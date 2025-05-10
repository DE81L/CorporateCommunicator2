"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWiki = useWiki;
const react_query_1 = require("@tanstack/react-query");
const use_toast_1 = require("./use-toast");
const API_BASE = "/api/wiki";
function useWiki() {
    const queryClient = (0, react_query_1.useQueryClient)();
    const { toast } = (0, use_toast_1.useToast)();
    // Query for fetching all wiki entries
    const { data: entries = [], isLoading: isLoadingEntries } = (0, react_query_1.useQuery)({
        queryKey: [API_BASE],
        queryFn: async () => {
            const res = await fetch(API_BASE, { credentials: "include" });
            if (!res.ok)
                throw new Error(`GET ${API_BASE} → ${res.status}`);
            return res.json();
        },
    });
    // Query for fetching entries by category
    const getCategoryEntries = async (categoryId) => {
        const res = await fetch(`${API_BASE}/categories/${categoryId}/entries`, {
            credentials: "include"
        });
        if (!res.ok)
            throw new Error(`GET ${API_BASE}/categories/${categoryId}/entries → ${res.status}`);
        return res.json();
    };
    // Mutation for creating entries
    const createEntry = (0, react_query_1.useMutation)({
        mutationFn: async (entry) => {
            const res = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(entry),
            });
            if (!res.ok)
                throw new Error(`POST ${API_BASE} → ${res.status}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [API_BASE] });
            toast({
                title: "Success",
                description: "Wiki entry created successfully",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });
    // Mutation for updating entries
    const updateEntry = (0, react_query_1.useMutation)({
        mutationFn: async ({ id, patch }) => {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(patch),
            });
            if (!res.ok)
                throw new Error(`PUT ${API_BASE}/${id} → ${res.status}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [API_BASE] });
            toast({
                title: "Success",
                description: "Wiki entry updated successfully",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });
    // Mutation for deleting entries
    const deleteEntry = (0, react_query_1.useMutation)({
        mutationFn: async (id) => {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok)
                throw new Error(`DELETE ${API_BASE}/${id} → ${res.status}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [API_BASE] });
            toast({
                title: "Success",
                description: "Wiki entry deleted successfully",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });
    return {
        entries,
        isLoadingEntries,
        getCategoryEntries,
        createEntry,
        updateEntry,
        deleteEntry,
    };
}
