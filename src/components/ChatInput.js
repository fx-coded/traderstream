import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

const ChatInput = ({ user, groupId }) => {
  const [message, setMessage] = useState("");

  const sendMessage = async () => {
    if (!user) {
      alert("You must be logged in to send messages!");
      return;
    }

    if (!groupId) {
      console.error("Error: groupId is undefined.");
      alert("Error: Group ID is missing! Please rejoin the chat.");
      return;
    }

    if (!message.trim()) {
      return;
    }

    try {
      const messagesRef = collection(db, "groups", String(groupId), "messages");

      await addDoc(messagesRef, {
        text: message,
        senderId: user.uid,
        senderName: user.displayName || "Unknown Trader",
        timestamp: serverTimestamp(),
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chat-input">
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="message-input"
      />
      <button onClick={sendMessage} className="send-button">
        Send
      </button>
    </div>
  );
};

export default ChatInput;
