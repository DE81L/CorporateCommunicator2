import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Request } from "./requests-section";
import { useAuth } from "@/hooks/use-auth";
import { deleteRequest } from "@/api/requests";
import { useToast } from "@/hooks/use-toast";

interface Props {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (req: Request) => void;
  onDeleted: () => void;
}

export default function RequestDetailsDialog({ request, open, onOpenChange, onEdit, onDeleted }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!request) return;
    try {
      await deleteRequest(request.id);
      toast({ title: "Заявка удалена" });
      onOpenChange(false);
      onDeleted();
    } catch (err: any) {
      toast({ title: "Ошибка удаления", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Заявка #{request?.id}</DialogTitle>
          <DialogDescription>Детали заявки</DialogDescription>
        </DialogHeader>
        {request && (
          <div className="space-y-2">
            {request.createdAt && (
              <p><span className="font-medium">Дата:</span> {new Date(request.createdAt).toLocaleString()}</p>
            )}
            {request.task?.name && (
              <p><span className="font-medium">Задание:</span> {request.task.name}</p>
            )}
            {request.cabinet && (
              <p><span className="font-medium">Кабинет:</span> {request.cabinet}</p>
            )}
            {request.phone && (
              <p><span className="font-medium">Телефон:</span> {request.phone}</p>
            )}
            {request.deadline && (
              <p><span className="font-medium">Выполнить до:</span> {new Date(request.deadline).toLocaleString()}</p>
            )}
            {request.comment && (
              <p><span className="font-medium">Комментарий:</span> {request.comment}</p>
            )}
            {request.status && (
              <p><span className="font-medium">Статус:</span> {request.status}</p>
            )}
            {request.whoAccepted && (
              <p><span className="font-medium">Принял заявку:</span> {request.whoAccepted.firstName} {request.whoAccepted.lastName}</p>
            )}
          </div>
        )}
        <DialogFooter className="mt-4">
          {request && user?.id === request.senderId && (
            <>
              <Button variant="outline" onClick={() => onEdit(request)}>Редактировать</Button>
              <Button variant="destructive" onClick={handleDelete}>Удалить</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
