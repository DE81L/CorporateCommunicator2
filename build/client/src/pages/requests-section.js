"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RequestsSection;
const react_1 = require("react");
const data_table_1 = require("@/components/ui/data-table");
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const request_modal_1 = __importDefault(require("./request-modal"));
const requests_1 = require("@/api/requests");
function RequestsSection() {
    const [data, setData] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [showModal, setShowModal] = (0, react_1.useState)(false);
    const load = async () => {
        setLoading(true);
        setData(await (0, requests_1.getRequests)());
        setLoading(false);
    };
    (0, react_1.useEffect)(() => { load(); }, []);
    const columns = [
        {
            accessorKey: "status",
            header: "Статус",
            cell: ({ getValue }) => {
                const status = getValue();
                return (<badge_1.Badge variant={status === "выполнена" ? "completed" :
                        status === "в работе" ? "inProgress" :
                            "pending"}>
            {status}
          </badge_1.Badge>);
            }
        },
        {
            accessorKey: "isUrgent",
            header: "Срочность",
            cell: ({ row }) => row.original.isUrgent &&
                <badge_1.Badge variant="destructive">Срочно</badge_1.Badge>
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
    return (<div className="flex flex-col gap-4 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Заявки</h2>
        <div className="flex gap-2">
          <button_1.Button size="icon" variant="outline" onClick={load} disabled={loading}>
            <lucide_react_1.RefreshCw className={loading ? "animate-spin" : ""}/>
          </button_1.Button>
          <button_1.Button onClick={() => setShowModal(true)}>
            <lucide_react_1.PlusIcon className="mr-2 h-4 w-4"/> Создать
          </button_1.Button>
        </div>
      </div>

      <data_table_1.DataTable columns={columns} data={data} placeholder="Заявок нет"/>

      <request_modal_1.default open={showModal} onOpenChange={setShowModal} onSuccess={load}/>
    </div>);
}
