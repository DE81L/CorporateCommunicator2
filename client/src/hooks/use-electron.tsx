import type { ElectronAPI } from '@/lib/electron-types';

export function useElectron() {
  const api = (window as any).electron as ElectronAPI | undefined;
  return {
    isElectron: Boolean(api),
    api,
  };
}