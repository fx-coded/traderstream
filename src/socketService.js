import io from "socket.io-client";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Environment-based configuration
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "https://trading-backend-1059368735900.us-central1.run.app";

// Logging utility
const logger = {
  info: (message) => console.log(`🔷 ${message}`),
  warn: (message) => console.warn(`⚠️ ${message}`),
  error: (message) => console.error(`❌ ${message}`)
};

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Get authentication token
  async getAuthToken() {
    return new Promise((resolve, reject) => {
      const auth = getAuth();
      
      const unsubscribe = onAuthStateChanged(
        auth, 
        async (user) => {
          // Unsubscribe immediately to prevent memory leaks
          unsubscribe();
          
          if (user) {
            try {
              const token = await user.getIdToken(true);
              resolve(token);
            } catch (error) {
              logger.error(`Token retrieval failed: ${error.message}`);
              reject(error);
            }
          } else {
            logger.warn("No authenticated user found");
            reject(new Error("No user logged in"));
          }
        },
        (error) => {
          logger.error(`Auth state error: ${error.message}`);
          reject(error);
        }
      );
    });
  }

  // Initialize socket connection
  async connectSocket() {
    // Disconnect existing connection if any
    this.disconnectSocket();

    try {
      // Get authentication token
      const token = await this.getAuthToken();

      // Create new socket instance
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        auth: { token },
        transports: ['websocket', 'polling']
      });

      // Setup connection event listeners
      this.socket.on('connect', () => {
        this.isConnected = true;
        logger.info('Socket connected successfully');
      });

      this.socket.on('connect_error', (error) => {
        this.isConnected = false;
        logger.error(`Socket connection error: ${error.message}`);
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        logger.warn(`Socket disconnected: ${reason}`);
      });

      // Initiate connection
      this.socket.connect();

      return this.socket;
    } catch (error) {
      logger.error(`Socket connection failed: ${error.message}`);
      throw error;
    }
  }

  // Disconnect socket
  disconnectSocket(reason = 'client disconnect') {
    if (this.socket) {
      this.socket.disconnect(reason);
      this.isConnected = false;
      logger.info(`Socket disconnected: ${reason}`);
    }
  }

  // Emit an event
  emitEvent(eventName, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventName, data);
      return true;
    }
    logger.warn(`Cannot emit ${eventName}: Socket not connected`);
    return false;
  }

  // Get current socket status
  getSocketStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      url: SOCKET_URL
    };
  }

  // Add event listener
  on(eventName, callback) {
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  // Remove event listener
  off(eventName, callback) {
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }
}

// Export a singleton instance
export default new SocketService();