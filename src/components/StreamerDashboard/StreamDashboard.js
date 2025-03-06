import React, { useState, useEffect, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "./styles/Stream.css";
import { generateUniqueId } from "../utils/helpers";

// Import custom hooks
import { useDeviceCheck } from "../hooks/UseDeviceCheck";
import { useTimeFormatter } from "../hooks/UseTimeFormatter";
import { useStreamConnection } from "../hooks/UseStreamConnection";
import { useMediaStream } from "../hooks/UseMediaStream";
import { useWebRTC } from "../hooks/UseWebRTC";
import { useChat } from "../hooks/useChat";
import { useGuests } from "../hooks/useGuest";

// Import components
import StreamSetup from "./StreamSetup";
import ActiveStream from "./ActiveStream";

const StreamerDashboard = ({ user }) => {
  // Check if device is supported
  const isDeviceAllowed = useDeviceCheck();
  
  // Stream state
  const [showStreamSetup, setShowStreamSetup] = useState(true);
  const [streamActive, setStreamActive] = useState(false);
  const [streamId, setStreamId] = useState(null);
  const [streamTitle, setStreamTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [streamStartTime, setStreamStartTime] = useState(null);
  const [streamDuration, setStreamDuration] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [shareUrl, setShareUrl] = useState("");

  // Format time for stream duration
  const formatDuration = useTimeFormatter();
  
  // Socket connection
  const { 
    socket, 
    isConnected: socketConnected, 
    error: socketError, 
    viewerCount,
    emitEvent 
  } = useStreamConnection(streamId);
  
  // Media stream handling
  const {
    streamSource,
    setStreamSource,
    screenWithAudio,
    setScreenWithAudio,
    audioEnabled,
    mediaStream,
    error: mediaError,
    isLoading,
    getStream,
    toggleAudio,
    stopStream: stopMediaStream
  } = useMediaStream();
  
  // WebRTC connection
  const {
    initializeWebRTC,
    handleAnswer,
    handleIceCandidate,
    closePeerConnection
  } = useWebRTC(emitEvent);
  
  // Chat functionality
  const {
    messages: chatMessages,
    newMessage,
    setNewMessage,
    sendMessage: sendChatMessage,
    addMessage: addChatMessage,
    chatContainerRef
  } = useChat(emitEvent, streamId, user);
  
  // Guest management
  const {
    guests,
    setGuests,
    guestMode,
    inviteLink,
    selectedGuest,
    guestConnections,
    setGuestConnections,
    guestAudioRefs,
    generateInviteLink,
    acceptGuest,
    removeGuest,
    selectGuest,
    toggleGuestMode,
    copyInviteLink
  } = useGuests(emitEvent, streamId);

  // Set up socket event handlers
  useEffect(() => {
    if (!socket) return;
    
    // Handle chat messages
    const handleChatMessage = (message) => {
      addChatMessage(message);
    };
    
    // Handle guest requests
    const handleGuestRequest = (data) => {
      if (data.streamId === streamId) {
        const { guestId, guestName, audioOnly } = data;
        
        setGuests(prev => [...prev, {
          id: guestId,
          name: guestName,
          status: "pending",
          audioOnly
        }]);
      }
    };
    
    // Handle guest joined
    const handleGuestJoined = (data) => {
      if (data.streamId === streamId) {
        const { guestId } = data;
        
        setGuests(prev => prev.map(guest => 
          guest.id === guestId 
            ? { ...guest, status: "connected" } 
            : guest
        ));
      }
    };
    
    // Handle guest left
    const handleGuestLeft = (data) => {
      if (data.streamId === streamId) {
        removeGuest(data.guestId);
      }
    };
    
    // Handle WebRTC events
    const handleIncomingAnswer = (data) => {
      if (data.sdp) {
        handleAnswer(data.sdp);
      }
    };
    
    const handleIncomingIceCandidate = (data) => {
      if (data.candidate) {
        handleIceCandidate(data.candidate);
      }
    };
    
    // Register event handlers
    socket.on("chat-message", handleChatMessage);
    socket.on("guest-request", handleGuestRequest);
    socket.on("guest-joined", handleGuestJoined);
    socket.on("guest-left", handleGuestLeft);
    socket.on("answer", handleIncomingAnswer);
    socket.on("ice-candidate", handleIncomingIceCandidate);
    
    // Cleanup
    return () => {
      socket.off("chat-message", handleChatMessage);
      socket.off("guest-request", handleGuestRequest);
      socket.off("guest-joined", handleGuestJoined);
      socket.off("guest-left", handleGuestLeft);
      socket.off("answer", handleIncomingAnswer);
      socket.off("ice-candidate", handleIncomingIceCandidate);
    };
  }, [
    socket, 
    streamId, 
    addChatMessage, 
    handleAnswer, 
    handleIceCandidate, 
    removeGuest, 
    setGuests,
    mediaStream // Added mediaStream to dependency array
  ]);

  // Stream duration timer
  useEffect(() => {
    let timer;
    if (streamActive && streamStartTime) {
      timer = setInterval(() => {
        const seconds = Math.floor((Date.now() - streamStartTime) / 1000);
        setStreamDuration(seconds);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [streamActive, streamStartTime]);

  // Confirm before leaving if stream is active
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (streamActive) {
        const message = "You are currently streaming. Leaving this page will end your stream.";
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [streamActive]);

  // Start streaming with improved error handling
  const startStream = useCallback(async () => {
    console.log("Starting stream process...");
    
    // Reset error state
    setStreamError(null);
    
    // Validation
    if (!streamTitle.trim()) {
      setStreamError("Please enter a stream title");
      return;
    }
    
    if (!acceptedTerms) {
      setStreamError("You must accept the Terms & Conditions to start streaming");
      return;
    }

    if (!isDeviceAllowed) {
      setStreamError("Streaming is only available on desktop devices");
      return;
    }

    if (!socketConnected) {
      setStreamError("Not connected to streaming server. Please wait or refresh the page.");
      return;
    }
    
    try {
      console.log("Attempting to get media stream...");
      // Get media stream
      const stream = await getStream();
      
      if (!stream) {
        console.error("Failed to create media stream - stream is null or undefined");
        throw new Error("Failed to create media stream");
      }
      
      console.log("Media stream acquired successfully:", stream.id);
      console.log("Audio tracks:", stream.getAudioTracks().length);
      console.log("Video tracks:", stream.getVideoTracks().length);
      
      // Generate a unique stream ID
      const uniqueStreamId = generateUniqueId();
      console.log("Generated stream ID:", uniqueStreamId);
      setStreamId(uniqueStreamId);
      
      // Generate guest invite link
      try {
        const guestInviteUrl = generateInviteLink(uniqueStreamId);
        console.log(`Guest invite URL generated: ${guestInviteUrl}`);
      } catch (inviteError) {
        console.error("Error generating invite link:", inviteError);
        // Non-fatal error, continue
      }
      
      // Generate shareable URL
      const shareableUrl = `${window.location.origin}/viewer/${uniqueStreamId}`;
      setShareUrl(shareableUrl);
      console.log("Shareable URL created:", shareableUrl);
      
      // Initialize WebRTC
      console.log("Initializing WebRTC connection...");
      try {
        const rtcInitialized = await initializeWebRTC(stream, uniqueStreamId);
        
        if (!rtcInitialized) {
          console.error("WebRTC initialization returned false");
          throw new Error("Failed to initialize WebRTC connection");
        }
        console.log("WebRTC initialized successfully");
      } catch (rtcError) {
        console.error("Error during WebRTC initialization:", rtcError);
        throw rtcError; // Re-throw to be caught by the outer catch
      }
      
      // Prepare stream data
      const newStream = {
        id: uniqueStreamId,
        title: streamTitle,
        category,
        description,
        username: user?.displayName || user?.email?.split("@")[0] || "Anonymous",
        userId: user?.uid,
        photoURL: user?.photoURL || null,
        viewers: 0,
        startTime: Date.now(),
        streamType: streamSource,
        allowGuests: true
      };
      
      // Save to Firestore
      console.log("Saving stream data to Firestore...");
      try {
        await addDoc(collection(db, "streams"), {
          ...newStream,
          timestamp: serverTimestamp(),
          isActive: true
        });
        console.log("Stream data saved to Firestore");
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        throw new Error(`Database error: ${firestoreError.message}`);
      }
      
      // Notify socket server
      console.log("Notifying socket server about new stream...");
      const emitSuccess = emitEvent("start-stream", newStream);
      if (!emitSuccess) {
        console.warn("Socket emit may have failed - socket might be disconnected");
      }
      
      // Update UI state
      console.log("Updating UI state...");
      setShowStreamSetup(false);
      setStreamActive(true);
      setStreamStartTime(Date.now());
      
      console.log(`Stream started successfully! Stream ID: ${uniqueStreamId}`);
    } catch (error) {
      console.error("Streaming error (full details):", error);
      
      let errorMessage = "Failed to start streaming.";
      
      // More specific error messages based on error type
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "Camera, microphone, or screen access denied. Please enable permissions in your browser settings.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "Camera or microphone not found. Please check your device connections.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage = "Your camera or microphone is already in use by another application.";
      } else if (error.message) {
        // Include the actual error message for better debugging
        errorMessage = `Streaming error: ${error.message}`;
      }
      
      console.log("Setting error message:", errorMessage);
      setStreamError(errorMessage);
      
      // Clean up any partial setup
      console.log("Cleaning up after error...");
      stopMediaStream();
      closePeerConnection();
    }
  }, [
    streamTitle,
    category,
    description,
    acceptedTerms,
    isDeviceAllowed,
    socketConnected,
    user,
    streamSource,
    getStream,
    initializeWebRTC,
    generateInviteLink,
    emitEvent,
    stopMediaStream,
    closePeerConnection
  ]);

  // Stop streaming
  const stopStream = useCallback(() => {
    // Stop media streams
    stopMediaStream();
    
    // Close WebRTC connections
    closePeerConnection();
    
    // Notify server
    if (socket && streamId) {
      emitEvent("stop-stream", { streamerId: streamId });
    }
    
    // Reset state
    setShowStreamSetup(true);
    setStreamActive(false);
    setStreamDuration(0);
    setStreamStartTime(null);
    setStreamId(null);
    setShareUrl("");
    setGuests([]);
    
    console.log("Stream stopped!");
  }, [streamId, socket, emitEvent, stopMediaStream, closePeerConnection, setGuests]);

  // Take screenshot functionality
  const takeScreenshot = useCallback(() => {
    // Screenshot logic here - this would be passed to the ControlPanel component
    const videoElement = document.querySelector('.stream-video');
    if (!videoElement) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || videoElement.clientWidth;
    canvas.height = videoElement.videoHeight || videoElement.clientHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Convert to image and download
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `stream-screenshot-${new Date().toISOString().substring(0, 19).replace(/:/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // Copy stream URL
  const copyStreamUrl = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert("Stream URL copied to clipboard!");
        })
        .catch(err => {
          console.error("Failed to copy URL:", err);
        });
    }
  }, [shareUrl]);

  // Share stream
  const shareStream = useCallback(() => {
    if (!shareUrl) return;
    
    if (navigator.share) {
      navigator.share({
        title: streamTitle,
        text: `Check out my live trading stream: ${streamTitle}`,
        url: shareUrl
      }).catch(err => {
        console.error("Error sharing stream:", err);
      });
    } else {
      copyStreamUrl();
    }
  }, [shareUrl, streamTitle, copyStreamUrl]);

  // If device is not allowed, show error message
  if (!isDeviceAllowed) {
    return (
      <div className="stream-error-container">
        <h2>Device Not Supported</h2>
        <p>Streaming is only available on desktop devices.</p>
        <button onClick={() => window.history.back()} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  // Display appropriate component based on stream state
  return (
    <div className="p2p-streamer-container">
      {showStreamSetup ? (
        <StreamSetup
          streamTitle={streamTitle}
          setStreamTitle={setStreamTitle}
          category={category}
          setCategory={setCategory}
          description={description}
          setDescription={setDescription}
          streamSource={streamSource}
          setStreamSource={setStreamSource}
          screenWithAudio={screenWithAudio}
          setScreenWithAudio={setScreenWithAudio}
          acceptedTerms={acceptedTerms}
          setAcceptedTerms={setAcceptedTerms}
          isLoading={isLoading}
          socketConnected={socketConnected}
          streamError={streamError || socketError || mediaError}
          setStreamError={setStreamError}
          startStream={startStream}
        />
      ) : (
        <ActiveStream
          streamId={streamId}
          streamTitle={streamTitle}
          category={category}
          user={user}
          viewerCount={viewerCount}
          streamDuration={streamDuration}
          formatDuration={formatDuration}
          streamSource={streamSource}
          audioEnabled={audioEnabled}
          toggleAudio={toggleAudio}
          streamError={streamError || socketError || mediaError}
          setStreamError={setStreamError}
          guestMode={guestMode}
          toggleGuestMode={toggleGuestMode}
          inviteLink={inviteLink}
          copyInviteLink={copyInviteLink}
          guests={guests}
          selectedGuest={selectedGuest}
          acceptGuest={acceptGuest}
          removeGuest={removeGuest}
          selectGuest={selectGuest}
          chatMessages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendChatMessage={sendChatMessage}
          chatContainerRef={chatContainerRef}
          stopStream={stopStream}
          takeScreenshot={takeScreenshot}
          copyStreamUrl={copyStreamUrl}
          shareStream={shareStream}
          shareUrl={shareUrl}
          guestConnections={guestConnections}
          setGuestConnections={setGuestConnections}
          guestAudioRefs={guestAudioRefs}
        />
      )}
    </div>
  );
};

export default StreamerDashboard;