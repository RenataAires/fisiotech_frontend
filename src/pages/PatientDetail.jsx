import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal de Agendamento
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ date: "", time: "" });
  const [isScheduling, setIsScheduling] = useState(false);

  // ✏️ Estados para Edição do Paciente
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    birth_date: "",
    address: "",
    specialty: "",
    health_plan: "",
    diagnosis: "",
  });

  // Função genérica para recarregar dados após alterações
  const fetchData = async () => {
    try {
      const [patientRes, sessionsRes] = await Promise.all([
        api.get(`/api/patients/${id}`),
        api.get(`/api/sessions/patient/${id}`),
      ]);
      setPatient(patientRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      console.error("Erro ao recarregar dados:", err);
    }
  };

  // Effect ajustado conforme boas práticas e regras do ESLint
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [patientRes, sessionsRes] = await Promise.all([
          api.get(`/api/patients/${id}`),
          api.get(`/api/sessions/patient/${id}`),
        ]);
        if (isMounted) {
          setPatient(patientRes.data);
          setSessions(sessionsRes.data);
        }
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // ✏️ Preenche o modal de edição com os dados atuais
  const handleOpenEdit = () => {
    if (!patient) return;
    setEditForm({
      name: patient.name || "",
      phone: patient.phone || "",
      birth_date: patient.birth_date ? patient.birth_date.split("T")[0] : "",
      address: patient.address || "",
      specialty: patient.specialty || "",
      health_plan: patient.health_plan || "",
      diagnosis: patient.diagnosis || "",
    });
    setShowEditModal(true);
  };

  // ✏️ Salva as alterações via PUT
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.phone) {
      alert("Nome e Telefone são obrigatórios!");
      return;
    }
    setIsEditing(true);
    try {
      await api.put(`/api/patients/${id}`, editForm);
      alert("Cadastro atualizado com sucesso!");
      setShowEditModal(false);
      await fetchData();
    } catch (err) {
      console.error("Erro ao editar paciente:", err);
      alert(err.response?.data?.error || "Erro ao atualizar dados.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm("Deseja realmente cancelar esta sessão?")) return;
    try {
      await api.put(`/api/sessions/${sessionId}/cancel`);
      alert("Sessão cancelada!");
      await fetchData();
    } catch (err) {
      console.error("Erro ao cancelar sessão:", err);
      alert("Erro ao cancelar.");
    }
  };

  const handleQuickSchedule = async () => {
    if (!scheduleData.date || !scheduleData.time) {
      alert("Preencha data e hora.");
      return;
    }
    setIsScheduling(true);
    try {
      const activePlan =
        patient.plans?.find((p) => p.status === "Ativo") || patient.plans?.[0];
      await api.post("/api/sessions/schedule", {
        patient_id: id,
        treatment_plan_id: activePlan?.id,
        session_date: `${scheduleData.date}T${scheduleData.time}`,
        session_number: parseInt(activePlan?.sessions_done || 0) + 1,
      });
      alert("Sessão agendada!");
      setShowScheduleModal(false);
      await fetchData();
    } catch (err) {
      console.error("Erro ao agendar sessão:", err);
      alert("Erro ao agendar.");
    } finally {
      setIsScheduling(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* Header com botão de edição */}
      <div className="bg-white shadow px-6 py-4 w-full flex items-center justify-between">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/patients")}
              className="text-gray-500 text-xl font-bold hover:text-gray-700"
            >
              ←
            </button>
            <div>
              <h1 className="font-bold text-gray-800 text-base leading-tight">
                {patient?.name}
              </h1>
              <p className="text-xs text-gray-400">
                {patient?.specialty || "Especialidade não informada"}
              </p>
            </div>
          </div>

          {/* ✏️ Botão de Editar visível e destacado */}
          <button
            onClick={handleOpenEdit}
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1 shadow shrink-0"
          >
            ✏️ Editar
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Histórico de Atendimentos */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            💰 Histórico de Atendimentos
          </h2>

          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl shadow p-4 flex justify-between items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-800">
                    Sessão #{session.session_number}
                  </p>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      session.status?.toLowerCase() === "realizada"
                        ? "bg-blue-50 text-blue-600"
                        : session.status?.toLowerCase() === "cancelada"
                          ? "bg-red-50 text-red-500 border border-red-100"
                          : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {session.status?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(session.session_date).toLocaleDateString("pt-BR")}
                </p>

                <div className="mt-3 flex gap-4">
                  {session.status?.toLowerCase() === "realizada" ? (
                    <button
                      onClick={() => navigate(`/sessions/${session.id}/report`)}
                      className="text-blue-600 text-[10px] font-bold flex items-center gap-1 hover:underline"
                    >
                      📄 VER RELATÓRIO
                    </button>
                  ) : session.status?.toLowerCase() !== "cancelada" ? (
                    <>
                      <button
                        onClick={() => navigate(`/sessions/${session.id}/edit`)}
                        className="text-green-600 text-[10px] font-bold hover:underline"
                      >
                        ⚡ ATENDER
                      </button>
                      <button
                        onClick={() => handleCancelSession(session.id)}
                        className="text-red-400 text-[10px] font-bold hover:underline"
                      >
                        ✕ CANCELAR
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-300 italic">
                      Sessão cancelada
                    </span>
                  )}
                </div>
              </div>

              {/* Bloco Financeiro */}
              <div className="text-right border-l pl-4 min-w-[100px]">
                {session.payment_id ? (
                  <div className="flex flex-col items-end">
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✅ PAGO
                    </span>
                    <p className="text-sm font-bold text-green-600 mt-1">
                      R$ {Number(session.payment_amount).toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        session.status?.toLowerCase() === "realizada"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {session.status?.toLowerCase() === "realizada"
                        ? "⏳ Pendente"
                        : session.status?.toLowerCase() === "cancelada"
                          ? "🚫 OFF"
                          : "🗓️ Agendado"}
                    </span>
                    <p className="text-[9px] text-gray-400 mt-1">
                      {session.status?.toLowerCase() === "realizada"
                        ? "Lançar valor"
                        : session.status?.toLowerCase() === "cancelada"
                          ? "Sem cobrança"
                          : "Aguardando"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botões de Ação Inferiores */}
        <div className="space-y-3 pt-4">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="w-full bg-blue-50 text-blue-600 border border-blue-200 font-semibold rounded-xl py-4 hover:bg-blue-100 transition"
          >
            🗓️ Agendar Próxima Sessão
          </button>
          <button
            onClick={() => navigate(`/sessions/new?patient=${id}`)}
            className="w-full bg-green-600 text-white font-semibold rounded-xl py-4 hover:bg-green-700 transition"
          >
            ⚡ Atender Agora (Fora da Agenda)
          </button>
        </div>
      </div>

      {/* Modal de Agendamento */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Agendar Sessão</h3>
            <div className="space-y-4">
              <input
                type="date"
                className="w-full border rounded-xl p-3"
                onChange={(e) =>
                  setScheduleData({ ...scheduleData, date: e.target.value })
                }
              />
              <input
                type="time"
                className="w-full border rounded-xl p-3"
                onChange={(e) =>
                  setScheduleData({ ...scheduleData, time: e.target.value })
                }
              />
            </div>
            <button
              onClick={handleQuickSchedule}
              disabled={isScheduling}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl"
            >
              {isScheduling ? "Agendando..." : "Confirmar"}
            </button>
            <button
              onClick={() => setShowScheduleModal(false)}
              className="w-full text-gray-400 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Edição do Paciente */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">
                ✏️ Editar Cadastro
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Telefone *
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={editForm.birth_date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, birth_date: e.target.value })
                  }
                  className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Endereço
                </label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Especialidade
                </label>
                <input
                  type="text"
                  value={editForm.specialty}
                  onChange={(e) =>
                    setEditForm({ ...editForm, specialty: e.target.value })
                  }
                  className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Convênio
                </label>
                <input
                  type="text"
                  value={editForm.health_plan}
                  onChange={(e) =>
                    setEditForm({ ...editForm, health_plan: e.target.value })
                  }
                  className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-3 space-y-2">
                <button
                  type="submit"
                  disabled={isEditing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50"
                >
                  {isEditing ? "Salvando..." : "Salvar Alterações"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-full text-gray-400 text-xs py-2"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
