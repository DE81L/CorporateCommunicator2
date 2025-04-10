import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createApiClient } from "../lib/queryClient";
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

// Wiki entry type
interface WikiEntry {
  id: number;
  title: string;
  content: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  lastEditorId: number;
  category: string | null;
}

// Wiki category type
interface WikiCategory {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

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

type WikiEntryFormValues = z.infer<typeof wikiEntryFormSchema>;
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function WikiSection() {
  const { request } = createApiClient(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("entries");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WikiEntry | null>(null);
  const [editingCategory, setEditingCategory] = useState<WikiCategory | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<WikiCategory[]>([]);

  // Wiki entries query
  const {
    data: entries = [],
    isLoading: isLoadingEntries,
    refetch: refetchEntries,
  } = useQuery<WikiEntry[]>({
    queryKey: ['/api/wiki'],
    enabled: activeTab === "entries",
  });

  // Wiki categories query
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useQuery<WikiCategory[]>({
    queryKey: ['/api/wiki/categories'],
    enabled: true,
  });

  // Category entries query
  const {
    data: categoryEntries = [],
    isLoading: isLoadingCategoryEntries,
    refetch: refetchCategoryEntries,
  } = useQuery<WikiEntry[]>({
    queryKey: ['/api/wiki/categories', activeCategoryId, 'entries'],
    queryFn: () => {
      if (!activeCategoryId) return Promise.resolve([] as WikiEntry[]);
      return request('GET', `/api/wiki/categories/${activeCategoryId}/entries`).then((res) => res.json());
    },
    enabled: !!activeCategoryId,
  });

  // Create wiki entry mutation
  const createEntryMutation = useMutation({
    mutationFn: (data: WikiEntryFormValues) => {
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
    mutationFn: (data: WikiEntryFormValues & { id: number }) => {
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
    mutationFn: (id: number) => {
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
    mutationFn: (data: CategoryFormValues) => {
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
    mutationFn: (data: CategoryFormValues & { id: number }) => {
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
    mutationFn: (id: number) => {
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
  const entryForm = useForm<WikiEntryFormValues>({
    resolver: zodResolver(wikiEntryFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
    },
  });

  // Category form
  const categoryForm = useForm<CategoryFormValues>({
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
  const handleEditEntry = (entry: WikiEntry) => {
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
  const handleEditCategory = (category: WikiCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || undefined,
    });
    setShowCategoryDialog(true);
  };

  // Function to get subcategories of a parent
  const getSubcategories = (parentId: number | null) => {
    return categories.filter(category => category.parentId === parentId);
  };

  // Function to handle breadcrumb generation
  useEffect(() => {
    const generateBreadcrumbs = () => {
      if (!activeCategoryId) {
        setBreadcrumbs([]);
        return;
      }
      
      const crumbs: WikiCategory[] = [];
      let currentCategoryId = activeCategoryId;
      
      while (currentCategoryId) {
        const category = categories.find(c => c.id === currentCategoryId);
        if (category) {
          crumbs.unshift(category);
          if (category.parentId !== null) {
            currentCategoryId = category.parentId;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      
      setBreadcrumbs(crumbs);
    };
    
    generateBreadcrumbs();
  }, [activeCategoryId, categories]);

  // Handle entry form submission
  const onEntrySubmit = (data: WikiEntryFormValues) => {
    if (editingEntry) {
      updateEntryMutation.mutate({
        ...data,
        id: editingEntry.id,
      });
    } else {
      createEntryMutation.mutate(data);
    }
  };

  // Handle category form submission
  const onCategorySubmit = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({
        ...data,
        id: editingCategory.id,
      });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  // Filter entries based on search query
  const filteredEntries = searchQuery
    ? (activeCategoryId ? categoryEntries : entries).filter(
        entry =>
          entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCategoryId
    ? categoryEntries
    : entries;

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Employee Wiki</h1>
        <div className="flex space-x-2">
          {user?.isAdmin === 1 && (
            <>          
              <Button onClick={handleAddEntry} size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Entry
              </Button>
              <Button onClick={handleAddCategory} size="sm" variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Category
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search wiki..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      {breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => setActiveCategoryId(null)}>
                Root
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {breadcrumbs.map((category, index) => (
              <BreadcrumbItem key={category.id}>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{category.name}</BreadcrumbPage>
                ) : (
                  <>
                    <BreadcrumbLink onClick={() => setActiveCategoryId(category.id)}>
                      {category.name}
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <TabsList className="grid w-60 grid-cols-2">
          <TabsTrigger value="entries">Wiki Entries</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex-1 overflow-hidden">
          <TabsContent value="entries" className="h-full">
            {isLoadingEntries || (activeCategoryId && isLoadingCategoryEntries) ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <p>No wiki entries found</p>
                {user?.isAdmin && (
                  <Button variant="link" onClick={handleAddEntry} className="mt-2">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create a new entry
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEntries.map(entry => (
                    <Card key={entry.id} className="h-full">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{entry.title}</CardTitle>
                          {user?.isAdmin && (
                            <div className="flex space-x-1">
                              <Button size="icon" variant="ghost" onClick={() => handleEditEntry(entry)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this entry?')) {
                                    deleteEntryMutation.mutate(entry.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {entry.category && (
                          <CardDescription>
                            Category: {entry.category}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="prose max-w-none">
                          {entry.content.length > 200
                            ? `${entry.content.substring(0, 200)}...`
                            : entry.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-4">
                          Last updated: {new Date(entry.updatedAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="categories" className="h-full">
            {isLoadingCategories ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getSubcategories(activeCategoryId).map(category => (
                    <Card 
                      key={category.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setActiveCategoryId(category.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          {user?.isAdmin && (
                            <div className="flex space-x-1" onClick={e => e.stopPropagation()}>
                              <Button size="icon" variant="ghost" onClick={() => handleEditCategory(category)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this category?')) {
                                    deleteCategoryMutation.mutate(category.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          {category.description || "No description"}
                        </p>
                        <div className="flex justify-end mt-4">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {getSubcategories(activeCategoryId).length === 0 && (
                  <div className="flex flex-col items-center justify-center text-gray-500 py-8">
                    <p>No categories found</p>
                    {user?.isAdmin && (
                      <Button variant="link" onClick={handleAddCategory} className="mt-2">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create a new category
                      </Button>
                    )}
                  </div>
                )}
              </ScrollArea>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Wiki Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Wiki Entry" : "New Wiki Entry"}</DialogTitle>
            <DialogDescription>
              {editingEntry
                ? "Update the details of this wiki entry."
                : "Create a new wiki entry to share knowledge."}
            </DialogDescription>
          </DialogHeader>

          <Form {...entryForm}>
            <form onSubmit={entryForm.handleSubmit(onEntrySubmit)} className="space-y-4">
              <FormField
                control={entryForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={entryForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={entryForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write the content here..."
                        className="min-h-[250px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEntryDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEntryMutation.isPending || updateEntryMutation.isPending}>
                  {(createEntryMutation.isPending || updateEntryMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingEntry ? "Save Changes" : "Create Entry"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the details of this category."
                : "Create a new category to organize wiki entries."}
            </DialogDescription>
          </DialogHeader>

          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a description (optional)"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a parent category (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None (Root)</SelectItem>
                          {categories
                            .filter(c => c.id !== editingCategory?.id) // Don't show self as parent
                            .map(category => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                  {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingCategory ? "Save Changes" : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}