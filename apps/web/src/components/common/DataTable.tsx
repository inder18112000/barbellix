import type { ReactNode } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyState?: ReactNode
}

/** Thin wrapper over the raw shadcn table primitives - MembersPage.tsx's roster table (and every
 * future admin list page) was hand-rolling this header/row/cell loop each time. Filtering/sorting
 * stays with the caller; this just renders whatever rows it's handed. */
export function DataTable<T>({ columns, data, getRowKey, onRowClick, emptyState }: DataTableProps<T>) {
  if (data.length === 0 && emptyState) return <>{emptyState}</>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key} className={col.className}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={getRowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(onRowClick && 'cursor-pointer')}
          >
            {columns.map((col) => (
              <TableCell key={col.key} className={col.className}>{col.render(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
