import { useEffect, useState } from 'react';

export interface AudioDevice {
  deviceId: string;
  label: string;
}

export function useAudioDevices(
  kind: 'audioinput' | 'audiooutput' = 'audioinput'
) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);

  const updateDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(
        list
          .filter((d) => d.kind === kind)
          .map((d) => ({
            deviceId: d.deviceId,
            label:
              d.label ||
              `${kind === 'audioinput' ? 'Microphone' : 'Speaker'} ${d.deviceId}`,
          }))
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
