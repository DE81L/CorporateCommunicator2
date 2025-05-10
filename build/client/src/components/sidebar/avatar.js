"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Avatar = ({ user }) => {
    return (<div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
      {(user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')}
    </div>);
};
exports.default = Avatar;
