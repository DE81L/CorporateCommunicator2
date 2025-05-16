import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isonline: 0 | 1;
}

export default function ContactsSection() {
  const apiClient = createApiClient();
  const { user } = useAuth();
  const [q, setQ] = useState('');

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<User[]>({
    queryKey: ['contacts'],
    // гарантируем, что никогда не вернём undefined
    queryFn: async () =>
      (await apiClient.request<User[]>('/contacts', {
        credentials: 'include',
      })) ?? [],
  });

  const filtered = users.filter((u: User) => {
    if (u.id === user?.id) return false;
    const haystack = (
      u.firstName +
      ' ' +
      u.lastName +
      ' ' +
      u.username +
      ' ' +
      u.email
    ).toLowerCase();
    return haystack.includes(q.toLowerCase());
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="text-center py-10 text-red-500">
        Ошибка при загрузке контактов
      </div>
    );

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex mb-4 items-center gap-2">
        <Input
          placeholder="Поиск..."
          value={q}
          onChange={(c: React.ChangeEvent<HTMLInputElement>) =>
            setQ(c.target.value)
          }
          className="flex-1"
        />
        <Button variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
        <Button size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map((u: User) => (
          <Card key={u.id}>
            <CardContent className="p-3 flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {u.firstName.at(0)}
                  {u.lastName.at(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">
                  {u.firstName} {u.lastName}
                </span>
                <span className="text-xs text-muted-foreground">
                  @{u.username}
                </span>
              </div>
              {u.isonline === 1 && (
                <span className="ml-auto h-2 w-2 rounded-full bg-green-500" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
