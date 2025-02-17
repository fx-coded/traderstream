import React, { useRef, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

const Viewer = () => {
  const videoRef = useRef(null);
  const peerRef = useRef(new RTCPeerConnection());

  useEffect(() => {
    socket.emit("join-stream", "streamer");

    socket.on("offer", async ({ sdp, from }) => {
      console.log("📡 Received offer from streamer.");
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(sdp));

      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);

      socket.emit("answer", { sdp: peerRef.current.localDescription, target: from });
    });

    socket.on("ice-candidate", ({ candidate }) => {
      console.log("📡 Received ICE candidate.");
      peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    peerRef.current.ontrack = (event) => {
      console.log("🎥 Receiving video stream.");
      videoRef.current.srcObject = event.streams[0];
    };

  }, []);

  return (
    <div>
      <h1>📡 Live Stream Viewer</h1>
      <video ref={videoRef} autoPlay playsInline />
    </div>
  );
};

export default Viewer;
