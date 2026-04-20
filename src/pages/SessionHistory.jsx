import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const statusColor = (status) => {
  if (status === 'Realizada') return 'bg-green-100 text-green-700';
  if (status === 'Cancelada') return 'bg-red-100 text-red-600';
  return 'bg-blue-100 text-blue-700';
};

const evolutionColor = (status) => {
  if (status === 'Melhorou') return 'text-green-600';
  if (status === 'Piorou') return 'text-red-500';
  return 'text-yellow-600';
};

export default function SessionHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, sessionsRes] = await Promise.all([
          api.get(`/api/patients/${id}`),
          api.get(`/api/sessions/patient/${id}`),
        ]);
        setPatient(patientRes.data);
        setSessions(sessionsRes.data);
      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleCancel = async (sessionId) => {
    if (!window.confirm('Cancelar esta sessão?')) return;
    try {
      await api.patch(`/api/sessions/${sessionId}/cancel`);
      setSessions(prev =>
        prev.map(s => s.id === sessionId ? { ...s, status: 'Cancelada' } : s)
      );
    } catch (err) {
      console.error('Erro ao cancelar sessão:', err);
      alert('Erro ao cancelar sessão.');
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

      <div className="bg-white shadow px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/patients/${id}`)}
          className="text-gray-500 text-xl">←</button>
        <div>
          <h1 className="font-bold text-gray-800">Histórico de Sessões</h1>
          <p className="text-xs text-gray-400">{patient?.name}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl shadow p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              {sessions.filter(s => s.status === 'Realizada').length}
            </p>
            <p className="text-xs text-gray-500">Realizadas</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {sessions.filter(s => s.status === 'Agendada').length}
            </p>
            <p className="text-xs text-gray-500">Agendadas</p>
          </div>
        </div>

        {/* Lista de sessões */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>Nenhuma sessão registrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, index) => (
              <div key={session.id} className="bg-white rounded-2xl shadow p-4">

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Sessão {session.session_number || sessions.length - index}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(session.session_date).toLocaleDateString('pt-BR', {
                        weekday: 'long', day: '2-digit',
                        month: '2-digit', year: 'numeric'
                      })} às {new Date(session.session_date).toLocaleTimeString('pt-BR', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium
                      ${statusColor(session.status)}`}>
                      {session.status || 'Realizada'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {session.duration_minutes}min
                    </span>
                  </div>
                </div>

                {(session.pain_scale_start !== null ||
                  session.pain_scale_end !== null) && (
                  <div className="flex gap-4 mb-3">
                    {session.pain_scale_start !== null && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">🔴 Início:</span>
                        <span className="text-sm font-bold text-gray-700">
                          {session.pain_scale_start}
                        </span>
                      </div>
                    )}
                    {session.pain_scale_end !== null && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">🟢 Final:</span>
                        <span className="text-sm font-bold text-gray-700">
                          {session.pain_scale_end}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {session.evolution_status && (
                  <p className={`text-sm font-semibold mb-2
                    ${evolutionColor(session.evolution_status)}`}>
                    {session.evolution_status === 'Melhorou' ? '✅' :
                     session.evolution_status === 'Piorou' ? '⬇️' : '➡️'}
                    {' '}{session.evolution_status}
                  </p>
                )}

                {session.evolution_notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-3">
                    {session.evolution_notes}
                  </p>
                )}

                {session.techniques?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Técnicas:</p>
                    <div className="flex flex-wrap gap-1">
                      {session.techniques.map((t, i) => (
                        <span key={i}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(session.next_goal_name || session.next_goal_custom) && (
                  <p className="text-xs text-gray-500 mb-3">
                    🎯 Próximo objetivo: {session.next_goal_name || session.next_goal_custom}
                  </p>
                )}

                {(!session.status || session.status === 'Agendada') && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/sessions/new?patient=${id}`)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white
                                 text-xs font-semibold rounded-xl py-2 transition">
                      ✅ Registrar Evolução
                    </button>
                    <button
                      onClick={() => handleCancel(session.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600
                                 text-xs font-semibold rounded-xl py-2 transition
                                 border border-red-200">
                      ❌ Cancelar
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate(`/sessions/new?patient=${id}`)}
          className="w-full bg-green-600 hover:bg-green-700 text-white
                     font-semibold rounded-xl py-4 transition">
          + Registrar Nova Sessão
        </button>

      </div>
    </div>
  );
}