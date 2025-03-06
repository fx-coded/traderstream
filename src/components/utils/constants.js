// Stream categories for the platform
export const STREAM_CATEGORIES = [
    "Forex Trading",
    "Stock Trading",
    "Crypto Trading",
    "Options Trading",
    "Futures Trading",
    "Market Analysis",
    "Technical Analysis",
    "Fundamental Analysis",
    "Trading Strategy",
    "Chart Patterns",
    "Risk Management",
    "Trading Psychology",
    "Prop Firm Challenge",
    "Day Trading",
    "Swing Trading",
    "Long-term Investing",
    "Algo Trading",
    "Educational",
    "Other"
  ];
  
  // Stream sources
  export const STREAM_SOURCES = {
    CAMERA: "camera",
    SCREEN: "screen",
    BOTH: "both"
  };
  
  // User roles
  export const USER_ROLES = {
    VIEWER: "viewer",
    STREAMER: "streamer",
    MODERATOR: "moderator",
    ADMIN: "admin"
  };
  
  // Socket event types
  export const SOCKET_EVENTS = {
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    ERROR: "connect_error",
    START_STREAM: "start-stream",
    STOP_STREAM: "stop-stream",
    JOIN_STREAM: "join-stream",
    LEAVE_STREAM: "leave-stream",
    CHAT_MESSAGE: "chat-message",
    VIEWER_COUNT: "viewer-count",
    OFFER: "offer",
    ANSWER: "answer",
    ICE_CANDIDATE: "ice-candidate",
    GUEST_REQUEST: "guest-request",
    GUEST_JOINED: "guest-joined",
    GUEST_LEFT: "guest-left",
    ACCEPT_GUEST: "accept-guest",
    REMOVE_GUEST: "remove-guest"
  };
  
  // Stream statuses
  export const STREAM_STATUS = {
    LIVE: "live",
    ENDED: "ended",
    SCHEDULED: "scheduled"
  };
  
  // Maximum stream duration in seconds (4 hours)
  export const MAX_STREAM_DURATION = 14400;
  
  // Maximum chat message length
  export const MAX_CHAT_MESSAGE_LENGTH = 500;