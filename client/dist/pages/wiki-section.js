import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { createApiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Loader2, PlusCircle, Search, ChevronRight, Edit, Trash2 } from "lucide-react";
// Form schema for wiki entries
const wikiEntryFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    category: z.string().optional(),
});
// Form schema for categories
const categoryFormSchema = z.object({
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional(),
    parentId: z.number().optional(),
});
export default function WikiSection() {
    const apiClient = createApiClient();
    const { request } = apiClient;
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("entries");
    const [searchQuery, setSearchQuery] = useState("");
    const [showEntryDialog, setShowEntryDialog] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    // Wiki entries query
    const { data: entries = [], isLoading: isLoadingEntries, refetch: refetchEntries, } = useQuery({
        queryKey: ['/api/wiki/entries'],
        enabled: activeTab === "entries",
        queryFn: async () => {
            return await apiClient.request("/api/wiki");
        }
    });
    // Wiki categories query
    const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories, } = useQuery({ queryKey: ['/api/wiki/categories'],
        queryFn: async () => {
            return await apiClient.request("/api/wiki/categories");
        },
        enabled: true,
    });
    // Category entries query
    const { data: categoryEntries = [], isLoading: isLoadingCategoryEntries, refetch: refetchCategoryEntries, } = useQuery({
        queryKey: ['/api/wiki/categories', activeCategoryId, 'entries'],
        queryFn: () => {
            if (!activeCategoryId)
                return Promise.resolve([]);
            return request(`/api/wiki/categories/${activeCategoryId}/entries`);
        },
        enabled: !!activeCategoryId,
    });
    // Create wiki entry mutation
    const createEntryMutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                ...data,
                creatorId: user?.id,
                lastEditorId: user?.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            return request('POST', '/api/wiki', payload);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Wiki entry created successfully",
            });
            refetchEntries();
            if (activeCategoryId) {
                refetchCategoryEntries();
            }
            setShowEntryDialog(false);
            entryForm.reset({
                title: "",
                content: "",
                category: "",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to create wiki entry",
                variant: "destructive",
            });
            console.error(error);
        },
    });
    // Update wiki entry mutation
    const updateEntryMutation = useMutation({
        mutationFn: (data) => {
            const { id, ...rest } = data;
            const payload = {
                ...rest,
                lastEditorId: user?.id,
                updatedAt: new Date().toISOString(),
            };
            return request('PUT', `/api/wiki/${id}`, payload);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Wiki entry updated successfully",
            });
            refetchEntries();
            if (activeCategoryId) {
                refetchCategoryEntries();
            }
            setShowEntryDialog(false);
            setEditingEntry(null);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to update wiki entry",
                variant: "destructive",
            });
            console.error(error);
        },
    });
    // Delete wiki entry mutation
    const deleteEntryMutation = useMutation({
        mutationFn: (id) => {
            return request('DELETE', `/api/wiki/${id}`);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Wiki entry deleted successfully",
            });
            refetchEntries();
            if (activeCategoryId) {
                refetchCategoryEntries();
            }
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to delete wiki entry",
                variant: "destructive",
            });
            console.error(error);
        },
    });
    // Create category mutation
    const createCategoryMutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            return request('POST', '/api/wiki/categories', payload);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Category created successfully",
            });
            refetchCategories();
            setShowCategoryDialog(false);
            categoryForm.reset({
                name: "",
                description: "",
                parentId: undefined,
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to create category",
                variant: "destructive",
            });
            console.error(error);
        },
    });
    // Update category mutation
    const updateCategoryMutation = useMutation({
        mutationFn: (data) => {
            const { id, ...rest } = data;
            const payload = {
                ...rest,
                updatedAt: new Date().toISOString(),
            };
            return request('PUT', `/api/wiki/categories/${id}`, payload);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Category updated successfully",
            });
            refetchCategories();
            setShowCategoryDialog(false);
            setEditingCategory(null);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to update category",
                variant: "destructive",
            });
            console.error(error);
        },
    });
    // Delete category mutation
    const deleteCategoryMutation = useMutation({
        mutationFn: (id) => {
            return request('DELETE', `/api/wiki/categories/${id}`);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Category deleted successfully",
            });
            refetchCategories();
            if (activeCategoryId === editingCategory?.id) {
                setActiveCategoryId(null);
            }
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to delete category",
                variant: "destructive",
            });
            console.error(error);
        },
    });
    // Entry form
    const entryForm = useForm({
        resolver: zodResolver(wikiEntryFormSchema),
        defaultValues: {
            title: "",
            content: "",
            category: "",
        },
    });
    // Category form
    const categoryForm = useForm({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: {
            name: "",
            description: "",
            parentId: undefined,
        },
    });
    // Function to handle adding new wiki entry
    const handleAddEntry = () => {
        setEditingEntry(null);
        entryForm.reset({
            title: "",
            content: "",
            category: activeCategoryId ? categories.find(c => c.id === activeCategoryId)?.name || "" : "",
        });
        setShowEntryDialog(true);
    };
    // Function to handle editing wiki entry
    const handleEditEntry = (entry) => {
        setEditingEntry(entry);
        entryForm.reset({
            title: entry.title,
            content: entry.content,
            category: entry.category || "",
        });
        setShowEntryDialog(true);
    };
    // Function to handle adding new category
    const handleAddCategory = () => {
        setEditingCategory(null);
        categoryForm.reset({
            name: "",
            description: "",
            parentId: activeCategoryId || undefined,
        });
        setShowCategoryDialog(true);
    };
    // Function to handle editing category
    const handleEditCategory = (category) => {
        setEditingCategory(category);
        categoryForm.reset({
            name: category.name,
            description: category.description || "",
            parentId: category.parentId || undefined,
        });
        setShowCategoryDialog(true);
    };
    // Function to get subcategories of a parent
    const getSubcategories = (parentId) => {
        return categories.filter(category => category.parentId === parentId);
    };
    // Function to handle breadcrumb generation
    useEffect(() => {
        const generateBreadcrumbs = () => {
            if (!activeCategoryId) {
                setBreadcrumbs([]);
                return;
            }
            const crumbs = [];
            let currentCategoryId = activeCategoryId;
            while (currentCategoryId) {
                const category = categories.find(c => c.id === currentCategoryId);
                if (category) {
                    crumbs.unshift(category);
                    if (category.parentId !== null) {
                        currentCategoryId = category.parentId;
                    }
                    else {
                        break;
                    }
                }
                else {
                    break;
                }
            }
            setBreadcrumbs(crumbs);
        };
        generateBreadcrumbs();
    }, [activeCategoryId, categories]);
    // Handle entry form submission
    const onEntrySubmit = (data) => {
        if (editingEntry) {
            updateEntryMutation.mutate({
                ...data,
                id: editingEntry.id,
            });
        }
        else {
            createEntryMutation.mutate(data);
        }
    };
    // Handle category form submission
    const onCategorySubmit = (data) => {
        if (editingCategory) {
            updateCategoryMutation.mutate({
                ...data,
                id: editingCategory.id,
            });
        }
        else {
            createCategoryMutation.mutate(data);
        }
    };
    // Filter entries based on search query
    const filteredEntries = searchQuery
        ? (activeCategoryId ? categoryEntries : entries).filter(entry => entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : activeCategoryId
            ? categoryEntries
            : entries;
    return (_jsxs("div", { className: "h-full flex flex-col p-4 overflow-hidden", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Employee Wiki" }), _jsx("div", { className: "flex space-x-2", children: user?.isAdmin === 1 && (_jsxs(_Fragment, { children: [_jsxs(Button, { onClick: handleAddEntry, size: "sm", children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "New Entry"] }), _jsxs(Button, { onClick: handleAddCategory, size: "sm", variant: "outline", children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "New Category"] })] })) })] }), _jsx("div", { className: "mb-4", children: _jsxs("div", { className: "relative max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" }), _jsx(Input, { placeholder: "Search wiki...", value: searchQuery, onChange: e => setSearchQuery(e.target.value), className: "pl-10" })] }) }), breadcrumbs.length > 0 && (_jsx(Breadcrumb, { className: "mb-4", children: _jsxs(BreadcrumbList, { children: [_jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { onClick: () => setActiveCategoryId(null), children: "Root" }) }), _jsx(BreadcrumbSeparator, {}), breadcrumbs.map((category, index) => (_jsx(BreadcrumbItem, { children: index === breadcrumbs.length - 1 ? (_jsx(BreadcrumbPage, { children: category.name })) : (_jsxs(_Fragment, { children: [_jsx(BreadcrumbLink, { onClick: () => setActiveCategoryId(category.id), children: category.name }), _jsx(BreadcrumbSeparator, {})] })) }, category.id)))] }) })), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "flex-1 overflow-hidden", children: [_jsxs(TabsList, { className: "grid w-60 grid-cols-2", children: [_jsx(TabsTrigger, { value: "entries", children: "Wiki Entries" }), _jsx(TabsTrigger, { value: "categories", children: "Categories" })] }), _jsxs("div", { className: "mt-4 flex-1 overflow-hidden", children: [_jsx(TabsContent, { value: "entries", className: "h-full", children: isLoadingEntries || (activeCategoryId && isLoadingCategoryEntries) ? (_jsx("div", { className: "h-full flex items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) })) : filteredEntries.length === 0 ? (_jsxs("div", { className: "h-full flex flex-col items-center justify-center text-gray-500", children: [_jsx("p", { children: "No wiki entries found" }), user?.isAdmin && (_jsxs(Button, { variant: "link", onClick: handleAddEntry, className: "mt-2", children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "Create a new entry"] }))] })) : (_jsx(ScrollArea, { className: "h-full", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: filteredEntries.map(entry => (_jsxs(Card, { className: "h-full", children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx(CardTitle, { className: "text-xl", children: entry.title }), user?.isAdmin && (_jsxs("div", { className: "flex space-x-1", children: [_jsx(Button, { size: "icon", variant: "ghost", onClick: () => handleEditEntry(entry), children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { size: "icon", variant: "ghost", onClick: () => {
                                                                                if (window.confirm('Are you sure you want to delete this entry?')) {
                                                                                    deleteEntryMutation.mutate(entry.id);
                                                                                }
                                                                            }, children: _jsx(Trash2, { className: "h-4 w-4 text-red-500" }) })] }))] }), entry.category && (_jsxs(CardDescription, { children: ["Category: ", entry.category] }))] }), _jsxs(CardContent, { children: [_jsx("div", { className: "prose max-w-none", children: entry.content.length > 200
                                                                ? `${entry.content.substring(0, 200)}...`
                                                                : entry.content }), _jsxs("div", { className: "text-xs text-gray-500 mt-4", children: ["Last updated: ", new Date(entry.updatedAt).toLocaleDateString()] })] })] }, entry.id))) }) })) }), _jsx(TabsContent, { value: "categories", className: "h-full", children: isLoadingCategories ? (_jsx("div", { className: "h-full flex items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) })) : (_jsxs(ScrollArea, { className: "h-full", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: getSubcategories(activeCategoryId).map(category => (_jsxs(Card, { className: "cursor-pointer hover:shadow-md transition-shadow", onClick: () => setActiveCategoryId(category.id), children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsx(CardTitle, { className: "text-lg", children: category.name }), user?.isAdmin && (_jsxs("div", { className: "flex space-x-1", onClick: e => e.stopPropagation(), children: [_jsx(Button, { size: "icon", variant: "ghost", onClick: () => handleEditCategory(category), children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { size: "icon", variant: "ghost", onClick: () => {
                                                                                if (window.confirm('Are you sure you want to delete this category?')) {
                                                                                    deleteCategoryMutation.mutate(category.id);
                                                                                }
                                                                            }, children: _jsx(Trash2, { className: "h-4 w-4 text-red-500" }) })] }))] }) }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-sm text-gray-600", children: category.description || "No description" }), _jsx("div", { className: "flex justify-end mt-4", children: _jsx(ChevronRight, { className: "h-4 w-4 text-gray-400" }) })] })] }, category.id))) }), getSubcategories(activeCategoryId).length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center text-gray-500 py-8", children: [_jsx("p", { children: "No categories found" }), user?.isAdmin && (_jsxs(Button, { variant: "link", onClick: handleAddCategory, className: "mt-2", children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "Create a new category"] }))] }))] })) })] })] }), _jsx(Dialog, { open: showEntryDialog, onOpenChange: setShowEntryDialog, children: _jsxs(DialogContent, { className: "max-w-3xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingEntry ? "Edit Wiki Entry" : "New Wiki Entry" }), _jsx(DialogDescription, { children: editingEntry
                                        ? "Update the details of this wiki entry."
                                        : "Create a new wiki entry to share knowledge." })] }), _jsx(Form, { ...entryForm, children: _jsxs("form", { onSubmit: entryForm.handleSubmit(onEntrySubmit), className: "space-y-4", children: [_jsx(FormField, { control: entryForm.control, name: "title", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter a title", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: entryForm.control, name: "category", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Category" }), _jsx(FormControl, { children: _jsxs(Select, { value: field.value, onValueChange: field.onChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a category" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "", children: "None" }), categories.map(category => (_jsx(SelectItem, { value: category.name, children: category.name }, category.id)))] })] }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: entryForm.control, name: "content", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Content" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Write the content here...", className: "min-h-[250px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setShowEntryDialog(false), children: "Cancel" }), _jsxs(Button, { type: "submit", disabled: createEntryMutation.isPending || updateEntryMutation.isPending, children: [(createEntryMutation.isPending || updateEntryMutation.isPending) && (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })), editingEntry ? "Save Changes" : "Create Entry"] })] })] }) })] }) }), _jsx(Dialog, { open: showCategoryDialog, onOpenChange: setShowCategoryDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingCategory ? "Edit Category" : "New Category" }), _jsx(DialogDescription, { children: editingCategory
                                        ? "Update the details of this category."
                                        : "Create a new category to organize wiki entries." })] }), _jsx(Form, { ...categoryForm, children: _jsxs("form", { onSubmit: categoryForm.handleSubmit(onCategorySubmit), className: "space-y-4", children: [_jsx(FormField, { control: categoryForm.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter a name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: categoryForm.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Enter a description (optional)", ...field, value: field.value || "" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: categoryForm.control, name: "parentId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Parent Category" }), _jsx(FormControl, { children: _jsxs(Select, { value: field.value?.toString() || "", onValueChange: (value) => field.onChange(value ? parseInt(value) : undefined), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a parent category (optional)" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "", children: "None (Root)" }), categories
                                                                        .filter(c => c.id !== editingCategory?.id) // Don't show self as parent
                                                                        .map(category => (_jsx(SelectItem, { value: category.id.toString(), children: category.name }, category.id)))] })] }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setShowCategoryDialog(false), children: "Cancel" }), _jsxs(Button, { type: "submit", disabled: createCategoryMutation.isPending || updateCategoryMutation.isPending, children: [(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })), editingCategory ? "Save Changes" : "Create Category"] })] })] }) })] }) })] }));
}
