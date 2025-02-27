import React, { useEffect, useState, useMemo } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate, useLocation } from "react-router-dom";

const TraderSidebar = ({ user }) => {
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      // Query all rooms where the user is a member, sorted by last activity
      const roomsRef = collection(db, "rooms");
      const q = query(
        roomsRef, 
        where("members", "array-contains", user.uid),
        orderBy("lastActivityAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const rooms = snapshot.docs.map((doc) => ({ 
            id: doc.id, 
            ...doc.data(),
            isActive: false
          }));
          setUserGroups(rooms);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching rooms:", err);
          setError("Failed to load your trading rooms");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up room listener:", err);
      setError("Failed to connect to trading rooms");
      setLoading(false);
    }
  }, [user]);

  // Determine which room is currently active
  const currentRooms = useMemo(() => {
    if (!userGroups.length) return [];
    
    const currentPath = location.pathname;
    return userGroups.map(group => ({
      ...group,
      isActive: currentPath.includes(`/chat/${group.chatId}`)
    }));
  }, [userGroups, location.pathname]);

  const handleRoomClick = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  const renderRoomStatus = (group) => {
    if (group.memberCount > 0) {
      return (
        <span className="member-count">
          👥 {group.memberCount || group.members?.length || 0}
        </span>
      );
    }
    return group.isPrivate ? "🔒 Private" : "🌍 Public";
  };

  if (loading) {
    return (
      <div className="sidebar-container loading">
        <h3 className="sidebar-title">📢 My Trading Rooms</h3>
        <div className="loading-indicator">Loading your rooms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sidebar-container error">
        <h3 className="sidebar-title">📢 My Trading Rooms</h3>
        <div className="error-message">{error}</div>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar-container">
      <h3 className="sidebar-title">📢 My Trading Rooms</h3>
      {currentRooms.length === 0 ? (
        <div className="no-groups-container">
          <p className="no-groups-message">You're not part of any rooms yet.</p>
          <button 
            className="create-room-button"
            onClick={() => navigate("/create-room")}
          >
            Create a Room
          </button>
        </div>
      ) : (
        <ul className="group-list">
          {currentRooms.map((group) => (
            <li
              key={group.id}
              className={`group-item ${group.isActive ? 'active' : ''}`}
              onClick={() => handleRoomClick(group.chatId)}
            >
              <div className="group-info">
                <img 
                  src={group.thumbnail || "/assets/default-room.svg"} 
                  alt={group.roomName} 
                  className="group-thumbnail"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/assets/default-room.svg";
                  }}
                />
                <div className="group-details">
                  <h4>{group.roomName}</h4>
                  <p className="group-status">
                    {renderRoomStatus(group)}
                    {group.unreadCount > 0 && (
                      <span className="unread-badge">{group.unreadCount}</span>
                    )}
                  </p>
                  {group.lastMessage && (
                    <p className="last-message">
                      {group.lastMessage.slice(0, 30)}
                      {group.lastMessage.length > 30 ? "..." : ""}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="sidebar-footer">
        <button 
          className="join-room-button"
          onClick={() => navigate("/join-room")}
        >
          Join a Room
        </button>
      </div>
    </div>
  );
};

export default TraderSidebar;