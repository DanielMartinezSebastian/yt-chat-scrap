// lib/chatScraper.ts
import { LiveChat } from "youtube-chat";

export async function* scrapeLiveChat(videoId: string) {
  const chat = new LiveChat({ liveId: videoId });

  if (!(await chat.start())) {
    console.error("No se pudo iniciar el chat.");
    return;
  }
  console.log("[DEBUG] chat.start() ejecutado correctamente");
  console.log("[DEBUG] Estado de LiveChat tras start:", chat);

  const messageBuffer: any[] = [];
  const onChat = (chatItem: any) => {
    console.log("[DEBUG] Nuevo mensaje recibido en backend:", chatItem);
    // Normaliza los fragmentos del mensaje para el frontend
    const messageFragments = (chatItem.message || []).map((frag: any) => {
      if (frag.text) return frag.text;
      if (frag.emoji || frag.isCustomEmoji || frag.emojiText || frag.url) {
        // Unifica el formato de emoji para el frontend
        return {
          emoji: {
            url: frag.url || (frag.emoji && frag.emoji.url),
            alt: frag.alt || frag.emojiText || "emoji",
            shortcuts: frag.shortcuts || [],
          },
        };
      }
      return "";
    });
    messageBuffer.push({
      author: {
        name: chatItem.author.name,
        thumbnail: chatItem.author.thumbnail || null,
        channelId: chatItem.author.channelId || null,
        badge: chatItem.author.badge || null,
      },
      message: messageFragments,
      timestamp: chatItem.timestamp,
    });
  };
  chat.on("chat", onChat);

  try {
    while (true) {
      if (messageBuffer.length > 0) {
        const msg = messageBuffer.shift();
        console.log("[DEBUG] Enviando mensaje al cliente:", msg);
        yield msg;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  } finally {
    chat.off("chat", onChat);
    chat.stop();
  }
}
