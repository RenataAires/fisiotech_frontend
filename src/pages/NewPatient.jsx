import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Chip = ({ label, selected, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`px-4 py-2 rounded-full text-sm font-medium border transition
      ${
        selected
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-600 border-gray-300"
      }`}
  >
    {label}
  </button>
);

const YesNo = ({ value, onChange }) => (
  <div className="flex gap-3">
    {["Sim", "Não"].map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt === "Sim")}
        className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition
          ${
            value === (opt === "Sim")
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300"
          }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

const PainScale = ({ value, onChange }) => (
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
);

const SPECIALTIES = [
  "Ortopedia",
  "Neurológica",
  "Traumatologia",
  "Reabilitação Física",
];

const BODY_REGIONS = [
  "Coluna lombar",
  "Coluna cervical",
  "Joelho",
  "Ombro",
  "Quadril",
  "Tornozelo/Pé",
  "Punho/Mão",
  "Cotovelo",
  "Coxa",
  "Panturrilha",
  "Cabeça",
  "Tórax",
];

const AGGRAVATING = [
  "Movimento",
  "Repouso",
  "Frio",
  "Calor",
  "Esforço",
  "Noite",
  "Manhã",
  "Postura sentada",
  "Postura em pé",
  "Caminhada",
];

const LIMITATIONS = [
  "Dificuldade para caminhar",
  "Dificuldade para subir escadas",
  "Dificuldade para se levantar",
  "Dificuldade para dormir",
  "Limitação de movimento do braço",
  "Limitação de movimento da perna",
  "Dificuldade de equilíbrio",
  "Dificuldade para se vestir",
];

const GOALS = [
  "Reduzir dor",
  "Melhorar mobilidade",
  "Fortalecer musculatura",
  "Voltar a caminhar",
  "Recuperação pós-cirúrgica",
  "Melhorar postura",
  "Ganhar independência",
  "Retorno ao esporte",
];

const SYMPTOM_ONSET = [
  "Menos de 1 semana",
  "1 a 4 semanas",
  "1 a 3 meses",
  "3 a 6 meses",
  "6 a 12 meses",
  "Mais de 1 ano",
];

const STEPS = [
  "Dados Básicos",
  "Queixa Principal",
  "Histórico",
  "Plano de Tratamento",
];

