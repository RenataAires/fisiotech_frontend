import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

const DURATIONS = [30, 45, 60, 90];

const toLocalISO = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function ScheduleSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    patient_id: "",
    treatment_plan_id: "",
    session_date: dateParam
      ? toLocalISO(dateParam)
      : toLocalISO(new Date()),
    duration_minutes: 45,
    session_number: "",
  });

  const [selectedPatient, setSelectedPatient] = useState(null);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data } = await api.get("/api/patients");
        setPatients(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    set("patient_id", patient.id);

    try {
      const { data } = await api.get(`/api/patients/${patient.id}`);
      console.log("Planos do paciente:", data.plans);
      const activePlan = data.plans?.find((p) => p.status === "Em andamento");
      if (activePlan) {
        set("treatment_plan_id", activePlan.id);
        set("session_number", parseInt(activePlan.sessions_done || 0) + 1);
      } else {
        setError("Paciente não tem plano de tratamento ativo.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!form.patient_id) {
      setError("Selecione um paciente.");
      return;
    }
    if (!form.treatment_plan_id) {
      setError("Paciente não tem plano de tratamento ativo.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/api/sessions/schedule", {
        patient_id: form.patient_id,
        treatment_plan_id: form.treatment_plan_id,
        session_date: form.session_date,
        duration_minutes: form.duration_minutes,
        session_number: form.session_number,
      });
      navigate("/calendar");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao agendar sessão");
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/calendar")}
          className="text-gray-500 text-xl"
        >
          ←
        </button>
        <div>
          <h1 className="font-bold text-gray-800">Agendar Sessão</h1>
          <p className="text-xs text-gray-400">
            {new Date(form.session_date).toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl shadow p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data e hora
            </label>
            <input
              type="datetime-local"
              value={form.session_date}
              onChange={(e) => set("session_date", e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duração
            </label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("duration_minutes", d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition
                    ${
                      form.duration_minutes === d
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-300"
                    }`}
                >
                  {d}min
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">👤 Paciente</h3>

          {selectedPatient ? (
            <div
              className="flex justify-between items-center bg-blue-50
                            border border-blue-200 rounded-xl p-3"
            >
              <div>
                <p className="font-medium text-blue-800">
                  {selectedPatient.name}
                </p>
                <p className="text-xs text-blue-600">
                  {selectedPatient.specialty}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  set("patient_id", "");
                  set("treatment_plan_id", "");
                }}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                Trocar
              </button>
            </div>
          ) : (
            <>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Buscar paciente..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-3
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {loading ? (
                <p className="text-gray-400 text-sm text-center">
                  Carregando...
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPatient(p)}
                      className="w-full text-left px-4 py-3 rounded-xl border
                                 border-gray-200 hover:border-blue-400 hover:bg-blue-50
                                 transition"
                    >
                      <p className="font-medium text-gray-800 text-sm">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500">{p.specialty}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white
                     font-semibold rounded-xl py-4 transition disabled:opacity-50"
        >
          {saving ? "Agendando..." : "📅 Confirmar Agendamento"}
        </button>
      </div>
    </div>
  );
}
