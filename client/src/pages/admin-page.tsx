import { useAuth } from '@/hooks/use-auth';
import { Redirect, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [editedRows, setEditedRows] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await fetch('/api/admin/tables');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error');
        setTables(data.tables);
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
        const res = await fetch(`/api/admin/table/${selectedTable}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error');
        setRows(data.rows);
        setEditedRows(data.rows);
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
      const res = await fetch(`/api/admin/table/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
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
      const res = await fetch('/api/admin/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setResult(data.rows);
    } catch (err) {
      setResult([]);
      setError((err as Error).message);
    }
  }

  if (!user) return <Redirect to="/auth" />;
  if (!user.isAdmin) return <Redirect to="/" />;

  const columns = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div className="min-h-screen flex flex-col items-center p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.admin')} Panel</h1>

      <div className="w-full flex items-center space-x-2">
        <select
          className="border p-2"
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
        <div className="overflow-auto w-full">
          <table className="min-w-full border">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col} className="border px-2 py-1 text-left">{col}</th>
                ))}
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {editedRows.map((row, rowIndex) => (
                <tr key={row.id ?? rowIndex}>
                  {columns.map(col => (
                    <td key={col} className="border px-2 py-1">
                      <Input
                        value={row[col] ?? ''}
                        onChange={e => handleChange(rowIndex, col, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="border px-2 py-1 text-center">
                    <Button size="sm" onClick={() => saveRow(rowIndex)}>Save</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="w-full mt-4">
        <textarea
          className="w-full border p-2 mb-2"
          rows={4}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="flex space-x-2 mb-4">
          <Button onClick={runQuery}>Run Query</Button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-2">{error}</p>}
      {result.length > 0 && (
        <pre className="w-full bg-gray-100 p-2 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
