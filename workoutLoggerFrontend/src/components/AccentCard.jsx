import React from 'react';

/**
 * Shared "accent card": a clay gradient bar across the top plus a subtle hover lift.
 * The common card look used on the session screen and dashboard.
 *
 * - `className` styles the outer card (e.g. flex / height helpers).
 * - `contentClassName` styles the padded content area (default `p-6`; pass `p-5` or
 *   extra layout classes as needed).
 */
export default function AccentCard({ className = '', contentClassName = 'p-6', children, ...props }) {
  return (
    <div
      className={`group overflow-hidden rounded-2xl bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}
      {...props}
    >
      <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-clay via-clay-hover to-clay" />
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
