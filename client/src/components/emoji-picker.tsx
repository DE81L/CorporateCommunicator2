import { useEffect, useRef } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const emojis = [
    '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😍','😘','😜','🤔','🤩','😎','😭','😡','👍','🙏','🎉','💯'
  ];

  return (
    <div
      ref={ref}
      className="absolute bottom-12 left-2 bg-popover border border-border rounded shadow-md p-2 grid grid-cols-8 gap-1 z-10"
    >
      {emojis.map((e) => (
        <button
          key={e}
          type="button"
          className="text-xl w-8 h-8 flex items-center justify-center hover:bg-muted rounded emoji-text"
          onClick={() => {
            onSelect(e);
            onClose?.();
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
