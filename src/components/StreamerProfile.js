import React from "react";
import LiveStreamPlayer from "./LivePlayer";
import ManageStream from "./ManageStream";

const StreamerProfile = ({ streamer, setSelectedStreamer }) => {
  if (!streamer) return null;

  return (
    <div className="streamer-profile">
      <button className="back-button" onClick={() => setSelectedStreamer(null)}>
        ← Back
      </button>

      {/* Profile Header */}
      <div className="profile-header">
        <img src={streamer.profilePic} alt={streamer.name} className="profile-pic" />
        <div>
          <h2>{streamer.name}</h2>
          <p className="bio">{streamer.bio}</p>
          <p className="viewers">👀 {streamer.viewers} viewers</p>
        </div>
      </div>

      {/* Show Live Stream if Streamer is Live */}
      {streamer.isLive ? (
        <div className="live-stream-section">
          <h3>🔴 Live Now</h3>
          <LiveStreamPlayer streamUrl={streamer.streamUrl} />
        </div>
      ) : (
        <p className="offline-text">⚫ {streamer.name} is currently offline.</p>
      )}

      {/* If the User is the Streamer, Show Stream Management */}
      {streamer.isOwner && <ManageStream streamer={streamer} />}

      {/* Past Streams Section */}
      <div className="past-streams">
        <h3>Past Streams</h3>
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
    </div>
  );
};

export default StreamerProfile;
