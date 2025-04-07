import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Group } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Plus, Users } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  isAnnouncement: z.boolean().default(false),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export default function GroupsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);

  // Fetch groups
  const {
    data: groups,
    isLoading: isLoadingGroups,
    error: groupsError,
  } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  // Fetch all users for adding to groups
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupFormValues) => {
      const res = await apiRequest("POST", "/api/groups", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsCreateGroupDialogOpen(false);
      toast({
        title: "Group created",
        description: "Your new group has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      isAnnouncement: false,
    },
  });

  const onSubmit = (data: CreateGroupFormValues) => {
    createGroupMutation.mutate(data);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Groups</h2>
        <Dialog
          open={isCreateGroupDialogOpen}
          onOpenChange={setIsCreateGroupDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new group to collaborate with your team members.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter group name" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the purpose of this group"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isAnnouncement"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Announcement Channel</FormLabel>
                        <FormDescription>
                          Make this an announcement-only channel
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createGroupMutation.isPending}
                  >
                    {createGroupMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Group"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingGroups ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : groupsError ? (
        <div className="text-center py-10 text-red-500">
          Error loading groups. Please try again.
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className={`h-24 flex items-center justify-center ${
                  group.isAnnouncement ? "bg-secondary-100" : "bg-primary-100"
                }`}
              >
                <Users
                  className={`h-12 w-12 ${
                    group.isAnnouncement
                      ? "text-secondary-600"
                      : "text-primary-600"
                  }`}
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {group.description}
                  </p>
                )}
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    <Avatar className="h-6 w-6 border border-white">
                      <AvatarFallback className="text-xs bg-blue-100">
                        A
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border border-white">
                      <AvatarFallback className="text-xs bg-green-100">
                        B
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border border-white">
                      <AvatarFallback className="text-xs bg-yellow-100">
                        C
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border border-white">
                      <AvatarFallback className="text-xs bg-purple-100">
                        +2
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <Button variant="link" className="text-primary p-0 h-auto">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Groups Found</h3>
          <p className="text-gray-500 mb-6">
            Create your first group to start collaborating with your team.
          </p>
          <Button
            onClick={() => setIsCreateGroupDialogOpen(true)}
            className="flex items-center mx-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>
      )}
    </div>
  );
}
