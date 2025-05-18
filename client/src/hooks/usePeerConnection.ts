// client/src/hooks/usePeerConnection.ts
import { useState, useEffect, useRef } from 'react';
import SimplePeer, { Instance as Peer } from 'simple-peer';

export type PeerStatus = 'init' | 'connecting' | 'open' | 'closed' | 'error';

export interface PeerMessage {
  senderId: number;
  receiverId: number;
  content: string;
  file?: string;
}

export function usePeerConnection(
  initiator: boolean,
  onSignal: (signal: SimplePeer.SignalData) => void,
  incomingSignal?: SimplePeer.SignalData,
  enabled = true,
) {
  const [status, setStatus] = useState<PeerStatus>('init');
  const [lastMessage, setLastMessage] = useState<PeerMessage | null>(null);
  const peerRef = useRef<Peer>();
  const onSignalRef = useRef(onSignal);
  onSignalRef.current = onSignal;

  useEffect(() => {
    if (!enabled) return;
    console.debug('P2P creating connection', { initiator });
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    });

    peer.on('signal', (sig) => {
      console.debug('P2P signal', sig);
      onSignalRef.current(sig);
    });

    if (incomingSignal) {
      console.debug('P2P received signal', incomingSignal);
      peer.signal(incomingSignal);
    }

    peer.on('connect', () => {
      console.info('P2P connection open');
      setStatus('open');
    });
    peer.on('data', data => {
      try {
        const msg = JSON.parse(data.toString());
        console.debug('P2P data received', msg);
        setLastMessage(msg);
      } catch {
        console.warn('Invalid P2P data', data);
      }
    });
    peer.on('close', () => {
      console.info('P2P connection closed');
      setStatus('closed');
    });
    peer.on('error', (err) => {
      console.error('P2P error', err);
      setStatus('error');
    });

    peerRef.current = peer;
    setStatus('connecting');

    return () => {
      peer.destroy();
    };
  }, [enabled, initiator, incomingSignal]);

  const send = (msg: PeerMessage) => {
    if (enabled && peerRef.current?.connected) {
      console.debug('P2P send', msg);
      peerRef.current.send(JSON.stringify(msg));
    }
  };

  return { status, lastMessage, send };
}
