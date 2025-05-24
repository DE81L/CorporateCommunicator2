import type { WikiEntry, InsertWikiEntry } from '@shared/schema/wiki';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { createApiClient } from "@/lib/api-client";

const api = createApiClient();
const API_BASE = "/wiki";

export function useWiki() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for fetching all wiki entries
  const { data: entries = [], isLoading: isLoadingEntries } = useQuery<WikiEntry[]>({
    queryKey: [API_BASE],
    queryFn: async () => api.request<WikiEntry[]>(API_BASE) as Promise<WikiEntry[]>,
  });

  // Query for fetching entries by category
  const getCategoryEntries = async (categoryId: number) => {
    return api.request<WikiEntry[]>(`${API_BASE}/categories/${categoryId}/entries`) as Promise<WikiEntry[]>;
  };

  // Mutation for creating entries
  const createEntry = useMutation({
    mutationFn: async (entry: InsertWikiEntry) =>
      api.request<WikiEntry>(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE] });
      toast({
        title: "Success",
        description: "Wiki entry created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Mutation for updating entries
  const updateEntry = useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<InsertWikiEntry> }) =>
      api.request<WikiEntry>(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE] });
      toast({
        title: "Success",
        description: "Wiki entry updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Mutation for deleting entries
  const deleteEntry = useMutation({
    mutationFn: async (id: number) =>
      api.request(`${API_BASE}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE] });
      toast({
        title: "Success", 
        description: "Wiki entry deleted successfully",
      });
    },
    onError: (error: Error) => {
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
