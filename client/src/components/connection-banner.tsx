import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  onReconnect: () => void
}

export default function ConnectionBanner({ onReconnect }: Props) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center p-2">
      <Alert variant="destructive" className="flex items-center gap-4 max-w-md">
        <div>
          <AlertTitle>Связь с сервером потеряна</AlertTitle>
          <AlertDescription>Попробуйте переподключиться</AlertDescription>
        </div>
        <Button onClick={onReconnect}>Переподключиться</Button>
      </Alert>
    </div>
  )
}
