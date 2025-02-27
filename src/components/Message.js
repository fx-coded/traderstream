import React, { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

const Message = ({ message, groupId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);

  const handleEdit = async () => {
    const messageRef = doc(db, "groups", groupId, "messages", message.id);
    await updateDoc(messageRef, { text: editedText, edited: true });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const messageRef = doc(db, "groups", groupId, "messages", message.id);
    await deleteDoc(messageRef);
  };

  return (
    <div className="flex gap-3 p-2 border-b border-gray-700">
      <img src={message.profilePic} alt="Trader" className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <div className="font-bold">{message.username}</div>
        {isEditing ? (
          <input
            type="text"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="bg-gray-700 p-2 rounded w-full"
          />
        ) : (
          <p>{message.text} {message.edited && <span className="text-sm text-gray-500">(Edited)</span>}</p>
        )}
        <div className="flex gap-2 mt-1">
          {message.userId === auth.currentUser?.uid && (
            <>
              {isEditing ? (
                <button onClick={handleEdit} className="text-green-500">Save</button>
              ) : (
                <button onClick={() => setIsEditing(true)} className="text-blue-500">Edit</button>
              )}
              <button onClick={handleDelete} className="text-red-500">Delete</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
