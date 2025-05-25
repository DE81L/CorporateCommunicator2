import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusIcon, RefreshCw, Trash2, Edit, Check } from "lucide-react";
import RequestModal from "./request-modal";
import RequestDetailsDialog from "./request-details-dialog";
import {
  getRequests,
  acceptRequest,
  deleteRequest,
  completeRequest,
} from "@/api/requests";
import { useAuth } from "@/hooks/use-auth";
import { showError } from "@/lib/error-toast";

export interface Request {
  id: number;
  senderId: number;
  status: 'новая' | 'в работе' | 'готово';
  receiverDepartmentId: number;
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
  const [editing, setEditing] = useState<Request | null>(null);
  const [selected, setSelected] = useState<Request | null>(null);
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    setData(await getRequests());
    setLoading(false);
  };

  const handleAccept = async (id: number) => {
    try {
      await acceptRequest(id);
      load();
    } catch (err) {
      showError(err, 'Не удалось принять заявку');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRequest(id);
      load();
    } catch (err) {
      showError(err, 'Не удалось удалить заявку');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeRequest(id, {});
      load();
    } catch (err) {
      showError(err, 'Не удалось завершить заявку');
    }
  };

  const handleRowClick = (row: Request) => {
    setSelected(row);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const columns: ColumnDef<Request>[] = [
    {
      accessorKey: "status",
      header: "Статус",
      cell: ({ getValue }) => {
        const status = getValue<string>();
        return (
          <Badge
            variant={
              status === "готово" ? "completed" :
              status === "в работе" ? "inProgress" :
              "pending"
            }
          >
            {status}
          </Badge>
        );
      }
    },
    {
      accessorKey: "task",
      header: "Задача",
      cell: ({ row }) => row.original.task?.name
    },
    {
      accessorKey: "subdivision",
      header: "Подразделение",
      cell: ({ row }) => row.original.subdivision?.name
    },
    {
      accessorKey: "whoAccepted",
      header: "Принял",
      cell: ({ row }) =>
        row.original.whoAccepted
          ? `${row.original.whoAccepted.firstName} ${row.original.whoAccepted.lastName}`
          : ''
    },
    { accessorKey: "cabinet", header: "Кабинет" },
    { accessorKey: "deadline", header: "Дедлайн" },
    { accessorKey: "comment", header: "Комментарий" },
    {
      id: "actions",
      header: "Действия",
      cell: ({ row }) => {
        const r = row.original;
        const canAccept = r.status === "новая" && user?.id !== r.senderId;
        const canEdit = user?.id === r.senderId && r.status === "новая";
        const canDelete = canEdit;
        const canComplete = user?.id === r.senderId && r.status === "в работе";
        return (
          <div className="flex gap-2">
            {canAccept && (
              <Button size="sm" onClick={() => handleAccept(r.id)}>
                Принять
              </Button>
            )}
            {canEdit && (
              <Button size="icon" variant="outline" onClick={() => { setEditing(r); setShowModal(true); }}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button size="icon" variant="outline" onClick={() => handleDelete(r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {canComplete && (
              <Button size="icon" variant="outline" onClick={() => handleComplete(r.id)}>
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
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

      <DataTable
        columns={columns}
        data={data}
        placeholder="Заявок нет"
        onRowClick={(row) => handleRowClick(row.original)}
      />

      <RequestModal
        open={showModal}
        request={editing ?? undefined}
        onOpenChange={(o) => {
          setShowModal(o);
          if (!o) setEditing(null);
        }}
        onSuccess={load}
      />

      <RequestDetailsDialog
        open={selected !== null}
        request={selected}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
        onEdit={(r) => {
          setEditing(r);
          setShowModal(true);
        }}
        onDeleted={load}
      />
    </div>
  );
}
