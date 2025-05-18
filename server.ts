// server.ts
import express from "express";
import next from "next";
import http from "http";
import { Request, Response } from "express";
import { initializeSocketServer } from "./server/socketServer";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

console.log("[DEBUG] Iniciando app.prepare()");
app.prepare().then(() => {
  console.log(
    "[DEBUG] app.prepare() completado, inicializando servidor Express"
  );
  const server = express();
  const httpServer = http.createServer(server);

  try {
    console.log("[DEBUG] Llamando a initializeSocketServer");
    initializeSocketServer(httpServer);

    // Cambiado de server.all("*", ...) a server.use(...)
    server.use((req: Request, res: Response) => {
      return handle(req, res);
    });

    httpServer.listen(3000, (err?: Error) => {
      if (err) {
        console.error("[ERROR] No se pudo iniciar el servidor:", err);
      } else {
        console.log("> Ready on http://localhost:3000");
      }
    });
  } catch (e) {
    console.error("[ERROR] Excepción en el bloque de inicialización:", e);
  }
});
console.log("[DEBUG] Después de app.prepare().then()");
