import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../styles/global.css";

const bannedWords = ["racistword1", "racistword2", "badword1", "badword2"];

const isValidMessage = (message) => {
  if (!message.trim() || message.length < 2) return false;
  const words = message.toLowerCase().split(/\s+/);
  return !words.some((word) => bannedWords.includes(word));
};

const Chat = ({ roomId, user, isAdmin }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageUpload, setImageUpload] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
      if (docSnap.exists()) setMessages(docSnap.data().messages || []);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to chat!");
    if (!isValidMessage(newMessage)) return alert("Message contains prohibited words!");

    let imageUrl = "";
    if (imageUpload) {
      const imageRef = ref(storage, `chat_images/${user.uid}_${Date.now()}`);
      await uploadBytes(imageRef, imageUpload);
      imageUrl = await getDownloadURL(imageRef);
    }

    const messageData = {
      id: Date.now(),
      user: user.displayName || "Anonymous",
      text: newMessage,
      imageUrl,
      timestamp: new Date(),
    };

    await updateDoc(doc(db, "rooms", roomId), { messages: arrayUnion(messageData) });
    setNewMessage("");
    setImageUpload(null);
  };

  const deleteMessage = async (messageId) => {
    if (!user) return;
    const roomRef = doc(db, "rooms", roomId);
    const updatedMessages = messages.filter((msg) => msg.id !== messageId);

    await updateDoc(roomRef, { messages: updatedMessages });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">💬 Live Chat</div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.user === user.displayName ? "sent" : "received"}`}>
            <strong>{msg.user}:</strong> {msg.text}
            {msg.imageUrl && <img src={msg.imageUrl} alt="Uploaded" className="chat-image" />}
            {(isAdmin || msg.user === user.displayName) && (
              <button className="delete-btn" onClick={() => deleteMessage(msg.id)}>🗑 Delete</button>
            )}
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>
      <form className="chat-input" onSubmit={sendMessage}>
        <input type="text" placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <input type="file" accept="image/png, image/jpeg, image/gif" onChange={(e) => setImageUpload(e.target.files[0])} />
        <button type="submit">🚀 Send</button>
      </form>
    </div>
  );
};

export default Chat;
