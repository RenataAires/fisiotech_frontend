import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const { data } = await api.get(`/api/patients/${id}`);
        setPatient(data);
      } catch (err) {
        console.error('Erro ao carregar paciente:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Paciente não encontrado.</p>
      </div>
    );
  }

  const anamnesis = patient.anamnesis;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/patients')}
          className="text-gray-500 text-xl">←</button>
        <div>
          <h1 className="font-bold text-gray-800">{patient.name}</h1>
          <p className="text-xs text-gray-400">{patient.specialty}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Dados básicos */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-2">
          <h2 className="font-semibold text-gray-700 mb-3">📋 Dados do Paciente</h2>
          <InfoRow label="Telefone" value={patient.phone} />
          <InfoRow label="Endereço" value={patient.address} />
          <InfoRow label="Convênio" value={patient.health_plan || 'Particular'} />
          <InfoRow label="Diagnóstico" value={patient.diagnosis} />
          {patient.birth_date && (
            <InfoRow label="Nascimento"
              value={new Date(patient.birth_date).toLocaleDateString('pt-BR')} />
          )}
        </div>

        {/* Planos de tratamento */}
        {patient.plans?.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold text-gray-700 mb-3">🗓️ Planos de Tratamento</h2>
            <div className="space-y-3">
              {patient.plans.map(plan => (
                <div key={plan.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-gray-800">{plan.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full
                      ${plan.status === 'Em andamento'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'}`}>
                      {plan.status}
                    </span>
                  </div>
                  {plan.total_sessions && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progresso</span>
                        <span>{plan.sessions_done}/{plan.total_sessions} sessões</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min((plan.sessions_done / plan.total_sessions) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {plan.unpaid_sessions > 0 && (
                    <p className="text-xs text-red-500 mt-2">
                      ⚠️ {plan.unpaid_sessions} sessão(ões) sem pagamento
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anamnese */}
        {anamnesis && (
          <div className="bg-white rounded-2xl shadow p-4 space-y-2">
            <h2 className="font-semibold text-gray-700 mb-3">🩺 Anamnese</h2>
            <InfoRow label="Queixa principal" value={anamnesis.main_complaint} />
            <InfoRow label="Início dos sintomas" value={anamnesis.symptom_onset} />
            <InfoRow label="Fatores de piora" value={anamnesis.aggravating_factors} />
            <InfoRow label="Medicamentos" value={anamnesis.current_medications} />
            <InfoRow label="Cirurgias/Fraturas" value={anamnesis.surgeries_fractures} />
            <InfoRow label="Profissão" value={anamnesis.profession} />
            <InfoRow label="Objetivos" value={anamnesis.patient_goals} />
            {anamnesis.additional_notes && (
              <InfoRow label="Observações" value={anamnesis.additional_notes} />
            )}
          </div>
        )}

        {/* Botões de ação */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/sessions/new?patient=${id}`)}
            className="w-full bg-green-600 hover:bg-green-700 text-white
                       font-semibold rounded-xl py-4 transition">
            + Registrar Nova Sessão
          </button>
          <button
            onClick={() => navigate(`/patients/${id}/sessions`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white
                       font-semibold rounded-xl py-4 transition">
            📋 Ver Histórico de Sessões
          </button>
        </div>

      </div>
    </div>
  );
}

// Componente auxiliar para exibir uma linha de informação
const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  );
};