import { useEffect, useRef, useState } from 'react';
import { showError } from '@/lib/error-toast';
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
        const constraints =
          (window as any).__CALL_TYPE === 'video'
            ? {
                video: { width: 1280, height: 720, facingMode: 'user' },
                audio: audioDeviceId
                  ? { deviceId: { exact: audioDeviceId } }
                  : true,
              }
            : {
                audio: audioDeviceId
                  ? { deviceId: { exact: audioDeviceId } }
                  : true,
              };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
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

        peer = new SimplePeer({
          initiator,
          trickle: true,
          stream,
          config: { iceServers },
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
        showError(err, 'getUserMedia failed');
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
