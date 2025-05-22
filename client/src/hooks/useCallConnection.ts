import { useEffect, useRef, useState } from 'react';
import SimplePeer, { Instance as Peer, SignalData } from 'simple-peer';

export type CallStatus = 'init' | 'connecting' | 'open' | 'closed' | 'error';

export function useCallConnection(
  initiator: boolean,
  onSignal: (signal: SignalData) => void,
  incomingSignal?: SignalData,
  audioDeviceId?: string | null
) {
  const [status, setStatus] = useState<CallStatus>('init');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerRef = useRef<Peer>();
  const onSignalRef = useRef(onSignal);
  onSignalRef.current = onSignal;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let peer: Peer | undefined;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        });
        setLocalStream(stream);
        peer = new SimplePeer({
          initiator,
          trickle: true,
          stream,
          config: {
            iceServers:
              !import.meta.env.VITE_STUN_SERVER ||
              import.meta.env.VITE_STUN_SERVER === 'none'
                ? []
                : import.meta.env.VITE_STUN_SERVER.split(',')
                    .map((u) => u.trim())
                    .filter(Boolean)
                    .map((u) => ({ urls: u })),
          },
        });
        peer.on('signal', (sig) => onSignalRef.current(sig));
        if (incomingSignal) peer.signal(incomingSignal);
        peer.on('connect', () => setStatus('open'));
        peer.on('stream', (s) => setRemoteStream(s));
        peer.on('close', () => setStatus('closed'));
        peer.on('error', () => setStatus('error'));
        peerRef.current = peer;
        setStatus('connecting');
      } catch (err) {
        console.error('getUserMedia failed', err);
        setStatus('error');
      }
    };
    start();
    return () => {
      if (peer) peer.destroy();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [initiator, incomingSignal, audioDeviceId]);

  return { status, remoteStream, localStream };
}
