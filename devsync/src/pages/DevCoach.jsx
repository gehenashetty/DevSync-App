import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

const DevCoach = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/devcoach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          context: "", // Optional context can be added here
        }),
      });

      const data = await res.json();
      const aiReply = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error("❌ Fetch failed:", err);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Failed to fetch reply." },
      ]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="h-full p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col h-full">
        {/* Header */}
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="text-white">💡</span>
          <span className="gradient-text-blue">DevCoach</span>
        </h2>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto bg-background-lighter p-4 rounded-lg border border-white/10 space-y-8 mb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[80%] p-4 rounded-2xl whitespace-pre-wrap flex flex-col shadow-lg border
                ${msg.role === "user"
                  ? "ml-auto bg-accent-purple/20 text-accent-purple items-end border-accent-purple/30"
                  : "mr-auto bg-accent-blue/20 text-accent-blue items-start border-accent-blue/30"}
              `}
            >
              <span className="font-semibold text-xs mb-2 opacity-80 tracking-wide">
                {msg.role === "user" ? "You" : "DevCoach"}
              </span>
              <span className="text-base">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </span>
            </div>
          ))}
        </div>

        {/* Input + Button */}
        <div className="flex items-center space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="flex-1 p-3 rounded-xl bg-background-lighter border border-white/10 text-base text-text-primary shadow-sm"
            placeholder="Ask me about commits, issues, or anything dev-related..."
          />
          <button
            onClick={handleAsk}
            className="p-2 bg-accent-blue rounded-lg text-white hover:bg-accent-blue-light"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevCoach;
