// // LiveStreamPlayer.js
// import React from "react";
// import Hls from "hls.js";
// import { useEffect, useRef } from "react";

// const LiveStreamPlayer = ({ streamUrl }) => {
//   const videoRef = useRef(null);

//   useEffect(() => {
//     if (Hls.isSupported() && streamUrl) {
//       const hls = new Hls();
//       hls.loadSource(streamUrl);
//       hls.attachMedia(videoRef.current);
//     }
//   }, [streamUrl]);

//   return <video ref={videoRef} controls autoPlay />;
// };

// export default LiveStreamPlayer;