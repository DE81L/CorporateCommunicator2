import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, Plus, Users, Eye, Pencil, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useElectron } from "@/hooks/use-electron";
import { useWebSocket } from "@/hooks/useWebSocket";
import { queryClient } from "@/lib/queryClient";
import { createApiClient } from "@/lib/api-client";
import { showError } from "@/lib/error-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import GroupChatSection from "@/pages/group-chat-section";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  isAnnouncement: z.boolean().default(false),
});
type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

const getInitials = (f: string, l: string) => `${f[0] || ''}${l[0] || ''}`.toUpperCase();

function GroupCard({
  group,
  onView,
  onEdit,
  onDelete,
  onInvite,
}: {
  group: Group;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onInvite: () => void;
}) {
  const apiClient = createApiClient();
  const { t } = useTranslation();
  const { data: members = [] } = useQuery<User[]>({
    queryKey: ["group-members", group.id],
    queryFn: async (): Promise<User[]> =>
      (await apiClient.request<User[]>(`/api/groups/${group.id}/users`)) ?? [],
  });

  const visible = members.slice(0, 3);
  const extra = members.length - visible.length;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div
        className={`h-24 flex items-center justify-center ${
          group.isAnnouncement ? "bg-secondary-100" : "bg-primary-100"
        }`}
      >
        <Users
          className={`h-12 w-12 ${
            group.isAnnouncement ? "text-secondary-600" : "text-primary-600"
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
            {visible.map((m) => (
              <Avatar key={m.id} className="h-6 w-6 border border-white">
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="text-xs">
                    {getInitials(m.firstName, m.lastName)}
                  </AvatarFallback>
                )}
              </Avatar>
            ))}
            {extra > 0 && (
              <Avatar className="h-6 w-6 border border-white">
                <AvatarFallback className="text-xs bg-muted">
                  +{extra}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <TooltipProvider delayDuration={0}>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={onView}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.view')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" onClick={onEdit}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.edit')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="destructive" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.delete')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={onInvite}>
                    <Users className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('groups.inviteToGroup')}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
export function GroupsSection() {
  const apiClient = createApiClient();
  const { lastRawMessage } = useWebSocket();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteGroupId, setInviteGroupId] = useState<number | null>(null);
  const [inviteUserId, setInviteUserId] = useState<number | null>(null);
  // Загружаем группы
  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    error: groupsError
  } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    queryFn: async (): Promise<Group[]> => {
      const groups = (await apiClient.request<Group[]>('/api/groups')) ?? [];
      return groups;
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/contacts'],
    queryFn: async (): Promise<User[]> =>
      (await apiClient.request<User[]>('/api/contacts')) ?? [],
  });

  useEffect(() => {
    if (lastRawMessage && (lastRawMessage as any).type === 'group-created') {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    }
  }, [lastRawMessage]);
  // Мутация создания группы
  const createGroupMutation = useMutation({
    mutationFn: (data: CreateGroupFormValues) =>
      apiClient.request("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
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
  const updateGroupMutation = useMutation({
     mutationFn: async ({ id, data }: { id: number; data: Partial<Group> }) => {
      return await apiClient.request(`/api/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });
  const deleteGroupMutation = useMutation({
      mutationFn: async (id: number) => {
        return await apiClient.request(`/api/groups/${id}`, {
          method: "DELETE"
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });

  const inviteMutation = useMutation<void, Error, { groupId: number; userId: number }>({
    mutationFn: ({ groupId, userId }) =>
      apiClient.request(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
      setInviteOpen(false);
      setInviteGroupId(null);
      setInviteUserId(null);
      toast({ title: t('groups.inviteToGroup'), description: 'Invite sent' });
    },
    onError: (err: Error) => {
      showError(err, 'Failed to invite');
    },
  });
  const createGroup = (data: CreateGroupFormValues) => {
    createGroupMutation.mutate(data);
  };
  const updateGroup = async (id: number, data: Partial<Group>) => {
    updateGroupMutation.mutate({ id, data });
  };
  const deleteGroup = async (id: number) => {
    deleteGroupMutation.mutate(id);
  };
  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      isAnnouncement: false,
    },
  });

  const onSubmit = (data: CreateGroupFormValues) => {
    createGroup(data);
  };
  if (selectedGroup) {
    return (
      <div className="flex-1 overflow-auto">
        <Button className="m-2" variant="ghost" onClick={() => setSelectedGroup(null)}>
          {t('common.back', 'Back')}
        </Button>
        <GroupChatSection group={selectedGroup} />
      </div>
    );
  }

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
                        {t('auth.pleaseWait')}
                      </>
                    ) : (
                      t('groups.createGroup')
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
          {t('groups.errorLoading', 'Error loading groups. Please try again.')}
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onView={() => setSelectedGroup(group)}
              onEdit={() =>
                updateGroup(group.id, {
                  name: `Updated Name ${group.id}`,
                  description: `Updated Description ${group.id}`,
                })
              }
              onDelete={() => deleteGroup(group.id)}
              onInvite={() => {
                setInviteGroupId(group.id);
                setInviteOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">{t('groups.noGroups')}</h3>
          <p className="text-gray-500 mb-6">{t('groups.addFirst')}</p>
          <Button
            onClick={() => setIsCreateGroupDialogOpen(true)}
            className="flex items-center mx-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('groups.createGroup')}
          </Button>
        </div>
      )}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('groups.inviteToGroup')}</DialogTitle>
          </DialogHeader>
          <Select
            value={inviteUserId ? inviteUserId.toString() : ''}
            onValueChange={(v) => setInviteUserId(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('groups.selectUser', 'Select user')} />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={() => {
                if (inviteGroupId && inviteUserId) {
                  inviteMutation.mutate({ groupId: inviteGroupId, userId: inviteUserId });
                }
              }}
              disabled={!inviteGroupId || !inviteUserId || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
