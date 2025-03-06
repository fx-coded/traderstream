import { useState, useRef, useCallback } from "react";

/**
 * Custom hook to manage chat functionality for streaming
 * 
 * @param {Function} emitEvent - Function to emit socket events
 * @param {string} streamId - The ID of the current stream
 * @param {Object} user - Current user object
 * @returns {Object} Chat state and functions
 */
export const useChat = (emitEvent, streamId, user) => {
  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  // Reference to the chat container for auto-scrolling
  const chatContainerRef = useRef(null);
  
  /**
   * Add a new message to the chat
   * 
   * @param {Object} message - Message object to add
   */
  const addMessage = useCallback((message) => {
    setMessages(prevMessages => [...prevMessages, message]);
    
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  }, []);
  
  /**
   * Send a new chat message
   */
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !streamId || !user) return;
    
    // Create message object
    const messageObj = {
      streamId,
      userId: user.uid,
      username: user.displayName || user.email?.split("@")[0] || "Anonymous",
      photoURL: user.photoURL || null,
      content: newMessage.trim(),
      timestamp: Date.now(),
      isOwner: true
    };
    
    // Add to local messages
    addMessage(messageObj);
    
    // Emit to socket server
    emitEvent("chat-message", messageObj);
    
    // Clear input
    setNewMessage("");
  }, [newMessage, streamId, user, emitEvent, addMessage]);
  
  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    addMessage,
    chatContainerRef
  };
};

export default useChat;