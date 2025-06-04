import { useAuth } from '@/hooks/use-auth';
import { Redirect, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import { createApiClient } from '@/lib/api-client';
import { showError } from '@/lib/error-toast';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [editedRows, setEditedRows] = useState<any[]>([]);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const apiClient = createApiClient();

  const [users, setUsers] = useState<any[]>([]);

  const [newUser, setNewUser] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isAdmin: false,
  });

  useEffect(() => {
    async function fetchTables() {
      try {
        const data = await apiClient.request<{ tables: string[] }>('/api/admin/tables');
        setTables(data?.tables ?? []);
      } catch (err) {
        setError((err as Error).message);
        showError(err);
      }
    }
    fetchTables();

    async function fetchUsers() {
      try {
        const data = await apiClient.request<{ users: any[] }>('/api/admin/users');
        setUsers(data?.users ?? []);
      } catch (err) {
        showError(err);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchRows() {
      if (!selectedTable) return;
      try {
        const data = await apiClient.request<{ rows: any[] }>(`/api/admin/table/${selectedTable}`);
        setRows(data?.rows ?? []);
        setEditedRows(data?.rows ?? []);
      } catch (err) {
        setRows([]);
        setEditedRows([]);
        setError((err as Error).message);
        showError(err);
      }
    }
    fetchRows();
  }, [selectedTable]);

  function handleChange(rowIndex: number, key: string, value: string) {
    setEditedRows(prev => {
      const copy = [...prev];
      copy[rowIndex] = { ...copy[rowIndex], [key]: value };
      return copy;
    });
  }

  function addRow() {
    const empty: any = {};
    columns.forEach(c => {
      if (c !== 'id') empty[c] = '';
    });
    setEditedRows(prev => [...prev, empty]);
  }

  async function deleteRow(index: number) {
    try {
      const row = editedRows[index];
      if (row.id !== undefined && row.id !== null && row.id !== '') {
        await apiClient.request(`/api/admin/table/${selectedTable}/${row.id}`, {
          method: 'DELETE',
        });
      }
      setRows(prev => prev.filter((_, i) => i !== index));
      setEditedRows(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      showError(err);
    }
  }

  async function saveRow(index: number) {
    try {
      setError(null);
      const row = editedRows[index];
      if (row.id === undefined || row.id === null || row.id === '') {
        const data = await apiClient.request<{ row: any }>(
          `/api/admin/table/${selectedTable}/insert`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ row }),
          }
        );
        const newRow = data?.row ?? row;
        setRows(prev => [...prev, newRow]);
        setEditedRows(prev => {
          const copy = [...prev];
          copy[index] = newRow;
          return copy;
        });
      } else {
        await apiClient.request(`/api/admin/table/${selectedTable}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ row }),
        });
        setRows(prev => {
          const copy = [...prev];
          copy[index] = row;
          return copy;
        });
      }
    } catch (err) {
      setError((err as Error).message);
      showError(err);
    }
  }

  async function runQuery() {
    try {
      setError(null);
      const data = await apiClient.request<{ rows: any[] }>('/api/admin/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      setResult(data?.rows ?? []);
    } catch (err) {
      setResult([]);
      setError((err as Error).message);
      showError(err);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      await apiClient.request('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      setNewUser({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        isAdmin: false,
      });
      const data = await apiClient.request<{ users: any[] }>('/api/admin/users');
      setUsers(data?.users ?? []);
    } catch (err) {
      setError((err as Error).message);
      showError(err);
    }
  }

  async function setUserAdmin(id: number, isAdmin: boolean) {
    try {
      await apiClient.request(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin }),
      });
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, isAdmin } : u)));
    } catch (err) {
      showError(err);
    }
  }

  if (!user) return <Redirect to="/auth" />;
  if (!user.isAdmin) return <Redirect to="/" />;

  const columns = useMemo(() => (rows.length ? Object.keys(rows[0]) : []), [rows]);
  function handleResize(index: number, startX: number) {
    const startWidth = columnWidths[index] ?? 150;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      setColumnWidths(prev => {
        const copy = [...prev];
        copy[index] = Math.max(50, startWidth + delta);
        return copy;
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }
  useEffect(() => {
    setColumnWidths(columns.map(() => 150));
  }, [columns]);

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">
          {t('nav.admin')} Panel
        </h1>

        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Create User</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-2" onSubmit={createUser}>
              <Input
                placeholder="Username"
                value={newUser.username}
                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
              />
              <Input
                placeholder="First name"
                value={newUser.firstName}
                onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
              />
              <Input
                placeholder="Last name"
                value={newUser.lastName}
                onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
              />
              <Input
                placeholder="Email"
                value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newUser.isAdmin}
                  onChange={e => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                />
                <span>Admin</span>
              </label>
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-primary-100 dark:bg-primary-900/30">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-semibold">ID</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold">Username</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold">Email</th>
                  <th className="px-3 py-2 text-center text-sm font-semibold">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u.id} className="odd:bg-background">
                    <td className="px-3 py-2">{u.id}</td>
                    <td className="px-3 py-2">{u.username}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2 text-center">
                      <Checkbox
                        checked={u.isAdmin}
                        onCheckedChange={checked =>
                          setUserAdmin(u.id, checked === true)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Table Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map(t => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="secondary" onClick={() => setLocation('/')}>{t('common.back')}</Button>
              {selectedTable && (
                <Button variant="outline" onClick={addRow}>{t('common.create')}</Button>
              )}
            </div>

            {selectedTable && (
              <div className="overflow-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-primary-100 dark:bg-primary-900/30">
                  <tr>
                    {columns.map((col, i) => (
                      <th
                        key={col}
                        style={{ width: columnWidths[i] }}
                        className="relative px-3 py-2 text-left text-sm font-semibold"
                      >
                        {col}
                        <div
                          onMouseDown={e => handleResize(i, e.clientX)}
                          className="absolute top-0 right-0 h-full w-1 cursor-col-resize"
                        />
                      </th>
                    ))}
                    <th className="px-3 py-2 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {editedRows.map((row, rowIndex) => (
                    <tr key={row.id ?? rowIndex} className="odd:bg-background">
                      {columns.map((col, i) => (
                        <td key={col} style={{ width: columnWidths[i] }} className="px-3 py-2">
                          <Input
                            value={row[col] ?? ''}
                            onChange={e => handleChange(rowIndex, col, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 space-x-2 text-center">
                        <Button size="sm" onClick={() => saveRow(rowIndex)}>{t('common.save')}</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteRow(rowIndex)}>{t('common.delete')}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </CardContent>
        </Card>

        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>SQL Query</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button onClick={runQuery}>Run Query</Button>
            </div>

          {error && <p className="text-red-600">{error}</p>}
          {result.length > 0 && (
            <pre className="w-full bg-gray-100 dark:bg-primary-900/30 p-2 overflow-auto whitespace-pre-wrap rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
