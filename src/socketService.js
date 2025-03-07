import io from "socket.io-client";
import { getAuth } from "firebase/auth";

// Environment-based configuration
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const createSocketInstance = () => {
  return io(SOCKET_URL, {
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: async (cb) => {
      try {
        const auth = getAuth();
        const token = await auth.currentUser.getIdToken();
        cb({ token });
      } catch (error) {
        console.error("Failed to get authentication token", error);
      }
    }
  });
};

export const socketService = {
  socket: createSocketInstance(),
  
  connect() {
    this.socket.connect();
  },
  
  disconnect() {
    this.socket.disconnect();
  },
  
  emitEvent(eventName, data) {
    if (this.socket.connected) {
      this.socket.emit(eventName, data);
    }
  }
};

export default socketService;