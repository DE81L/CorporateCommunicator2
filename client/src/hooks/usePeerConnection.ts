// client/src/hooks/usePeerConnection.ts
import { useState, useEffect, useRef } from 'react';
import { showError } from '@/lib/error-toast';
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
    const stun = import.meta.env.VITE_STUN_SERVER;
    const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
    const turnUser = import.meta.env.VITE_TURN_USER as string | undefined;
    const turnPass = import.meta.env.VITE_TURN_PASS as string | undefined;

    const stunUrls =
      !stun || stun === 'none'
        ? ['stun:stun.l.google.com:19302']
        : stun.split(',').map((u) => u.trim()).filter(Boolean);

    const iceServers: RTCIceServer[] = stunUrls.map((url) => ({ urls: url }));
    if (turnUrl) {
      iceServers.push({ urls: turnUrl, username: turnUser, credential: turnPass });
    }

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: { iceServers },
    });

    peer.on('signal', (sig) => {
      console.debug('P2P signal', sig);
      onSignalRef.current(sig);
    });


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
      showError(err, 'P2P error');
      setStatus('closed');
    });

    peerRef.current = peer;
    setStatus('connecting');

    return () => {
      peer.destroy();
    };
  }, [enabled, initiator]);

  useEffect(() => {
    if (incomingSignal && peerRef.current) {
      console.debug('P2P received signal', incomingSignal);
      try {
        peerRef.current.signal(incomingSignal);
      } catch (err) {
        showError(err, 'P2P signal error');
      }
    }
  }, [incomingSignal]);

  const send = (msg: PeerMessage) => {
    if (enabled && peerRef.current?.connected) {
      console.debug('P2P send', msg);
      peerRef.current.send(JSON.stringify(msg));
    }
  };

  return { status, lastMessage, send };
}
