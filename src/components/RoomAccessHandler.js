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
  arrayRemove,
  addDoc,
  deleteDoc
} from "firebase/firestore";
import "../styles/RoomAccessHandler.css"; // Create this CSS file

const RoomAccessHandler = ({ user, notificationId, roomId, requesterId, requesterName, roomName }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  
  // Handle approve request
  const handleApprove = async () => {
    if (!user || !roomId || !requesterId) return;
    setIsProcessing(true);
    
    try {
      // Find the room document
      const roomsQuery = query(collection(db, "rooms"), where("roomId", "==", roomId));
      const roomSnapshot = await getDocs(roomsQuery);
      
      if (roomSnapshot.empty) {
        setStatus("Room not found");
        setIsProcessing(false);
        return;
      }
      
      const roomDoc = roomSnapshot.docs[0];
      
      // Add user to members and remove from pending
      await updateDoc(doc(db, "rooms", roomDoc.id), {
        members: arrayUnion(requesterId),
        pendingUsers: arrayRemove(requesterId)
      });
      
      // Add a welcome message to the room
      await updateDoc(doc(db, "rooms", roomDoc.id), {
        messages: arrayUnion({
          sender: "System",
          text: `👋 ${requesterName} has joined the room.`,
          timestamp: new Date()
        })
      });
      
      // Create notification for the requester
      await addDoc(collection(db, "notifications"), {
        userId: requesterId,
        type: "request_approved",
        roomId: roomId,
        roomName: roomName,
        message: `Your request to join "${roomName}" has been approved`,
        read: false,
        createdAt: new Date()
      });
      
      // Delete the original notification
      if (notificationId) {
        await deleteDoc(doc(db, "notifications", notificationId));
      }
      
      setStatus("User approved successfully");
    } catch (error) {
      console.error("Error approving request:", error);
      setStatus("Error approving request");
    }
    
    setIsProcessing(false);
  };
  
  // Handle decline request
  const handleDecline = async () => {
    if (!user || !roomId || !requesterId) return;
    setIsProcessing(true);
    
    try {
      // Find the room document
      const roomsQuery = query(collection(db, "rooms"), where("roomId", "==", roomId));
      const roomSnapshot = await getDocs(roomsQuery);
      
      if (roomSnapshot.empty) {
        setStatus("Room not found");
        setIsProcessing(false);
        return;
      }
      
      const roomDoc = roomSnapshot.docs[0];
      
      // Remove user from pending
      await updateDoc(doc(db, "rooms", roomDoc.id), {
        pendingUsers: arrayRemove(requesterId)
      });
      
      // Create notification for the requester
      await addDoc(collection(db, "notifications"), {
        userId: requesterId,
        type: "request_declined",
        roomId: roomId,
        roomName: roomName,
        message: `Your request to join "${roomName}" has been declined`,
        read: false,
        createdAt: new Date()
      });
      
      // Delete the original notification
      if (notificationId) {
        await deleteDoc(doc(db, "notifications", notificationId));
      }
      
      setStatus("Request declined");
    } catch (error) {
      console.error("Error declining request:", error);
      setStatus("Error declining request");
    }
    
    setIsProcessing(false);
  };
  
  return (
    <div className="room-access-handler">
      {status && <p className={status.includes("Error") ? "error-message" : "success-message"}>{status}</p>}
      
      <div className="access-buttons">
        <button 
          className="approve-btn" 
          onClick={handleApprove} 
          disabled={isProcessing}
        >
          ✅ Approve
        </button>
        <button 
          className="decline-btn" 
          onClick={handleDecline} 
          disabled={isProcessing}
        >
          ❌ Decline
        </button>
      </div>
    </div>
  );
};

export default RoomAccessHandler;