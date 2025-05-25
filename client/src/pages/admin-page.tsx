import { useAuth } from '@/hooks/use-auth';
import { Redirect, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { createApiClient } from '@/lib/api-client';

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

  useEffect(() => {
    async function fetchTables() {
      try {
        const data = await apiClient.request<{ tables: string[] }>('/api/admin/tables');
        setTables(data?.tables ?? []);
      } catch (err) {
        setError((err as Error).message);
      }
    }
    fetchTables();
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

  async function saveRow(index: number) {
    try {
      setError(null);
      const row = editedRows[index];
      const data = await apiClient.request<{ rows: any[] }>(`/api/admin/table/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row }),
      });
      setRows(prev => {
        const copy = [...prev];
        copy[index] = row;
        return copy;
      });
    } catch (err) {
      setError((err as Error).message);
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
    }
  }

  if (!user) return <Redirect to="/auth" />;
  if (!user.isAdmin) return <Redirect to="/" />;

  const columns = rows.length ? Object.keys(rows[0]) : [];
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
            <CardTitle>Table Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <select
                className="border rounded p-2 flex-1"
                value={selectedTable}
                onChange={e => setSelectedTable(e.target.value)}
              >
                <option value="">Select table</option>
                {tables.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => setLocation('/')}>{t('common.back')}</Button>
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
                      <td className="px-3 py-2 text-center">
                        <Button size="sm" onClick={() => saveRow(rowIndex)}>Save</Button>
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
