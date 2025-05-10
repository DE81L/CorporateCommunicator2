"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidSection = void 0;
const isValidSection = (section) => {
    return ['messages', 'groups', 'announcements', 'requests', 'contacts', 'settings', 'wiki'].includes(section);
};
exports.isValidSection = isValidSection;
