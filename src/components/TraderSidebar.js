import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

const TraderSidebar = ({ user }) => {
  const [userGroups, setUserGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // ✅ Query all rooms where the user is a member
    const roomsRef = collection(db, "rooms");
    const q = query(roomsRef, where("members", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserGroups(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="sidebar-container">
      <h3 className="sidebar-title">📢 My Trading Rooms</h3>
      {userGroups.length === 0 ? (
        <p className="no-groups-message">You're not part of any rooms yet.</p>
      ) : (
        <ul className="group-list">
          {userGroups.map((group) => (
            <li
              key={group.id}
              className="group-item"
              onClick={() => navigate(`/chat/${group.chatId}`)}
            >
              <div className="group-info">
                <img src={group.thumbnail || "https://via.placeholder.com/50"} alt="Group" className="group-thumbnail" />
                <div>
                  <h4>{group.roomName}</h4>
                  <p>{group.isPrivate ? "🔒 Private" : "🌍 Public"}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TraderSidebar;
