import React from "react";

const StreamerProfile = ({ streamer, setSelectedStreamer }) => {
  if (!streamer) return null;

  return (
    <div className="streamer-profile">
      <button className="back-button" onClick={() => setSelectedStreamer(null)}>
        ← Back
      </button>
      <div className="profile-header">
        <h2>{streamer.name}</h2>
        <p className="bio">{streamer.bio}</p>
        <p className="viewers">👀 {streamer.viewers} viewers</p>
      </div>
      <div className="past-streams">
        <h3>Past Streams</h3>
        <ul>
          {streamer.streams.map((stream, index) => (
            <li key={index}>{stream}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StreamerProfile;