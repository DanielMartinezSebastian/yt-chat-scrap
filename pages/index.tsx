import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import React from "react";

const socket = io();

export default function Home() {
  const [videoId, setVideoId] = useState("");
  const [input, setInput] = useState("4xDzrJKXOOY");
  const [messages, setMessages] = useState<any[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const startStream = () => {
    socket.emit("start", input);
    setVideoId(input);
  };

  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Componente para renderizar fragmentos de mensaje de YouTube (texto y emojis)
  type MessageFragment =
    | string
    | { emoji: { url: string; alt: string; shortcuts?: string[] } };

  interface YouTubeMessageProps {
    fragments: MessageFragment[];
  }

  const YouTubeMessage: React.FC<YouTubeMessageProps> = ({ fragments }) => (
    <span style={{ display: "inline" }}>
      {fragments.map((frag, idx) => {
        if (typeof frag === "string") {
          return <React.Fragment key={idx}>{frag}</React.Fragment>;
        } else if (frag.emoji) {
          return (
            <img
              key={idx}
              src={frag.emoji.url}
              alt={frag.emoji.alt}
              title={frag.emoji.shortcuts?.[0] || frag.emoji.alt}
              style={{
                display: "inline",
                width: 24,
                height: 24,
                verticalAlign: "middle",
              }}
            />
          );
        }
        return null;
      })}
    </span>
  );

  // Función para mostrar tiempo relativo tipo "hace 1 min"
  function timeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "hace unos segundos";
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString();
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 font-sans">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6 flex flex-col h-[90vh] max-h-[700px]">
        <h1 className="text-3xl font-bold mb-6 text-blue-700 text-center">
          Live Chat Viewer
        </h1>
        <div className="flex mb-4">
          <input
            className="flex-1 border border-blue-300 rounded-l-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="4xDzrJKXOOY"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-r-md px-6 py-3 font-semibold transition-colors"
            onClick={startStream}
          >
            Start Chat
          </button>
        </div>
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto border border-blue-200 rounded-md bg-blue-50 p-4 shadow-inner"
          style={{ minHeight: 0 }}
        >
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center mt-20">
              No hay mensajes aún.
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className="mb-2 flex items-start gap-3 px-2 py-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                style={{ maxWidth: 600 }}
              >
                {/* Avatar del usuario */}
                {m.author?.thumbnail?.url ? (
                  <img
                    src={m.author.thumbnail.url}
                    alt={m.author.thumbnail.alt || m.author.name}
                    className="w-8 h-8 rounded-full border border-gray-200 object-cover mt-1"
                    style={{ minWidth: 32, minHeight: 32 }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold border border-gray-200 mt-1">
                    {m.author?.name?.[0] || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold text-gray-800 text-sm leading-tight hover:underline cursor-pointer"
                      title={m.author?.name}
                    >
                      {m.author?.name}
                    </span>
                    {m.timestamp && (
                      <span className="text-xs text-gray-400 select-none">
                        {timeAgo(m.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-900 text-[15px] leading-snug break-words mt-0.5">
                    {Array.isArray(m.message) ? (
                      <YouTubeMessage fragments={m.message} />
                    ) : (
                      m.message
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
