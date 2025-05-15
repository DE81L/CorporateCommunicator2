// client/src/hooks/usePeerConnection.ts
import { useState, useEffect, useRef } from 'react';
import SimplePeer, { Instance as Peer } from 'simple-peer';

export type PeerStatus = 'init' | 'connecting' | 'open' | 'closed' | 'error';

export interface PeerMessage {
  senderId: number;
  receiverId: number;
  content: string;
}

export function usePeerConnection(
  initiator: boolean,
  onSignal: (signal: SimplePeer.SignalData) => void,
  incomingSignal?: SimplePeer.SignalData
) {
  const [status, setStatus] = useState<PeerStatus>('init');
  const [lastMessage, setLastMessage] = useState<PeerMessage | null>(null);
  const peerRef = useRef<Peer>();

  useEffect(() => {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    });

    peer.on('signal', onSignal);
    if (incomingSignal) peer.signal(incomingSignal);

    peer.on('connect', () => setStatus('open'));
    peer.on('data', data => {
      try {
        setLastMessage(JSON.parse(data.toString()));
      } catch {
        console.warn('Invalid P2P data', data);
      }
    });
    peer.on('close', () => setStatus('closed'));
    peer.on('error', () => setStatus('error'));

    peerRef.current = peer;
    setStatus('connecting');

    return () => peer.destroy();
  }, [initiator, onSignal, incomingSignal]);

  const send = (msg: PeerMessage) => {
    if (peerRef.current?.connected) {
      peerRef.current.send(JSON.stringify(msg));
    }
  };

  return { status, lastMessage, send };
}
