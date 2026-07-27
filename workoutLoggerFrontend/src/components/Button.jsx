import React from 'react';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-55 disabled:cursor-default';

const variants = {
  primary: 'bg-clay text-white hover:bg-clay-hover px-5 py-3',
  outline: 'bg-surface border border-line-strong text-ink hover:border-muted px-5 py-3',
  ghost: 'text-muted hover:text-ink px-3 py-2',
  danger: 'text-muted hover:text-danger px-3 py-2',
};

export default function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
