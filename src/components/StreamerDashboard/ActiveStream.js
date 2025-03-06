import React, { useState } from "react";
import { FaUserFriends, FaRegClock } from "react-icons/fa";


// Import components
import StreamContent from "./StreamContent";
import ControlPanel from "./ControlPanel";

const ActiveStream = ({
 streamId,
 streamTitle,
 category,
 user,
 viewerCount,
 streamDuration,
 formatDuration,
 streamSource,
 audioEnabled,
 toggleAudio,
 streamError,
 setStreamError,
 guestMode,
 toggleGuestMode,
 inviteLink,
 copyInviteLink,
 guests,
 selectedGuest,
 acceptGuest,
 removeGuest,
 selectGuest,
 chatMessages,
 newMessage,
 setNewMessage,
 sendChatMessage,
 chatContainerRef,
 stopStream,
 takeScreenshot,
 copyStreamUrl,
 shareStream,
 shareUrl,
 // Adding the missing props below
 guestConnections,
 setGuestConnections,
 guestAudioRefs
}) => {
 // Extract username from user object
 const username = user?.displayName || user?.email?.split("@")[0] || "Anonymous";
 
 // Add fullscreen state
 const [isFullscreen, setIsFullscreen] = useState(false);
 
 // Toggle fullscreen function
 const toggleFullscreen = () => {
   setIsFullscreen(!isFullscreen);
   
   // Add/remove class from body element to hide navbar
   if (!isFullscreen) {
     document.body.classList.add('fullscreen-active');
   } else {
     document.body.classList.remove('fullscreen-active');
   }
 };
 
 return (
   <div className={`active-stream-container ${isFullscreen ? 'stream-fullscreen-mode' : ''}`}>
     {/* Stream header with title, user info, and stats */}
     <div className="stream-header">
       <div className="stream-info">
         <img 
           src={user?.photoURL || "https://via.placeholder.com/40"} 
           alt={username} 
           className="streamer-avatar" 
         />
         <div>
           <h2>{streamTitle}</h2>
           <p>
             {username}
             <span className="category-badge">{category}</span>
           </p>
         </div>
       </div>
       <div className="stream-stats">
         <div className="stat">
           <FaUserFriends />
           <span>{viewerCount}</span>
         </div>
         <div className="stat">
           <FaRegClock />
           <span>{formatDuration(streamDuration)}</span>
         </div>
       </div>
     </div>

     {/* Main content area with video and chat */}
     <StreamContent
       streamSource={streamSource}
       streamError={streamError}
       setStreamError={setStreamError}
       guestMode={guestMode}
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
       // Pass the new props to StreamContent if needed
       guestConnections={guestConnections}
       setGuestConnections={setGuestConnections}
       guestAudioRefs={guestAudioRefs}
       isFullscreen={isFullscreen}
     />

     {/* Stream controls */}
     <ControlPanel
       audioEnabled={audioEnabled}
       toggleAudio={toggleAudio}
       guestMode={guestMode}
       toggleGuestMode={toggleGuestMode}
       takeScreenshot={takeScreenshot}
       copyStreamUrl={copyStreamUrl}
       shareStream={shareStream}
       shareUrl={shareUrl}
       stopStream={stopStream}
       isFullscreen={isFullscreen}
       toggleFullscreen={toggleFullscreen}
     />
   </div>
 );
};

export default ActiveStream;