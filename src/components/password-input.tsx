'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Password input with show/hide toggle. `className="input"` already applied. */
export function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className="input pr-10" />
      <button type="button" onClick={() => setShow((v) => !v)} tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
        aria-label={show ? 'Hide password' : 'Show password'} title={show ? 'Hide' : 'Show'}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
