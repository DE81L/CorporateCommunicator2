import {
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
}

export default function RequestModal({
  isOpen,
  onClose,
  title,
  children,
}: RequestModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}