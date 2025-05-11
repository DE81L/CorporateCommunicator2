import { jsx as _jsx } from "react/jsx-runtime";
const Avatar = ({ user }) => {
    return (_jsx("div", { className: "h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600", children: (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '') }));
};
export default Avatar;
