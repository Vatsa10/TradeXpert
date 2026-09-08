"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  /** Stable identifier; also the sort key. */
  key: string;
  header: React.ReactNode;
  /** Cell renderer. Return an em dash yourself, or use Money/Percent/Delta. */
  cell: (row: T, index: number) => React.ReactNode;
  align?: "left" | "right" | "center";
  /** Right-align + tabular numerals. Shorthand for a figures column. */
  numeric?: boolean;
  sortable?: boolean;
  /** Comparable value for sorting. Without it the column cannot sort. */
  sortValue?: (row: T) => number | string | null | undefined;
  /** CSS width, e.g. "9rem". */
  width?: string;
  /** Hide below this breakpoint to keep narrow screens readable. */
  hideBelow?: "sm" | "md" | "lg";
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Stable React key per row. */
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  /** Freeze the first column while the rest scrolls horizontally. */
  stickyFirstColumn?: boolean;
  /** Sticky header row. Pair with maxHeight. */
  stickyHeader?: boolean;
  /** CSS max-height on the scroll container, e.g. "28rem". */
  maxHeight?: string;
  /** Rendered in place of the table when rows is empty. */
  empty?: React.ReactNode;
  initialSort?: { key: string; direction: SortDirection };
  /** Tighter row height for long tables. */
  dense?: boolean;
  /** Accessible table description (visually hidden caption). */
  caption?: string;
  className?: string;
}

const HIDE = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

function compare(a: unknown, b: unknown): number {
  const aNull = a === null || a === undefined || a === "";
  const bNull = b === null || b === undefined || b === "";
  if (aNull && bNull) return 0;
  if (aNull) return 1; // missing values always sink to the bottom
  if (bNull) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

/**
 * The app's only table. Zebra-free (hairlines, not stripes), tabular figures,
 * sortable headers, optional sticky first column, and horizontal overflow
 * contained inside the component so the page body never scrolls sideways.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  stickyFirstColumn = false,
  stickyHeader = false,
  maxHeight,
  empty,
  initialSort,
  dense = false,
  caption,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<{ key: string; direction: SortDirection } | null>(
    initialSort ?? null
  );

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    const sortValue = column?.sortValue;
    if (!sortValue) return rows;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => factor * compare(sortValue(a), sortValue(b)));
  }, [rows, sort, columns]);

  const toggle = (key: string) =>
    setSort((current) =>
      current?.key === key
        ? current.direction === "asc"
          ? { key, direction: "desc" }
          : null
        : { key, direction: "asc" }
    );

  const alignOf = (c: Column<T>) =>
    c.align === "center"
      ? "text-center"
      : c.align === "right" || c.numeric
        ? "text-right"
        : "text-left";

  const pad = dense ? "px-3 py-2" : "px-3 py-2.5 sm:px-4";

  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div
      className={cn(
        "scrollbar-hide-default w-full overflow-x-auto rounded-lg border border-hairline",
        maxHeight && "overflow-y-auto",
        className
      )}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className="w-full border-collapse text-left">
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead className={cn("bg-surface-sunken", stickyHeader && "sticky top-0 z-20")}>
          <tr>
            {columns.map((column, columnIndex) => {
              const active = sort?.key === column.key;
              const sortable = Boolean(column.sortable && column.sortValue);
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    active && sort
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    "app-label border-b border-hairline-strong whitespace-nowrap",
                    pad,
                    alignOf(column),
                    column.hideBelow && HIDE[column.hideBelow],
                    stickyFirstColumn &&
                      columnIndex === 0 &&
                      "sticky left-0 z-10 bg-surface-sunken",
                    column.headerClassName
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggle(column.key)}
                      className={cn(
                        "app-press app-focus inline-flex cursor-pointer items-center gap-1 rounded-sm",
                        active
                          ? "text-ink"
                          : "[@media(hover:hover)]:hover:text-ink-secondary",
                        (column.align === "right" || column.numeric) && "flex-row-reverse"
                      )}
                    >
                      {column.header}
                      {active && sort ? (
                        sort.direction === "asc" ? (
                          <ChevronUp className="size-3" aria-hidden />
                        ) : (
                          <ChevronDown className="size-3" aria-hidden />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-50" aria-hidden />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {sorted.map((row, rowIndex) => (
            <tr
              key={getRowKey(row, rowIndex)}
              onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
              className={cn(
                "app-row-hover border-b border-hairline last:border-b-0",
                onRowClick && "cursor-pointer"
              )}
            >
              {columns.map((column, columnIndex) => (
                <td
                  key={column.key}
                  className={cn(
                    "text-[0.8125rem] text-ink",
                    pad,
                    alignOf(column),
                    column.numeric && "tnum",
                    column.hideBelow && HIDE[column.hideBelow],
                    stickyFirstColumn &&
                      columnIndex === 0 &&
                      "sticky left-0 z-10 bg-surface-raised font-medium",
                    column.cellClassName
                  )}
                >
                  {column.cell(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
