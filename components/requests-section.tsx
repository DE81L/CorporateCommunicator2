import React, { useState } from "react";
import RequestModal from "@/pages/request-modal";

export default function RequestsSection() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <h1>Requests</h1>

      <button onClick={() => setOpen(true)}>New request</button>

      <RequestModal
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          // TODO: invalidate react-query etc.
          setOpen(false);
        }}
      />
    </div>
  );
}
