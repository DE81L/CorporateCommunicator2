#!/usr/bin/env node
const { RTCPeerConnection } = require('werift-webrtc');
const fs = require('fs');
const path = require('path');

const stunListPath = path.join(__dirname, 'stun-servers.json');
let stunServers = ['stun:stun.l.google.com:19302'];
try {
  const data = fs.readFileSync(stunListPath, 'utf8');
  const list = JSON.parse(data);
  if (Array.isArray(list) && list.length) stunServers = list;
} catch {
  console.warn('Using default STUN server list');
}

async function checkServer(stun) {
  console.log(`Using STUN server: ${stun}`);
  const pc1 = new RTCPeerConnection({ iceServers: [{ urls: stun }] });
  const pc2 = new RTCPeerConnection();

  pc1.onicecandidate = ({ candidate }) => candidate && pc2.addIceCandidate(candidate);
  pc2.onicecandidate = ({ candidate }) => candidate && pc1.addIceCandidate(candidate);

  const dc1 = pc1.createDataChannel('test');

  return await new Promise(async (resolve) => {
    let success = false;
    dc1.onopen = () => dc1.send('ping');
    dc1.onmessage = ({ data }) => {
      if (data === 'pong') {
        success = true;
        cleanup();
      }
    };
    pc2.ondatachannel = ({ channel }) => {
      channel.onmessage = ({ data }) => {
        if (data === 'ping') channel.send('pong');
      };
    };

    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);
    await pc2.setRemoteDescription(offer);
    const answer = await pc2.createAnswer();
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(answer);

    const timeout = setTimeout(cleanup, 5000);

    function cleanup() {
      clearTimeout(timeout);
      pc1.close();
      pc2.close();
      resolve(success);
    }
  });
}

async function run() {
  let allOk = true;
  for (const stun of stunServers) {
    const ok = await checkServer(stun);
    console.log(`${stun} ${ok ? 'OK' : 'FAILED'}`);
    if (!ok) allOk = false;
  }
  if (!allOk) process.exit(1);
}

run();
