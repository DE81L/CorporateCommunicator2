import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createApiClient } from "@/lib/queryClient";
;

async function createRequest(data: any, isElectron:boolean) {
  const apiClient = createApiClient(isElectron);

  try {
    const response = await apiClient.request("POST", "/api/requests", data);
    return await response.json();
  } catch (error) {
    throw new Error("Failed to create request");
  }
}

async function fetchAllRequests() {
  const apiClient = createApiClient(false);

  try {
    const response = await apiClient.request("GET", "/api/requests");
    return await response.json();
  } catch (error) {
    throw new Error("Failed to load requests");
  }
}

async function completeRequest(id: number, grade: number, reviewText?: string) {
  const apiClient = createApiClient(false);

  try {
    const response = await apiClient.request("PATCH", `/api/requests/${id}/complete`, {
      grade,
      reviewText
    });
    return await response.json();
  } catch (error) {
    throw new Error("Failed to complete request");
  }
}

type FormInputs = {
  numberOfRequest: string;
  dateOfRequest: string;
  deadline: string | null;
  category: string | null;
  cabinet: string;
  localNumber: string;
  comment: string;
  whoAccepted: string;
  requestStatus: string;
  subdivision: string | null;
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [grade, setGrade] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  );

  const { register, handleSubmit, reset } = useForm<FormInputs>({
    defaultValues: {
      numberOfRequest: "",
      dateOfRequest: "",
      deadline: "",
      category: "",
      cabinet: "",
      localNumber: "",
      comment: "",
      whoAccepted: "",
      requestStatus: "новая",
      subdivision: "",
    },
  });

  // Загрузка всех заявок
  async function loadRequests() {
    setLoading(true);
    try {
      const data = await fetchAllRequests();
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  // Создать заявку
  const onSubmit = async (formData: FormInputs) => {
    try {
      // Некоторые поля требуют аккуратных преобразований
      // dateOfRequest, deadline и т.п.
      if (!formData.dateOfRequest) {
        formData.dateOfRequest = new Date().toISOString().substring(0, 10); // сегодняшняя дата
      }
      if (!formData.deadline) {
        formData.deadline = null;
      }
      if (!formData.category) {
        formData.category = null;
      }
      if (!formData.subdivision) {
        formData.subdivision = null;
      }

      await createRequest(formData, false);
      reset();
      alert("Заявка успешно создана!");
      loadRequests();
    } catch (err) {
      alert("Ошибка при создании заявки");
    }
  };

  // Завершить заявку (установить оценку)
  async function handleCompleteRequest() {
    if (selectedRequestId === null) {
      alert("Сначала выберите заявку");
      return;
    }
    try {
      await completeRequest(
        selectedRequestId,
        grade,
        grade < 5 ? reviewText : undefined,
      );
      alert("Заявка завершена!");
      setSelectedRequestId(null);
      setGrade(5);
      setReviewText("");
      loadRequests();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Список заявок</h1>

      {/* Форма создания заявки */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ marginBottom: 30, border: "1px solid #ccc", padding: 10 }}
      >
        <h2>Создать новую заявку</h2>

        <div>
          <label>Номер заявки:</label>
          <input {...register("numberOfRequest", { required: true })} />
        </div>

        <div>
          <label>Дата заявки (ГГГГ-ММ-ДД):</label>
          <input type="date" {...register("dateOfRequest")} />
        </div>

        <div>
          <label>Срок выполнения (ГГГГ-ММ-ДД):</label>
          <input type="date" {...register("deadline")} />
        </div>

        <div>
          <label>Категория:</label>
          <input {...register("category")} />
        </div>

        <div>
          <label>Кабинет:</label>
          <input {...register("cabinet", { required: true })} />
        </div>

        <div>
          <label>Локальный номер:</label>
          <input {...register("localNumber", { required: true })} />
        </div>

        <div>
          <label>Комментарий:</label>
          <textarea {...register("comment", { required: true })} />
        </div>

        <div>
          <label>Кто принял заявку:</label>
          <input {...register("whoAccepted", { required: true })} />
        </div>

        <div>
          <label>Подразделение:</label>
          <input {...register("subdivision")} />
        </div>

        <button type="submit">Отправить заявку</button>
      </form>

      {/* Список заявок */}
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ccc" }}>
              <th>ID</th>
              <th>Номер</th>
              <th>Статус</th>
              <th>Кабинет</th>
              <th>Дедлайн</th>
              <th>Оценка</th>
              <th>Отзыв</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} style={{ borderBottom: "1px solid #ccc" }}>
                <td>{req.id}</td>
                <td>{req.numberOfRequest}</td>
                <td>{req.requestStatus}</td>
                <td>{req.cabinet}</td>
                <td>{req.deadline || "—"}</td>
                <td>{req.grade != null ? req.grade : "—"}</td>
                <td>{req.reviewText || "—"}</td>
                <td>
                  {req.requestStatus !== "выполнена" ? (
                    <button
                      onClick={() => {
                        setSelectedRequestId(req.id);
                        alert(
                          `Вы выбрали заявку ID=${req.id}. Теперь укажите оценку и при необходимости отзыв ниже.`,
                        );
                      }}
                    >
                      Завершить
                    </button>
                  ) : (
                    "Уже выполнена"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Блок установки оценки и отзыва */}
      <div
        style={{
          marginTop: 20,
          border: "1px solid #ccc",
          padding: 10,
          width: 300,
        }}
      >
        <h2>Завершить выбранную заявку</h2>
        <label>Оценка (1-5):</label>
        <input
          type="number"
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
          min={1}
          max={5}
        />

        {grade < 5 && (
          <>
            <br />
            <label>Отзыв (обязателен, если оценка &lt; 5):</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </>
        )}

        <div style={{ marginTop: 10 }}>
          <button onClick={handleCompleteRequest}>Завершить заявку</button>
        </div>
      </div>
    </div>
  );
}

export function RequestsSection() {}
//   // Fetch user's own requests
//   const {
//     data: myRequests,
//     isLoading: isLoadingMyRequests,
//     error: myRequestsError,
//   } = useQuery<Request[]>({
//     queryKey: ["/api/requests"],
//     queryFn: () =>
//       apiRequest("GET", "/api/requests").then((res) => res.json()),
//   });

//   // Fetch requests assigned to the user
//   const {
//     data: assignedRequests,
//     isLoading: isLoadingAssigned,
//     error: assignedError,
//   } = useQuery<Request[]>({
//     queryKey: ["/api/requests/assigned"],
//     queryFn: () =>
//       apiRequest("GET", "/api/requests/assigned").then((res) => res.json()),
//   });

//   // Fetch all users for the assignee dropdown
//   const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
//     queryKey: ["/api/users"],
//     queryFn: () => apiRequest("GET", "/api/users").then((res) => res.json()),
//   });
// }
