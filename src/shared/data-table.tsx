import type { ReactNode } from 'react';
/** A semantic, focusable scroll region. Keep domain rows/columns at the call site. */
export function DataTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label={label}>
      <table>
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </div>
  );
}
