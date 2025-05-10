"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.isElectron = void 0;
exports.isElectron = Boolean(window.electron);
// Get direct reference to electron API
const eapi = window.electron;
exports.api = {
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
