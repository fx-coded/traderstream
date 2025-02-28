import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDoc,
  limit,
  getDocs,
  startAfter 
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import TraderSidebar from "./TraderSidebar";
import "../styles/Chat.css"; 

const MESSAGES_PER_PAGE = 25;

const Chat = ({ roomId, user, onExit }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [roomName, setRoomName] = useState("");
  const chatRef = useRef(null);
  const lastMessageRef = useRef(null);
  const observerRef = useRef(null);

  // Fetch room details
  useEffect(() => {
    if (!user || !roomId) return;

    const fetchRoomDetails = async () => {
      try {
        const roomDoc = await getDoc(doc(db, "rooms", roomId));
        if (roomDoc.exists()) {
          setRoomName(roomDoc.data().roomName || "Trading Chat Room");
        }
      } catch (error) {
        console.error("Error fetching room details:", error);
      }
    };

    fetchRoomDetails();

    // Mark user as online when they enter the chat
    if (user.uid) {
      const userRef = doc(db, "users", user.uid);
      updateDoc(userRef, { 
        isOnline: true,
        lastActiveRoom: roomId,
        lastActive: serverTimestamp()
      }).catch(error => {
        console.error("Error updating online status:", error);
      });
    }

    return () => {
      // Mark user as offline when they leave
      if (user.uid) {
        const userRef = doc(db, "users", user.uid);
        updateDoc(userRef, { 
          isOnline: false,
          lastActive: serverTimestamp()
        }).catch(error => {
          console.error("Error updating offline status:", error);
        });
      }
    };
  }, [user, roomId]);

  // Load more messages when scrolling up - useCallback to fix the dependency issue
  const loadMoreMessages = useCallback(async () => {
    if (!roomId || !hasMore || loadingMore || messages.length === 0) return;
    
    setLoadingMore(true);
    
    try {
      const messagesRef = collection(db, "rooms", roomId, "messages");
      const q = query(
        messagesRef, 
        orderBy("timestamp", "desc"), 
        startAfter(messages[0].timestamp),
        limit(MESSAGES_PER_PAGE)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const oldMessages = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .reverse();
          
        setMessages(prev => [...oldMessages, ...prev]);
        setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE);
        
        // Maintain scroll position
        const currentHeight = chatRef.current?.scrollHeight;
        
        setTimeout(() => {
          if (chatRef.current && currentHeight) {
            const newHeight = chatRef.current.scrollHeight;
            chatRef.current.scrollTop = newHeight - currentHeight;
          }
        }, 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [roomId, hasMore, loadingMore, messages]);

  // Fetch initial messages batch
  useEffect(() => {
    if (!roomId) return;
    
    setIsLoading(true);
    setMessages([]);
    
    const messagesRef = collection(db, "rooms", roomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(MESSAGES_PER_PAGE));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .reverse();
        
      setMessages(fetchedMessages);
      setIsLoading(false);
      setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE);
      
      // Scroll to bottom after initial load
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [roomId]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (!hasMore || isLoading || loadingMore || messages.length === 0) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    const options = {
      root: chatRef.current,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMoreMessages();
      }
    }, options);
    
    if (lastMessageRef.current) {
      observerRef.current.observe(lastMessageRef.current);
    }
    
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, isLoading, loadingMore, messages, loadMoreMessages]);

  // Fetch online users in real-time
  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    
    const unsubscribe = onSnapshot(roomRef, async (roomSnapshot) => {
      if (roomSnapshot.exists()) {
        const members = roomSnapshot.data().members || [];

        // Improved method - use Promise.all for parallel requests
        const promises = members.map(memberId => 
          getDoc(doc(db, "users", memberId))
            .then(userDoc => {
              if (userDoc.exists() && userDoc.data().isOnline) {
                return {
                  uid: memberId,
                  ...userDoc.data()
                };
              }
              return null;
            })
            .catch(error => {
              console.error(`Error fetching user ${memberId}:`, error);
              return null;
            })
        );

        const results = await Promise.all(promises);
        setOnlineUsers(results.filter(Boolean));
      }
    }, (error) => {
      console.error("Error fetching room data:", error);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Auto-scroll to latest message when new messages arrive
  useEffect(() => {
    // Only auto-scroll if user is already at the bottom
    if (chatRef.current && messages.length > 0) {
      const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (isAtBottom) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }
  }, [messages]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!user) {
      alert("You must be logged in to send messages!");
      return;
    }

    if (!roomId) {
      alert("Error: Room ID is missing! Please rejoin the chat.");
      return;
    }

    if (!message.trim()) {
      return;
    }

    try {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        text: message,
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || "Trader",
        timestamp: serverTimestamp(),
      });

      setMessage("");
      
      // Ensure scroll to bottom after sending
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  }, [message, roomId, user]);

  // Handle key press (Enter to send)
  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  const renderMessagesList = () => {
    if (isLoading) {
      return <div className="loading-messages">Loading messages...</div>;
    }
    
    if (messages.length === 0) {
      return (
        <div className="no-messages">
          No messages yet. Be the first to send a message!
        </div>
      );
    }
    
    return (
      <>
        {hasMore && (
          <div className="load-more-container">
            <button 
              className="load-more-button" 
              onClick={loadMoreMessages}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load more messages"}
            </button>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div 
            key={msg.id} 
            className={`message ${msg.senderId === user?.uid ? "sent" : "received"}`}
            ref={index === 0 ? lastMessageRef : null}
          >
            <div className="message-info">
              <span className="sender-name">
                {msg.senderId === user?.uid ? "You" : msg.senderName}
              </span>
              <span className="message-timestamp">
                {formatTimestamp(msg.timestamp)}
              </span>
            </div>
            <div className="message-text">{msg.text}</div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="chat-container">
      {/* Left Sidebar */}
      <TraderSidebar roomId={roomId} user={user} />

      {/* Chat Window */}
      <div className="chat-window">
        {/* Chat Header */}
        <div className="chat-header">
          <h2>{roomName}</h2>
          <div className="online-users">
            <strong>🟢 Online:</strong>
            {onlineUsers.length === 0 ? (
              <span> No one is online</span>
            ) : (
              <span>
                {onlineUsers.map((onlineUser, index) => (
                  <span key={onlineUser.uid}>
                    {index > 0 ? ", " : " "}
                    {onlineUser.displayName || onlineUser.email?.split('@')[0] || "Trader"}
                  </span>
                ))}
              </span>
            )}
          </div>
          {onExit && (
            <button className="exit-button" onClick={onExit}>
              Exit Chat
            </button>
          )}
        </div>

        {/* Messages Container */}
        <div ref={chatRef} className="chat-messages">
          {renderMessagesList()}
        </div>

        {/* Chat Input */}
        <div className="chat-input">
          <textarea
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
            disabled={!user || !roomId}
          />
          <button 
            onClick={sendMessage} 
            disabled={!message.trim() || !user || !roomId}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;