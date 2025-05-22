#!/usr/bin/env node
const { RTCPeerConnection } = require('werift-webrtc');

async function run() {
  const pc1 = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });
  const pc2 = new RTCPeerConnection();

  pc1.onicecandidate = ({ candidate }) => {
    if (candidate) pc2.addIceCandidate(candidate);
  };
  pc2.onicecandidate = ({ candidate }) => {
    if (candidate) pc1.addIceCandidate(candidate);
  };

  const dc1 = pc1.createDataChannel('test');
  let success = false;

  dc1.onopen = () => {
    console.log('peer1 connected');
    dc1.send('ping');
  };

  dc1.onmessage = ({ data }) => {
    console.log('peer1 got:', data);
    if (data === 'pong') {
      success = true;
      console.log('P2P connection OK');
      cleanup();
    }
  };

  pc2.ondatachannel = ({ channel }) => {
    channel.onmessage = ({ data }) => {
      console.log('peer2 got:', data);
      if (data === 'ping') channel.send('pong');
    };
  };

  const offer = await pc1.createOffer();
  await pc1.setLocalDescription(offer);
  await pc2.setRemoteDescription(offer);
  const answer = await pc2.createAnswer();
  await pc2.setLocalDescription(answer);
  await pc1.setRemoteDescription(answer);

  const timeout = setTimeout(() => {
    console.error('P2P connection failed');
    cleanup();
  }, 5000);

  function cleanup() {
    clearTimeout(timeout);
    pc1.close();
    pc2.close();
    if (!success) process.exit(1);
  }
}

run();
