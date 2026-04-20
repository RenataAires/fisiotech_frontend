import React from 'react';
import { generatePDF } from '../utils/pdfGenerator'; // Importando a função que você criou

export default function SessionReport() {
  // Dados simulados (No futuro, virão do seu Banco de Dados / Estado do React)
  const reportData = {
    patientName: "Cecília Meireles",
    date: "18/04/2026 às 19:29",
    duration: "45 minutos",
    sessionNumber: "1 de 5",
    status: "Melhorou",
    painStart: 8,
    painEnd: 5,
    techniques: "Cinesioterapia, Laser Terapêutico",
    observations: "Paciente relatou alívio após aplicação do laser. Exercícios de cinesioterapia executados com boa amplitude.",
    nextGoal: "Fortalecer musculatura estabilizadora",
    signatureDate: "18/04/2026 20:43",
    signatureImage: null // Aqui entrará o Base64 do canvas de assinatura
  };

  const handleExportPDF = () => {
    // Passamos o ID da div principal e o nome do arquivo
    generatePDF('pdf-relatorio', `Evolucao_${reportData.patientName.replace(' ', '_')}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      
      {/* Botão de Ação - Fica FORA do PDF */}
      <button 
        onClick={handleExportPDF}
        className="mb-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition"
      >
        Gerar e Baixar PDF
      </button>

      {/* A DIV DO PDF
        Tudo dentro desta div com id="pdf-relatorio" será "fotografado".
        Coloquei uma largura fixa (w-[794px]) que simula a proporção de uma folha A4.
      */}
      <div id="pdf-relatorio" className="w-[794px] bg-white border border-gray-300 shadow-sm text-gray-800">
        
        {/* Cabeçalho */}
        <div className="text-center py-6 border-b-2 border-gray-800 bg-gray-50">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-blue-900">FisioTech</h1>
          <h2 className="text-lg font-semibold text-gray-600">Relatório de Sessão Clínica</h2>
        </div>

        {/* Informações do Paciente */}
        <div className="p-6 border-b border-gray-300">
          <div className="grid grid-cols-2 gap-4">
            <p><span className="font-bold">Paciente:</span> {reportData.patientName}</p>
            <p><span className="font-bold">Data:</span> {reportData.date}</p>
            <p><span className="font-bold">Duração:</span> {reportData.duration}</p>
            <p><span className="font-bold">Sessão:</span> {reportData.sessionNumber}</p>
          </div>
        </div>

        {/* Evolução Clínica */}
        <div className="p-6 border-b border-gray-300">
          <h3 className="font-bold text-lg mb-4 text-blue-800">EVOLUÇÃO</h3>
          <div className="space-y-3">
            <p><span className="font-bold">Status:</span> ✅ {reportData.status}</p>
            <p><span className="font-bold">Escala de Dor:</span> Início: {reportData.painStart} → Final: {reportData.painEnd}</p>
            <p><span className="font-bold">Técnicas Aplicadas:</span> {reportData.techniques}</p>
            <div>
              <span className="font-bold">Observações:</span>
              <p className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                {reportData.observations}
              </p>
            </div>
          </div>
        </div>

        {/* Próximo Objetivo */}
        <div className="p-6 border-b border-gray-300 bg-blue-50">
          <p><span className="font-bold text-blue-900">Próximo objetivo:</span> {reportData.nextGoal}</p>
        </div>

        {/* Assinatura */}
        <div className="p-6 text-center">
          <h3 className="font-bold text-gray-600 mb-6">ASSINATURA DO PACIENTE / RESPONSÁVEL</h3>
          
          <div className="flex justify-center mb-4">
            {reportData.signatureImage ? (
              <img 
                src={reportData.signatureImage} 
                alt="Assinatura" 
                className="h-24 object-contain border-b border-gray-800 px-8"
              />
            ) : (
              /* Linha de assinatura vazia caso a imagem ainda não exista */
              <div className="w-64 border-b-2 border-gray-800 h-24"></div> 
            )}
          </div>
          
          <p className="text-sm text-gray-500">Assinado digitalmente em: {reportData.signatureDate}</p>
          <p className="text-xs text-gray-400 mt-2">Validação de Registro FisioTech</p>
        </div>

      </div>
    </div>
  );
}