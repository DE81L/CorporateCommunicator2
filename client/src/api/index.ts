import * as clientAPI from '../apiClient';

declare global {
  interface Window {
    electron?: {
      api?: any;
    };
  }
}

const isElectron = window.navigator.userAgent.includes("Electron");

export const api = {
  getSystemInfo: () => {
    return isElectron && window.electron?.api?.system
      ? window.electron.api.system.getSystemInfo()
      : clientAPI.getSystemInfo();
  },
  getAppVersion: () => {
    return isElectron && window.electron?.api?.app
      ? window.electron.api.app.getAppVersion()
      : clientAPI.getAppVersion();
  },
  // Add other API functions here, handling both Electron and client implementations
};