import * as clientAPI from "../apiClient";
import type { ElectronAPI } from "@/lib/electron-types";

export type { ElectronAPI };

export const isElectron = Boolean(window.electron);

// Get direct reference to electron API
const eapi = window.electron;

export const api = {
  app: {
    minimize: () => eapi?.app?.minimize?.(),
    maximize: () => eapi?.app?.maximize?.(),
    quit: () => eapi?.app?.quit?.(),
  },
  system: {
    getSystemInfo: () => eapi?.system?.getSystemInfo?.(),
    isOnline: () => eapi?.system?.isOnline?.(),
  },
};