export default function NewPatient() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    birth_date: "",
    address: "",
    health_plan: "",
    specialty: "",
    body_regions: [],
    pain_scale: null,
    aggravating_factors: [],
    symptom_onset: "",
    main_complaint: "",
    has_pain: null,
    pain_location: "",
    limitations: [],
    has_surgery: null,
    surgeries_fractures: "",
    has_medication: null,
    current_medications: "",
    medical_history: "",
    physical_activity: "",
    profession: "",
    patient_goals: [],
    additional_notes: "",
    plan_title: "",
    total_sessions: "",
    lgpd_consent: false,
    // Dentro do useState do form, adicione:
    schedule_first_session: false,
    first_session_date: "",
    first_session_time: "",
  });

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleArray = (field, value) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }));
  };

  const handleSubmit = async () => {

    if (loading) return;

    if (!form.lgpd_consent) {
      setError("É necessário aceitar o termo de consentimento");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        aggravating_factors: form.aggravating_factors.join(", "),
        main_complaint: [...form.body_regions, form.main_complaint]
          .filter(Boolean)
          .join(", "),
        patient_goals: form.patient_goals.join(", "),
        plan_title: form.plan_title || `Plano - ${form.specialty || "Geral"}`,
      };

      // ← Chama a API apenas UMA vez e guarda o resultado
      const { data } = await api.post("/api/patients", payload);

      // Agenda primeira sessão se solicitado
      if (
        form.schedule_first_session &&
        form.first_session_date &&
        form.first_session_time
      ) {
        const sessionDate = `${form.first_session_date}T${form.first_session_time}`;

        await api.post("/api/sessions/schedule", {
          patient_id: data.patient.id,
          treatment_plan_id: data.plan.id,
          session_date: sessionDate,
          session_number: 1,
        });
      }

      navigate("/"); // ← navega só no final

    } catch (err) {
      console.error("Erro no cadastro", err);
      setError(err.response?.data?.error || "Erro ao cadastrar paciente");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => (step > 0 ? setStep((s) => s - 1) : navigate("/"))}
          className="text-gray-500 text-xl"
        >
          ←
        </button>
        <div>
          <h1 className="font-bold text-gray-800">Novo Paciente</h1>
          <p className="text-xs text-gray-400">{STEPS[step]}</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-1 bg-blue-600 transition-all"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* ETAPA 1 — Dados Básicos */}
        {step === 0 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo *
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Nome do paciente"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone / WhatsApp *
              </label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(62) 99999-9999"
                type="tel"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de nascimento
              </label>
              <input
                value={form.birth_date}
                onChange={(e) => set("birth_date", e.target.value)}
                type="date"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço completo *
              </label>
              <textarea
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Convênio / Plano de saúde
              </label>
              <input
                value={form.health_plan}
                onChange={(e) => set("health_plan", e.target.value)}
                placeholder="Particular, Unimed, etc."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* ETAPA 2 — Queixa Principal */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Especialidade
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={form.specialty === s}
                    onToggle={() => set("specialty", s)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Região do corpo afetada
              </label>
              <div className="flex flex-wrap gap-2">
                {BODY_REGIONS.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    selected={form.body_regions.includes(r)}
                    onToggle={() => toggleArray("body_regions", r)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Escala de dor atual
              </label>
              <PainScale
                value={form.pain_scale}
                onChange={(v) => set("pain_scale", v)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Início dos sintomas
              </label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_ONSET.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={form.symptom_onset === s}
                    onToggle={() => set("symptom_onset", s)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Fatores de piora
              </label>
              <div className="flex flex-wrap gap-2">
                {AGGRAVATING.map((a) => (
                  <Chip
                    key={a}
                    label={a}
                    selected={form.aggravating_factors.includes(a)}
                    onToggle={() => toggleArray("aggravating_factors", a)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações adicionais
              </label>
              <textarea
                value={form.main_complaint}
                onChange={(e) => set("main_complaint", e.target.value)}
                placeholder="Descreva outros detalhes relevantes..."
                rows={5}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </>
        )}

        {/* ETAPA 3 — Histórico */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Limitações funcionais
              </label>
              <div className="space-y-2">
                {LIMITATIONS.map((l) => (
                  <label
                    key={l}
                    className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.limitations.includes(l)}
                      onChange={() => toggleArray("limitations", l)}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{l}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cirurgias ou fraturas anteriores?
              </label>
              <YesNo
                value={form.has_surgery}
                onChange={(v) => set("has_surgery", v)}
              />
              {form.has_surgery && (
                <textarea
                  value={form.surgeries_fractures}
                  onChange={(e) => set("surgeries_fractures", e.target.value)}
                  placeholder="Descreva as cirurgias ou fraturas..."
                  rows={4}
                  className="w-full mt-3 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usa medicamentos?
              </label>
              <YesNo
                value={form.has_medication}
                onChange={(v) => set("has_medication", v)}
              />
              {form.has_medication && (
                <textarea
                  value={form.current_medications}
                  onChange={(e) => set("current_medications", e.target.value)}
                  placeholder="Liste os medicamentos em uso..."
                  rows={4}
                  className="w-full mt-3 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profissão
              </label>
              <input
                value={form.profession}
                onChange={(e) => set("profession", e.target.value)}
                placeholder="Ex: Professora, Motorista..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* ETAPA 4 — Plano de Tratamento */}
        {step === 3 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Objetivo principal
              </label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <Chip
                    key={g}
                    label={g}
                    selected={form.patient_goals.includes(g)}
                    onToggle={() => toggleArray("patient_goals", g)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total de sessões previstas
              </label>
              <input
                value={form.total_sessions}
                onChange={(e) => set("total_sessions", e.target.value)}
                type="number"
                placeholder="Ex: 10"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações do plano
              </label>
              <textarea
                value={form.additional_notes}
                onChange={(e) => set("additional_notes", e.target.value)}
                placeholder="Conduta inicial, observações relevantes..."
                rows={6}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Agendamento da primeira sessão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Agendar primeira sessão?
              </label>
              <div className="flex gap-3 mb-3">
                {["Sim", "Não"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set("schedule_first_session", opt === "Sim")}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition
          ${
            form.schedule_first_session === (opt === "Sim")
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300"
          }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {form.schedule_first_session && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={form.first_session_date}
                      onChange={(e) =>
                        set("first_session_date", e.target.value)
                      }
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={form.first_session_time}
                      onChange={(e) =>
                        set("first_session_time", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-xl px-4 py-3
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 border border-blue-200 cursor-pointer">
              <input
                type="checkbox"
                checked={form.lgpd_consent}
                onChange={(e) => set("lgpd_consent", e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-blue-600"
              />
              <span className="text-sm text-gray-700">
                Autorizo o armazenamento e uso dos meus dados clínicos para fins
                de acompanhamento fisioterapêutico, conforme a LGPD.
              </span>
            </label>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </>
        )}

        {/* Botão de navegação */}
        <div className="pt-2">
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-4 transition"
            >
              Próximo →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-4 transition disabled:opacity-50"
            >
              {loading ? "Salvando..." : "✅ Cadastrar Paciente"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
