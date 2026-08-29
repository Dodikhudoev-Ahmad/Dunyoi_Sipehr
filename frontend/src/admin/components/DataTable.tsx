import type { ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useScrollShadow } from '@/admin/hooks/useScrollShadow'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  sort?: string
  dir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  /** Extra classes for a specific row — e.g. flagging an overdue follow-up. */
  rowClassName?: (row: T) => string | undefined
}

export function DataTable<T>({ columns, rows, rowKey, sort, dir, onSort, rowClassName }: DataTableProps<T>) {
  const { ref, canScrollLeft, canScrollRight } = useScrollShadow<HTMLDivElement>()

  return (
    <div className="relative">
      <div ref={ref} className="overflow-x-auto rounded-xl border border-text/10 bg-elevated">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-text/10 text-xs uppercase tracking-wide text-slate">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                {col.sortable && onSort ? (
                  <button className="flex items-center gap-1 hover:text-text" onClick={() => onSort(col.key)}>
                    {col.header}
                    {sort === col.key && (dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={cn('border-b border-text/5 last:border-0 hover:bg-text/2', rowClassName?.(row))}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-middle">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-6 rounded-l-xl bg-gradient-to-r from-elevated to-transparent transition-opacity',
          canScrollLeft ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-6 rounded-r-xl bg-gradient-to-l from-elevated to-transparent transition-opacity',
          canScrollRight ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}
