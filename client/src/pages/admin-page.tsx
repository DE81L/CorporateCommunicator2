import { useAuth } from '@/hooks/use-auth';
import { Redirect, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">{t('nav.admin')} Panel</h1>
      <textarea
        className="w-full border p-2 mb-2"
        rows={4}
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <div className="flex space-x-2 mb-4">
        <Button onClick={runQuery}>Run Query</Button>
        <Button variant="secondary" onClick={() => setLocation('/')}>{t('common.back')}</Button>
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
