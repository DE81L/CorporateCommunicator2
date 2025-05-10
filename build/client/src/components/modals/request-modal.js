"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RequestModal;
const dialog_1 = require("@/components/ui/dialog");
function RequestModal({ isOpen, onClose, title, children, }) {
    return (<dialog_1.Dialog open={isOpen} onOpenChange={onClose}>
      <dialog_1.DialogContent>
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>{title}</dialog_1.DialogTitle>
        </dialog_1.DialogHeader>
        {children}
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
