"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useElectron = useElectron;
function useElectron() {
    const api = window.electron;
    return {
        isElectron: Boolean(api),
        api,
    };
}
