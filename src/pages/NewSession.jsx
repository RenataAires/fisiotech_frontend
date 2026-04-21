import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import api from "../services/api";

// --- Componentes Auxiliares ---
const PainScale = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="flex gap-1 flex-wrap">
      {[...Array(11)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`w-9 h-9 rounded-lg text-sm font-bold border transition
            ${value === i
              ? i <= 3 ? "bg-green-500 text-white border-green-500"
              : i <= 6 ? "bg-yellow-500 text-white border-yellow-500"
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

const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Transferência"];
const DURATIONS = [30, 45, 60, 90];

// --- Componente Principal ---
export default function NewSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: sessionIdFromUrl } = useParams();

  const [patientId, setPatientId] = useState(searchParams.get("patient"));
  const sessionId = sessionIdFromUrl || searchParams.get("session_id");

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
        let currentPatientId = patientId;

        if (sessionIdFromUrl) {
          const sessionRes = await api.get(`/api/sessions/${sessionIdFromUrl}`);
          currentPatientId = sessionRes.data.patient_id;
          setPatientId(currentPatientId);
          
          setForm(prev => ({
            ...prev,
            session_date: new Date(sessionRes.data.session_date).toISOString().slice(0, 16),
            session_number: sessionRes.data.session_number,
            treatment_plan_id: sessionRes.data.treatment_plan_id,
            // Carrega valores financeiros se existirem
            payment_amount: sessionRes.data.payment_amount?.toString() || "",
            payment_method: sessionRes.data.payment_method || ""
          }));
        }

        if (!currentPatientId) {
          navigate("/patients");
          return;
        }

        const [patientRes, techniquesRes, goalsRes] = await Promise.all([
          api.get(`/api/patients/${currentPatientId}`),
          api.get("/api/techniques"),
          api.get("/api/goals"),
        ]);

        setPatient(patientRes.data);
        setTechniques(techniquesRes.data);
        setGoals(goalsRes.data);

        if (!sessionIdFromUrl) {
          const plans = patientRes.data.plans || [];
          const activePlan = plans.find(p => p.status === "Em andamento" || p.status === "Ativo") || plans[0];

          if (activePlan) {
            setForm(prev => ({
              ...prev,
              treatment_plan_id: activePlan.id,
              session_number: parseInt(activePlan.sessions_done || 0) + 1,
              payment_amount: ((Number(activePlan.base_value) || 0) + (Number(activePlan.transport_fee) || 0)).toString()
            }));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        navigate("/patients");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, sessionIdFromUrl, navigate]);

  const handleSubmit = async () => {
    if (!form.treatment_plan_id) {
      setError("Plano de tratamento não identificado.");
      return;
    }
    setSaving(true);
    setError("");

    // 🚀 TRATAMENTO PARA "PAGAR DEPOIS"
    const paymentAmount = form.payment_amount ? parseFloat(form.payment_amount) : null;
    const paymentMethod = form.payment_method || null;

    try {
      const sessionData = {
        ...form,
        payment_amount: paymentAmount,
        payment_method: paymentMethod,
        patient_id: patientId,
      };

      let response;
      if (sessionId) {
        response = await api.put(`/api/sessions/${sessionId}`, {
          ...sessionData,
          status: "Realizada",
        });
      } else {
        response = await api.post("/api/sessions", sessionData);
      }

      const finalSessionId = sessionId || response.data.session.id;

      // Só registra pagamento no banco se houver valor preenchido
      if (paymentAmount && paymentMethod) {
        await api.post("/api/payments", {
          patient_id: patientId,
          treatment_plan_id: form.treatment_plan_id,
          session_id: finalSessionId,
          amount: paymentAmount,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString().split('T')[0],
          notes: `Pagamento da sessão ${form.session_number}`
        });
      }

      navigate(`/sessions/${finalSessionId}/sign?patient=${patientId}`);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError(err.response?.data?.error || "Erro ao registrar atendimento");
    } finally {
      setSaving(false);
    }
  };

  const techniquesByCategory = techniques.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  if (loading) return <div className="p-10 text-center italic text-gray-400">Carregando prontuário...</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <div className="bg-white shadow px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/patients/${patientId}`)} className="text-gray-500 text-xl">←</button>
        <div>
          <h1 className="font-bold text-gray-800">{sessionIdFromUrl ? 'Atender Agendamento' : 'Nova Sessão'}</h1>
          <p className="text-xs text-gray-400">{patient?.name}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Banner do Plano */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm font-medium text-blue-800">
            {patient?.plans?.find(p => p.id === form.treatment_plan_id)?.title || 'Plano de Tratamento'}
          </p>
          <p className="text-sm text-blue-600 font-bold uppercase">Sessão nº {form.session_number}</p>
        </div>

        {/* Formulário Clínico */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-4">
          <label className="block text-sm font-medium text-gray-700">Data e Hora</label>
          <input type="datetime-local" value={form.session_date} onChange={(e) => set("session_date", e.target.value)} className="w-full border rounded-xl p-3" />
          
          <PainScale label="🔴 Dor no Início" value={form.pain_scale_start} onChange={(v) => set("pain_scale_start", v)} />
          <PainScale label="🟢 Dor no Final" value={form.pain_scale_end} onChange={(v) => set("pain_scale_end", v)} />
        </div>

        {/* Técnicas */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">🛠️ Técnicas</h3>
          {Object.entries(techniquesByCategory).map(([category, techs]) => (
            <div key={category} className="mb-4">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">{category}</p>
              {techs.map((t) => (
                <label key={t.id} className="flex items-center gap-3 py-1">
                  <input type="checkbox" checked={form.techniques_used.includes(t.id)} onChange={() => toggleTechnique(t.id)} className="w-5 h-5 accent-blue-600" />
                  <span className="text-sm">{t.name}</span>
                </label>
              ))}
            </div>
          ))}
        </div>

        {/* Evolução */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">📈 Evolução</h3>
          <div className="flex gap-2 mb-4">
            {["Melhorou", "Estável", "Piorou"].map(s => (
              <StatusButton key={s} label={s} value={s} current={form.evolution_status} color={s === "Melhorou" ? "bg-green-500" : s === "Estável" ? "bg-yellow-500" : "bg-red-500"} onChange={(v) => set("evolution_status", v)} />
            ))}
          </div>
          <textarea value={form.evolution_notes} onChange={(e) => set("evolution_notes", e.target.value)} placeholder="Notas de evolução..." rows={4} className="w-full border rounded-xl p-3" />
        </div>

        {/* Financeiro (Opcional) */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-4">
          <h3 className="font-semibold text-gray-700">💰 Pagamento</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" step="0.01" value={form.payment_amount} onChange={(e) => set("payment_amount", e.target.value)} placeholder="Valor R$" className="border rounded-xl p-3" />
            <select value={form.payment_method} onChange={(e) => set("payment_method", e.target.value)} className="border rounded-xl p-3 bg-white text-sm">
              <option value="">Pagar depois</option>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

        <button onClick={handleSubmit} disabled={saving} className="w-full bg-green-600 text-white font-bold rounded-xl py-4 hover:bg-green-700 transition disabled:opacity-50">
          {saving ? "Salvando..." : "✅ Finalizar Atendimento"}
        </button>
      </div>
    </div>
  );
}