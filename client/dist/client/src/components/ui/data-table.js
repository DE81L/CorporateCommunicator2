import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption, } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
export function DataTable({ columns, data, placeholder = "No data", }) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });
    // Nothing to show? – early out with a caption
    if (!data.length) {
        return (_jsx(Table, { className: "w-full", children: _jsx(TableCaption, { className: "text-center p-4", children: placeholder }) }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs(Table, { className: "w-full", children: [_jsx(TableHeader, { children: table.getHeaderGroups().map((headerGroup) => (_jsx(TableRow, { children: headerGroup.headers.map((header) => (_jsx(TableHead, { children: header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext()) }, header.id))) }, headerGroup.id))) }), _jsx(TableBody, { children: table.getRowModel().rows.map((row) => (_jsx(TableRow, { "data-state": row.getIsSelected() && "selected", children: row.getVisibleCells().map((cell) => (_jsx(TableCell, { children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id))) })] }), _jsxs("div", { className: "mt-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", size: "icon", onClick: () => table.previousPage(), disabled: !table.getCanPreviousPage(), children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsxs("span", { className: "text-sm self-center", children: ["Page ", table.getState().pagination.pageIndex + 1, " of", " ", table.getPageCount()] }), _jsx(Button, { variant: "outline", size: "icon", onClick: () => table.nextPage(), disabled: !table.getCanNextPage(), children: _jsx(ChevronRight, { className: "h-4 w-4" }) })] })] }));
}
