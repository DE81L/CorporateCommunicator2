#!/usr/bin/env node
const { RTCPeerConnection } = require('werift-webrtc');
const fs = require('fs');
const path = require('path');

const STUN_SERVER = process.env.STUN_SERVER;
const TURN_SERVER = process.env.TURN_SERVER;
const STUN_LIST = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'stun-servers.json'), 'utf8'),
);

function addUdpTransport(url) {
  if (!url) return url;
  return url.includes('?') ? url : `${url}?transport=udp`;
}

const STUN_LIST_UDP = STUN_LIST.map(addUdpTransport);

const envStun =
  STUN_SERVER && STUN_SERVER !== 'none' ? [addUdpTransport(STUN_SERVER)] : [];
const envTurn = TURN_SERVER ? [addUdpTransport(TURN_SERVER)] : [];
const DEFAULT_STUN = ['stun:stun.l.google.com:19302'];

const ICE_SERVERS = [
  ...envTurn.map(url => ({ urls: url })),
  ...envStun.map(url => ({ urls: url })),
  ...DEFAULT_STUN.map(url => ({ urls: url })),
  ...STUN_LIST_UDP.map(url => ({ urls: url })),
];

async function tryConnection() {
  console.log('ICE servers:', ICE_SERVERS.map(s => s.urls).join(', '));

  const iceServers = ICE_SERVERS;

  // give both peers the same configuration
  const config = { iceServers, iceTransportPolicy: 'all' };
  const pc1 = new RTCPeerConnection(config);
  const pc2 = new RTCPeerConnection(config);

  pc1.onicecandidate = ({ candidate }) => {
    if (candidate) {
      console.log(
        'pc1 -> pc2 candidate',
        candidate.candidate,
        'type',
        candidate.type
      );
      pc2.addIceCandidate(candidate);
    }
  };
  pc2.onicecandidate = ({ candidate }) => {
    if (candidate) {
      console.log(
        'pc2 -> pc1 candidate',
        candidate.candidate,
        'type',
        candidate.type
      );
      pc1.addIceCandidate(candidate);
    }
  };

  pc1.onconnectionstatechange = () =>
    console.log('pc1 state', pc1.connectionState);
  pc2.onconnectionstatechange = () =>
    console.log('pc2 state', pc2.connectionState);
  pc1.onicegatheringstatechange = () =>
    console.log('pc1 gathering', pc1.iceGatheringState);
  pc2.onicegatheringstatechange = () =>
    console.log('pc2 gathering', pc2.iceGatheringState);

  const dc1 = pc1.createDataChannel('test');
  let success = false;

  dc1.onopen = () => {
    console.log('peer1 data channel open');
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
    console.log('peer2 data channel created');
    channel.onopen = () => console.log('peer2 data channel open');
    channel.onmessage = ({ data }) => {
      console.log('peer2 got:', data);
      if (data === 'ping') channel.send('pong');
    };
  };

  console.log('creating offer...');
  const offer = await pc1.createOffer();
  await pc1.setLocalDescription(offer);

  await new Promise(resolve => {
    const timer = setTimeout(() => {
      console.error('pc1 ICE gathering timed out');
      resolve();
    }, 5000);
    if (pc1.iceGatheringState === 'complete') {
      clearTimeout(timer);
      return resolve();
    }
    pc1.onicegatheringstatechange = () => {
      if (pc1.iceGatheringState === 'complete') {
        clearTimeout(timer);
        console.log('pc1 ICE gathering complete');
        resolve();
      }
    };
  });

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
    try { dc1.close(); } catch (_) {}
    pc1.close();
    pc2.close();
    if (success) console.log('cleanup after success');
  }

  return new Promise(resolve => {
    dc1.onclose = () => {
      console.log('peer1 data channel closed');
      resolve(success);
    };
  });
}

async function run() {
  const ok = await tryConnection();
  process.exit(ok ? 0 : 1);
}

run();
