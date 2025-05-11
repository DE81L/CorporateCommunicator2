export function useElectron() {
    const api = window.electron;
    return {
        isElectron: Boolean(api),
        api,
    };
}
