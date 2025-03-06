import React, { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaSmile } from "react-icons/fa";
import "./styles/chatInput.css";

const ChatInput = ({
  newMessage,
  setNewMessage,
  sendChatMessage,
  isDisabled = false,
  streamActive = true
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isCharLimitWarning, setIsCharLimitWarning] = useState(false);
  const inputRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      // Reset height to auto to get the correct scrollHeight
      inputRef.current.style.height = 'auto';
      
      // Set the height to scrollHeight to fit content
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = 
        scrollHeight > 100 ? '100px' : `${scrollHeight}px`;
    }
  }, [newMessage]);

  // Check character limit for warning states
  useEffect(() => {
    const charCount = newMessage.length;
    setIsCharLimitWarning(charCount >= 150 && charCount < 200);
  }, [newMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && !isDisabled && streamActive) {
      sendChatMessage();
      
      // Reset textarea height after sending
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Get container class based on states
  const getContainerClass = () => {
    let classes = "chat-input-container";
    if (isFocused) classes += " focused";
    if (isCharLimitWarning) classes += " char-limit-warning";
    if (newMessage.length >= 200) classes += " char-limit-reached";
    if (!streamActive) classes += " stream-offline";
    return classes;
  };

  return (
    <div className={getContainerClass()}>
      <form onSubmit={handleSubmit} className="chat-form">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isDisabled || !streamActive}
          rows={1}
          maxLength={200}
          aria-label="Chat message input"
        />
        
        <div className="chat-input-actions">
          <button
            type="button"
            className="emoji-button"
            aria-label="Add emoji"
            title="Add emoji"
            disabled={isDisabled || !streamActive}
          >
            <FaSmile />
          </button>
          
          <button
            type="submit"
            className="send-button"
            aria-label="Send message"
            title="Send message"
            disabled={!newMessage.trim() || isDisabled || !streamActive}
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
      
      {/* Character counter */}
      <div className="character-counter">
        {newMessage.length}/200
      </div>
    </div>
  );
};

export default ChatInput;