// client/src/contacts-section.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
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
  const { user } = useAuth();
  const [q, setQ] = useState('');

  const { data: users, isLoading, error } = useQuery<User[]> ({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await apiClient.request<User[]>('/contacts', {
        credentials: 'include',
      });
      return res ?? [];
    },
  });

  const filtered = (users ?? []).filter(
    (u) =>
      u.id !== user?.id &&
      (u.firstName + ' ' + u.lastName + ' ' + u.username + ' ' + u.email)
        .toLowerCase()
        .includes(q.toLowerCase())
  );

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
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Контакты</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск…"
            />
          </div>
          <Button>
            <Plus className="mr-1 h-4 w-4" /> Добавить
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500">Нет контактов</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow">
              <CardContent className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {c.firstName[0]}
                    {c.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-sm text-gray-500">@{c.username}</p>
                    </div>
                    {/* Индикатор статуса */}
                    <span
                      className={`h-3 w-3 rounded-full ${
                        c.isonline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      title={c.isonline ? 'online' : 'offline'}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{c.email}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}