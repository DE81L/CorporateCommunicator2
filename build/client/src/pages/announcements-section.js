"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AnnouncementsSection;
const api_client_1 = require("@/lib/api-client");
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const use_auth_1 = require("../hooks/use-auth");
const queryClient_1 = require("@/lib/queryClient");
const use_toast_1 = require("../hooks/use-toast");
const react_hook_form_1 = require("react-hook-form");
const dialog_1 = require("@/components/ui/dialog");
const form_1 = require("@/components/ui/form");
const zod_1 = require("@hookform/resolvers/zod");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const lucide_react_1 = require("lucide-react");
const zod_2 = require("zod");
const createAnnouncementSchema = zod_2.z.object({
    name: zod_2.z.string().min(1, "Title is required"),
    description: zod_2.z.string().min(1, "Content is required"),
    isAnnouncement: zod_2.z.boolean().default(true),
});
function AnnouncementsSection() {
    const { toast } = (0, use_toast_1.useToast)();
    const {} = (0, use_auth_1.useAuth)();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = (0, react_1.useState)(false);
    const apiClient = (0, api_client_1.createApiClient)();
    // Fetch announcements
    const { data: announcements = [], isLoading: isAnnouncementsLoading, error: announcementsError } = (0, react_query_1.useQuery)({
        queryKey: ['/api/announcements'],
        queryFn: () => apiClient.request('/api/announcements'),
        initialData: []
    });
    // Create announcement mutation (creates a group with isAnnouncement=true)
    const createAnnouncementMutation = (0, react_query_1.useMutation)({
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
            queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
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
            queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
        }
    });
    const form = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(createAnnouncementSchema),
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
    return (<div className="flex-1 overflow-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Announcements</h2>
        <dialog_1.Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <dialog_1.DialogTrigger asChild>
            <button_1.Button className="flex items-center">
              <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
              New Announcement
            </button_1.Button>
          </dialog_1.DialogTrigger>
          <dialog_1.DialogContent>
            <dialog_1.DialogHeader>
              <dialog_1.DialogTitle>Create Announcement</dialog_1.DialogTitle>
              <dialog_1.DialogDescription>
                Post a new company-wide announcement
              </dialog_1.DialogDescription>
            </dialog_1.DialogHeader>
            <form_1.Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <form_1.FormField control={form.control} name="name" render={({ field }) => (<form_1.FormItem>
                      <form_1.FormLabel>Title</form_1.FormLabel>
                      <form_1.FormControl>
                        <input_1.Input placeholder="Enter announcement title" {...field}/>
                      </form_1.FormControl>
                      <form_1.FormMessage />
                    </form_1.FormItem>)}/>
                <form_1.FormField control={form.control} name="description" render={({ field }) => (<form_1.FormItem>
                      <form_1.FormLabel>Content</form_1.FormLabel>
                      <form_1.FormControl>
                        <textarea_1.Textarea placeholder="Enter the announcement content" className="min-h-[100px]" {...field}/>
                      </form_1.FormControl>
                      <form_1.FormMessage />
                    </form_1.FormItem>)}/>
                <dialog_1.DialogFooter>
                  <button_1.Button type="submit" disabled={createAnnouncementMutation.isPending}>
                    {createAnnouncementMutation.isPending ? (<>
                        <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        Posting...
                      </>) : ("Post Announcement")}
                  </button_1.Button>
                </dialog_1.DialogFooter>
              </form>
            </form_1.Form>
          </dialog_1.DialogContent>
        </dialog_1.Dialog>
      </div>

      {isAnnouncementsLoading ? (<div className="flex justify-center items-center h-40">
          <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-primary"/>
        </div>) : announcementsError ? (<div className="text-center py-10 text-red-500">
          Error loading announcements: {announcementsError.message}. Please try again.
        </div>) : announcements.length > 0 ? (<div className="space-y-4">
          {announcements.map((announcement) => (<div key={announcement?.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">{announcement.name}</h3>
                <span className="text-xs text-gray-500">{getRelativeTime(announcement?.id)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{announcement.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center text-gray-500 text-sm">
                  <lucide_react_1.User className="h-4 w-4 mr-1"/>
                  Posted by {getDepartmentName(announcement.creatorId)}
                </div>
                <button_1.Button variant="link" className="text-primary p-0 h-auto">View Details</button_1.Button>
              </div>
            </div>))}
        </div>) : (<div className="text-center py-10">
          <div className="h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Announcements</h3>
          <p className="text-gray-500 mb-6">Create your first announcement to communicate with your company.</p>
          <button_1.Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center mx-auto">
            <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
            Create Announcement
          </button_1.Button>
        </div>)}
    </div>);
}
