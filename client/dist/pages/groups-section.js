import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Plus, Users } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { queryClient } from "@/lib/queryClient";
import { createApiClient } from "@/lib/api-client";
const createGroupSchema = z.object({
    name: z.string().min(1, "Group name is required"),
    description: z.string().optional(),
    isAnnouncement: z.boolean().default(false),
});
export default function GroupsSection() {
    const apiClient = createApiClient();
    const { toast } = useToast();
    const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
    //Fetch groups
    const { data: groups = [], isLoading: isLoadingGroups, error: groupsError, } = useQuery({
        queryKey: ["/api/groups"],
        queryFn: () => apiClient.request("/api/groups"),
    });
    // Fetch all users for adding to groups
    useQuery({
        queryKey: ["/api/users"],
        queryFn: async () => {
            return await apiClient.request("/api/users");
        },
    });
    // Create group mutation
    const createGroupMutation = useMutation({
        mutationFn: (data) => apiClient.request("POST", "/api/groups", data),
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
            setIsCreateGroupDialogOpen(false);
            toast({
                title: "Group created",
                description: "Your new group has been created successfully.",
            });
        },
        onError: (error) => {
            toast({
                title: "Failed to create group",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const updateGroupMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            return await apiClient.request("PUT", `/api/groups/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        },
    });
    const deleteGroupMutation = useMutation({
        mutationFn: async (id) => {
            return await apiClient.request("DELETE", `/api/groups/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        },
    });
    const createGroup = async (data) => {
        await apiClient.request("POST", "/api/groups", data);
        createGroupMutation.mutate(data);
    };
    const updateGroup = async (id, data) => {
        updateGroupMutation.mutate({ id, data });
    };
    const deleteGroup = async (id) => {
        deleteGroupMutation.mutate(id);
    };
    const form = useForm({
        resolver: zodResolver(createGroupSchema),
        defaultValues: {
            name: "",
            description: "",
            isAnnouncement: false,
        },
    });
    const onSubmit = (data) => {
        createGroup(data);
    };
    return (_jsxs("div", { className: "flex-1 overflow-auto p-6", children: [_jsxs("div", { className: "mb-6 flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Groups" }), _jsxs(Dialog, { open: isCreateGroupDialogOpen, onOpenChange: setIsCreateGroupDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { className: "flex items-center", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "New Group"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create New Group" }), _jsx(DialogDescription, { children: "Create a new group to collaborate with your team members." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Group Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter group name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Describe the purpose of this group", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "isAnnouncement", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-center justify-between space-y-0 rounded-md border p-4", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(FormLabel, { children: "Announcement Channel" }), _jsx(FormDescription, { children: "Make this an announcement-only channel" })] }), _jsx(FormControl, { children: _jsx(Switch, { checked: field.value, onCheckedChange: field.onChange }) })] })) }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", disabled: createGroupMutation.isPending, children: createGroupMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Creating..."] })) : ("Create Group") }) })] }) })] })] })] }), isLoadingGroups ? (_jsx("div", { className: "flex justify-center items-center h-40", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) })) : groupsError ? (_jsx("div", { className: "text-center py-10 text-red-500", children: "Error loading groups. Please try again." })) : groups && groups.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: groups.map((group) => (_jsxs(Card, { className: "overflow-hidden hover:shadow-md transition-shadow", children: [_jsx("div", { className: `h-24 flex items-center justify-center ${group.isAnnouncement ? "bg-secondary-100" : "bg-primary-100"}`, children: _jsx(Users, { className: `h-12 w-12 ${group.isAnnouncement
                                    ? "text-secondary-600"
                                    : "text-primary-600"}` }) }), _jsxs(CardContent, { className: "p-4", children: [_jsx("h3", { className: "font-medium", children: group.name }), group.description && (_jsx("p", { className: "text-sm text-gray-500 mt-1 line-clamp-2", children: group.description })), _jsxs("div", { className: "mt-4 flex justify-between items-center", children: [_jsxs("div", { className: "flex -space-x-2", children: [_jsx(Avatar, { className: "h-6 w-6 border border-white", children: _jsx(AvatarFallback, { className: "text-xs bg-blue-100", children: "A" }) }), _jsx(Avatar, { className: "h-6 w-6 border border-white", children: _jsx(AvatarFallback, { className: "text-xs bg-green-100", children: "B" }) }), _jsx(Avatar, { className: "h-6 w-6 border border-white", children: _jsx(AvatarFallback, { className: "text-xs bg-yellow-100", children: "C" }) }), _jsx(Avatar, { className: "h-6 w-6 border border-white", children: _jsx(AvatarFallback, { className: "text-xs bg-purple-100", children: "+2" }) })] }), _jsx(Button, { variant: "link", className: "text-primary p-0 h-auto", children: "View" }), _jsx(Button, { variant: "link", className: "text-primary p-0 h-auto", onClick: () => updateGroup(group.id, {
                                                name: `Updated Name ${group.id}`,
                                                description: `Updated Description ${group.id}`,
                                            }), children: "Update" }), _jsx(Button, { variant: "destructive", className: "p-0 h-auto", onClick: () => deleteGroup(group.id), children: "Delete" })] })] })] }, group.id))) })) : (_jsxs("div", { className: "text-center py-10", children: [_jsx("div", { className: "h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4", children: _jsx(Users, { className: "h-10 w-10 text-gray-400" }) }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "No Groups Found" }), _jsx("p", { className: "text-gray-500 mb-6", children: "Create your first group to start collaborating with your team." }), _jsxs(Button, { onClick: () => setIsCreateGroupDialogOpen(true), className: "flex items-center mx-auto", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create Group"] })] }))] }));
}
