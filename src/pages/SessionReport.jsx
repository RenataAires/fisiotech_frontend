import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { generatePDF } from "../utils/pdfGenerator";

// 1. Dicionário de Jurisdição do CREFITO (Mapeamento de Regiões)
const REGIOES_CREFITO = {
  1: "AL, PE, PB, RN",
  2: "RJ",
  3: "SP",
  4: "MG",
  5: "RS",
  6: "CE, PI",
  7: "BA, SE",
  8: "PR",
  9: "MT, MS, AC, RO",
  10: "SC",
  11: "DF, GO",
  12: "AM, PA, AP, MA, RR",
  13: "MS",
  14: "PI",
  15: "ES",
  16: "MA",
};

export default function SessionReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const professional = {
    name: "Joelison Rocha",
    numero: "385742-F",
    regiao: 11,
  };

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/sessions/${id}`);
        setSession(data);
      } catch (err) {
        console.error("Erro ao carregar dados da sessão:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSessionData();
  }, [id]);

  const handleExportPDF = () => {
    const fileName = `Relatorio_${session.patient_name.replace(/\s/g, "_")}_Sessao_${session.session_number}`;
    generatePDF("pdf-relatorio", fileName);
  };

  if (loading)
    return (
      <div className="p-10 text-center font-sans">
        🔄 Carregando prontuário clínico...
      </div>
    );
  if (!session)
    return (
      <div className="p-10 text-center text-red-500">
        Sessão não encontrada.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      {/* Barra de Ações (Não sai no PDF) */}
      <div className="flex gap-4 mb-6 no-print">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition shadow"
        >
          ← Voltar
        </button>
        <button
          onClick={handleExportPDF}
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow"
        >
          📥 Baixar PDF Oficial
        </button>
      </div>

      {/* ÁREA DO RELATÓRIO (Simula Folha A4) */}
      <div
        id="pdf-relatorio"
        className="w-[794px] bg-white text-gray-800 p-[20mm] leading-relaxed font-serif shadow-2xl border border-gray-200"
      >
        {/* --- CABEÇALHO COM LÓGICA DE REGIÃO --- */}
        <div className="flex justify-between items-center pb-6 border-b-2 border-gray-800 mb-8 font-sans">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-tighter">
              {professional.name}
            </h1>
            <p className="text-sm font-semibold text-gray-700">
              Fisioterapeuta | CREFITO {professional.regiao} /{" "}
              {professional.numero}
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
              Jurisdição: {REGIOES_CREFITO[professional.regiao]}
            </p>
          </div>
          <div className="text-right">
            <div className="bg-gray-100 px-3 py-1 rounded text-[10px] font-bold text-gray-500 tracking-widest mb-1">
              PRONTUÁRIO CLÍNICO
            </div>
            <p className="text-[9px] text-gray-400 italic">
              Documento Particular e Confidencial
            </p>
          </div>
        </div>

        {/* Identificação do Paciente */}
        <div className="py-4 border-b border-gray-100 text-sm mb-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <p>
              <span className="font-bold">PACIENTE:</span>{" "}
              {session.patient_name}
            </p>
            <p>
              <span className="font-bold">DATA DA SESSÃO:</span>{" "}
              {new Date(session.session_date).toLocaleString("pt-BR")}
            </p>
            <p>
              <span className="font-bold">PLANO:</span>{" "}
              {session.plan_title || "Atendimento Particular"}
            </p>
            <p>
              <span className="font-bold">SESSÃO Nº:</span>{" "}
              {session.session_number} / {session.total_sessions || "--"}
            </p>
          </div>
        </div>

        {/* Evolução e Conduta Técnica */}
        <div className="py-6 border-b border-gray-100">
          <h3 className="font-bold text-md mb-4 text-blue-800 font-sans uppercase border-l-4 border-blue-800 pl-3">
            1. Evolução e Conduta Terapêutica
          </h3>
          <div className="space-y-5 text-sm">
            <div className="flex gap-10">
              <p>
                <span className="font-bold">Status:</span>{" "}
                {session.evolution_status || "Estável"}
              </p>
              <p>
                <span className="font-bold">Escala de Dor (EVA):</span>{" "}
                {session.pain_scale_start}/10 → {session.pain_scale_end}/10
              </p>
            </div>

            <p>
              <span className="font-bold">Recursos e Técnicas Utilizadas:</span>
              <br />
              <span className="text-gray-700">
                {session.techniques?.length > 0
                  ? session.techniques.join(", ")
                  : "Cinesioterapia e orientações gerais."}
              </span>
            </p>

            <div className="bg-gray-50 p-4 rounded border border-gray-100">
              <span className="font-bold block mb-1">Evolução Detalhada:</span>
              <p className="italic text-gray-700 whitespace-pre-wrap text-justify break-words leading-relaxed">
                "
                {session.evolution_notes ||
                  "O paciente segue o plano de tratamento sem intercorrências no período."}
                "
              </p>
            </div>
          </div>
        </div>

        {/* Planejamento Próximo Atendimento */}
        <div className="py-4 border-b border-gray-100 text-sm">
          <p className="text-blue-900 font-sans">
            <span className="font-bold">OBJETIVO PRÓXIMA SESSÃO:</span>{" "}
            {session.next_goal_name ||
              session.next_goal_custom ||
              "Progressão de carga e manutenção clínica."}
          </p>
        </div>

        {/* Assinatura e Validação */}
        <div className="mt-16 flex flex-col items-center">
          <div className="w-full flex justify-center mb-4">
            {session.signature ? (
              <img
                src={session.signature}
                alt="Assinatura"
                className="h-24 object-contain mix-blend-multiply"
              />
            ) : (
              <div className="h-24 w-64 border-b border-gray-300 flex items-end justify-center pb-2 text-[10px] text-gray-300">
                CAMPO PARA ASSINATURA DO PACIENTE
              </div>
            )}
          </div>
          <div className="w-72 border-t border-gray-800"></div>
          <p className="text-xs font-bold mt-2 uppercase">
            {session.patient_name}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            {session.signed_at
              ? `Documento validado via sistema em ${new Date(session.signed_at).toLocaleString("pt-BR")}`
              : "Aguardando validação digital"}
          </p>
        </div>

        {/* Rodapé do PDF */}
        <div className="mt-20 text-center text-[8px] text-gray-300 font-sans uppercase tracking-[3px]">
          FisioTech - Sistema de Gestão de Fisioterapia
        </div>
      </div>
    </div>
  );
}
