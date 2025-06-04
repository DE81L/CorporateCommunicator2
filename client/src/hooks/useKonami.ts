import { useEffect, useState } from 'react';

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
  'Enter',
];

export function useKonami() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let index = 0;
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === KONAMI_SEQUENCE[index] || key.toLowerCase() === KONAMI_SEQUENCE[index]) {
        index += 1;
        if (index === KONAMI_SEQUENCE.length) {
          setActive(true);
          index = 0;
        }
      } else {
        index = 0;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return active;
}
