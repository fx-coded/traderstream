import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import "../styles/TrendingStreams.css";
import img1 from "./images/img1.png";
import img2 from "./images/img2.png";
import img3 from "./images/img3.png";
import img11 from "./images/img11.png";
import img13 from "./images/img13.png";
import img14 from "./images/img14.png";
import trive from "./images/trive.jpg";
import { FaUsers, FaFire, FaClock, FaUserPlus, FaCircle } from "react-icons/fa";

// Placeholder assets in case real data is not available
const placeholderStreams = [
  { id: 1, type: "stream", name: "My 2025 watchlist", category: "Crypto Trading", viewers: 0, thumbnail: img1, creator: "Money Speaks" },
  { id: 2, type: "stream", name: "My 2025 watchlist", category: "Gold, Oil & Indices", viewers: 0, thumbnail: img2, creator: "FxGuru" },
  { id: 3, type: "stream", name: "My 2025 watchlist", category: "Crypto Trading", viewers: 0, thumbnail: img3, creator: "Diamond Hands" },
];

const placeholderDiscussions = [
  { id: 11, type: "chat", name: "🚀 Bitcoin 100x 🚀", category: "Crypto Trading", members: 250, profilePic: img11, message: "Bitcoin breakout incoming, sending it to the moon! 🌕", creator: "Money Speaks" },
  { id: 13, type: "chat", name: "Solana Degen Calls", category: "Crypto Trading", members: 200, profilePic: img13, message: "Solana $500 EOD?? Don't fade the degen pump! 🤯", creator: "Diamond Hands" },
  { id: 14, type: "chat", name: "Gold Scalpers 🔥", category: "Gold, Oil & Indices", members: 180, profilePic: img14, message: "XAU/USD just broke resistance, get in before the next run! 🚀", creator: "FxGuru" },
];

