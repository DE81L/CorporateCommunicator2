import { useEffect, useState } from 'react';

export interface AudioDevice {
  deviceId: string;
  label: string;
}

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);

  const updateDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(
        list
          .filter((d) => d.kind === 'audioinput')
          .map((d) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId}` }))
      );
    } catch (err) {
      console.warn('Failed to enumerate audio devices', err);
      setDevices([]);
    }
  };

  useEffect(() => {
    updateDevices();
  }, []);

  return { devices, refresh: updateDevices };
}
