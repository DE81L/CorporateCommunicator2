"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WikiSection;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const use_auth_1 = require("../hooks/use-auth");
const api_client_1 = require("@/lib/api-client");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const tabs_1 = require("@/components/ui/tabs");
const dialog_1 = require("@/components/ui/dialog");
const textarea_1 = require("@/components/ui/textarea");
const use_toast_1 = require("@/hooks/use-toast");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("zod");
const zod_2 = require("@hookform/resolvers/zod");
const form_1 = require("@/components/ui/form");
const select_1 = require("@/components/ui/select");
const scroll_area_1 = require("@/components/ui/scroll-area");
const breadcrumb_1 = require("@/components/ui/breadcrumb");
const lucide_react_1 = require("lucide-react");
// Form schema for wiki entries
const wikiEntryFormSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    content: zod_1.z.string().min(1, "Content is required"),
    category: zod_1.z.string().optional(),
});
// Form schema for categories
const categoryFormSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Category name is required"),
    description: zod_1.z.string().optional(),
    parentId: zod_1.z.number().optional(),
});
function WikiSection() {
    const apiClient = (0, api_client_1.createApiClient)();
    const { request } = (0, api_client_1.createApiClient)(true);
    const { user } = (0, use_auth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const [activeTab, setActiveTab] = (0, react_1.useState)("entries");
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [showEntryDialog, setShowEntryDialog] = (0, react_1.useState)(false);
    const [showCategoryDialog, setShowCategoryDialog] = (0, react_1.useState)(false);
    const [editingEntry, setEditingEntry] = (0, react_1.useState)(null);
    const [editingCategory, setEditingCategory] = (0, react_1.useState)(null);
    const [activeCategoryId, setActiveCategoryId] = (0, react_1.useState)(null);
    const [breadcrumbs, setBreadcrumbs] = (0, react_1.useState)([]);
    // Wiki entries query
    const { data: entries = [], isLoading: isLoadingEntries, refetch: refetchEntries, } = (0, react_query_1.useQuery)({
        queryKey: ['/api/wiki/entries'],
        enabled: activeTab === "entries",
        queryFn: async () => {
            return await apiClient.request("/api/wiki");
        }
    });
    // Wiki categories query
    const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories, } = (0, react_query_1.useQuery)({ queryKey: ['/api/wiki/categories'],
        queryFn: async () => {
            return await apiClient.request("/api/wiki/categories");
        },
        enabled: true,
    });
    // Category entries query
    const { data: categoryEntries = [], isLoading: isLoadingCategoryEntries, refetch: refetchCategoryEntries, } = (0, react_query_1.useQuery)({
        queryKey: ['/api/wiki/categories', activeCategoryId, 'entries'],
        queryFn: () => {
            if (!activeCategoryId)
                return Promise.resolve([]);
            return request('GET', `/api/wiki/categories/${activeCategoryId}/entries`).then((res) => res.json());
        },
        enabled: !!activeCategoryId,
    });
    // Create wiki entry mutation
    const createEntryMutation = (0, react_query_1.useMutation)({
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
    const updateEntryMutation = (0, react_query_1.useMutation)({
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
    const deleteEntryMutation = (0, react_query_1.useMutation)({
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
    const createCategoryMutation = (0, react_query_1.useMutation)({
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
    const updateCategoryMutation = (0, react_query_1.useMutation)({
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
    const deleteCategoryMutation = (0, react_query_1.useMutation)({
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
    const entryForm = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_2.zodResolver)(wikiEntryFormSchema),
        defaultValues: {
            title: "",
            content: "",
            category: "",
        },
    });
    // Category form
    const categoryForm = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_2.zodResolver)(categoryFormSchema),
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
    (0, react_1.useEffect)(() => {
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
    return (<div className="h-full flex flex-col p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Employee Wiki</h1>
        <div className="flex space-x-2">
          {user?.isAdmin === 1 && (<>          
              <button_1.Button onClick={handleAddEntry} size="sm">
                <lucide_react_1.PlusCircle className="h-4 w-4 mr-2"/>
                New Entry
              </button_1.Button>
              <button_1.Button onClick={handleAddCategory} size="sm" variant="outline">
                <lucide_react_1.PlusCircle className="h-4 w-4 mr-2"/>
                New Category
              </button_1.Button>
            </>)}
        </div>
      </div>
      <div className="mb-4">
        <div className="relative max-w-md">
          <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
          <input_1.Input placeholder="Search wiki..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10"/>
        </div>
      </div>
      {breadcrumbs.length > 0 && (<breadcrumb_1.Breadcrumb className="mb-4">
          <breadcrumb_1.BreadcrumbList>
            <breadcrumb_1.BreadcrumbItem>
              <breadcrumb_1.BreadcrumbLink onClick={() => setActiveCategoryId(null)}>
                Root
              </breadcrumb_1.BreadcrumbLink>
            </breadcrumb_1.BreadcrumbItem>
            <breadcrumb_1.BreadcrumbSeparator />
            {breadcrumbs.map((category, index) => (<breadcrumb_1.BreadcrumbItem key={category.id}>
                {index === breadcrumbs.length - 1 ? (<breadcrumb_1.BreadcrumbPage>{category.name}</breadcrumb_1.BreadcrumbPage>) : (<>
                    <breadcrumb_1.BreadcrumbLink onClick={() => setActiveCategoryId(category.id)}>
                      {category.name}
                    </breadcrumb_1.BreadcrumbLink>
                    <breadcrumb_1.BreadcrumbSeparator />
                  </>)}
              </breadcrumb_1.BreadcrumbItem>))}
          </breadcrumb_1.BreadcrumbList>
        </breadcrumb_1.Breadcrumb>)}

      <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <tabs_1.TabsList className="grid w-60 grid-cols-2">
          <tabs_1.TabsTrigger value="entries">Wiki Entries</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="categories">Categories</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <div className="mt-4 flex-1 overflow-hidden">
          <tabs_1.TabsContent value="entries" className="h-full">
            {isLoadingEntries || (activeCategoryId && isLoadingCategoryEntries) ? (<div className="h-full flex items-center justify-center">
                <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-primary"/>
              </div>) : filteredEntries.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-gray-500">
                <p>No wiki entries found</p>
                {user?.isAdmin && (<button_1.Button variant="link" onClick={handleAddEntry} className="mt-2">
                    <lucide_react_1.PlusCircle className="h-4 w-4 mr-2"/>
                    Create a new entry
                  </button_1.Button>)}
              </div>) : (<scroll_area_1.ScrollArea className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEntries.map(entry => (<card_1.Card key={entry.id} className="h-full">
                      <card_1.CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <card_1.CardTitle className="text-xl">{entry.title}</card_1.CardTitle>
                          {user?.isAdmin && (<div className="flex space-x-1">
                              <button_1.Button size="icon" variant="ghost" onClick={() => handleEditEntry(entry)}>
                                <lucide_react_1.Edit className="h-4 w-4"/>
                              </button_1.Button>
                              <button_1.Button size="icon" variant="ghost" onClick={() => {
                        if (window.confirm('Are you sure you want to delete this entry?')) {
                            deleteEntryMutation.mutate(entry.id);
                        }
                    }}>
                                <lucide_react_1.Trash2 className="h-4 w-4 text-red-500"/>
                              </button_1.Button>
                            </div>)}
                        </div>
                        {entry.category && (<card_1.CardDescription>
                            Category: {entry.category}
                          </card_1.CardDescription>)}
                      </card_1.CardHeader>
                      <card_1.CardContent>
                        <div className="prose max-w-none">
                          {entry.content.length > 200
                    ? `${entry.content.substring(0, 200)}...`
                    : entry.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-4">
                          Last updated: {new Date(entry.updatedAt).toLocaleDateString()}
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>))}
                </div>
              </scroll_area_1.ScrollArea>)}
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="categories" className="h-full">
            {isLoadingCategories ? (<div className="h-full flex items-center justify-center">
                <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-primary"/>
              </div>) : (<scroll_area_1.ScrollArea className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getSubcategories(activeCategoryId).map(category => (<card_1.Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCategoryId(category.id)}>
                      <card_1.CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <card_1.CardTitle className="text-lg">{category.name}</card_1.CardTitle>
                          {user?.isAdmin && (<div className="flex space-x-1" onClick={e => e.stopPropagation()}>
                              <button_1.Button size="icon" variant="ghost" onClick={() => handleEditCategory(category)}>
                                <lucide_react_1.Edit className="h-4 w-4"/>
                              </button_1.Button>
                              <button_1.Button size="icon" variant="ghost" onClick={() => {
                        if (window.confirm('Are you sure you want to delete this category?')) {
                            deleteCategoryMutation.mutate(category.id);
                        }
                    }}>
                                <lucide_react_1.Trash2 className="h-4 w-4 text-red-500"/>
                              </button_1.Button>
                            </div>)}
                        </div>
                      </card_1.CardHeader>
                      <card_1.CardContent>
                        <p className="text-sm text-gray-600">
                          {category.description || "No description"}
                        </p>
                        <div className="flex justify-end mt-4">
                          <lucide_react_1.ChevronRight className="h-4 w-4 text-gray-400"/>
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>))}
                </div>
                
                {getSubcategories(activeCategoryId).length === 0 && (<div className="flex flex-col items-center justify-center text-gray-500 py-8">
                    <p>No categories found</p>
                    {user?.isAdmin && (<button_1.Button variant="link" onClick={handleAddCategory} className="mt-2">
                        <lucide_react_1.PlusCircle className="h-4 w-4 mr-2"/>
                        Create a new category
                      </button_1.Button>)}
                  </div>)}
              </scroll_area_1.ScrollArea>)}
          </tabs_1.TabsContent>
        </div>
      </tabs_1.Tabs>

      {/* Wiki Entry Dialog */}
      <dialog_1.Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <dialog_1.DialogContent className="max-w-3xl">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>{editingEntry ? "Edit Wiki Entry" : "New Wiki Entry"}</dialog_1.DialogTitle>
            <dialog_1.DialogDescription>
              {editingEntry
            ? "Update the details of this wiki entry."
            : "Create a new wiki entry to share knowledge."}
            </dialog_1.DialogDescription>
          </dialog_1.DialogHeader>

          <form_1.Form {...entryForm}>
            <form onSubmit={entryForm.handleSubmit(onEntrySubmit)} className="space-y-4">
              <form_1.FormField control={entryForm.control} name="title" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>Title</form_1.FormLabel>
                    <form_1.FormControl>
                      <input_1.Input placeholder="Enter a title" {...field}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>

              <form_1.FormField control={entryForm.control} name="category" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>Category</form_1.FormLabel>
                    <form_1.FormControl>
                      <select_1.Select value={field.value} onValueChange={field.onChange}>
                        <select_1.SelectTrigger>
                          <select_1.SelectValue placeholder="Select a category"/>
                        </select_1.SelectTrigger>
                        <select_1.SelectContent>
                          <select_1.SelectItem value="">None</select_1.SelectItem>
                          {categories.map(category => (<select_1.SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </select_1.SelectItem>))}
                        </select_1.SelectContent>
                      </select_1.Select>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>

              <form_1.FormField control={entryForm.control} name="content" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>Content</form_1.FormLabel>
                    <form_1.FormControl>
                      <textarea_1.Textarea placeholder="Write the content here..." className="min-h-[250px]" {...field}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>

              <dialog_1.DialogFooter>
                <button_1.Button type="button" variant="outline" onClick={() => setShowEntryDialog(false)}>
                  Cancel
                </button_1.Button>
                <button_1.Button type="submit" disabled={createEntryMutation.isPending || updateEntryMutation.isPending}>
                  {(createEntryMutation.isPending || updateEntryMutation.isPending) && (<lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>)}
                  {editingEntry ? "Save Changes" : "Create Entry"}
                </button_1.Button>
              </dialog_1.DialogFooter>
            </form>
          </form_1.Form>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* Category Dialog */}
      <dialog_1.Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <dialog_1.DialogContent>
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</dialog_1.DialogTitle>
            <dialog_1.DialogDescription>
              {editingCategory
            ? "Update the details of this category."
            : "Create a new category to organize wiki entries."}
            </dialog_1.DialogDescription>
          </dialog_1.DialogHeader>

          <form_1.Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
              <form_1.FormField control={categoryForm.control} name="name" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>Name</form_1.FormLabel>
                    <form_1.FormControl>
                      <input_1.Input placeholder="Enter a name" {...field}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>

              <form_1.FormField control={categoryForm.control} name="description" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>Description</form_1.FormLabel>
                    <form_1.FormControl>
                      <textarea_1.Textarea placeholder="Enter a description (optional)" {...field} value={field.value || ""}/>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>

              <form_1.FormField control={categoryForm.control} name="parentId" render={({ field }) => (<form_1.FormItem>
                    <form_1.FormLabel>Parent Category</form_1.FormLabel>
                    <form_1.FormControl>
                      <select_1.Select value={field.value?.toString() || ""} onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                        <select_1.SelectTrigger>
                          <select_1.SelectValue placeholder="Select a parent category (optional)"/>
                        </select_1.SelectTrigger>
                        <select_1.SelectContent>
                          <select_1.SelectItem value="">None (Root)</select_1.SelectItem>
                          {categories
                .filter(c => c.id !== editingCategory?.id) // Don't show self as parent
                .map(category => (<select_1.SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </select_1.SelectItem>))}
                        </select_1.SelectContent>
                      </select_1.Select>
                    </form_1.FormControl>
                    <form_1.FormMessage />
                  </form_1.FormItem>)}/>

              <dialog_1.DialogFooter>
                <button_1.Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                  Cancel
                </button_1.Button>
                <button_1.Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                  {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (<lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>)}
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button_1.Button>
              </dialog_1.DialogFooter>
            </form>
          </form_1.Form>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>
    </div>);
}
