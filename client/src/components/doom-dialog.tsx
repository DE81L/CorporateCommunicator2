import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DoomDialog({ open, onOpenChange }: DoomDialogProps) {
  const doomPath = "/literal_copy_of_doom/doom-wasm/index.html";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 w-full max-w-3xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>DOOM</DialogTitle>
        </DialogHeader>
        <iframe src={doomPath} title="DOOM" className="w-full h-full" />
      </DialogContent>
    </Dialog>
  );
}
