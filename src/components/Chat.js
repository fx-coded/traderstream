import React, { useState, useEffect, useRef } from "react";
import "../styles/global.css";

const Chat = () => {
  const [messages, setMessages] = useState([
    { id: 1, user: "TraderX", text: "Welcome to the trading room! 🚀" },
    { id: 2, user: "CryptoGuru", text: "Let’s catch some pips today! 💰" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const message = { id: Date.now(), user: "You", text: newMessage };
    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">💬 Live Chat</div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.user === "You" ? "sent" : "received"}`}>
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>
      <form className="chat-input" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit">🚀 Send</button>
      </form>
    </div>
  );
};

export default Chat;
