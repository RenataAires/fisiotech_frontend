import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ date: "", time: "" });
  const [isScheduling, setIsScheduling] = useState(false);

  const fetchData = async () => {
    try {
      const [patientRes, sessionsRes] = await Promise.all([
        api.get(`/api/patients/${id}`),
        api.get(`/api/sessions/patient/${id}`),
      ]);
      setPatient(patientRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      loading && setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm("Deseja realmente cancelar esta sessão?")) return;
    try {
      await api.put(`/api/sessions/${sessionId}/cancel`);
      alert("Sessão cancelada!");
      fetchData();
    } catch (err) {
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
      fetchData();
    } catch (err) {
      alert("Erro ao agendar.");
    } finally {
      setIsScheduling(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* Header */}
      <div className="bg-white shadow px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/patients")}
          className="text-gray-500 text-xl"
        >
          ←
        </button>
        <div>
          <h1 className="font-bold text-gray-800">{patient?.name}</h1>
          <p className="text-xs text-gray-400">{patient?.specialty}</p>
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
                    <span className="text-[10px] text-gray-300 italic">Sessão cancelada</span>
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
    </div>
  );
}