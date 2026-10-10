import { createServer } from "node:http";
import { GAME_NAME, GAME_VERSION } from "@kla-khlok/shared";
import { RoomError, RoomManager } from "./rooms.js";

const port = Number(process.env.PORT ?? 8787);

const rooms = new RoomManager();

const send = (response: import("node:http").ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*" });
  response.end(JSON.stringify(body));
};

const readBody = async (request: import("node:http").IncomingMessage): Promise<Record<string, unknown>> => {
  let body = "";
  for await (const chunk of request) body += chunk;
  if (!body) return {};
  try { return JSON.parse(body) as Record<string, unknown>; } catch { throw new RoomError(400, "Request body must be JSON"); }
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (request.method === "OPTIONS") { send(response, 204, {}); return; }
    if (request.method === "GET" && url.pathname === "/health") { send(response, 200, { service: GAME_NAME, version: GAME_VERSION, status: "ready" }); return; }
    if (request.method === "POST" && url.pathname === "/rooms") {
      const body = await readBody(request);
      const created = rooms.createRoom(body.name);
      send(response, 201, created);
      return;
    }
    const joinMatch = url.pathname.match(/^\/rooms\/([^/]+)\/join$/);
    if (request.method === "POST" && joinMatch) {
      const body = await readBody(request);
      const joined = rooms.joinRoom(joinMatch[1], body.name, body.credential);
      send(response, 200, joined);
      return;
    }
    const roomMatch = url.pathname.match(/^\/rooms\/([^/]+)$/);
    if (request.method === "GET" && roomMatch) { send(response, 200, { snapshot: rooms.getRoom(roomMatch[1]) }); return; }
    const commandMatch = url.pathname.match(/^\/rooms\/([^/]+)\/commands$/);
    if (request.method === "POST" && commandMatch) {
      const body = await readBody(request);
      send(response, 200, rooms.applyCommand(commandMatch[1], body.credential, body.commandId, body.command));
      return;
    }
    send(response, 404, { error: "Not found" });
  } catch (error) {
    if (error instanceof RoomError) { send(response, error.statusCode, { error: error.message }); return; }
    send(response, 500, { error: "Internal server error" });
  }
});

server.listen(port, () => {
  console.log(`${GAME_NAME} server listening on http://localhost:${port}`);
});
