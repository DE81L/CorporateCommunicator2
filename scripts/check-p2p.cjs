#!/usr/bin/env node
const { RTCPeerConnection } = require('werift-webrtc');
const fs = require('fs');
const path = require('path');

const STUN_SERVER = process.env.STUN_SERVER;
const STUN_LIST = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'stun-servers.json'), 'utf8'),
);

function addUdpTransport(url) {
  if (!url) return url;
  return url.includes('?') ? url : `${url}?transport=udp`;
}

const STUN_LIST_UDP = STUN_LIST.map(addUdpTransport);

async function tryConnection(server) {
  const iceServers = server ? [{ urls: addUdpTransport(server) }] : [];
  console.log(
    server ? `Using STUN server: ${server}` : 'Running without STUN server'
  );

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
  const serversToTry =
    STUN_SERVER !== undefined
      ? STUN_SERVER === 'none'
        ? [null, ...STUN_LIST_UDP]
        : [addUdpTransport(STUN_SERVER), ...STUN_LIST_UDP]
      : STUN_LIST_UDP;

  for (const server of serversToTry) {
    const ok = await tryConnection(server);
    if (ok) return process.exit(0);
    console.error('Retrying with next STUN server…');
  }

  console.error('All STUN servers failed');
  process.exit(1);
}

run();
