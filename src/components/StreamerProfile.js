import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../styles/global.css";

const StreamerProfile = ({ user }) => {
  const { streamerId } = useParams(); // Get streamer ID from URL
  const navigate = useNavigate();
  const [streamer, setStreamer] = useState(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [experience, setExperience] = useState("Beginner");
  const [socialLinks, setSocialLinks] = useState({ twitter: "", youtube: "", tiktok: "" });
  const [followers, setFollowers] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // 🔥 Fetch streamer profile data
  useEffect(() => {
    if (!streamerId) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", streamerId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setStreamer(userData);
          setUsername(userData.username || "");
          setBio(userData.bio || "");
          setProfilePic(userData.profilePic || "");
          setExperience(userData.experience || "Beginner");
          setSocialLinks(userData.socialLinks || { twitter: "", youtube: "", tiktok: "" });
          setFollowers(userData.followers || []);
        } else {
          navigate("/"); // Redirect if user not found
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [streamerId, navigate]);

  useEffect(() => {
    if (user) {
      setIsFollowing(followers.includes(user.uid));
    }
  }, [followers, user]);

  // 📸 Handle profile picture upload
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const fileRef = ref(storage, `profile_pictures/${streamerId}`);
      await uploadBytes(fileRef, file);
      const imageUrl = await getDownloadURL(fileRef);

      await updateDoc(doc(db, "users", streamerId), { profilePic: imageUrl });
      setProfilePic(imageUrl);
    } catch (err) {
      setError("⚠️ Error uploading image. Try again.");
    }

    setUploading(false);
  };

  // ✅ Save profile updates (username, bio, experience, links)
  const handleSaveProfile = async () => {
    if (!username.trim()) {
      setError("⚠️ Username cannot be empty.");
      return;
    }

    try {
      await updateDoc(doc(db, "users", streamerId), {
        username,
        bio,
        experience,
        socialLinks,
      });

      // Ensure username updates everywhere (chat, profile, etc.)
      if (user?.uid === streamerId) {
        user.displayName = username;
      }

      setEditing(false);
    } catch (err) {
      setError("⚠️ Error updating profile. Try again.");
    }
  };

  // ➕ Follow / Unfollow streamer
  const handleFollow = async () => {
    if (!user) return alert("You need to log in to follow streamers!");

    const userRef = doc(db, "users", streamerId);
    let updatedFollowers = isFollowing
      ? followers.filter((followerId) => followerId !== user.uid)
      : [...followers, user.uid];

    await updateDoc(userRef, { followers: updatedFollowers });
    setFollowers(updatedFollowers);
    setIsFollowing(!isFollowing);
  };

  if (!streamer) {
    return <p className="no-profile">⚠️ No streamer selected.</p>;
  }

  return (
    <div className={`streamer-profile ${editing ? "fullscreen-edit" : ""}`}>
      <button className="back-button" onClick={() => navigate("/")}>
        ← Back
      </button>

      <div className="profile-container">
        <div className="profile-pic-container">
          <img src={profilePic || "/default-profile.png"} alt="Profile" className="profile-pic" />
          {user?.uid === streamerId && editing && (
            <>
              <label className="upload-btn">
                📸 Change Profile
                <input type="file" accept="image/*" onChange={handleProfilePicUpload} />
              </label>
              {uploading && <p className="uploading-text">Uploading...</p>}
            </>
          )}
        </div>

        <div className="profile-info">
          {editing ? (
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="editable-input" />
          ) : (
            <h2>{username}</h2>
          )}

          {editing ? (
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="editable-input" />
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

          {user?.uid === streamerId && <p className="followers-count">👥 {followers.length} Followers</p>}

          {user && user.uid !== streamerId && (
            <button className="follow-btn" onClick={handleFollow}>
              {isFollowing ? "✅ Following" : "➕ Follow"}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="social-links">
          <label>Twitter:</label>
          <input type="text" value={socialLinks.twitter} onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })} />

          <label>YouTube:</label>
          <input type="text" value={socialLinks.youtube} onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })} />

          <label>TikTok:</label>
          <input type="text" value={socialLinks.tiktok} onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })} />
        </div>
      )}

      {editing ? (
        <button className="save-btn" onClick={handleSaveProfile}>✅ Save Profile</button>
      ) : (
        user?.uid === streamerId && (
          <button className="edit-btn" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
        )
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default StreamerProfile;
