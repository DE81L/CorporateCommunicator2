"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInitials = exports.TranslationKey = void 0;
var TranslationKey;
(function (TranslationKey) {
    // Move all translation keys here from client/src/types.ts
})(TranslationKey || (exports.TranslationKey = TranslationKey = {}));
// Add helper functions
const getInitials = (firstName, lastName) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
};
exports.getInitials = getInitials;
