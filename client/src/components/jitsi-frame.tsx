/*
 * Встраиваемый фрейм Jitsi временно не используется.
 */

// import { useEffect, useRef } from 'react';
// import { showError } from '@/lib/error-toast';
// import { callLog } from '../../../util/logger';

// declare global {
//   interface Window {
//     JitsiMeetExternalAPI?: any;
//     __jitsiScriptLoading?: Promise<void>;
//   }
// }

// interface JitsiFrameProps {
//   roomName: string;
//   userName?: string;
//   video?: boolean;
//   onApiReady?: (api: any) => void;
//   interfaceConfig?: Record<string, unknown>;
// }

// export default function JitsiFrame({
//   roomName,
//   userName,
//   video = true,
//   onApiReady,
//   interfaceConfig,
// }: JitsiFrameProps) {
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     let disposed = false;
//     let api: any = null;

//     const load = () => {
//       callLog('Initializing Jitsi', roomName);
//       const domain = 'meet.jit.si';
//       const options: any = {
//         roomName,
//         parentNode: containerRef.current,
//         userInfo: { displayName: userName },
//         configOverwrite: {
//           startWithVideoMuted: !video,
//           prejoinPageEnabled: false,
//         },
//         interfaceConfigOverwrite: {
//           TOOLBAR_BUTTONS: [],
//           filmStripOnly: false,
//           SHOW_JITSI_WATERMARK: false,
//           SHOW_WATERMARK_FOR_GUESTS: false,
//           ...interfaceConfig,
//         },
//       };
//       api = new (window as any).JitsiMeetExternalAPI(domain, options);
//       const iframe = containerRef.current?.querySelector('iframe');
//       if (iframe) {
//         const allow = iframe.getAttribute('allow') ?? '';
//         if (allow.includes('speaker-selection')) {
//           iframe.setAttribute('allow', allow.replace(/\bspeaker-selection;?/g, ''));
//         }
//       }
//       onApiReady?.(api);
//       callLog('Jitsi API ready');
//     };

//     if (window.JitsiMeetExternalAPI) {
//       load();
//     } else {
//       if (!window.__jitsiScriptLoading) {
//         callLog('Loading Jitsi script');
//         window.__jitsiScriptLoading = new Promise<void>((resolve, reject) => {
//           const script = document.createElement('script');
//           script.src = 'https://meet.jit.si/external_api.js';
//           script.async = true;
//           script.onload = () => resolve();
//           script.onerror = () => reject(new Error('Failed to load Jitsi'));
//           document.body.appendChild(script);
//         });
//       }
//       window.__jitsiScriptLoading
//         .then(() => {
//           if (!disposed) load();
//         })
//         .catch((err) => {
//           callLog('Jitsi script failed', err);
//           showError(err, 'Jitsi script failed');
//         });
//     }

//     return () => {
//       disposed = true;
//       api?.dispose();
//     };
//   }, [roomName, userName, video, onApiReady, interfaceConfig]);

//   return <div ref={containerRef} className="w-full h-80" />;
// }
export {}
