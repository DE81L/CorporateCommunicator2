#!/usr/bin/env node
const { RTCPeerConnection } = require('werift-webrtc');
const fs = require('fs');
const path = require('path');

const STUN_SERVER = process.env.STUN_SERVER;
const STUN_LIST = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'stun-servers.json'), 'utf8'),
);

async function tryConnection(server) {
  const iceServers = server ? [{ urls: server }] : [];
  if (server) {
    console.log('Using STUN server:', server);
  } else {
    console.log('Running without STUN server');
  }

  const pc1 = new RTCPeerConnection({ iceServers });
  const pc2 = new RTCPeerConnection();

  pc1.onicecandidate = ({ candidate }) => {
    if (candidate) {
      console.log('pc1 -> pc2 candidate', candidate.candidate);
      pc2.addIceCandidate(candidate);
    }
  };
  pc2.onicecandidate = ({ candidate }) => {
    if (candidate) {
      console.log('pc2 -> pc1 candidate', candidate.candidate);
      pc1.addIceCandidate(candidate);
    }
  };


  pc1.onconnectionstatechange = () =>
    console.log('pc1 state', pc1.connectionState);
  pc2.onconnectionstatechange = () =>
    console.log('pc2 state', pc2.connectionState);

  const dc1 = pc1.createDataChannel('test');

  let success = false;

  dc1.onopen = () => {
    console.log('peer1 data channel open');
    dc1.send('ping');
  };

  dc1.onclose = () => {
    console.log('peer1 data channel closed');
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
    console.log('peer2 data channel created');
    channel.onopen = () => console.log('peer2 data channel open');
    channel.onclose = () => console.log('peer2 data channel closed');
    channel.onmessage = ({ data }) => {
      console.log('peer2 got:', data);
      if (data === 'ping') channel.send('pong');
    };
  };

  console.log('creating offer...');
  const offer = await pc1.createOffer();
  await pc1.setLocalDescription(offer);
  await pc2.setRemoteDescription(offer);

  console.log('creating answer...');
  const answer = await pc2.createAnswer();
  await pc2.setLocalDescription(answer);
  await pc1.setRemoteDescription(answer);

  const timeout = setTimeout(() => {
    console.error('P2P connection timed out');
    cleanup();
  }, 5000);

  function cleanup() {
    clearTimeout(timeout);
    // Ensure the data channel closes so the promise resolves
    try {
      dc1.close();
    } catch (_) {
      // ignore errors if channel is not open
    }
    pc1.close();
    pc2.close();
    if (success) {
      console.log('cleanup after success');
    }
  }
  return new Promise((resolve) => {
    dc1.onclose = () => {
      console.log('peer1 data channel closed');
      resolve(success);
    };
  });
}

async function run() {
  if (STUN_SERVER !== undefined) {
    const server = STUN_SERVER === 'none' ? null : STUN_SERVER;
    const ok = await tryConnection(server);
    process.exit(ok ? 0 : 1);
  }

  for (const server of STUN_LIST) {
    const ok = await tryConnection(server);
    if (ok) return;
    console.error('Retrying with next STUN server');
  }
  console.error('All STUN servers failed');
  process.exit(1);
}

run();
