import type { ElectronAPI } from '@/lib/electron-types';

export function useElectron() {
  const api = window.electron as ElectronAPI | undefined;
  return {
    isElectron: Boolean(api),
    api,
  };
}
