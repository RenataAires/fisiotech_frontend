import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Captura um elemento HTML e gera um PDF A4
 * @param {string} elementId - O ID da div que contém o relatório
 * @param {string} fileName - Nome do arquivo final (ex: Sessao_Cecilia_14-04-2026)
 */
export const generatePDF = async (elementId, fileName) => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error("Elemento do relatório não encontrado.");
    return;
  }

  try {
    // 1. Tira uma "foto" do elemento HTML com alta qualidade (scale: 2)
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    // 2. Configura o documento PDF para A4 (retrato)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 3. Calcula a proporção matemática para caber na folha A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // 4. Cola a imagem no PDF e aciona o download
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
    
  } catch (error) {
    console.error("Erro ao gerar PDF da sessão:", error);
  }
};