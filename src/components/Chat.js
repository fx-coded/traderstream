import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../styles/global.css";

const bannedWords = ["racistword1", "racistword2", "badword1", "badword2"];

const isValidMessage = (message) => {
  if (!message.trim() || message.length < 2) return false;
  return !bannedWords.some((word) => message.toLowerCase().includes(word));
};

const reactions = ["👍", "😂", "🔥", "❤️", "💎", "🚀", "🤑"];

const Chat = ({ roomId, user, isAdmin, onExit }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageUpload, setImageUpload] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [roomOwner, setRoomOwner] = useState(null);
  const [activeReactions, setActiveReactions] = useState(null);
  const [showRemoveUser, setShowRemoveUser] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const roomRef = doc(db, "rooms", roomId);
    const unsubscribe = onSnapshot(roomRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessages(data.messages || []);
        setRoomData(data);
        setRoomOwner(data.adminId);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    const username = user?.displayName || user?.email.split("@")[0] || "Guest";

    const messageData = {
      id: Date.now(),
      userId: user.uid,
      user: username,
      text: newMessage,
      imageUrl,
      timestamp: new Date().toLocaleTimeString(),
      reactions: [],
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

  const deleteChat = async () => {
    if (user.uid !== roomOwner) return alert("Only the room creator can delete the chat!");
    await updateDoc(doc(db, "rooms", roomId), { messages: [] });
  };

  const removeUser = async (userId) => {
    if (user.uid !== roomOwner) return alert("Only the room creator can remove users!");
    const updatedMembers = roomData.members.filter((id) => id !== userId);
    await updateDoc(doc(db, "rooms", roomId), { members: updatedMembers });
    setShowRemoveUser(null);
  };

  const reactToMessage = async (messageId, reaction) => {
    const roomRef = doc(db, "rooms", roomId);
    const updatedMessages = messages.map((msg) => {
      if (msg.id === messageId) {
        if (!msg.reactions) msg.reactions = [];
        if (!msg.reactions.includes(reaction)) {
          msg.reactions.push(reaction);
        }
      }
      return msg;
    });
    await updateDoc(roomRef, { messages: updatedMessages });
    setActiveReactions(null);
  };

  return (
    <div className="chat-fullscreen">
      <div className="chat-navbar">
        <button className="exit-room-btn" onClick={onExit}>🍔 Exit Room</button>
        <h2>{roomData?.roomName}</h2>
        <p>👥 {roomData?.members?.length || 0} Members</p>
        {user.uid === roomOwner && (
          <button className="delete-chat-btn" onClick={deleteChat}>🗑 Delete Chat</button>
        )}
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.userId === user.uid ? "sent" : "received"}`}
            onContextMenu={(e) => {
              e.preventDefault(); 
              setActiveReactions(msg.id);
            }}
          >
            <strong
              onContextMenu={(e) => {
                e.preventDefault();
                isAdmin && setShowRemoveUser(msg.userId);
              }}
            >
              {msg.user}:
            </strong>
            {msg.text}
            {msg.imageUrl && <img src={msg.imageUrl} alt="Uploaded" className="chat-image" />}
            <span className="message-time">⏳ {msg.timestamp}</span>

            {/* 🔥 Clickable Reaction Container */}
            {activeReactions === msg.id && (
              <div className="reaction-container">
                {reactions.map((emoji) => (
                  <button key={emoji} className="reaction-btn" onClick={() => reactToMessage(msg.id, emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <span>{msg.reactions?.join(" ")}</span>

            {msg.userId === user.uid || user.uid === roomOwner ? (
              <button className="delete-btn" onClick={() => deleteMessage(msg.id)}>🗑</button>
            ) : null}

            {showRemoveUser === msg.userId && (
              <button className="remove-user-btn" onClick={() => removeUser(msg.userId)}>🚫 Remove</button>
            )}
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

        <label className="upload-icon">
          📎
          <input
            type="file"
            accept="image/png, image/jpeg, image/gif"
            onChange={(e) => setImageUpload(e.target.files[0])}
            style={{ display: "none" }}
          />
        </label>

        <button type="submit">🚀 Send</button>
      </form>
    </div>
  );
};

export default Chat;