const TrendingStreams = ({ setSelectedStreamer, realStreams, realChats }) => {
  const navigate = useNavigate();
  // State for different sections
  const [liveStreams, setLiveStreams] = useState([]);
  const [newRooms, setNewRooms] = useState([]);
  const [trendingRooms, setTrendingRooms] = useState([]);
  const [loading, setLoading] = useState({
    streams: true,
    newRooms: true,
    trendingRooms: true
  });

  // Fetch live streams, new rooms, and trending rooms from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch live streams
        await fetchLiveStreams();
        
        // 2. Fetch new chat rooms (most recently created)
        await fetchNewRooms();
        
        // 3. Fetch trending chat rooms (most members/active)
        await fetchTrendingRooms();
        
      } catch (error) {
        console.error("Error fetching trending data:", error);
        // Handle errors by using placeholder data
        fallbackToPlaceholders();
      }
    };
    
    fetchData();
  }, [realStreams, realChats]);

  // Function to fetch live streams
  const fetchLiveStreams = async () => {
    try {
      // If we have real streams data from props, use it
      if (realStreams && realStreams.length > 0) {
        setLiveStreams(realStreams.slice(0, 3));
      } else {
        // Otherwise, fetch from Firestore
        const streamsQuery = query(
          collection(db, "streams"), 
          where("isLive", "==", true),
          orderBy("viewerCount", "desc"), 
          limit(3)
        );
        
        const streamsSnapshot = await getDocs(streamsQuery);
        
        if (!streamsSnapshot.empty) {
          const streamsList = streamsSnapshot.docs.map(doc => ({
            id: doc.id,
            type: "stream",
            ...doc.data()
          }));
          setLiveStreams(streamsList);
        } else {
          // No live streams, use placeholders
          setLiveStreams(placeholderStreams);
        }
      }
    } catch (error) {
      console.error("Error fetching live streams:", error);
      setLiveStreams(placeholderStreams);
    } finally {
      setLoading(prev => ({ ...prev, streams: false }));
    }
  };

  // Function to fetch new rooms
  const fetchNewRooms = async () => {
    try {
      const roomsQuery = query(
        collection(db, "rooms"), 
        orderBy("createdAt", "desc"), 
        limit(3)
      );
      
      const roomsSnapshot = await getDocs(roomsQuery);
      
      if (!roomsSnapshot.empty) {
        const roomsList = roomsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: "chat",
            name: data.roomName,
            category: data.category,
            members: data.members ? data.members.length : 0,
            profilePic: data.thumbnail || getPlaceholderImage(data.category),
            message: data.messages && data.messages.length > 0 ? 
              data.messages[data.messages.length - 1].text : 
              `Welcome to ${data.roomName}!`,
            creator: data.adminName || "Anonymous",
            isPrivate: data.isPrivate,
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            chatId: data.chatId
          };
        });
        setNewRooms(roomsList);
      } else {
        // No rooms found, use first 3 placeholder discussions
        setNewRooms(placeholderDiscussions.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching new rooms:", error);
      setNewRooms(placeholderDiscussions.slice(0, 3));
    } finally {
      setLoading(prev => ({ ...prev, newRooms: false }));
    }
  };

  // Function to fetch trending rooms (by member count)
  const fetchTrendingRooms = async () => {
    try {
      // If we have real chats from props, use those
      if (realChats && realChats.length > 0) {
        // Sort by members count to get most popular
        const sortedChats = [...realChats].sort((a, b) => 
          (b.members || 0) - (a.members || 0)
        ).slice(0, 3);
        
        setTrendingRooms(sortedChats);
      } else {
        // Otherwise fetch from Firestore
        // We're defining "trending" as rooms with most members
        const roomsQuery = query(
          collection(db, "rooms"),
          // Here we would ideally order by member count, but Firestore can't order by array length
          // Instead, we'll fetch more rooms and sort them manually
          limit(20)
        );
        
        const roomsSnapshot = await getDocs(roomsQuery);
        
        if (!roomsSnapshot.empty) {
          let roomsList = roomsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: "chat",
              name: data.roomName,
              category: data.category,
              members: data.members ? data.members.length : 0,
              profilePic: data.thumbnail || getPlaceholderImage(data.category),
              message: data.messages && data.messages.length > 0 ? 
                data.messages[data.messages.length - 1].text : 
                `Welcome to ${data.roomName}!`,
              creator: data.adminName || "Anonymous",
              isPrivate: data.isPrivate,
              createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
              chatId: data.chatId,
              // Last activity can be determined by the timestamp of the last message
              lastActivity: data.messages && data.messages.length > 0 ?
                data.messages[data.messages.length - 1].timestamp :
                data.createdAt
            };
          });
          
          // Sort by member count to get trending rooms
          roomsList.sort((a, b) => b.members - a.members);
          setTrendingRooms(roomsList.slice(0, 3));
        } else {
          // No rooms found, use placeholder discussions
          setTrendingRooms(placeholderDiscussions);
        }
      }
    } catch (error) {
      console.error("Error fetching trending rooms:", error);
      setTrendingRooms(placeholderDiscussions);
    } finally {
      setLoading(prev => ({ ...prev, trendingRooms: false }));
    }
  };

  // Fallback to placeholders if all fetches fail
  const fallbackToPlaceholders = () => {
    setLiveStreams(placeholderStreams);
    setNewRooms(placeholderDiscussions.slice(0, 3));
    setTrendingRooms(placeholderDiscussions);
    setLoading({
      streams: false,
      newRooms: false,
      trendingRooms: false
    });
  };

  // Helper function to get placeholder images based on category
  const getPlaceholderImage = (category) => {
    switch (category) {
      case "Crypto Trading":
        return img11;
      case "Gold, Oil & Indices":
        return img14;
      default:
        return img13;
    }
  };

  // Navigate to chat room when clicked
  const handleRoomClick = (room) => {
    if (room.chatId) {
      navigate(`/chat/${room.chatId}`);
    } else if (setSelectedStreamer) {
      setSelectedStreamer(room);
    }
  };

  // Format relative time (e.g., "2 hours ago")
  const getRelativeTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="trending-container">
      {/* Trive Advertisement Banner */}
      <div className="ad-banner">
        <div className="ad-label">Ad</div>
        <div className="ad-content">
          <div className="ad-text">
            <h2 className="ad-title">TRADE WITH TRIVE<br/>- THE PREMIER<br/>GLOBAL BROKER</h2>
            <p className="ad-subtext">Access 10,000+ markets with<br/>competitive spreads</p>
          </div>
          <div className="ad-media">
            <div className="ad-video-container">
              <iframe 
                className="youtube-video" 
                src="https://www.youtube.com/embed/P0E0rZCfo3A?autoplay=1&mute=1&loop=1&playlist=P0E0rZCfo3A" 
                title="Trive International" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="ad-info">
            <div className="ad-info-container">
              <div className="ad-info-icon">
                <img src={trive} alt="Trive icon" className="trive-icon" />
              </div>
              <div className="ad-info-text">
                <h3 className="ad-info-title">What is Trive Social?</h3>
                <p className="ad-info-description">
                  Trive Social is a trading platform that seamlessly integrates with technology. It simplifies the trading journey through copy trading, where users can follow and replicate the trades of top-performing traders. This feature is ideal for beginners learning the ropes and for experienced traders looking to diversify by leveraging expert strategies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Live Streams Section */}
      <section className="trending-section">
        <div className="section-header">
          <h3 className="section-title">
            <FaCircle className="live-icon pulse" /> LIVE STREAMS
          </h3>
          <button className="view-all-btn" onClick={() => navigate('/streams')}>
            View All
          </button>
        </div>
        
        {loading.streams ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="content-grid">
            {liveStreams.map(stream => (
              <div 
                key={stream.id} 
                className="content-card stream-card" 
                onClick={() => setSelectedStreamer(stream)}
              >
                <div className="card-thumbnail">
                  <div className="live-tag">LIVE</div>
                  <div className="viewers-count">
                    <FaUsers className="icon" /> {stream.viewers || 0}
                  </div>
                  <img 
                    src={stream.thumbnail} 
                    alt={stream.name} 
                    className="thumbnail-img"
                  />
                </div>
                <div className="card-info">
                  <div className="info-row">
                    <p className="creator-name">{stream.creator}</p>
                    <span className="category-tag">{stream.category}</span>
                  </div>
                  <p className="stream-name">{stream.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* New Chat Rooms Section */}
      <section className="trending-section">
        <div className="section-header">
          <h3 className="section-title">
            <FaUserPlus className="section-icon" /> NEW CHAT ROOMS
          </h3>
          <button className="view-all-btn" onClick={() => navigate('/rooms')}>
            View All
          </button>
        </div>
        
        {loading.newRooms ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="content-grid">
            {newRooms.map(room => (
              <div 
                key={room.id} 
                className="content-card room-card" 
                onClick={() => handleRoomClick(room)}
              >
                <div className="card-thumbnail">
                  {room.isPrivate && (
                    <div className="private-tag">PRIVATE</div>
                  )}
                  <div className="members-count">
                    <FaUsers className="icon" /> {room.members}
                  </div>
                  <img 
                    src={room.profilePic} 
                    alt={room.name} 
                    className="thumbnail-img"
                  />
                </div>
                <div className="card-info">
                  <div className="info-row">
                    <p className="creator-name">{room.creator}</p>
                    <div className="time-tag">
                      <FaClock className="icon" /> {getRelativeTime(room.createdAt)}
                    </div>
                  </div>
                  <p className="stream-name">{room.name}</p>
                  <span className="category-tag">{room.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* Trending Chat Rooms Section */}
      <section className="trending-section">
        <div className="section-header">
          <h3 className="section-title">
            <FaFire className="section-icon" /> TRENDING DISCUSSIONS
          </h3>
          <button className="view-all-btn" onClick={() => navigate('/rooms')}>
            View All
          </button>
        </div>
        
        {loading.trendingRooms ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="content-grid">
            {trendingRooms.map(room => (
              <div 
                key={room.id} 
                className="content-card room-card" 
                onClick={() => handleRoomClick(room)}
              >
                <div className="card-thumbnail">
                  {room.isPrivate && (
                    <div className="private-tag">PRIVATE</div>
                  )}
                  <div className="members-count">
                    <FaUsers className="icon" /> {room.members}
                  </div>
                  <img 
                    src={room.profilePic} 
                    alt={room.name} 
                    className="thumbnail-img"
                  />
                </div>
                <div className="card-info">
                  <div className="info-row">
                    <p className="creator-name">{room.creator}</p>
                    <span className="category-tag">{room.category}</span>
                  </div>
                  <p className="stream-name">{room.name}</p>
                  <p className="latest-message">{room.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TrendingStreams;