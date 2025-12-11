import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import React, { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: string;
  timestamp: string;
  card_uid: string;
  amount: number;
  description: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  loading?: boolean;
  className?: string;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  loading = false,
  className = "",
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Transaction, string | number>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: () => (
          <span className="cursor-pointer text-rose-600">Date</span>
        ),
        cell: (info) => new Date(info.getValue<string>()).toLocaleString(),
      },
      {
        accessorKey: "card_uid",
        header: () => (
          <span className="cursor-pointer text-rose-600">Card UID</span>
        ),
        cell: (info) => <span className="font-mono">{info.getValue()}</span>,
      },
      {
        accessorKey: "amount",
        header: () => (
          <span className="cursor-pointer text-rose-600">Amount</span>
        ),
        cell: (info) => `$${Number(info.getValue()).toFixed(2)}`,
      },
      {
        accessorKey: "description",
        header: () => (
          <span className="cursor-pointer text-rose-600">Description</span>
        ),
        cell: (info) => info.getValue(),
      },
    ],
    []
  );

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      // Filter by card_uid, description, or amount
      const value = row.getValue(columnId);
      if (typeof value === "number") {
        return value.toString().includes(filterValue);
      }
      if (typeof value === "string") {
        return value.toLowerCase().includes(filterValue.toLowerCase());
      }
      return false;
    },
    debugTable: false,
  });

  return (
    <div
      className={`border-2 border-gray-300 rounded-xl bg-white shadow-lg overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <Input
          placeholder="Search transactions..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs input-styled text-base"
        />
      </div>
      <div className="max-h-80 overflow-y-auto">
        <Table>
          <TableCaption>A list of your recent transactions.</TableCaption>
          <TableHeader>
            <TableRow>
              {table.getHeaderGroups()[0].headers.map((header) => (
                <TableHead
                  key={header.id}
                  onClick={
                    header.column.getCanSort()
                      ? header.column.getToggleSortingHandler()
                      : undefined
                  }
                  className={`select-none ${
                    header.column.getCanSort()
                      ? "cursor-pointer hover:text-rose-700 transition-colors duration-200"
                      : ""
                  }`}
                  aria-sort={
                    header.column.getIsSorted()
                      ? header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getIsSorted() === "asc" && <span> ▲</span>}
                  {header.column.getIsSorted() === "desc" && <span> ▼</span>}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-4"
                >
                  <span className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin inline-block" />
                  <span className="ml-2">Loading...</span>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-500"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
