import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useForm, } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

type CreateAnnouncementFormValues = z.infer<typeof createAnnouncementSchema>;

export default function AnnouncementsSection() {
  const { toast } = useToast();
  const { } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Fetch announcements
  const {
    isLoading: isAnnouncementsLoading,
    error: announcementsError, data,
  } = useQuery({
    queryKey: ['/api/announcements'], queryFn: async () => {
      // const response = await fetch("/api/groups?isAnnouncement=true");
      //   if (!response.ok) {
      //   throw new Error("Failed to fetch announcements");
      // }    
      // return await response.json();
      return [];
    }
  });
  
  // Create announcement mutation (creates a group with isAnnouncement=true)
    const createAnnouncementMutation = useMutation({
      
      mutationFn: async (data: CreateAnnouncementFormValues) => {
        
          await fetch("/api/groups", {
           //  method: "POST",
           //  headers: {
           //    "Content-Type": "application/json",
           //  },
           //  body: JSON.stringify(data),
          });
           return null
          
      },
      
      onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
        setIsCreateDialogOpen(false);
        toast({
          title: "Announcement created",
          description: "Your announcement has been posted successfully.",
        });
      },
      onError: (error: Error): void => {
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

  const form = useForm<CreateAnnouncementFormValues>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      name: "",
      description: "",
      isAnnouncement: true,
    },
  });
  
  const onSubmit = (data: CreateAnnouncementFormValues) => {
    createAnnouncementMutation.mutate(data);
  };

  useEffect(()=> {
    if(data){
      setAnnouncements(data);
    }
  },[data])
  if (announcementsError) {
      console.error("Error fetching announcements:", announcementsError);
  }
  

  // Mock function to get department name for demo
  const getDepartmentName = (id: number) => {
    const departments = ["HR Department", "Executive Team", "Marketing Team", "Engineering Team"];
    return departments[id % departments.length];
  };

  // Mock function to get post date for demo
  const getRelativeTime = (id: number) => {
    const times = ["2 hours ago", "Yesterday", "2 days ago", "Last week"];
    return times[id % times.length];
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Announcements</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>
                Post a new company-wide announcement
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter announcement title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the announcement content"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createAnnouncementMutation.isPending}
                  >
                    {createAnnouncementMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Announcement"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isAnnouncementsLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : announcementsError ? (
        <div className="text-center py-10 text-red-500">
          Error loading announcements: {announcementsError.message}. Please try again.
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement: any) => (
            <div key={announcement?.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">{announcement.name}</h3>
                <span className="text-xs text-gray-500">{getRelativeTime(announcement?.id)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{announcement.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center text-gray-500 text-sm">
                  <User className="h-4 w-4 mr-1" />
                  Posted by {getDepartmentName(announcement.creatorId)}
                </div>
                <Button variant="link" className="text-primary p-0 h-auto">View Details</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Announcements</h3>
          <p className="text-gray-500 mb-6">Create your first announcement to communicate with your company.</p>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center mx-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Button>
        </div>
      )}
    </div>
  );
}