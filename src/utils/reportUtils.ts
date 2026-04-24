import { jsPDF } from 'jspdf';

export const generateNativePDF = (summary: any, charts: any, selectedDate: string) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);

  const colors = {
    primary: [29, 78, 216],       // Blue-700
    primaryLight: [147, 197, 253], // Blue-300
    emerald: [5, 150, 105],      // Emerald-600
    emeraldLight: [167, 243, 208],// Emerald-200
    amber: [217, 119, 6],        // Amber-600
    rose: [225, 29, 72],         // Rose-600
    secondary: [15, 23, 42],      // Slate-900
    text: [51, 65, 85],           // Slate-700
    textLight: [100, 116, 139],   // Slate-500
    background: [248, 250, 252],  // Slate-50
    grid: [226, 232, 240]         // Slate-200
  };

  const drawHeader = (pageTitle: string) => {
    // Top Bar Decoration
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageWidth, 2, 'F');

    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, margin, 4, 4, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text("ASSISTANCE / UNAM / V4.2", margin + 6, margin + 3.5);

    doc.setFontSize(26);
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text(pageTitle, margin, margin + 15);
    
    doc.setFontSize(8);
    doc.text("REPORTE DE AUDITORÍA OPERATIVA", margin, margin + 20);

    // Timestamp
    doc.setFontSize(7);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text("EMITIDO EL", pageWidth - margin, margin + 3, { align: 'right' });
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.setFontSize(8);
    doc.text(new Date().toLocaleString(), pageWidth - margin, margin + 7, { align: 'right' });

    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, margin + 25, pageWidth - margin, margin + 25);
  };

  // --- PAGE 1: CORE ANALYTICS ---
  drawHeader("ANALYSIS_DASHBOARD");

  // Summary Metrics
  const summaryY = margin + 35;
  const metrics = [
    { label: "INGRESOS", value: summary?.ingresos || 0, sub: "Registrados" },
    { label: "SALIDAS", value: summary?.salidas || 0, sub: "Registrados" },
    { label: "USUARIOS", value: charts?.summary?.unique_users || 0, sub: "Únicos" },
    { label: "HORA PICO", value: charts?.summary?.peak_hour || "N/A", sub: "Flujo Max" }
  ];

  metrics.forEach((m, i) => {
    const x = margin + (i * (contentWidth / 4));
    doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
    doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2]);
    doc.roundedRect(x, summaryY, (contentWidth / 4) - 3, 22, 3, 3, 'FD');
    
    doc.setFontSize(6);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text(m.label, x + 4, summaryY + 6);
    
    doc.setFontSize(14);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(String(m.value), x + 4, summaryY + 14);
    
    doc.setFontSize(5);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text(m.sub, x + 4, summaryY + 19);
  });

  // --- PREMIUM HOURLY CHART ---
  const hourlyY = summaryY + 35;
  doc.setFontSize(9);
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.text("FLUJO TEMPORAL DE ACCESOS", margin, hourlyY);
  doc.setFontSize(7);
  doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  doc.text("Distribución de ingresos y salidas por hora", margin, hourlyY + 4);

  // Legend for Hourly Chart
  doc.setFontSize(6);
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(pageWidth - margin - 40, hourlyY, 3, 3, 'F');
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.text("INGRESOS", pageWidth - margin - 35, hourlyY + 2.5);
  
  doc.setFillColor(colors.emerald[0], colors.emerald[1], colors.emerald[2]);
  doc.rect(pageWidth - margin - 20, hourlyY, 3, 3, 'F');
  doc.text("SALIDAS", pageWidth - margin - 15, hourlyY + 2.5);

  const chartBoxH = 45;
  const barGap = 1.2;
  const hourlyData = charts?.hourly || [];
  const maxH = Math.max(...hourlyData.map((d: any) => d.ingresos + d.salidas), 10);

  // Background Grid Lines
  doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2]);
  doc.setLineWidth(0.05);
  for(let j=0; j<=4; j++) {
     const lineY = hourlyY + 10 + chartBoxH - (j * (chartBoxH / 4));
     doc.line(margin, lineY, margin + contentWidth, lineY);
  }

  hourlyData.forEach((d: any, i: number) => {
    const x = margin + 5 + (i * (contentWidth - 10) / 24);
    const bW = ((contentWidth - 10) / 24) - barGap;
    const baseLineY = hourlyY + 10 + chartBoxH;

    if (d.ingresos > 0) {
      const hIng = (d.ingresos / maxH) * chartBoxH;
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(x, baseLineY - hIng, bW, hIng, 0.3, 0.3, 'F');
    }
    
    if (d.salidas > 0) {
      const hSal = (d.salidas / maxH) * chartBoxH;
      const hIng = (d.ingresos / maxH) * chartBoxH;
      doc.setFillColor(colors.emerald[0], colors.emerald[1], colors.emerald[2]);
      doc.roundedRect(x, baseLineY - hIng - hSal, bW, hSal, 0.3, 0.3, 'F');
    }

    if (i % 3 === 0) {
      doc.setFontSize(5);
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.text(d.hora.split(':')[0], x, baseLineY + 4);
    }
  });

  // --- PREMIUM LANE CHART ---
  const laneY = hourlyY + 75;
  doc.setFontSize(9);
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.text("DETALLE POR PUNTO DE CONTROL (CARRIL)", margin, laneY);

  const lanes = (charts?.lane || []).slice(0, 5);
  const maxL = Math.max(...lanes.map((l: any) => l.ingresos + l.salidas), 1);

  const laneColors = [colors.primary, colors.emerald, colors.amber, colors.rose, colors.primaryLight];

  lanes.forEach((l: any, i: number) => {
    const yPos = laneY + 10 + (i * 12);
    const barW = ((l.ingresos + l.salidas) / maxL) * (contentWidth - 60);
    const currentColor = laneColors[i % laneColors.length];

    doc.setFontSize(7);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text(l.name.toUpperCase(), margin, yPos + 4.5);

    // Background Shadow
    doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
    doc.roundedRect(margin + 50, yPos, contentWidth - 50, 7, 1.5, 1.5, 'F');
    
    // Colored bar
    doc.setFillColor(currentColor[0], currentColor[1], currentColor[2]);
    doc.roundedRect(margin + 50, yPos, barW, 7, 1.5, 1.5, 'F');
    
    doc.setFontSize(7);
    doc.setTextColor(currentColor[0], currentColor[1], currentColor[2]);
    doc.text(String(l.ingresos + l.salidas), margin + 50 + barW + 3, yPos + 4.5);
  });

  // --- DURATION TREND (PAGE 1 BOTTOM) ---
  const durY = laneY + 75;
  doc.setFontSize(9);
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.text("TIEMPO PROMEDIO DE PERMANENCIA (HORAS)", margin, durY);
  doc.setFontSize(7);
  doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  doc.text("Tendencia de estancia promedio por hora de entrada", margin, durY + 4);

  const durationData = charts?.duration || [];
  const maxD = Math.max(...durationData.map((d: any) => d.horas), 1);
  const durChartH = 20;

  // Background Grid
  doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2]);
  doc.setLineWidth(0.05);
  for(let j=0; j<=2; j++) {
     const lineY = durY + 10 + durChartH - (j * (durChartH / 2));
     doc.line(margin, lineY, margin + contentWidth, lineY);
  }

  // Draw Line
  doc.setDrawColor(colors.amber[0], colors.amber[1], colors.amber[2]);
  doc.setLineWidth(0.5);
  durationData.forEach((d: any, i: number) => {
    if (i === 0) return;
    const x1 = margin + 5 + ((i-1) * (contentWidth - 10) / 24);
    const x2 = margin + 5 + (i * (contentWidth - 10) / 24);
    const y1 = durY + 10 + durChartH - (durationData[i-1].horas / maxD) * durChartH;
    const y2 = durY + 10 + durChartH - (d.horas / maxD) * durChartH;
    doc.line(x1, y1, x2, y2);
    
    // Y-Axis labels (every 4 hours)
    if (i % 4 === 0) {
      doc.setFontSize(5);
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.text(d.hora.split(':')[0] + "h", x2, durY + 10 + durChartH + 4);
    }
  });

  // --- PAGE 2: TABLES ---
  doc.addPage();
  drawHeader("ACADEMIC_AUDIT");

  const tableY = margin + 35;
  doc.setFontSize(10);
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.text("DISTRIBUCIÓN POR ESCUELA PROFESIONAL (TOP-X)", margin, tableY);

  // Table Styles
  const escuelas = charts?.escuela || [];
  const totalE = escuelas.reduce((acc: number, cur: any) => acc + cur.value, 0) || 1;

  doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  doc.rect(margin, tableY + 6, contentWidth, 8, 'F');
  doc.setFontSize(7);
  doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  doc.text("FACULTAD / ESCUELA", margin + 3, tableY + 11.5);
  doc.text("TOTAL ACCESOS", pageWidth - margin - 30, tableY + 11.5, { align: 'right' });
  doc.text("PARTICIPACIÓN %", pageWidth - margin - 5, tableY + 11.5, { align: 'right' });

  let rowY = tableY + 22;
  escuelas.slice(0, 15).forEach((e: any, i: number) => {
    doc.setFontSize(8);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text(e.name.toUpperCase(), margin + 3, rowY);
    
    doc.setFontSize(8);
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text(String(e.value), pageWidth - margin - 30, rowY, { align: 'right' });
    
    const p = ((e.value/totalE)*100).toFixed(1);
    // Clearer Percentage Badge
    doc.setFillColor(241, 245, 249); // Lighter background Slated-100
    doc.setDrawColor(226, 232, 240); // Slated-200 border
    doc.roundedRect(pageWidth - margin - 15, rowY - 3, 12, 4.5, 1, 1, 'FD');
    doc.setFontSize(6.5);
    doc.setTextColor(29, 78, 216); // Bold Blue text
    doc.text(p + "%", pageWidth - margin - 9, rowY + 0.3, { align: 'center' });

    doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2]);
    doc.line(margin, rowY + 3, pageWidth - margin, rowY + 3);
    rowY += 9;
  });

  // --- ACADEMIC DURATION (PAGE 2 BOTTOM) ---
  const durEscY = rowY + 10;
  if (durEscY < pageHeight - 60) { // Only if space allows
    doc.setFontSize(10);
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text("PERMANENCIA PROMEDIO POR CARRERA", margin, durEscY);

    const durEx = charts?.durationEscuela || [];
    const maxDEx = Math.max(...durEx.map((d: any) => d.value), 1);

    durEx.slice(0, 5).forEach((d: any, i: number) => {
      const yPos = durEscY + 8 + (i * 8);
      const barW = (d.value / maxDEx) * (contentWidth - 60);
      
      doc.setFontSize(7);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.text(d.name.substring(0, 25).toUpperCase(), margin, yPos + 4);

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin + 50, yPos, contentWidth - 50, 5, 1, 1, 'F');
      
      doc.setFillColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      doc.roundedRect(margin + 50, yPos, barW, 5, 1, 1, 'F');
      
      doc.setFontSize(6);
      doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      doc.text(d.value.toFixed(2) + "h", margin + 50 + barW + 2, yPos + 4);
    });
  }

  // Footer Metadata
  const addFoot = (p: number) => {
    doc.setPage(p);
    doc.setFontSize(6);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text("ESTE DOCUMENTO ES UNA TRANSCRIPCIÓN DIGITAL OFICIAL DE LA PLATAFORMA ASSISTANCE.", margin, pageHeight - 15);
    doc.text(`CERTIFICADO DE AUTENTICIDAD: AS-TX-${Math.random().toString(36).substring(7).toUpperCase()}`, margin, pageHeight - 12);
    doc.text(`PÁGINA ${p} DE 2`, pageWidth - margin, pageHeight - 12, { align: 'right' });
  };
  addFoot(1);
  addFoot(2);

  doc.save(`Reporte_Assistance_${selectedDate || 'General'}.pdf`);
};
