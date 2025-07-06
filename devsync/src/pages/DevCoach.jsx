import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

const DevCoach = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setLoading(true);

    const res = await fetch(
      "https://api.githubcopilot.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer YOUR_GITHUB_PAT`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: newMessages,
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `API error: ${res.status} ${res.statusText} - ${errorText}`
      );
    }
    

    const data = await res.json();
    const aiReply = { role: "assistant", content: data.reply };
    setMessages((prev) => [...prev, aiReply]);
    setInput("");
    setLoading(false);
  };

  return (
    <div className="h-full p-6 flex flex-col">
      <h2 className="text-2xl font-bold mb-4 gradient-text-blue">
        🧠 DevCoach
      </h2>
      <div className="flex-1 overflow-y-auto bg-background-lighter p-4 rounded-lg border border-white/10 space-y-3 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${
              msg.role === "user"
                ? "bg-accent-purple/10 text-accent-purple"
                : "bg-accent-blue/10 text-accent-blue"
            }`}
          >
            <strong>{msg.role === "user" ? "You" : "DevCoach"}:</strong>{" "}
            {msg.content}
          </div>
        ))}
        {loading && <p className="text-sm text-text-muted">Thinking...</p>}
      </div>

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
  );
};

export default DevCoach;
