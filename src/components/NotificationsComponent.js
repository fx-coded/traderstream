import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";
import RoomAccessHandler from "./RoomAccessHandler";
import "../styles/Notifications.css"; // Create this CSS file

const NotificationsComponent = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Set up real-time listener for user's notifications
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date (newest first)
      notificationsList.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
      
      setNotifications(notificationsList);
      
      // Count unread notifications
      const unread = notificationsList.filter(notification => !notification.read).length;
      setUnreadCount(unread);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const promises = notifications
        .filter(notification => !notification.read)
        .map(notification => 
          updateDoc(doc(db, "notifications", notification.id), {
            read: true
          })
        );
      
      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Render notification based on type
  const renderNotification = (notification) => {
    switch(notification.type) {
      case "join_request":
        return (
          <div className={`notification join-request ${!notification.read ? 'unread' : ''}`}>
            <div className="notification-content" onClick={() => markAsRead(notification.id)}>
              <p className="notification-message">{notification.message}</p>
              <span className="notification-time">
                {notification.createdAt.toDate().toLocaleString()}
              </span>
            </div>
            <div className="notification-actions">
              <RoomAccessHandler 
                user={user}
                notificationId={notification.id}
                roomId={notification.roomId}
                requesterId={notification.requesterId}
                requesterName={notification.requesterName}
                roomName={notification.roomName}
              />
            </div>
          </div>
        );
      
      case "request_approved":
      case "request_declined":
      case "room_created":
        return (
          <div 
            className={`notification ${notification.type} ${!notification.read ? 'unread' : ''}`}
            onClick={() => markAsRead(notification.id)}
          >
            <p className="notification-message">{notification.message}</p>
            <span className="notification-time">
              {notification.createdAt.toDate().toLocaleString()}
            </span>
          </div>
        );
      
      default:
        return (
          <div 
            className={`notification ${!notification.read ? 'unread' : ''}`}
            onClick={() => markAsRead(notification.id)}
          >
            <p className="notification-message">{notification.message}</p>
            <span className="notification-time">
              {notification.createdAt.toDate().toLocaleString()}
            </span>
          </div>
        );
    }
  };

  // Component to be included in Navbar
  return (
    <div className="notifications-container">
      <div className="notification-icon" onClick={toggleNotifications}>
        <span>🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notifications-list">
            {loading ? (
              <p className="notifications-loading">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="no-notifications">No notifications</p>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className="notification-item">
                  {renderNotification(notification)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsComponent;