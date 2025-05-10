"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTable = DataTable;
const react_table_1 = require("@tanstack/react-table");
const table_1 = require("@/components/ui/table");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
function DataTable({ columns, data, placeholder = "No data", }) {
    const table = (0, react_table_1.useReactTable)({
        data,
        columns,
        getCoreRowModel: (0, react_table_1.getCoreRowModel)(),
        getPaginationRowModel: (0, react_table_1.getPaginationRowModel)(),
    });
    // Nothing to show? – early out with a caption
    if (!data.length) {
        return (<table_1.Table className="w-full">
        <table_1.TableCaption className="text-center p-4">{placeholder}</table_1.TableCaption>
      </table_1.Table>);
    }
    return (<>
      <table_1.Table className="w-full">
        <table_1.TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (<table_1.TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (<table_1.TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : (0, react_table_1.flexRender)(header.column.columnDef.header, header.getContext())}
                </table_1.TableHead>))}
            </table_1.TableRow>))}
        </table_1.TableHeader>

        <table_1.TableBody>
          {table.getRowModel().rows.map((row) => (<table_1.TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
              {row.getVisibleCells().map((cell) => (<table_1.TableCell key={cell.id}>
                  {(0, react_table_1.flexRender)(cell.column.columnDef.cell, cell.getContext())}
                </table_1.TableCell>))}
            </table_1.TableRow>))}
        </table_1.TableBody>
      </table_1.Table>

      {/* super-simple pager */}
      <div className="mt-2 flex justify-end gap-2">
        <button_1.Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          <lucide_react_1.ChevronLeft className="h-4 w-4"/>
        </button_1.Button>
        <span className="text-sm self-center">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <button_1.Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          <lucide_react_1.ChevronRight className="h-4 w-4"/>
        </button_1.Button>
      </div>
    </>);
}
