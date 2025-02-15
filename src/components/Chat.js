import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion, onSnapshot, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../styles/global.css";

const bannedWords = ["racistword1", "racistword2", "badword1", "badword2"];

const isValidMessage = (message) => {
  if (!message.trim() || message.length < 2) return false;
  return !bannedWords.some((word) => message.toLowerCase().includes(word));
};

const reactions = ["👍", "😂", "🔥", "❤️", "💎", "🚀", "🤑"];

const Chat = ({ roomId, user, isAdmin, onExit, onLeaveRoom }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageUpload, setImageUpload] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [roomOwner, setRoomOwner] = useState(null);
  const [username, setUsername] = useState(user?.displayName || "Trader");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeReactions, setActiveReactions] = useState(null);
  const chatEndRef = useRef(null);

  // ✅ Fetch username from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUsername = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || user.displayName || "Trader");
        }
      } catch (error) {
        console.error("🔥 Error fetching username:", error);
      }
    };

    fetchUsername();
  }, [user?.uid, user.displayName]);

  // ✅ Listen for messages in the chat room
  useEffect(() => {
    const roomRef = doc(db, "rooms", roomId);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        setMessages(docSnap.data().messages || []);
        setRoomData(docSnap.data());
        setRoomOwner(docSnap.data().adminId);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // ✅ Scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send a message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!user) return alert("❌ You must be logged in to chat!");
    if (!isValidMessage(newMessage)) return alert("❌ Message contains prohibited words!");

    let imageUrl = "";
    if (imageUpload) {
      const imageRef = ref(storage, `chat_images/${user.uid}_${Date.now()}`);
      await uploadBytes(imageRef, imageUpload);
      imageUrl = await getDownloadURL(imageRef);
    }

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

  // ✅ Toggle reactions menu on right-click or hold
  const toggleReactionMenu = (messageId) => {
    setActiveReactions(activeReactions === messageId ? null : messageId);
  };

  // ✅ Add reactions to a message
  const addReaction = async (messageId, reaction) => {
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

  // ✅ Delete a message
  const deleteMessage = async (messageId) => {
    if (!user) return;
    const roomRef = doc(db, "rooms", roomId);
    const updatedMessages = messages.filter((msg) => msg.id !== messageId);
    await updateDoc(roomRef, { messages: updatedMessages });
  };

  return (
    <div className="chat-container">
      {/* ✅ Chat Header */}
      <div className="chat-header">
        <h2>{roomData?.roomName}</h2>
        <p className="member-count">👥 {roomData?.members?.length || 0} Members</p>

        <div className="chat-options">
          <button className="menu-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>☰</button>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <button onClick={onExit}>🍔 Exit Room</button>
              <button onClick={onLeaveRoom}>🚪 Leave Group</button>
              {user.uid === roomOwner && (
                <button onClick={() => updateDoc(doc(db, "rooms", roomId), { messages: [] })}>
                  🗑 Delete Chat
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Chat Messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.userId === user.uid ? "sent" : "received"}`}
            onContextMenu={(e) => {
              e.preventDefault();
              toggleReactionMenu(msg.id);
            }}
          >
            <strong className="username">{msg.user}:</strong> {msg.text}
            {msg.imageUrl && <img src={msg.imageUrl} alt="Uploaded" className="chat-image" />}
            <span className="message-time">{msg.timestamp}</span>

            {/* ✅ Reactions Menu */}
            {activeReactions === msg.id && (
              <div className="reaction-container">
                {reactions.map((emoji) => (
                  <button key={emoji} className="reaction-btn" onClick={() => addReaction(msg.id, emoji)}>
                    {emoji}
                  </button>
                ))}
                {msg.userId === user.uid && <button className="delete-btn" onClick={() => deleteMessage(msg.id)}>🗑</button>}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      {/* ✅ Chat Input */}
      <form className="chat-input" onSubmit={sendMessage}>
        <input type="text" placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <label className="upload-icon">
          📎
          <input type="file" accept="image/*" onChange={(e) => setImageUpload(e.target.files[0])} style={{ display: "none" }} />
        </label>
        <button type="submit">🚀 Send</button>
      </form>
    </div>
  );
};

export default Chat;
