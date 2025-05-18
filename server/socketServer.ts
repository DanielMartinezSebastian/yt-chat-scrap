// server/socketServer.ts
import { Server as SocketIOServer } from "socket.io";
import { scrapeLiveChat } from "../lib/chatScraper";

export function initializeSocketServer(server: any) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Cliente conectado");

    let scraperAbortController: AbortController | null = null;

    socket.on("start", async (videoId: string) => {
      // Si ya hay un scraper corriendo para este socket, abortar el anterior
      if (scraperAbortController) {
        scraperAbortController.abort();
      }
      scraperAbortController = new AbortController();
      const { signal } = scraperAbortController;
      console.log(`Iniciando scraper para: ${videoId}`);
      try {
        for await (const message of scrapeLiveChat(videoId)) {
          if (signal.aborted) {
            console.log("Scraper abortado por el usuario o reconexión");
            break;
          }
          socket.emit("message", message);
        }
        console.log("Scraper finalizado para:", videoId);
      } catch (err) {
        console.error("Error en el scraper:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado");
      if (scraperAbortController) {
        scraperAbortController.abort();
      }
    });
  });
}
