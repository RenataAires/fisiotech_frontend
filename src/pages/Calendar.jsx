import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7h às 22h
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const getWeekDates = (baseDate) => {
  const date = new Date(baseDate);
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);

  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  }); // Seg a Sáb
};

const formatDate = (date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const statusColor = (status) => {
  if (status === 'Realizada') return 'bg-green-500';
  if (status === 'Cancelada') return 'bg-red-400';
  return 'bg-blue-500'; // Agendada
};

export default function Calendar() {
  const navigate = useNavigate();
  const [baseDate, setBaseDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates(baseDate);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];

  useEffect(() => {
  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Define início da semana às 00:00 local
      const start = new Date(weekStart);
      start.setHours(0, 0, 0, 0);

      // Define fim da semana às 23:59 local
      const end = new Date(weekEnd);
      end.setHours(23, 59, 59, 999);

      const { data } = await api.get('/api/sessions/week', {
        params: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      });
      setSessions(data);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    } finally {
      setLoading(false);
    }
  };
  fetchSessions();
}, [baseDate]);

  const prevWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 7);
    setBaseDate(d);
  };

  const nextWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    setBaseDate(d);
  };

  // Retorna sessões de um dia e hora específicos
  const getSessionsAt = (date, hour) => {
  return sessions.filter(s => {
    const sd = new Date(s.session_date);
    // getHours() já retorna no horário local do navegador
    return sd.getFullYear() === date.getFullYear() &&
           sd.getMonth() === date.getMonth() &&
           sd.getDate() === date.getDate() &&
           sd.getHours() === hour;
  });
};

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="text-gray-500 text-xl">←</button>
          <h1 className="font-bold text-gray-800">Agenda</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevWeek}
            className="text-gray-500 hover:text-gray-700 text-lg">‹</button>
          <span className="text-sm font-medium text-gray-700">
            {formatDate(weekStart)} — {formatDate(weekEnd)}
          </span>
          <button onClick={nextWeek}
            className="text-gray-500 hover:text-gray-700 text-lg">›</button>
        </div>
      </div>

      {/* Calendário */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px] p-4">

          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            <div className="text-xs text-gray-400 text-center py-2">Hora</div>
            {weekDates.map((date, i) => (
              <div key={i} className={`text-center py-2 rounded-xl text-xs font-medium
                ${date.toDateString() === new Date().toDateString()
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600'}`}>
                <div>{DAYS[date.getDay()]}</div>
                <div>{formatDate(date)}</div>
              </div>
            ))}
          </div>

          {/* Grid de horários */}
          {loading ? (
            <p className="text-center text-gray-400 py-10">Carregando...</p>
          ) : (
            HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-7 gap-1 mb-1">
                {/* Coluna de hora */}
                <div className="text-xs text-gray-400 text-center py-2">
                  {hour}:00
                </div>

                {/* Células dos dias */}
                {weekDates.map((date, i) => {
                  const daySessions = getSessionsAt(date, hour);
                  return (
                    <div key={i}
                      className="min-h-[48px] bg-white rounded-lg border border-gray-100
                                 hover:border-blue-300 cursor-pointer transition p-1"
                      onClick={() => {
                        const dt = new Date(date);
                        dt.setHours(hour, 0, 0);
                        navigate(`/sessions/schedule?date=${dt.toISOString()}`);
                      }}>
                      {daySessions.map(s => (
                        <div key={s.id}
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/patients/${s.patient_id}`);
                          }}
                          className={`${statusColor(s.status)} text-white text-xs
                                      rounded p-1 mb-1 truncate cursor-pointer`}>
                          {s.patient_name.split(' ')[0]}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="px-4 pb-6">
        <div className="flex gap-4 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-xs text-gray-500">Agendada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-xs text-gray-500">Realizada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-400"></div>
            <span className="text-xs text-gray-500">Cancelada</span>
          </div>
        </div>
      </div>
    </div>
  );
}