import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import "../styles/Notifications.css";

const NotificationsComponent = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Memoized fetch notifications function
  const fetchNotifications = useCallback(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return () => {};
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date (newest first)
      const sortedNotifications = notificationsList.sort((a, b) => 
        b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
      );
      
      setNotifications(sortedNotifications);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Use effect for fetching notifications and adding click outside listener
  useEffect(() => {
    const unsubscribe = fetchNotifications();
    
    // Add click outside listener to close notifications
    const handleClickOutside = (event) => {
      const container = document.querySelector('.notifications-container');
      if (container && !container.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup function
    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fetchNotifications]);

  // Memoize unread count
  const unreadCount = useMemo(() => 
    notifications.filter(notification => !notification.read).length, 
    [notifications]
  );

  // Memoized toggle function
  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev);
  }, []);

  // Async function to mark a single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Async function to mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(notification => !notification.read);
      
      const promises = unreadNotifications.map(notification => 
        updateDoc(doc(db, "notifications", notification.id), {
          read: true
        })
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [notifications]);

  // Render notification based on type
  const renderNotification = useCallback((notification) => {
    const commonProps = {
      className: `notification ${notification.type} ${!notification.read ? 'unread' : ''}`,
      onClick: () => markAsRead(notification.id)
    };

    switch(notification.type) {
      case "join_request":
        return (
          <div {...commonProps}>
            <div className="notification-content">
              <p className="notification-message">{notification.message}</p>
              <span className="notification-time">
                {notification.createdAt.toDate().toLocaleString()}
              </span>
            </div>
            <div className="notification-actions">
              {user && notification.roomId && (
                <RoomAccessHandler 
                  user={user}
                  notificationId={notification.id}
                  roomId={notification.roomId}
                  requesterId={notification.requesterId}
                  requesterName={notification.requesterName}
                  roomName={notification.roomName}
                />
              )}
            </div>
          </div>
        );
      
      case "request_approved":
      case "request_declined":
      case "room_created":
      case "default":
        return (
          <div {...commonProps}>
            <p className="notification-message">{notification.message}</p>
            <span className="notification-time">
              {notification.createdAt.toDate().toLocaleString()}
            </span>
          </div>
        );
      
      default:
        return (
          <div {...commonProps}>
            <p className="notification-message">{notification.message}</p>
            <span className="notification-time">
              {notification.createdAt.toDate().toLocaleString()}
            </span>
          </div>
        );
    }
  }, [markAsRead, user]);

  // Render the notifications dropdown
  const renderNotificationsDropdown = useMemo(() => {
    if (!showNotifications) return null;

    return (
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
    );
  }, [
    showNotifications, 
    notifications, 
    loading, 
    markAllAsRead, 
    renderNotification
  ]);

  // Main render
  return (
    <div className="notifications-container">
      <div className="notification-icon" onClick={toggleNotifications}>
        <span>🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {renderNotificationsDropdown}
    </div>
  );
};

export default NotificationsComponent;