import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion,
  addDoc
} from "firebase/firestore";
import "../styles/JoinRoomRequest.css"; // Create this CSS file

const JoinRoomRequest = ({ user, room }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState("");
  
  // Check if user is already in the pending list
  const isPending = room.pendingUsers?.includes(user?.uid);
  // Check if user is already a member
  const isMember = room.members?.includes(user?.uid);
  
  const handleJoinRequest = async () => {
    if (!user) {
      setError("You must be logged in to request access");
      return;
    }
    
    setIsRequesting(true);
    setError("");
    
    try {
      // Find the room document by roomId
      const roomsQuery = query(collection(db, "rooms"), where("roomId", "==", room.roomId));
      const roomSnapshot = await getDocs(roomsQuery);
      
      if (roomSnapshot.empty) {
        setError("Room not found");
        setIsRequesting(false);
        return;
      }
      
      const roomDoc = roomSnapshot.docs[0];
      
      // Add user to pending users
      await updateDoc(doc(db, "rooms", roomDoc.id), {
        pendingUsers: arrayUnion(user.uid)
      });
      
      // Get user name for the notification
      const userName = user.displayName || user.email?.split("@")[0] || "A user";
      
      // Create notification for the admin
      await addDoc(collection(db, "notifications"), {
        userId: room.adminId, // Send to room admin
        type: "join_request",
        roomId: room.roomId,
        roomName: room.roomName,
        requesterId: user.uid,
        requesterName: userName,
        message: `${userName} has requested to join your room "${room.roomName}"`,
        read: false,
        createdAt: new Date()
      });
      
      setRequestSent(true);
    } catch (error) {
      console.error("Error sending join request:", error);
      setError("Failed to send request. Please try again.");
    }
    
    setIsRequesting(false);
  };
  
  if (isMember) {
    return <div className="already-member">You are already a member of this room</div>;
  }
  
  if (requestSent || isPending) {
    return <div className="request-pending">Your request to join is pending admin approval</div>;
  }
  
  return (
    <div className="join-request-container">
      {error && <p className="error-message">{error}</p>}
      <button 
        className="request-access-btn" 
        onClick={handleJoinRequest} 
        disabled={isRequesting}
      >
        {isRequesting ? "Sending Request..." : "🔒 Request Access"}
      </button>
      <p className="join-info">
        This is a private room. The admin will review your request.
      </p>
    </div>
  );
};

export default JoinRoomRequest;