import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PatientCard = ({ patient, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl shadow p-4 flex justify-between
               items-center cursor-pointer hover:shadow-md transition">
    <div>
      <p className="font-semibold text-gray-800">{patient.name}</p>
      <p className="text-sm text-gray-500">{patient.specialty || 'Especialidade não informada'}</p>
      <p className="text-sm text-gray-400">{patient.phone}</p>
    </div>
    <div className="text-right">
      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
        {patient.total_sessions ?? 0} sessões
      </span>
      <p className="text-xs text-gray-400 mt-1">→</p>
    </div>
  </div>
);

export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data } = await api.get('/api/patients');
        setPatients(data);
        setFiltered(data);
      } catch (err) {
        console.error('Erro ao carregar pacientes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Filtro de busca em tempo real
  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      patients.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.specialty?.toLowerCase().includes(term) ||
        p.phone?.includes(term)
      )
    );
  }, [search, patients]);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-500 text-xl">←</button>
        <h1 className="font-bold text-gray-800">Pacientes</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Busca */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar por nome, especialidade ou telefone..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />

        {/* Contador */}
        <p className="text-sm text-gray-500">
          {filtered.length} paciente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Lista */}
        {loading ? (
          <p className="text-center text-gray-400 py-10">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">👤</p>
            <p>Nenhum paciente encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(patient => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onClick={() => navigate(`/patients/${patient.id}`)}
              />
            ))}
          </div>
        )}

        {/* Botão novo paciente */}
        <button
          onClick={() => navigate('/patients/new')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white
                     font-semibold rounded-xl py-4 transition">
          + Novo Paciente
        </button>

      </div>
    </div>
  );
}