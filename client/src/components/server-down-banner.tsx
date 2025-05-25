import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  onReload: () => void
}

export default function ServerDownBanner({ onReload }: Props) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center p-2">
      <Alert variant="destructive" className="flex items-center gap-4 max-w-md">
        <div>
          <AlertTitle>Сервер не отвечает</AlertTitle>
          <AlertDescription>Попробуйте обновить страницу</AlertDescription>
        </div>
        <Button onClick={onReload}>Перезагрузить страницу</Button>
      </Alert>
    </div>
  )
}
