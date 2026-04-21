import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Captura um elemento HTML e gera um PDF A4 com suporte a múltiplas páginas
 */
export const generatePDF = async (elementId, fileName) => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error("Elemento do relatório não encontrado.");
    return;
  }

  try {
    // 1. Captura do HTML
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    // 2. Configuração do PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 3. Dimensões e Proporções
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width; // Altura total da imagem em mm
    
    // --- 🚀 INÍCIO DA LÓGICA DE MÚLTIPLAS PÁGINAS ---
    let heightLeft = imgHeight;
    let position = 0;

    // Adiciona a primeira página
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    // 4. Enquanto houver conteúdo sobrando, adiciona novas páginas
    while (heightLeft > 0) {
      position = heightLeft - imgHeight; // Move a "janela" da imagem para cima
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    // --- 🏁 FIM DA LÓGICA DE MÚLTIPLAS PÁGINAS ---

    // 5. Download
    pdf.save(`${fileName}.pdf`);
    
  } catch (error) {
    console.error("Erro ao gerar PDF da sessão:", error);
  }
};