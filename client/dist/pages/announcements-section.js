import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createApiClient } from "@/lib/api-client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, User } from "lucide-react";
import { z } from "zod";
const createAnnouncementSchema = z.object({
    name: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Content is required"),
    isAnnouncement: z.boolean().default(true),
});
export default function AnnouncementsSection() {
    const { toast } = useToast();
    const {} = useAuth();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const apiClient = createApiClient();
    // Fetch announcements
    const { data: announcements = [], isLoading: isAnnouncementsLoading, error: announcementsError } = useQuery({
        queryKey: ['/api/announcements'],
        queryFn: () => apiClient.request('/api/announcements'),
        initialData: []
    });
    // Create announcement mutation (creates a group with isAnnouncement=true)
    const createAnnouncementMutation = useMutation({
        mutationFn: async (data) => {
            await fetch("/api/groups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            return null;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
            setIsCreateDialogOpen(false);
            toast({
                title: "Announcement created",
                description: "Your announcement has been posted successfully.",
            });
        },
        onError: (error) => {
            toast({
                title: "Failed to create announcement",
                description: error.message,
                variant: "destructive",
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
        }
    });
    const form = useForm({
        resolver: zodResolver(createAnnouncementSchema),
        defaultValues: {
            name: "",
            description: "",
            isAnnouncement: true,
        },
    });
    const onSubmit = (data) => {
        createAnnouncementMutation.mutate(data);
    };
    if (announcementsError) {
        console.error("Error fetching announcements:", announcementsError);
    }
    // Mock function to get department name for demo
    const getDepartmentName = (id) => {
        const departments = ["HR Department", "Executive Team", "Marketing Team", "Engineering Team"];
        return departments[id % departments.length];
    };
    // Mock function to get post date for demo
    const getRelativeTime = (id) => {
        const times = ["2 hours ago", "Yesterday", "2 days ago", "Last week"];
        return times[id % times.length];
    };
    return (_jsxs("div", { className: "flex-1 overflow-auto p-6", children: [_jsxs("div", { className: "mb-6 flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Announcements" }), _jsxs(Dialog, { open: isCreateDialogOpen, onOpenChange: setIsCreateDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { className: "flex items-center", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "New Announcement"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create Announcement" }), _jsx(DialogDescription, { children: "Post a new company-wide announcement" })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter announcement title", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Content" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Enter the announcement content", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", disabled: createAnnouncementMutation.isPending, children: createAnnouncementMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Posting..."] })) : ("Post Announcement") }) })] }) })] })] })] }), isAnnouncementsLoading ? (_jsx("div", { className: "flex justify-center items-center h-40", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) })) : announcementsError ? (_jsxs("div", { className: "text-center py-10 text-red-500", children: ["Error loading announcements: ", announcementsError.message, ". Please try again."] })) : announcements.length > 0 ? (_jsx("div", { className: "space-y-4", children: announcements.map((announcement) => (_jsxs("div", { className: "bg-white rounded-lg shadow-sm p-4", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("h3", { className: "font-medium", children: announcement.name }), _jsx("span", { className: "text-xs text-gray-500", children: getRelativeTime(announcement?.id) })] }), _jsx("p", { className: "text-sm text-gray-600 mt-2", children: announcement.description }), _jsxs("div", { className: "mt-4 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center text-gray-500 text-sm", children: [_jsx(User, { className: "h-4 w-4 mr-1" }), "Posted by ", getDepartmentName(announcement.creatorId)] }), _jsx(Button, { variant: "link", className: "text-primary p-0 h-auto", children: "View Details" })] })] }, announcement?.id))) })) : (_jsxs("div", { className: "text-center py-10", children: [_jsx("div", { className: "h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-10 w-10 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" }) }) }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "No Announcements" }), _jsx("p", { className: "text-gray-500 mb-6", children: "Create your first announcement to communicate with your company." }), _jsxs(Button, { onClick: () => setIsCreateDialogOpen(true), className: "flex items-center mx-auto", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create Announcement"] })] }))] }));
}
