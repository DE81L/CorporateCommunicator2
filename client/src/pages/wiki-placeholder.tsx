import { useTranslation } from 'react-i18next';

export default function WikiPlaceholder() {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">📚 Wiki</h1>
        <p className="text-gray-600">
          This feature is temporarily unavailable.
        </p>
      </div>
    </div>
  );
}
