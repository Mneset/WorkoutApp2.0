import React from 'react';

export default function Card({ className = '', ...props }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-sm ${className}`}
      {...props}
    />
  );
}
