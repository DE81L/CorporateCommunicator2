import { useEffect, useRef } from 'react';

interface JitsiFrameProps {
  roomName: string;
  userName?: string;
  video?: boolean;
}

export default function JitsiFrame({ roomName, userName, video = true }: JitsiFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const load = () => {
      const domain = 'meet.jit.si';
      const options: any = {
        roomName,
        parentNode: containerRef.current,
        userInfo: { displayName: userName },
        configOverwrite: { startWithVideoMuted: !video },
      };
      const api = new (window as any).JitsiMeetExternalAPI(domain, options);
      return () => api?.dispose();
    };

    if ((window as any).JitsiMeetExternalAPI) {
      return load();
    } else {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = load;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [roomName, userName, video]);

  return <div ref={containerRef} className="w-full h-80" />;
}
