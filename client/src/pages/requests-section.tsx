import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusIcon, RefreshCw } from "lucide-react";
import RequestModal from "./request-modal";
import { getRequests } from "@/api/requests";

export interface Request {
  id: number;
  status: 'новая' | 'в работе' | 'выполнена';
  receiverSubdivisionId: number;
  subdivision?: { id: number; name: string };
  taskId: number;
  task?: { id: number; name: string; category: string };
  cabinet?: string;
  phone?: string;
  isUrgent: boolean;
  deadline?: string;
  comment?: string;
  whoAccepted?: { id: number; firstName: string; lastName: string };
  takenAt?: string;
  grade?: number;
  reviewText?: string;
  finishedAt?: string;
  createdAt: string;
}

export default function RequestsSection() {
  const [data, setData] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setData(await getRequests());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const columns: ColumnDef<Request>[] = [
    {
      accessorKey: "status",
      header: "Статус",
      cell: ({ getValue }) => {
        const status = getValue<string>();
        return (
          <Badge 
            variant={
              status === "выполнена" ? "success" :
              status === "в работе" ? "warning" : 
              "default"
            }
          >
            {status}
          </Badge>
        );
      }
    },
    {
      accessorKey: "isUrgent",
      header: "Срочность",
      cell: ({ row }) => 
        row.original.isUrgent && 
        <Badge variant="destructive">Срочно</Badge>
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

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Заявки</h2>
        <div className="flex gap-2">
          <Button size="icon" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""}/>
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <PlusIcon className="mr-2 h-4 w-4"/> Создать
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={data} placeholder="Заявок нет"/>

      <RequestModal open={showModal} onOpenChange={setShowModal} onSuccess={load}/>
    </div>
  );
}