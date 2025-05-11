import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Plus, MessageSquare, Phone, Video, Mail, } from "lucide-react";
import { apiClient } from "@/lib/api-client";
export default function ContactsSection({ onStartCall }) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    // Fetch all users
    const { data: users, isLoading, error, } = useQuery({
        queryKey: ["/api/users"],
        queryFn: async () => {
            return await apiClient.request("/api/users");
        },
    });
    // Filter users based on search query
    const filteredUsers = users?.filter((u) => u.id !== user?.id && // Exclude current user
        (u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())));
    const getInitials = (firstName, lastName) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };
    // Mock function to get job titles for demo
    const getJobTitle = (userId) => {
        const titles = [
            "Marketing Director",
            "Senior Developer",
            "UX Designer",
            "Product Manager",
            "HR Specialist",
            "Sales Executive",
            "Finance Manager",
            "Content Writer",
        ];
        return titles[userId % titles.length];
    };
    return (_jsxs("div", { className: "flex-1 overflow-auto p-6", children: [_jsxs("div", { className: "mb-6 flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Contacts" }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" }), _jsx(Input, { value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search contacts...", className: "pl-10" })] }), _jsxs(Button, { className: "flex items-center", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add Contact"] })] })] }), isLoading ? (_jsx("div", { className: "flex justify-center items-center h-40", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) })) : error ? (_jsx("div", { className: "text-center py-10 text-red-500", children: "Error loading contacts. Please try again." })) : filteredUsers && filteredUsers.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: filteredUsers.map((contact) => (_jsx(Card, { className: "hover:shadow-md transition-shadow", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Avatar, { className: "h-12 w-12 mr-4", children: contact.avatarUrl ? (_jsx("img", { src: contact.avatarUrl, alt: `${contact.firstName} ${contact.lastName}` })) : (_jsx(AvatarFallback, { className: "bg-primary-100 text-primary-600", children: getInitials(contact.firstName, contact.lastName) })) }), _jsxs("div", { children: [_jsxs("h3", { className: "font-medium", children: [contact.firstName, " ", contact.lastName] }), _jsx("p", { className: "text-sm text-gray-500", children: getJobTitle(contact.id) })] })] }), _jsxs("div", { className: "mt-4 flex justify-between", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "rounded-full", children: _jsx(MessageSquare, { className: "h-5 w-5" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "rounded-full", onClick: () => onStartCall("audio", {
                                            id: contact.id,
                                            name: `${contact.firstName} ${contact.lastName}`,
                                        }), children: _jsx(Phone, { className: "h-5 w-5" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "rounded-full", onClick: () => onStartCall("video", {
                                            id: contact.id,
                                            name: `${contact.firstName} ${contact.lastName}`,
                                        }), children: _jsx(Video, { className: "h-5 w-5" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "rounded-full", children: _jsx(Mail, { className: "h-5 w-5" }) })] })] }) }, contact.id))) })) : (_jsx("div", { className: "text-center py-10", children: searchQuery ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4", children: _jsx(Search, { className: "h-10 w-10 text-gray-400" }) }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "No results found" }), _jsxs("p", { className: "text-gray-500", children: ["No contacts match your search term \"", searchQuery, "\""] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-10 w-10 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" }) }) }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "No Contacts Found" }), _jsx("p", { className: "text-gray-500 mb-6", children: "Add your first contact to get started" }), _jsxs(Button, { className: "flex items-center mx-auto", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add Contact"] })] })) }))] }));
}
