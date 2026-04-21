import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

const SummaryCard = ({ title, value, color, icon, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl shadow p-5 border-l-4 ${color} ${onClick ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}`}
  >
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    <p className="text-2xl mt-2">{icon}</p>
  </div>
);

const SessionCard = ({ session, onCancel }) => {
  const navigate = useNavigate();
  const time = new Date(session.session_date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isAgendada = session.status === "Agendada";
  const isCancelada = session.status === "Cancelada"; // ← Nova verificação

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-800 text-lg">
            {session.patient_name}
          </p>
          <p className="text-sm text-gray-500">{session.plan_title}</p>
          <p className="text-sm text-gray-500">
            Sessão {session.session_number} · {session.duration_minutes}min
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-blue-600">{time}</p>
          <span
            className={`text-xs px-2 py-1 rounded-full mt-1 inline-block font-medium
            ${
              isAgendada
                ? "bg-blue-100 text-blue-700"
                : isCancelada
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
            }`}
          >
            {isAgendada
              ? "🗓️ Agendada"
              : isCancelada
                ? "✕ Cancelada"
                : "✅ Realizada"}
          </span>
        </div>
      </div>

      {isAgendada && (
        <div className="flex gap-2 pt-2 border-t border-gray-50">
          <button
            onClick={() =>
              navigate(
                `/sessions/new?patient=${session.patient_id}&session_id=${session.id}`,
              )
            }
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-3 rounded-xl transition"
          >
            ⚡ Atender Agora
          </button>
          <button
            onClick={() => onCancel(session.id)}
            className="px-4 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold py-3 rounded-xl transition"
          >
            ✕ Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [summary, setSummary] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Função fetchData movida para fora do useEffect para ser acessível globalmente no componente
  const fetchData = async () => {
    try {
      const [summaryRes, todayRes] = await Promise.all([
        api.get("/api/dashboard/summary"),
        api.get("/api/dashboard/today"),
      ]);
      setSummary(summaryRes.data);
      setTodaySessions(todayRes.data);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. useEffect configurado para recarregar sempre que você entrar na página (location.key)
  useEffect(() => {
    fetchData();
  }, [location.key]);

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;
    try {
      // 1. Envia o pedido de cancelamento
      await api.patch(`/api/sessions/${sessionId}/cancel`);

      // 2. RECARREGA os dados do banco imediatamente para limpar o "fantasma"
      await fetchData();

      alert("Sessão cancelada com sucesso.");
    } catch (err) {
      console.error("Erro ao cancelar:", err);
      alert("Não foi possível cancelar a sessão.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-blue-600">FisioTech</h1>
          <p className="text-sm text-gray-500">Olá, {user?.name}! 👋</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/patients")}
            className="text-sm text-blue-600 font-medium"
          >
            Pacientes
          </button>
          <button
            onClick={() => navigate("/calendar")}
            className="text-sm text-blue-600 font-medium"
          >
            Agenda
          </button>
          <button onClick={logout} className="text-sm text-red-500">
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            title="Pacientes ativos"
            value={summary?.activePatients ?? 0}
            color="border-blue-500"
            icon="👥"
          />
          <SummaryCard
            title="Sessões hoje"
            value={summary?.todaySessions ?? 0}
            color="border-green-500"
            icon="📅"
          />
          <SummaryCard
            title="Pagtos. pendentes"
            value={summary?.pendingPayments ?? 0}
            color="border-red-400"
            icon="💰"
            onClick={() => navigate("/payments/pending")} // 🚀 Navega para a lista de pendências
          />
        </div>

        {/* Lista de Sessões */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            📋 Agenda de hoje
          </h2>
          {todaySessions.filter((s) => s.status !== "Cancelada").length ===
          0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
              Nenhuma sessão agendada
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions
                .filter((s) => s.status !== "Cancelada") // ← Isso faz a mágica de sumir ao cancelar
                .map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onCancel={handleCancelSession}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/patients/new")}
            className="bg-blue-600 text-white rounded-2xl py-4 font-semibold text-sm"
          >
            + Novo Paciente
          </button>
          <button
            onClick={() => navigate("/patients")}
            className="bg-green-600 text-white rounded-2xl py-4 font-semibold text-sm"
          >
            + Nova Sessão
          </button>
        </div>
      </div>
    </div>
  );
}
