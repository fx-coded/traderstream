import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "../firebaseConfig";
import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../styles/StreamerProfile.css";

const StreamerProfile = ({ user }) => {
  const { streamerId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [streamer, setStreamer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    experience: "Beginner",
    socialLinks: { twitter: "", youtube: "", tiktok: "", discord: "" }
  });
  const [profilePic, setProfilePic] = useState("/default-profile.png");
  const [followers, setFollowers] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Check if the current user is the profile owner
  const isProfileOwner = user?.uid === streamerId;

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle social media link changes
  const handleSocialLinkChange = (platform, value) => {
    setFormData({
      ...formData,
      socialLinks: { ...formData.socialLinks, [platform]: value }
    });
  };

  // 🔥 Fetch user profile in real-time
  useEffect(() => {
    if (!streamerId) {
      setError("Invalid profile ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, "users", streamerId);
    
    const unsubscribe = onSnapshot(
      userRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setStreamer(userData);
          
          // Initialize form data from user data
          setFormData({
            username: userData.username || "",
            bio: userData.bio || "",
            experience: userData.experience || "Beginner",
            socialLinks: userData.socialLinks || { twitter: "", youtube: "", tiktok: "", discord: "" }
          });
          
          setProfilePic(userData.profilePic || "/default-profile.png");
          setFollowers(userData.followers || []);
          setLoading(false);
        } else {
          setError("Streamer profile not found");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching streamer profile:", err);
        setError("Failed to load profile data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [streamerId]);

  // Update following status when user or followers change
  useEffect(() => {
    if (user && followers.length > 0) {
      setIsFollowing(followers.includes(user.uid));
    } else {
      setIsFollowing(false);
    }
  }, [followers, user]);

  // 📸 Handle profile picture upload
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("⚠️ Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError("⚠️ Image must be smaller than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const fileRef = ref(storage, `profile_pictures/${streamerId}_${Date.now()}`);
      await uploadBytes(fileRef, file);
      const imageUrl = await getDownloadURL(fileRef);

      await updateDoc(doc(db, "users", streamerId), { 
        profilePic: imageUrl,
        updatedAt: serverTimestamp()
      });
      
      setProfilePic(imageUrl);
      setSuccessMessage("Profile picture updated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("⚠️ Error uploading image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Save profile updates (username, bio, experience, links)
  const handleSaveProfile = async () => {
    if (!formData.username.trim()) {
      setError("⚠️ Username cannot be empty.");
      return;
    }

    if (formData.bio.length > 500) {
      setError("⚠️ Bio must be less than 500 characters.");
      return;
    }

    setError("");
    
    try {
      await updateDoc(doc(db, "users", streamerId), {
        username: formData.username,
        bio: formData.bio,
        experience: formData.experience,
        socialLinks: formData.socialLinks,
        updatedAt: serverTimestamp()
      });

      setSuccessMessage("Profile updated successfully!");
      setEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("⚠️ Error updating profile. Please try again.");
    }
  };

  // ➕ Follow / Unfollow streamer
  const handleFollow = useCallback(async () => {
    if (!user) {
      // Navigate to login or show login modal
      setError("You need to log in to follow streamers!");
      return;
    }

    try {
      const userRef = doc(db, "users", streamerId);
      let updatedFollowers = isFollowing
        ? followers.filter((followerId) => followerId !== user.uid)
        : [...followers, user.uid];

      await updateDoc(userRef, { 
        followers: updatedFollowers,
        updatedAt: serverTimestamp()
      });
      
      setFollowers(updatedFollowers);
      setIsFollowing(!isFollowing);
      
      // Update followers count in the user's profile as well
      const currentUserRef = doc(db, "users", user.uid);
      await updateDoc(currentUserRef, {
        following: isFollowing 
          ? (user.following || []).filter(id => id !== streamerId)
          : [...(user.following || []), streamerId]
      });
      
    } catch (err) {
      console.error("Error updating follow status:", err);
      setError("⚠️ Failed to update follow status. Please try again.");
    }
  }, [user, streamerId, followers, isFollowing]);

  // Cancel editing and reset form data
  const handleCancelEdit = () => {
    if (streamer) {
      setFormData({
        username: streamer.username || "",
        bio: streamer.bio || "",
        experience: streamer.experience || "Beginner",
        socialLinks: streamer.socialLinks || { twitter: "", youtube: "", tiktok: "", discord: "" }
      });
    }
    setEditing(false);
    setError("");
  };

  if (loading) {
    return (
      <div className="streamer-profile loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error === "Streamer profile not found") {
    return (
      <div className="streamer-profile error-container">
        <h2>Profile Not Found</h2>
        <p>The streamer profile you're looking for doesn't exist.</p>
        <button className="primary-btn" onClick={() => navigate("/")}>
          Return to Home
        </button>
      </div>
    );
  }

  if (!streamer && !loading) {
    return (
      <div className="streamer-profile error-container">
        <h2>Something went wrong</h2>
        <p>{error || "Unable to load profile data"}</p>
        <button className="primary-btn" onClick={() => navigate("/")}>
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="streamer-profile">
      <div className="profile-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        
        {isProfileOwner && !editing && (
          <button className="edit-btn" onClick={() => setEditing(true)}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {successMessage && (
        <div className="success-message">
          ✅ {successMessage}
        </div>
      )}

      <div className="profile-container">
        <div className="profile-pic-container">
          <img 
            src={profilePic} 
            alt={`${formData.username}'s profile`} 
            className="profile-pic"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/default-profile.png";
            }} 
          />
          
          {isProfileOwner && editing && (
            <div className="profile-pic-upload">
              <label className="upload-btn">
                {uploading ? "Uploading..." : "📸 Change Profile"}
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/gif, image/webp" 
                  onChange={handleProfilePicUpload}
                  disabled={uploading} 
                />
              </label>
              {uploading && <div className="upload-progress"></div>}
            </div>
          )}
        </div>

        <div className="profile-info">
          {editing ? (
            <input 
              type="text" 
              name="username"
              value={formData.username} 
              onChange={handleInputChange} 
              className="editable-input username-input"
              placeholder="Username"
              maxLength={30}
            />
          ) : (
            <h2 className="profile-username">{formData.username || "Unnamed Trader"}</h2>
          )}

          <div className="experience-badge">
            {editing ? (
              <select 
                name="experience" 
                value={formData.experience} 
                onChange={handleInputChange}
                className="experience-select"
              >
                <option value="Beginner">Beginner - Haven't lost money (yet)</option>
                <option value="Intermediate">Intermediate - Lost a bit of money</option>
                <option value="Pro">Pro - Lost a sh*t ton of money</option>
                <option value="Expert">Expert - Actually making money</option>
              </select>
            ) : (
              <span className={`experience-level ${formData.experience.toLowerCase()}`}>
                🎯 {formData.experience}
              </span>
            )}
          </div>
          
          <div className="bio-container">
            {editing ? (
              <>
                <textarea 
                  name="bio"
                  value={formData.bio} 
                  onChange={handleInputChange} 
                  className="editable-input bio-input"
                  placeholder="Tell others about yourself..."
                  maxLength={500}
                />
                <small className="char-count">
                  {formData.bio.length}/500 characters
                </small>
              </>
            ) : (
              <p className="bio">{formData.bio || "No bio available"}</p>
            )}
          </div>

          <div className="stats-container">
            <div className="followers-count">
              <span className="count-number">{followers.length}</span>
              <span className="count-label">Followers</span>
            </div>
            
            {!isProfileOwner && user && (
              <button 
                className={`follow-btn ${isFollowing ? "following" : ""}`} 
                onClick={handleFollow}
              >
                {isFollowing ? "✅ Following" : "➕ Follow"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="social-links-container">
        <h3 className="social-links-title">Social Links</h3>
        
        {editing ? (
          <div className="social-links-edit">
            <div className="social-link-input">
              <label>Twitter:</label>
              <input 
                type="text" 
                value={formData.socialLinks.twitter} 
                onChange={(e) => handleSocialLinkChange("twitter", e.target.value)}
                placeholder="Twitter username or URL" 
              />
            </div>
            
            <div className="social-link-input">
              <label>YouTube:</label>
              <input 
                type="text" 
                value={formData.socialLinks.youtube} 
                onChange={(e) => handleSocialLinkChange("youtube", e.target.value)}
                placeholder="YouTube channel URL" 
              />
            </div>
            
            <div className="social-link-input">
              <label>TikTok:</label>
              <input 
                type="text" 
                value={formData.socialLinks.tiktok} 
                onChange={(e) => handleSocialLinkChange("tiktok", e.target.value)}
                placeholder="TikTok username" 
              />
            </div>
            
            <div className="social-link-input">
              <label>Discord:</label>
              <input 
                type="text" 
                value={formData.socialLinks.discord} 
                onChange={(e) => handleSocialLinkChange("discord", e.target.value)}
                placeholder="Discord username or server" 
              />
            </div>
          </div>
        ) : (
          <div className="social-links-display">
            {Object.entries(formData.socialLinks).some(([_, value]) => value) ? (
              Object.entries(formData.socialLinks).map(([platform, value]) => (
                value && (
                  <a 
                    key={platform}
                    href={value.startsWith('http') ? value : `https://${platform}.com/${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    {platform === "twitter" && "𝕏 Twitter"}
                    {platform === "youtube" && "▶️ YouTube"}
                    {platform === "tiktok" && "📱 TikTok"}
                    {platform === "discord" && "💬 Discord"}
                  </a>
                )
              ))
            ) : (
              <p className="no-socials">No social links provided</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      {editing && (
        <div className="edit-controls">
          <button className="cancel-btn" onClick={handleCancelEdit}>
            ❌ Cancel
          </button>
          <button className="save-btn" onClick={handleSaveProfile}>
            ✅ Save Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default StreamerProfile;