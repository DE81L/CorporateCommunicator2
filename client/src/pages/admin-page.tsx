import { useAuth } from '@/hooks/use-auth';
import { Redirect, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  if (!user) return <Redirect to="/auth" />;
  if (!user.isAdmin) return <Redirect to="/" />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">{t('nav.admin')} Panel</h1>
      <p className="text-gray-600 mb-6">This area is under construction.</p>
      <Button onClick={() => setLocation('/')}>{t('common.back')}</Button>
    </div>
  );
}
