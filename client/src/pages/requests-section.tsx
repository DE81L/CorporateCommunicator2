import { useEffect, useState } from "react";
import { ColumnsType } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusIcon, RefreshCw } from "lucide-react";
import { RequestModal } from "./request-modal";
import { getRequests } from "@/api/requests";

export interface Request {
  id: number;
  numberOfRequest: string;
  requestStatus: string;
  cabinet: string;
  deadline?: string;
  grade?: number;
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

  const columns: ColumnsType<Request> = [
    { accessorKey: "numberOfRequest", header: "№ заявки" },
    {
      accessorKey: "requestStatus",
      header: "Статус",
      cell: ({ getValue }) => {
        const val = getValue<string>();
        const color =
          val === "выполнена" ? "completed" :
          val === "в работе"   ? "inProgress" :
          val === "новая"      ? "pending" : "secondary";
        return <Badge variant={color as any}>{val}</Badge>;
      }
    },
    { accessorKey: "cabinet",   header: "Кабинет" },
    { accessorKey: "deadline",  header: "Дедлайн" },
    { accessorKey: "grade",     header: "Оценка" },
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