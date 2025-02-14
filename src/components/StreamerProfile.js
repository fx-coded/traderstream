import React, { useState, useEffect } from "react";
import { db, storage } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../styles/global.css";

const StreamerProfile = ({ streamer, user, setSelectedStreamer }) => {
  const [bio, setBio] = useState("");
  const [editing, setEditing] = useState(false);
  const [profilePic, setProfilePic] = useState("");
  const [username, setUsername] = useState("");
  const [uploading, setUploading] = useState(false);
  const [experience, setExperience] = useState("Beginner");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!streamer) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", streamer.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBio(userData.bio || "");
          setProfilePic(userData.profilePic || "");
          setUsername(userData.username || "");
          setExperience(userData.experience || "Beginner");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [streamer]);

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const fileRef = ref(storage, `profile_pictures/${streamer.id}`);
      await uploadBytes(fileRef, file);
      const imageUrl = await getDownloadURL(fileRef);

      await updateDoc(doc(db, "users", streamer.id), { profilePic: imageUrl });
      setProfilePic(imageUrl);
    } catch (err) {
      setError("⚠️ Error uploading image. Try again.");
    }

    setUploading(false);
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      setError("⚠️ Username cannot be empty.");
      return;
    }

    try {
      await updateDoc(doc(db, "users", streamer.id), { bio, username, experience });
      setEditing(false);
    } catch (err) {
      setError("⚠️ Error updating profile. Try again.");
    }
  };

  if (!streamer) {
    return <p className="no-profile">⚠️ No streamer selected.</p>;
  }

  return (
    <div className="streamer-profile">
      <button className="back-button" onClick={() => setSelectedStreamer(null)}>
        ← Back
      </button>

      <div className="profile-header">
        <div className="profile-pic-container">
          <img src={profilePic} alt="Profile" className="profile-pic" />
          {user?.uid === streamer.id && (
            <>
              <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="upload-input" />
              {uploading && <p className="uploading-text">Uploading...</p>}
            </>
          )}
        </div>

        <div>
          {editing ? (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="editable-input"
            />
          ) : (
            <h2>{username}</h2>
          )}

          {editing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="editable-input"
            />
          ) : (
            <p className="bio">{bio}</p>
          )}

          <p className="experience">🎯 Experience Level: {experience}</p>
          {editing && (
            <select value={experience} onChange={(e) => setExperience(e.target.value)}>
              <option value="Beginner">Beginner - Haven’t lost money (yet)</option>
              <option value="Intermediate">Intermediate - Lost a bit of money</option>
              <option value="Pro">Pro - Lost a sh*t ton of money</option>
            </select>
          )}
        </div>
      </div>

      {streamer.isLive ? (
        <div className="live-stream-section">
          <h3>🔴 Live Now</h3>
          <p>🚀 Streaming in progress...</p>
        </div>
      ) : (
        <p className="offline-text">⚫ {username} is currently offline.</p>
      )}

      <div className="past-streams">
        <h3>📺 Past Streams</h3>
        {streamer.streams.length > 0 ? (
          <ul>
            {streamer.streams.map((stream, index) => (
              <li key={index}>{stream}</li>
            ))}
          </ul>
        ) : (
          <p>No past streams available.</p>
        )}
      </div>

      {user?.uid === streamer.id && (
        <div className="edit-profile">
          {editing ? (
            <button className="edit-btn" onClick={handleSaveProfile}>
              ✅ Save Changes
            </button>
          ) : (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              ✏️ Edit Profile
            </button>
          )}
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default StreamerProfile;
