import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export type TableAlign = 'left' | 'center' | 'right';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: TableAlign;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Array<TableColumn<T>>;
  rowKey: (row: T, index: number) => string;
  emptyState?: ReactNode;
  stickyHeader?: boolean;
  className?: string;
}

const alignStyles: Record<TableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Table<T>({
  data,
  columns,
  rowKey,
  emptyState,
  stickyHeader = false,
  className,
}: TableProps<T>) {
  return (
    <div className={cn('relative overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-card', className)}>
      <table className="min-w-full border-separate border-spacing-0">
        <thead className={cn('bg-neutral-50', stickyHeader && 'sticky top-0 z-10')}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-3 py-2 text-body-xs font-semibold uppercase tracking-wider text-neutral-700 border-b border-neutral-200',
                  alignStyles[col.align ?? 'left'],
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-body-sm text-neutral-700">
                {emptyState ?? 'No rows.'}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={rowKey(row, idx)} className="odd:bg-white even:bg-neutral-50/50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2 text-body-sm text-neutral-800 align-top',
                      alignStyles[col.align ?? 'left'],
                      col.className
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
