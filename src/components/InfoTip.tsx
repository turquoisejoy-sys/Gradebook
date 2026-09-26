'use client';

import { useState, useRef, useEffect } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface InfoTipProps {
  text: string;
  label?: string;
  /** Wider popup for longer reminders (e.g. import instructions). */
  wide?: boolean;
}

/** Small “?” control with a short reminder on click/hover. */
export default function InfoTip({ text, label = 'Help', wide = false }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex align-middle print:hidden">
      <button
        type="button"
        className="p-0.5 text-gray-400 hover:text-[var(--cace-teal)] rounded-full"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <QuestionMarkCircleIcon className="w-4 h-4" />
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute z-20 left-1/2 -translate-x-1/2 top-full mt-1 rounded-lg bg-[var(--cace-navy)] text-white text-xs leading-snug px-3 py-2 shadow-lg ${
            wide ? 'w-72 sm:w-80' : 'w-56 sm:w-64'
          }`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
