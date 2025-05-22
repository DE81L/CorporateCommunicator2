#!/usr/bin/env node
const SimplePeer = require('simple-peer');
const wrtc = require('wrtc');

function createPeer(initiator) {
  return new SimplePeer({
    initiator,
    trickle: false,
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    wrtc,
  });
}

const peer1 = createPeer(true);
const peer2 = createPeer(false);

peer1.on('signal', data => peer2.signal(data));
peer2.on('signal', data => peer1.signal(data));

let success = false;

peer1.on('connect', () => {
  console.log('peer1 connected');
  peer1.send('ping');
});

peer2.on('data', data => {
  console.log('peer2 got:', data.toString());
  if (data.toString() === 'ping') {
    peer2.send('pong');
  }
});

peer1.on('data', data => {
  console.log('peer1 got:', data.toString());
  if (data.toString() === 'pong') {
    success = true;
    console.log('P2P connection OK');
    cleanup();
  }
});

const timeout = setTimeout(() => {
  console.error('P2P connection failed');
  cleanup();
}, 5000);

function cleanup() {
  clearTimeout(timeout);
  peer1.destroy();
  peer2.destroy();
  if (!success) process.exit(1);
}
