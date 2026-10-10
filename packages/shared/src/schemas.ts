import { z } from "zod";
import { ROUND_PHASES, SYMBOL_IDS } from "./constants.js";

export const SymbolIdSchema = z.enum(SYMBOL_IDS);
export const RoundPhaseSchema = z.enum(ROUND_PHASES);

export const DiceOutcomeSchema = z.tuple([
  SymbolIdSchema,
  SymbolIdSchema,
  SymbolIdSchema,
]);

export const SymbolSlotSchema = z.object({
  id: SymbolIdSchema,
  label: z.string().trim().min(1),
  assetId: z.string().trim().min(1),
  contentHash: z.string().trim().min(1),
  width: z.number().int().positive().finite(),
  height: z.number().int().positive().finite(),
});

export const SymbolPackManifestSchema = z.object({
  packId: z.string().trim().min(1),
  revision: z.string().trim().min(1),
  name: z.string().trim().min(1),
  slots: z
    .tuple([
      SymbolSlotSchema,
      SymbolSlotSchema,
      SymbolSlotSchema,
      SymbolSlotSchema,
      SymbolSlotSchema,
      SymbolSlotSchema,
    ])
    .superRefine((slots, context) => {
      const ids = slots.map((slot) => slot.id);
      for (const [index, expectedId] of SYMBOL_IDS.entries()) {
        if (ids[index] !== expectedId) {
          context.addIssue({
            code: "custom",
            path: [index, "id"],
            message: `Expected stable slot ID ${expectedId}`,
          });
        }
      }
    }),
});
