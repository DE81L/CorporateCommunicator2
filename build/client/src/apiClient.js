"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppVersion = exports.getSystemInfo = void 0;
async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
    }
    return response.json();
}
const getSystemInfo = async () => {
    const response = await fetch("/api/system/info");
    return handleResponse(response);
};
exports.getSystemInfo = getSystemInfo;
const getAppVersion = async () => {
    const response = await fetch("/api/app/version");
    return handleResponse(response);
};
exports.getAppVersion = getAppVersion;
// Add other API functions as needed
