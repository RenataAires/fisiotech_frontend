import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ← adicionado
import { useAuth } from '../context/useAuth';
import api from "../services/api";

const SummaryCard = ({ title, value, color, icon }) => (
  <div className={`bg-white rounded-2xl shadow p-5 border-l-4 ${color}`}>
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    <p className="text-2xl mt-2">{icon}</p>
  </div>
);

const SessionCard = ({ session }) => {
  const time = new Date(session.session_date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-2xl shadow p-4 flex justify-between items-center">
      <div>
        <p className="font-semibold text-gray-800">{session.patient_name}</p>
        <p className="text-sm text-gray-500">{session.plan_title}</p>
        <p className="text-sm text-gray-500">
          Sessão {session.session_number}
          {session.total_sessions ? `/${session.total_sessions}` : ""} ·{" "}
          {session.duration_minutes}min
        </p>
        <p className="text-xs text-gray-400 mt-1">
          📍 {session.patient_address}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-blue-600">{time}</p>
        <span
          className={`text-xs px-2 py-1 rounded-full mt-1 inline-block
          ${session.paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
        >
          {session.paid ? "✅ Pago" : "❌ Pendente"}
        </span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // ← adicionado
  const [summary, setSummary] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchData();
  }, []);

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
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Pacientes
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Agenda
          </button>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
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
          />
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            📋 Agenda de hoje
          </h2>
          {todaySessions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
              Nenhuma sessão agendada para hoje
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            ⚡ Ações rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/patients/new")} // ← adicionado
              className="bg-blue-600 hover:bg-blue-700 text-white
                         rounded-2xl py-4 font-semibold text-sm transition"
            >
              + Novo Paciente
            </button>
            <button
              onClick={() => navigate("/sessions/new")} // ← para o futuro
              className="bg-green-600 hover:bg-green-700 text-white
                         rounded-2xl py-4 font-semibold text-sm transition"
            >
              + Nova Sessão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
