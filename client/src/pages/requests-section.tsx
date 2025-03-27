import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Request, User } from "@shared/schema";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

const createRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  assigneeId: z.string().optional(),
});

type CreateRequestFormValues = z.infer<typeof createRequestSchema>;

export default function RequestsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Fetch user's own requests
  const { 
    data: myRequests,
    isLoading: isLoadingMyRequests,
    error: myRequestsError
  } = useQuery<Request[]>({
    queryKey: ['/api/requests'],
  });
  
  // Fetch requests assigned to the user
  const { 
    data: assignedRequests,
    isLoading: isLoadingAssigned,
    error: assignedError
  } = useQuery<Request[]>({
    queryKey: ['/api/requests/assigned'],
  });
  
  // Fetch all users for the assignee dropdown
  const { 
    data: users,
    isLoading: isLoadingUsers
  } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: CreateRequestFormValues) => {
      const assigneeId = data.assigneeId ? parseInt(data.assigneeId) : undefined;
      const res = await apiRequest("POST", "/api/requests", {
        title: data.title,
        description: data.description,
        assigneeId
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Request created",
        description: "Your request has been submitted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update request status mutation
  const updateRequestStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/requests/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/requests/assigned'] });
      toast({
        title: "Status updated",
        description: "The request status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const form = useForm<CreateRequestFormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      assigneeId: undefined,
    },
  });
  
  const onSubmit = (data: CreateRequestFormValues) => {
    createRequestMutation.mutate(data);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="pending">Pending</Badge>;
      case 'in-progress':
        return <Badge variant="inProgress">In Progress</Badge>;
      case 'completed':
        return <Badge variant="completed">Approved</Badge>;
      case 'denied':
        return <Badge variant="denied">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Requests</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Request</DialogTitle>
              <DialogDescription>
                Submit a new request for approval
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter request title" {...field} />
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
                          placeholder="Provide details about your request"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To (Optional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a person to assign" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingUsers ? (
                            <div className="flex justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : users ? (
                            users
                              .filter(u => u.id !== user?.id) // Filter out current user
                              .map(u => (
                                <SelectItem 
                                  key={u.id} 
                                  value={u.id.toString()}
                                >
                                  {u.firstName} {u.lastName}
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="" disabled>No users available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createRequestMutation.isPending}
                  >
                    {createRequestMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="your-requests" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="your-requests">Your Requests</TabsTrigger>
          <TabsTrigger value="assigned-requests">To Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="your-requests">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
              <h3 className="font-medium">Your Requests</h3>
            </div>
            
            {isLoadingMyRequests ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myRequestsError ? (
              <div className="p-4 text-center text-red-500">
                Error loading your requests. Please try again.
              </div>
            ) : myRequests && myRequests.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {myRequests.map(request => (
                  <div key={request.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{request.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Submitted on {format(new Date(request.createdAt), 'MMMM d, yyyy')}
                      </span>
                      <Button variant="link" size="sm" className="h-auto p-0">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium mb-1">No Requests Found</h4>
                <p className="text-gray-500 mb-4">You haven't submitted any requests yet</p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex items-center mx-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Request
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="assigned-requests">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
              <h3 className="font-medium">Requests to Review</h3>
            </div>
            
            {isLoadingAssigned ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : assignedError ? (
              <div className="p-4 text-center text-red-500">
                Error loading assigned requests. Please try again.
              </div>
            ) : assignedRequests && assignedRequests.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {assignedRequests.map(request => (
                  <div key={request.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{request.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Submitted on {format(new Date(request.createdAt), 'MMMM d, yyyy')}
                      </span>
                      <div className="space-x-2">
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                              onClick={() => updateRequestStatusMutation.mutate({
                                id: request.id,
                                status: 'completed'
                              })}
                              disabled={updateRequestStatusMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => updateRequestStatusMutation.mutate({
                                id: request.id,
                                status: 'denied'
                              })}
                              disabled={updateRequestStatusMutation.isPending}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button variant="link" size="sm" className="h-auto p-0">
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium mb-1">No Requests to Review</h4>
                <p className="text-gray-500">You don't have any requests assigned to you</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
