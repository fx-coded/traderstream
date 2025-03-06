import React from "react";
import { FaComments } from "react-icons/fa";

const ChatPanel = ({
  chatMessages,
  newMessage,
  setNewMessage,
  sendChatMessage,
  chatContainerRef
}) => {
  return (
    <div className="chat-section">
      {/* Chat header */}
      <div className="chat-header">
        <FaComments className="header-icon" />
        <h3>Live Chat</h3>
      </div>
      
      {/* Messages area */}
      <div className="chat-messages" ref={chatContainerRef}>
        {chatMessages.length > 0 ? (
          chatMessages.map((msg, index) => (
            <div 
              key={index} 
              className={`chat-message ${msg.isOwn ? "own-message" : ""}`}
            >
              <div className="message-header">
                <img 
                  src={msg.photoURL || "https://via.placeholder.com/24"} 
                  alt={msg.username} 
                  className="user-avatar" 
                />
                <span className="username">{msg.username}</span>
                <span className="timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="message-content">{msg.message}</p>
            </div>
          ))
        ) : (
          <div className="no-messages">
            <p>No messages yet. Be the first to say hello!</p>
          </div>
        )}
      </div>
      
      {/* Message input form */}
      <form className="chat-input" onSubmit={sendChatMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          maxLength={500}
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()} 
          className={`chat-send-button ${!newMessage.trim() ? 'disabled' : ''}`}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;