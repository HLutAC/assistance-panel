import { jsPDF } from 'jspdf';

export const generateNativePDF = (summary: any, charts: any, selectedDate: string) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);

  // --- Header ---
  doc.setFillColor(29, 78, 216); // Blue-700
  doc.rect(margin, margin, 4, 4, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-400
  doc.text("ASSISTANCE / OS_V4.2", margin + 6, margin + 3.5);

  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text("ASSISTANCE_LOG", margin, margin + 15);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text("Reporte generado automáticamente mediante sistema de auditoría", margin, margin + 20);

  // Timeline & Info
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text("TIMESTAMP EMISIÓN", pageWidth - margin, margin + 4, { align: 'right' });
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString(), pageWidth - margin, margin + 8, { align: 'right' });

  // Divider
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(1.5);
  doc.line(margin, margin + 25, pageWidth - margin, margin + 25);

  // --- Context Grid ---
  const gridY = margin + 35;
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(241, 245, 249); // Slate-100
  doc.roundedRect(margin, gridY, contentWidth / 2 - 4, 20, 3, 3, 'FD');
  doc.roundedRect(margin + contentWidth / 2 + 4, gridY, contentWidth / 2 - 4, 20, 3, 3, 'FD');

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("CONTEXTO TEMPORAL", margin + 5, gridY + 6);
  doc.text("ALCANCE DE AUDITORÍA", margin + contentWidth / 2 + 9, gridY + 6);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(selectedDate || "HISTÓRICO COMPLETO", margin + 5, gridY + 13);
  doc.text("TODOS LOS NODOS ACTIVOS", margin + contentWidth / 2 + 9, gridY + 13);

  // --- KPIs ---
  const kpiY = gridY + 30;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("RESUMEN OPERATIVO", margin, kpiY);

  const kpiData = [
    { label: "INGRESOS", value: summary?.ingresos || 0 },
    { label: "SALIDAS", value: summary?.salidas || 0 },
    { label: "USUARIOS", value: charts?.summary?.unique_users || 0 },
    { label: "HORA PICO", value: charts?.summary?.peak_hour || "N/A" }
  ];

  kpiData.forEach((kpi, i) => {
    const x = margin + (i * (contentWidth / 4));
    doc.setDrawColor(241, 245, 249);
    doc.roundedRect(x, kpiY + 4, (contentWidth / 4) - 2, 18, 2, 2, 'D');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.label, x + 4, kpiY + 9);
    doc.setFontSize(12);
    doc.setTextColor(29, 78, 216);
    doc.text(String(kpi.value), x + 4, kpiY + 17);
  });

  // --- Table ---
  const tableY = kpiY + 40;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("DISTRIBUCIÓN POR CARRERA", margin, tableY);

  // Header Table
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("FACULTAD / ESCUELA PROFESIONAL", margin, tableY + 8);
  doc.text("VOLUMEN", pageWidth - margin - 35, tableY + 8, { align: 'right' });
  doc.text("IMPACTO %", pageWidth - margin, tableY + 8, { align: 'right' });
  
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.5);
  doc.line(margin, tableY + 10, pageWidth - margin, tableY + 10);

  // Rows
  let rowY = tableY + 17;
  const escuelas = charts?.escuela || [];
  const total = escuelas.reduce((acc: number, cur: any) => acc + cur.value, 0) || 1;

  escuelas.slice(0, 12).forEach((esc: any) => {
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(esc.name.toUpperCase(), margin, rowY);
    
    doc.setTextColor(15, 23, 42);
    doc.text(String(esc.value), pageWidth - margin - 35, rowY, { align: 'right' });
    
    const perc = ((esc.value / total) * 100).toFixed(1) + "%";
    doc.setTextColor(148, 163, 184);
    doc.text(perc, pageWidth - margin, rowY, { align: 'right' });
    
    rowY += 10;
    doc.setDrawColor(248, 250, 252);
    doc.line(margin, rowY - 2, pageWidth - margin, rowY - 2);
  });

  // --- Footer ---
  const footerY = pageHeight - margin;
  doc.setFontSize(6);
  doc.setTextColor(203, 213, 225);
  doc.text("SISTEMA AUTOMATIZADO DE AUDITORÍA DE ACCESOS - UNAM", margin, footerY);
  doc.text(`CÓDIGO DE VERIFICACIÓN: ASSISTANCE_${Math.random().toString(36).substring(7).toUpperCase()}`, margin, footerY + 3);

  // QR Placeholders
  doc.setDrawColor(241, 245, 249);
  doc.rect(pageWidth - margin - 20, footerY - 20, 20, 20, 'D');
  doc.setFontSize(5);
  doc.text("QR AUDITORÍA", pageWidth - margin - 10, footerY - 10, { align: 'center' });

  doc.save(`Reporte_Assistance_${selectedDate || 'General'}.pdf`);
};
