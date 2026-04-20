import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

const PainScale = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <div className="flex gap-1 flex-wrap">
      {[...Array(11)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`w-9 h-9 rounded-lg text-sm font-bold border transition
            ${
              value === i
                ? i <= 3
                  ? "bg-green-500 text-white border-green-500"
                  : i <= 6
                    ? "bg-yellow-500 text-white border-yellow-500"
                    : "bg-red-500 text-white border-red-500"
                : "bg-white text-gray-600 border-gray-300"
            }`}
        >
          {i}
        </button>
      ))}
    </div>
  </div>
);

const StatusButton = ({ label, value, current, color, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(value)}
    className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition
      ${current === value ? `${color} text-white` : "bg-white text-gray-600 border-gray-300"}`}
  >
    {label}
  </button>
);

const PAYMENT_METHODS = [
  "Pix",
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Transferência",
];

const DURATIONS = [30, 45, 60, 90];

export default function NewSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patient");

  const [patient, setPatient] = useState(null);
  const [techniques, setTechniques] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    treatment_plan_id: "",
    session_number: "",
    session_date: new Date().toISOString().slice(0, 16),
    duration_minutes: 45,
    pain_scale_start: null,
    pain_scale_end: null,
    evolution_status: "",
    evolution_notes: "",
    next_goal_id: "",
    next_goal_custom: "",
    techniques_used: [],
    payment_amount: "",
    payment_method: "",
  });

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleTechnique = (id) => {
    setForm((f) => ({
      ...f,
      techniques_used: f.techniques_used.includes(id)
        ? f.techniques_used.filter((t) => t !== id)
        : [...f.techniques_used, id],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, techniquesRes, goalsRes] = await Promise.all([
          api.get(`/api/patients/${patientId}`),
          api.get("/api/techniques"),
          api.get("/api/goals"),
        ]);
        setPatient(patientRes.data);
        setTechniques(techniquesRes.data);
        setGoals(goalsRes.data);

        // Pré-seleciona o plano ativo e número da próxima sessão
        const activePlan = patientRes.data.plans?.find(
          (p) => p.status === "Em andamento",
        );
        if (activePlan) {
          set("treatment_plan_id", activePlan.id);
          set("session_number", parseInt(activePlan.sessions_done || 0) + 1);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchData();
  }, [patientId]);

  const handleSubmit = async () => {
    if (!form.treatment_plan_id) {
      setError("Plano de tratamento não encontrado.");
      return;
    }
    if (!form.evolution_notes && !form.evolution_status) {
      setError("Informe pelo menos o status da evolução.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/api/sessions", {
        ...form,
        patient_id: patientId,
      });
      navigate(`/sessions/${data.session.id}/sign?patient=${patientId}`);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao registrar sessão");
    } finally {
      setSaving(false);
    }
  };

  // Agrupa técnicas por categoria
  const techniquesByCategory = techniques.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  const activePlan = patient?.plans?.find((p) => p.status === "Em andamento");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="text-gray-500 text-xl"
        >
          ←
        </button>
        <div>
          <h1 className="font-bold text-gray-800">Nova Sessão</h1>
          <p className="text-xs text-gray-400">{patient?.name}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Info do plano */}
        {activePlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-sm font-medium text-blue-800">
              {activePlan.title}
            </p>
            <p className="text-sm text-blue-600">
              Sessão {form.session_number}
              {activePlan.total_sessions
                ? ` de ${activePlan.total_sessions}`
                : ""}
            </p>
            {activePlan.total_sessions && (
              <div className="h-2 bg-blue-100 rounded-full mt-2">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{
                    width: `${Math.min((form.session_number / activePlan.total_sessions) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Data e duração */}
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

        {/* Escala de dor */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-4">
          <PainScale
            label="🔴 Dor no início da sessão"
            value={form.pain_scale_start}
            onChange={(v) => set("pain_scale_start", v)}
          />
          <PainScale
            label="🟢 Dor no final da sessão"
            value={form.pain_scale_end}
            onChange={(v) => set("pain_scale_end", v)}
          />
        </div>

        {/* Técnicas */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">
            🛠️ Técnicas utilizadas
          </h3>
          {Object.entries(techniquesByCategory).map(([category, techs]) => (
            <div key={category} className="mb-3">
              <p className="text-xs text-gray-400 uppercase mb-2">{category}</p>
              <div className="space-y-1">
                {techs.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl
                               hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.techniques_used.includes(t.id)}
                      onChange={() => toggleTechnique(t.id)}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{t.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Status da evolução */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">📈 Evolução</h3>
          <div className="flex gap-2 mb-4">
            <StatusButton
              label="✅ Melhorou"
              value="Melhorou"
              current={form.evolution_status}
              color="bg-green-500 border-green-500"
              onChange={(v) => set("evolution_status", v)}
            />
            <StatusButton
              label="➡️ Estável"
              value="Estável"
              current={form.evolution_status}
              color="bg-yellow-500 border-yellow-500"
              onChange={(v) => set("evolution_status", v)}
            />
            <StatusButton
              label="⬇️ Piorou"
              value="Piorou"
              current={form.evolution_status}
              color="bg-red-500 border-red-500"
              onChange={(v) => set("evolution_status", v)}
            />
          </div>
          <textarea
            value={form.evolution_notes}
            onChange={(e) => set("evolution_notes", e.target.value)}
            placeholder="Descreva a evolução do paciente nesta sessão..."
            rows={6}
            className="w-full border border-gray-300 rounded-xl px-4 py-3
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Objetivo da próxima sessão */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">
            🎯 Objetivo da próxima sessão
          </h3>
          <div className="space-y-1 mb-3">
            {goals.map((g) => (
              <label
                key={g.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl
                   hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="goal"
                  checked={form.next_goal_id === String(g.id)} // ← String()
                  onChange={() => {
                    set("next_goal_id", String(g.id)); // ← String()
                    set("next_goal_custom", "");
                  }}
                  className="w-5 h-5 accent-blue-600"
                />
                <span className="text-sm text-gray-700">{g.name}</span>
              </label>
            ))}
            <label
              className="flex items-center gap-3 px-3 py-2 rounded-xl
                       hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name="goal"
                checked={form.next_goal_id === "custom"}
                onChange={() => set("next_goal_id", "custom")}
                className="w-5 h-5 accent-blue-600"
              />
              <span className="text-sm text-gray-700">Outro</span>
            </label>
          </div>
          {form.next_goal_id === "custom" && (
            <input
              value={form.next_goal_custom}
              onChange={(e) => set("next_goal_custom", e.target.value)}
              placeholder="Descreva o objetivo personalizado..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Pagamento */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-4">
          <h3 className="font-semibold text-gray-700">
            💰 Pagamento (opcional)
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor (R$)
            </label>
            <input
              value={form.payment_amount}
              onChange={(e) => set("payment_amount", e.target.value)}
              type="number"
              placeholder="0,00"
              className="w-full border border-gray-300 rounded-xl px-4 py-3
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de pagamento
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("payment_method", m)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition
                    ${
                      form.payment_method === m
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-300"
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white
                     font-semibold rounded-xl py-4 transition disabled:opacity-50"
        >
          {saving ? "Salvando..." : "✅ Registrar Sessão"}
        </button>
      </div>
    </div>
  );
}
