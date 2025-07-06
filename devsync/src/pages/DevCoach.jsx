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

  return (
    <div className="h-full p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col h-full">
        {/* Header */}
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="text-white">💡</span>
          <span className="gradient-text-blue">DevCoach</span>
        </h2>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto bg-background-lighter p-4 rounded-lg border border-white/10 space-y-3 mb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-accent-purple/10 text-accent-purple"
                  : "bg-accent-blue/10 text-accent-blue markdown-body"
              }`}
            >
              <strong>{msg.role === "user" ? "You" : "DevCoach"}:</strong>{" "}
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ))}
        </div>

        {/* Input + Button */}
        <div className="flex items-center space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 rounded-lg bg-background-lighter border border-white/10 text-sm text-text-primary"
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
