import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusIcon, RefreshCw } from "lucide-react";
import RequestModal from "./request-modal";
import { getRequests } from "@/api/requests";
export default function RequestsSection() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const load = async () => {
        setLoading(true);
        setData(await getRequests());
        setLoading(false);
    };
    useEffect(() => { load(); }, []);
    const columns = [
        {
            accessorKey: "status",
            header: "Статус",
            cell: ({ getValue }) => {
                const status = getValue();
                return (_jsx(Badge, { variant: status === "выполнена" ? "completed" :
                        status === "в работе" ? "inProgress" :
                            "pending", children: status }));
            }
        },
        {
            accessorKey: "isUrgent",
            header: "Срочность",
            cell: ({ row }) => row.original.isUrgent &&
                _jsx(Badge, { variant: "destructive", children: "\u0421\u0440\u043E\u0447\u043D\u043E" })
        },
        {
            accessorKey: "task",
            header: "Задача",
            cell: ({ row }) => row.original.task?.name
        },
        { accessorKey: "cabinet", header: "Кабинет" },
        { accessorKey: "deadline", header: "Дедлайн" },
        { accessorKey: "grade", header: "Оценка" },
    ];
    return (_jsxs("div", { className: "flex flex-col gap-4 p-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-semibold", children: "\u0417\u0430\u044F\u0432\u043A\u0438" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "icon", variant: "outline", onClick: load, disabled: loading, children: _jsx(RefreshCw, { className: loading ? "animate-spin" : "" }) }), _jsxs(Button, { onClick: () => setShowModal(true), children: [_jsx(PlusIcon, { className: "mr-2 h-4 w-4" }), " \u0421\u043E\u0437\u0434\u0430\u0442\u044C"] })] })] }), _jsx(DataTable, { columns: columns, data: data, placeholder: "\u0417\u0430\u044F\u0432\u043E\u043A \u043D\u0435\u0442" }), _jsx(RequestModal, { open: showModal, onOpenChange: setShowModal, onSuccess: load })] }));
}
