"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GroupsSection;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const use_toast_1 = require("@/hooks/use-toast");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const zod_2 = require("zod");
const card_1 = require("@/components/ui/card");
const dialog_1 = require("@/components/ui/dialog");
const form_1 = require("@/components/ui/form");
const input_1 = require("@/components/ui/input");
const button_1 = require("@/components/ui/button");
const avatar_1 = require("@/components/ui/avatar");
const lucide_react_1 = require("lucide-react");
const textarea_1 = require("@/components/ui/textarea");
const switch_1 = require("@/components/ui/switch");
const queryClient_1 = require("@/lib/queryClient");
const api_client_1 = require("@/lib/api-client");
const createGroupSchema = zod_2.z.object({
    name: zod_2.z.string().min(1, "Group name is required"),
    description: zod_2.z.string().optional(),
    isAnnouncement: zod_2.z.boolean().default(false),
});
function GroupsSection() {
    const apiClient = (0, api_client_1.createApiClient)();
    const { toast } = (0, use_toast_1.useToast)();
    const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = (0, react_1.useState)(false);
    //Fetch groups
    const { data: groups = [], isLoading: isLoadingGroups, error: groupsError, } = (0, react_query_1.useQuery)({
        queryKey: ["/api/groups"],
        queryFn: () => apiClient.request("/api/groups"),
    });
    // Fetch all users for adding to groups
    (0, react_query_1.useQuery)({
        queryKey: ["/api/users"],
        queryFn: async () => {
            return await apiClient.request("/api/users");
        },
    });
    // Create group mutation
    const createGroupMutation = (0, react_query_1.useMutation)({
        mutationFn: (data) => apiClient.request("POST", "/api/groups", data),
        onSuccess: async () => {
            queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
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
    const updateGroupMutation = (0, react_query_1.useMutation)({
        mutationFn: async ({ id, data }) => {
            return await apiClient.request("PUT", `/api/groups/${id}`, data);
        },
        onSuccess: () => {
            queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        },
    });
    const deleteGroupMutation = (0, react_query_1.useMutation)({
        mutationFn: async (id) => {
            return await apiClient.request("DELETE", `/api/groups/${id}`);
        },
        onSuccess: () => {
            queryClient_1.queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
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
    const form = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(createGroupSchema),
        defaultValues: {
            name: "",
            description: "",
            isAnnouncement: false,
        },
    });
    const onSubmit = (data) => {
        createGroup(data);
    };
    return (<div className="flex-1 overflow-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Groups</h2>
        <dialog_1.Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
          <dialog_1.DialogTrigger asChild>
            <button_1.Button className="flex items-center">
              <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
              New Group
            </button_1.Button>
          </dialog_1.DialogTrigger>
          <dialog_1.DialogContent>
            <dialog_1.DialogHeader>
              <dialog_1.DialogTitle>Create New Group</dialog_1.DialogTitle>
              <dialog_1.DialogDescription>
                Create a new group to collaborate with your team members.
              </dialog_1.DialogDescription>
            </dialog_1.DialogHeader>
            <form_1.Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <form_1.FormField control={form.control} name="name" render={({ field }) => (<form_1.FormItem>
                      <form_1.FormLabel>Group Name</form_1.FormLabel>
                      <form_1.FormControl>
                        <input_1.Input placeholder="Enter group name" {...field}/>
                      </form_1.FormControl>
                      <form_1.FormMessage />
                    </form_1.FormItem>)}/>
                <form_1.FormField control={form.control} name="description" render={({ field }) => (<form_1.FormItem>
                      <form_1.FormLabel>Description</form_1.FormLabel>
                      <form_1.FormControl>
                        <textarea_1.Textarea placeholder="Describe the purpose of this group" {...field}/>
                      </form_1.FormControl>
                      <form_1.FormMessage />
                    </form_1.FormItem>)}/>
                <form_1.FormField control={form.control} name="isAnnouncement" render={({ field }) => (<form_1.FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <form_1.FormLabel>Announcement Channel</form_1.FormLabel>
                        <form_1.FormDescription>
                          Make this an announcement-only channel
                        </form_1.FormDescription>
                      </div>
                      <form_1.FormControl>
                        <switch_1.Switch checked={field.value} onCheckedChange={field.onChange}/>
                      </form_1.FormControl>
                    </form_1.FormItem>)}/>
                <dialog_1.DialogFooter>
                  <button_1.Button type="submit" disabled={createGroupMutation.isPending}>
                    {createGroupMutation.isPending ? (<>
                        <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        Creating...
                      </>) : ("Create Group")}
                  </button_1.Button>
                </dialog_1.DialogFooter>
              </form>
            </form_1.Form>
          </dialog_1.DialogContent>
        </dialog_1.Dialog>
      </div>

      {isLoadingGroups ? (<div className="flex justify-center items-center h-40">
          <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-primary"/>
        </div>) : groupsError ? (<div className="text-center py-10 text-red-500">
          Error loading groups. Please try again.
        </div>) : groups && groups.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (<card_1.Card key={group.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-24 flex items-center justify-center ${group.isAnnouncement ? "bg-secondary-100" : "bg-primary-100"}`}>
                <lucide_react_1.Users className={`h-12 w-12 ${group.isAnnouncement
                    ? "text-secondary-600"
                    : "text-primary-600"}`}/>
              </div>
              <card_1.CardContent className="p-4">
                <h3 className="font-medium">{group.name}</h3>
                {group.description && (<p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {group.description}
                  </p>)}

                <div className="mt-4 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    <avatar_1.Avatar className="h-6 w-6 border border-white">
                      <avatar_1.AvatarFallback className="text-xs bg-blue-100">
                        A
                      </avatar_1.AvatarFallback>
                    </avatar_1.Avatar>
                    <avatar_1.Avatar className="h-6 w-6 border border-white">
                      <avatar_1.AvatarFallback className="text-xs bg-green-100">
                        B
                      </avatar_1.AvatarFallback>
                    </avatar_1.Avatar>
                    <avatar_1.Avatar className="h-6 w-6 border border-white">
                      <avatar_1.AvatarFallback className="text-xs bg-yellow-100">
                        C
                      </avatar_1.AvatarFallback>
                    </avatar_1.Avatar>
                    <avatar_1.Avatar className="h-6 w-6 border border-white">
                      <avatar_1.AvatarFallback className="text-xs bg-purple-100">
                        +2
                      </avatar_1.AvatarFallback>
                    </avatar_1.Avatar>
                  </div>
                  <button_1.Button variant="link" className="text-primary p-0 h-auto">
                    View
                  </button_1.Button>
                  <button_1.Button variant="link" className="text-primary p-0 h-auto" onClick={() => updateGroup(group.id, {
                    name: `Updated Name ${group.id}`,
                    description: `Updated Description ${group.id}`,
                })}>
                    Update
                  </button_1.Button>
                  <button_1.Button variant="destructive" className="p-0 h-auto" onClick={() => deleteGroup(group.id)}>
                    Delete
                  </button_1.Button>
                </div>
              </card_1.CardContent>
            </card_1.Card>))}
        </div>) : (<div className="text-center py-10">
          <div className="h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <lucide_react_1.Users className="h-10 w-10 text-gray-400"/>
          </div>
          <h3 className="text-lg font-medium mb-2">No Groups Found</h3>
          <p className="text-gray-500 mb-6">
            Create your first group to start collaborating with your team.
          </p>
          <button_1.Button onClick={() => setIsCreateGroupDialogOpen(true)} className="flex items-center mx-auto">
            <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
            Create Group
          </button_1.Button>
        </div>)}
    </div>);
}
