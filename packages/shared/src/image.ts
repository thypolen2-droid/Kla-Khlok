export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 8_192;
export const MAX_IMAGE_PIXELS = 40_000_000;

export type ImageFormat = "png" | "jpeg" | "webp";

export interface ImageInspection {
  format: ImageFormat;
  width: number;
  height: number;
  byteLength: number;
  hasMetadata: boolean;
}

export interface NormalizedImage {
  bytes: Uint8Array;
  format: ImageFormat;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

const byteAt = (bytes: Uint8Array, index: number): number => bytes[index] ?? 0;

const readU16 = (bytes: Uint8Array, offset: number): number =>
  (byteAt(bytes, offset) << 8) | byteAt(bytes, offset + 1);

const readU32 = (bytes: Uint8Array, offset: number): number =>
  byteAt(bytes, offset) * 2 ** 24 + byteAt(bytes, offset + 1) * 2 ** 16 + byteAt(bytes, offset + 2) * 2 ** 8 + byteAt(bytes, offset + 3);

const startsWith = (bytes: Uint8Array, signature: number[]): boolean =>
  signature.every((value, index) => byteAt(bytes, index) === value);

const inspectPng = (bytes: Uint8Array): ImageInspection => {
  if (bytes.length < 33 || !startsWith(bytes, [137, 80, 78, 71, 13, 10, 26, 10]) ||
      byteAt(bytes, 12) !== 73 || byteAt(bytes, 13) !== 72 || byteAt(bytes, 14) !== 68 || byteAt(bytes, 15) !== 82) {
    throw new ImageValidationError("Invalid or truncated PNG image");
  }
  const width = readU32(bytes, 16);
  const height = readU32(bytes, 20);
  return { format: "png", width, height, byteLength: bytes.length, hasMetadata: hasPngMetadata(bytes) };
};

const hasPngMetadata = (bytes: Uint8Array): boolean => {
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = readU32(bytes, offset);
    const type = String.fromCharCode(byteAt(bytes, offset + 4), byteAt(bytes, offset + 5), byteAt(bytes, offset + 6), byteAt(bytes, offset + 7));
    if (["tEXt", "zTXt", "iTXt", "eXIf"].includes(type)) return true;
    offset += 12 + length;
    if (type === "IEND") break;
  }
  return false;
};

const inspectJpeg = (bytes: Uint8Array): ImageInspection => {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new ImageValidationError("Invalid or truncated JPEG image");
  }
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (byteAt(bytes, offset) !== 0xff) { offset += 1; continue; }
    const marker = byteAt(bytes, offset + 1);
    offset += 2;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;
    const length = readU16(bytes, offset);
    if (length < 2 || offset + length > bytes.length) break;
    const isFrame = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
    if (isFrame && length >= 7) {
      return { format: "jpeg", width: readU16(bytes, offset + 5), height: readU16(bytes, offset + 3), byteLength: bytes.length, hasMetadata: hasJpegMetadata(bytes) };
    }
    offset += length;
  }
  throw new ImageValidationError("JPEG dimensions could not be decoded");
};

const hasJpegMetadata = (bytes: Uint8Array): boolean => {
  for (let index = 2; index + 1 < bytes.length; index += 1) {
    if (byteAt(bytes, index) === 0xff && (byteAt(bytes, index + 1) === 0xe1 || byteAt(bytes, index + 1) === 0xed)) return true;
  }
  return false;
};

const inspectWebp = (bytes: Uint8Array): ImageInspection => {
  if (bytes.length < 30 || !startsWith(bytes, [82, 73, 70, 70]) || !startsWith(bytes.slice(8), [87, 69, 66, 80])) {
    throw new ImageValidationError("Invalid or truncated WebP image");
  }
  const chunk = String.fromCharCode(byteAt(bytes, 12), byteAt(bytes, 13), byteAt(bytes, 14), byteAt(bytes, 15));
  let width = 0;
  let height = 0;
  if (chunk === "VP8X" && bytes.length >= 30) {
    width = 1 + byteAt(bytes, 24) + (byteAt(bytes, 25) << 8) + (byteAt(bytes, 26) << 16);
    height = 1 + byteAt(bytes, 27) + (byteAt(bytes, 28) << 8) + (byteAt(bytes, 29) << 16);
  } else if (chunk === "VP8L" && bytes.length >= 25) {
    width = 1 + (byteAt(bytes, 21) | ((byteAt(bytes, 22) & 0x3f) << 8));
    height = 1 + ((byteAt(bytes, 22) >> 6) | (byteAt(bytes, 23) << 2) | ((byteAt(bytes, 24) & 0xf) << 10));
  }
  if (!width || !height) throw new ImageValidationError("WebP dimensions could not be decoded");
  return { format: "webp", width, height, byteLength: bytes.length, hasMetadata: chunk === "EXIF" || chunk === "XMP " };
};

export const inspectImageBytes = (bytes: Uint8Array): ImageInspection => {
  if (bytes.byteLength === 0) throw new ImageValidationError("Image is empty");
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new ImageValidationError("Image exceeds the 10 MiB limit");
  const inspection = startsWith(bytes, [137, 80, 78, 71, 13, 10, 26, 10]) ? inspectPng(bytes) :
    startsWith(bytes, [255, 216]) ? inspectJpeg(bytes) : inspectWebp(bytes);
  if (inspection.width < 1 || inspection.height < 1 || inspection.width > MAX_IMAGE_DIMENSION || inspection.height > MAX_IMAGE_DIMENSION || inspection.width * inspection.height > MAX_IMAGE_PIXELS) {
    throw new ImageValidationError("Image dimensions exceed the supported limit");
  }
  return inspection;
};

export const normalizeImageBytes = (bytes: Uint8Array): NormalizedImage => {
  const inspection = inspectImageBytes(bytes);
  return {
    bytes: bytes.slice(),
    format: inspection.format,
    width: inspection.width,
    height: inspection.height,
    sourceWidth: inspection.width,
    sourceHeight: inspection.height,
  };
};
