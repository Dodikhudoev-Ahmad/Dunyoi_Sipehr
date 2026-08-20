import type { ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

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
}

export function DataTable<T>({ columns, rows, rowKey, sort, dir, onSort }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-text/10 bg-elevated">
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
            <tr key={rowKey(row)} className="border-b border-text/5 last:border-0 hover:bg-text/2">
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
  )
}
