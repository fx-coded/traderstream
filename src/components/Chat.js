import React, { useState, useEffect, useRef } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import TraderSidebar from "./TraderSidebar";
import "../styles/Chat.css"; 

const Chat = ({ groupId, user }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]); // ✅ Track online users
  const chatRef = useRef(null);

  // ✅ Mark user as online when they enter the chat
  useEffect(() => {
    if (!user || !groupId) return;

    const userRef = doc(db, "users", user.uid);
    updateDoc(userRef, { isOnline: true });

    return () => {
      updateDoc(userRef, { isOnline: false }); // ✅ Mark user as offline when they leave
    };
  }, [user, groupId]);

  // ✅ Fetch messages in real-time
  useEffect(() => {
    if (!groupId) return;

    const messagesRef = collection(db, "groups", groupId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [groupId]);

  // ✅ Fetch online users in real-time
  useEffect(() => {
    if (!groupId) return;

    const groupRef = doc(db, "groups", groupId);
    
    const unsubscribe = onSnapshot(groupRef, async (groupSnapshot) => {
      if (groupSnapshot.exists()) {
        const members = groupSnapshot.data().members || [];
        const onlineUsersList = [];

        for (const memberId of members) {
          const userDoc = await getDoc(doc(db, "users", memberId));
          if (userDoc.exists() && userDoc.data().isOnline) {
            onlineUsersList.push(userDoc.data());
          }
        }

        setOnlineUsers(onlineUsersList);
      }
    });

    return () => unsubscribe();
  }, [groupId]);

  // ✅ Auto-scroll to latest message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // ✅ Send message
  const sendMessage = async () => {
    if (!user) {
      alert("You must be logged in to send messages!");
      return;
    }

    if (!groupId) {
      alert("Error: Group ID is missing! Please rejoin the chat.");
      return;
    }

    if (!message.trim()) {
      return;
    }

    try {
      await addDoc(collection(db, "groups", String(groupId), "messages"), {
        text: message,
        senderId: user.uid,
        senderName: user.displayName || "Trader",
        timestamp: serverTimestamp(),
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chat-container">
      {/* Left Sidebar */}
      <TraderSidebar groupId={groupId} />

      {/* Chat Window */}
      <div className="chat-window">
        {/* Chat Header */}
        <div className="chat-header">
          <h2>Traders Chat Room</h2>
          <div className="online-users">
            <strong>🟢 Online:</strong>
            {onlineUsers.length === 0 ? (
              <span> No one is online</span>
            ) : (
              onlineUsers.map((user) => <span key={user.uid}>{user.displayName || "Trader"}, </span>)
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div ref={chatRef} className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.senderId === user?.uid ? "sent" : "received"}`}>
              <div className="message-info">
                <span className="sender-name">{msg.senderName}</span>
                <span className="message-text">{msg.text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
