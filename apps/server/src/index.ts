import { createServer } from "node:http";
import { GAME_NAME, GAME_VERSION } from "@kla-khlok/shared";

const port = Number(process.env.PORT ?? 8787);

const server = createServer((_request, response) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ service: GAME_NAME, version: GAME_VERSION, status: "ready" }));
});

server.listen(port, () => {
  console.log(`${GAME_NAME} server listening on http://localhost:${port}`);
});
