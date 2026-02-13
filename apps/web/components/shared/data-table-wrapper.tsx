'use client';

import { motion } from 'motion/react';

import { DataTable } from '@kit/ui/enhanced-data-table';

interface DataTableWrapperProps<TData extends object> {
  data: TData[];
  columns: any[];
  pageSize?: number;
  pageIndex?: number;
  pageCount?: number;
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
}

export function DataTableWrapper<TData extends object>({
  data,
  columns,
  pageSize = 10,
  pageIndex = 0,
  pageCount,
  onPaginationChange,
}: DataTableWrapperProps<TData>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-lg border border-border bg-card"
    >
      <DataTable
        data={data}
        columns={columns}
        pageSize={pageSize}
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPaginationChange={onPaginationChange}
      />
    </motion.div>
  );
}
