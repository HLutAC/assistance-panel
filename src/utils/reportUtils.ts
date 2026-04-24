import { jsPDF } from 'jspdf';

export const generateNativePDF = (summary: any, charts: any, selectedDate: string, individualData?: any, globalEvents?: any[]) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  const colors = {
    primary: [15, 23, 42],        // Slate-900 (Deep blue-black)
    accent: [29, 78, 216],        // Blue-700
    accentLight: [191, 219, 254], // Blue-200
    success: [5, 150, 105],       // Emerald-600
    warning: [217, 119, 6],       // Amber-600
    danger: [225, 29, 72],        // Rose-600
    text: [30, 41, 59],           // Slate-800
    textMuted: [100, 116, 139],   // Slate-500
    bgLight: [248, 250, 252],     // Slate-50
    border: [226, 232, 240],      // Slate-200
    white: [255, 255, 255]
  };

  const drawWatermark = () => {
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.03 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(60);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text("UNAM AUDIT", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();
  };

  const drawHeader = (title: string, subtitle: string) => {
    // Top Accent Bar
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageWidth, 15, 'F');
    
    // Header Content
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("SISTEMA DE GESTIÓN DE ACCESOS - SMARTACCESS V5.0", margin, 10);
    doc.text("ID_NODE: UNAM_MOQ_01", pageWidth - margin, 10, { align: 'right' });

    // Title Block
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, 35);
    
    doc.setFontSize(9);
    doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.text(subtitle.toUpperCase(), margin, 41);

    // Metadata Right Column
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.setFontSize(7);
    doc.text("FECHA EMISIÓN", pageWidth - margin, 25, { align: 'right' });
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleString(), pageWidth - margin, 30, { align: 'right' });
    
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.setFontSize(7);
    doc.text("RANGO DE CONSULTA", pageWidth - margin, 37, { align: 'right' });
    doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.setFontSize(9);
    doc.text(selectedDate || "HISTÓRICO_FULL", pageWidth - margin, 42, { align: 'right' });

    // separator
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, 48, pageWidth - margin, 48);
  };

  const drawFooter = (page: number, total: number) => {
    doc.setPage(page);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    
    doc.setFontSize(7);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("DOC_HASH: " + Math.random().toString(36).substring(2, 15).toUpperCase(), margin, pageHeight - 12);
    doc.text(`PÁGINA ${page} DE ${total}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
    doc.text("Este documento es confidencial y para uso exclusivo de UNAM.", pageWidth/2, pageHeight - 12, { align: 'center' });
  };

  if (individualData) {
    // ==========================================
    // INDIVIDUAL REPORT DESIGN
    // ==========================================
    drawWatermark();
    drawHeader("FICHA_AUDITORÍA", "Reporte Detallado de Usuario");

    const p = individualData.person;
    const s = individualData.stats;
    const e = individualData.events;

    // User Profile Box
    doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
    doc.roundedRect(margin, 55, contentWidth, 45, 3, 3, 'F');
    
    // Avatar Placeholder
    doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.roundedRect(margin + 8, 62, 30, 30, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(p.nombre[0] + p.apellido[0], margin + 23, 81, { align: 'center' });

    // Profile Info
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFontSize(16);
    doc.text(`${p.nombre} ${p.apellido}`.toUpperCase(), margin + 45, 68);
    
    doc.setFontSize(10);
    doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.text(p.escuela.toUpperCase(), margin + 45, 74);

    doc.setFontSize(8);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(`DNI / CÓDIGO:`, margin + 45, 82);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text(p.id, margin + 70, 82);

    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(`ESTADO SISTEMA:`, margin + 45, 88);
    doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.text("VERIFICADO / ACTIVO", margin + 70, 88);

    // Stats Grid
    const statW = contentWidth / 3;
    const statsY = 105;
    [
      { label: "INGRESOS", value: s.ingresos, color: colors.accent },
      { label: "SALIDAS", value: s.salidas, color: colors.success },
      { label: "TOTAL EVENTOS", value: s.ingresos + s.salidas, color: colors.primary }
    ].forEach((stat, i) => {
      const x = margin + (i * statW);
      doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
      doc.roundedRect(x, statsY, statW - 5, 20, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text(stat.label, x + 5, statsY + 6);
      doc.setFontSize(12);
      doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
      doc.text(String(stat.value), x + 5, statsY + 14);
    });

    // Visual Activity Chart (Individual)
    const indChartY = 110;
    doc.setFontSize(9);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text("FRECUENCIA DE ACCESO DIARIA (FILTRADO)", margin, indChartY);

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.1);
    doc.line(margin, indChartY + 2, margin + contentWidth, indChartY + 2);

    // Timeline visualization
    const timelineW = contentWidth;
    const timelineH = 15;
    const timelineY = indChartY + 8;
    
    doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
    doc.roundedRect(margin, timelineY, timelineW, timelineH, 2, 2, 'F');
    
    // Draw hours markers
    for(let h=0; h<=24; h+=4) {
      const hx = margin + (h/24) * timelineW;
      doc.setFontSize(5);
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text(h+"h", hx, timelineY + timelineH + 4, { align: 'center' });
    }

    // Plot events on timeline
    e.forEach((ev: any) => {
      const timeStr = ev.t.split(' ')[1];
      const [hh, mm] = timeStr.split(':').map(Number);
      const hourFract = hh + (mm/60);
      const ex = margin + (hourFract/24) * timelineW;
      
      const isIng = ev.tipo_movimiento === 'INGRESO';
      doc.setFillColor(isIng ? colors.accent[0] : colors.success[0], isIng ? colors.accent[1] : colors.success[1], isIng ? colors.accent[2] : colors.success[2]);
      doc.circle(ex, timelineY + (timelineH/2), 1.5, 'F');
    });

    // Timeline Log
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFontSize(10);
    doc.text("CRONOLOGÍA DE MOVIMIENTOS", margin, 145);
    
    // Table Header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, 145, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text("MARCA DE TIEMPO (TIMESTAMP)", margin + 5, 150.5);
    doc.text("OPERACIÓN", pageWidth/2, 150.5, { align: 'center' });
    doc.text("PUNTO DE CONTROL / NODO", pageWidth - margin - 5, 150.5, { align: 'right' });

    let rowY = 158;
    e.slice(0, 15).forEach((ev: any, i: number) => {
      doc.setFontSize(8);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.text(ev.t, margin + 5, rowY);
      
      const isIng = ev.tipo_movimiento === 'INGRESO';
      doc.setFillColor(isIng ? 239 : 236, isIng ? 246 : 253, isIng ? 255 : 245);
      doc.roundedRect(pageWidth/2 - 12, rowY - 4, 24, 6, 1, 1, 'F');
      doc.setTextColor(isIng ? colors.accent[0] : colors.success[0], isIng ? colors.accent[1] : colors.success[1], isIng ? colors.accent[2] : colors.success[2]);
      doc.text(ev.tipo_movimiento, pageWidth/2, rowY, { align: 'center' });
      
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text(`CARRIL ${ev.carril}`, pageWidth - margin - 5, rowY, { align: 'right' });
      
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.line(margin, rowY + 3, pageWidth - margin, rowY + 3);
      rowY += 9;
    });

    drawFooter(1, 1);
  } else {
    // ==========================================
    // GLOBAL REPORT DESIGN
    // ==========================================
    drawWatermark();
    drawHeader("REPORTE_GERENCIAL", "Análisis Estadístico de Operaciones");

    // KPI Section
    const kpiW = contentWidth / 4;
    const kpiY = 55;
    const kpis = [
      { label: "INGRESOS", val: summary?.ingresos || 0, col: colors.accent },
      { label: "SALIDAS", val: summary?.salidas || 0, col: colors.success },
      { label: "USUARIOS ÚN.", val: charts?.summary?.unique_users || 0, col: colors.primary },
      { label: "HORA PICO", val: charts?.summary?.peak_hour || "N/A", col: colors.warning }
    ];

    kpis.forEach((k, i) => {
      const x = margin + (i * kpiW);
      doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
      doc.roundedRect(x, kpiY, kpiW - 4, 30, 2, 2, 'F');
      
      doc.setFontSize(6);
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text(k.label, x + 5, kpiY + 8);
      
      doc.setFontSize(16);
      doc.setTextColor(k.col[0], k.col[1], k.col[2]);
      doc.text(String(k.val), x + 5, kpiY + 20);
      
      doc.setFontSize(5);
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text("METRICA_VERIFICADA", x + 5, kpiY + 26);
    });

    // Main Chart: Hourly Distribution
    const chartY = 100;
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFontSize(12);
    doc.text("DISTRIBUCIÓN DE CARGA HORARIA", margin, chartY);
    
    const chartH = 50;
    const hData = charts?.hourly || [];
    const maxVal = Math.max(...hData.map((d: any) => d.ingresos + d.salidas), 10);

    // Chart Grid
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.1);
    for(let j=0; j<=5; j++) {
      const gy = chartY + 10 + chartH - (j * (chartH/5));
      doc.line(margin, gy, margin + contentWidth, gy);
      doc.setFontSize(5);
      doc.text(String(Math.round((maxVal/5)*j)), margin - 5, gy);
    }

    hData.forEach((d: any, i: number) => {
      const bw = (contentWidth - 10) / 24;
      const x = margin + 5 + (i * bw);
      const hi = (d.ingresos / maxVal) * chartH;
      const hs = (d.salidas / maxVal) * chartH;
      
      doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.rect(x + 0.5, chartY + 10 + chartH - hi, bw - 1, hi, 'F');
      
      doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
      doc.rect(x + 0.5, chartY + 10 + chartH - hi - hs, bw - 1, hs, 'F');
      
      if (i % 4 === 0) {
        doc.setFontSize(6);
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text(d.hora.split(':')[0], x, chartY + 15 + chartH);
      }
    });

    // Lane Utilization
    const laneY = 175;
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFontSize(12);
    doc.text("USO DE CARRILES / PUNTOS DE CONTROL", margin, laneY);
    
    const lanes = (charts?.lane || []).slice(0, 6);
    const maxLane = Math.max(...lanes.map((l: any) => l.ingresos + l.salidas), 1);

    lanes.forEach((l: any, i: number) => {
      const ly = laneY + 10 + (i * 10);
      const lw = ((l.ingresos + l.salidas) / maxLane) * (contentWidth - 60);
      
      doc.setFontSize(8);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.text(l.name.toUpperCase(), margin, ly + 5);
      
      doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
      doc.roundedRect(margin + 50, ly, contentWidth - 50, 6, 1, 1, 'F');
      
      doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.roundedRect(margin + 50, ly, lw, 6, 1, 1, 'F');
      
      doc.setFontSize(7);
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(String(l.ingresos + l.salidas), margin + 52 + lw, ly + 5);
    });

    // Page 2: Academic Analysis
    doc.addPage();
    drawWatermark();
    drawHeader("ANÁLISIS_ACADÉMICO", "Distribución por Facultades y Escuelas");

    const escData = charts?.escuela || [];
    const totalAcc = escData.reduce((a: any, b: any) => a + b.value, 0) || 1;

    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, 55, contentWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("FACULTAD / ESCUELA PROFESIONAL", margin + 5, 61.5);
    doc.text("VOLUMEN", pageWidth - margin - 40, 61.5, { align: 'right' });
    doc.text("IMPACTO %", pageWidth - margin - 5, 61.5, { align: 'right' });

    let ey = 73;
    escData.slice(0, 18).forEach((e: any, i: number) => {
      doc.setFontSize(8);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.text(e.name.toUpperCase(), margin + 5, ey);
      
      doc.setFontSize(9);
      doc.text(String(e.value), pageWidth - margin - 40, ey, { align: 'right' });
      
      const p = ((e.value / totalAcc) * 100).toFixed(1);
      doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
      doc.roundedRect(pageWidth - margin - 20, ey - 4, 15, 6, 1, 1, 'F');
      doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.text(p + "%", pageWidth - margin - 12.5, ey + 0.5, { align: 'center' });

      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.line(margin, ey + 4, pageWidth - margin, ey + 4);
      ey += 10;
    });

    // Page 3: Global Log
    if (globalEvents && globalEvents.length > 0) {
      doc.addPage();
      drawWatermark();
      drawHeader("LOG_TRANSACCIONAL", "Bitácora de Eventos Registrados");
      
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(margin, 55, contentWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("TIMESTAMP", margin + 5, 61.5);
      doc.text("ID", margin + 40, 61.5);
      doc.text("PERSONA", margin + 65, 61.5);
      doc.text("MOV", pageWidth / 2 + 20, 61.5);
      doc.text("PUNTO DE CONTROL", pageWidth - margin - 5, 61.5, { align: 'right' });

      let gy = 73;
      globalEvents.slice(0, 35).forEach((e: any, i: number) => {
        if (gy > pageHeight - 30) return;
        doc.setFontSize(7);
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        doc.text(e.t.split(' ')[1], margin + 5, gy);
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text(e.person_id, margin + 40, gy);
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        doc.text(`${e.nombre} ${e.apellido}`.toUpperCase().slice(0, 20), margin + 65, gy);
        
        const isIng = e.tipo_movimiento === 'INGRESO';
        doc.setTextColor(isIng ? colors.accent[0] : colors.success[0], isIng ? colors.accent[1] : colors.success[1], isIng ? colors.accent[2] : colors.success[2]);
        doc.text(e.tipo_movimiento[0], pageWidth / 2 + 20, gy);
        
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text(`C${e.carril}`, pageWidth - margin - 5, gy, { align: 'right' });
        
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.line(margin, gy + 3, pageWidth - margin, gy + 3);
        gy += 8;
      });
    }

    const totalPages = doc.getNumberOfPages();
    for(let i=1; i<=totalPages; i++) drawFooter(i, totalPages);
  }

  doc.save(`Audit_Assistance_${individualData ? 'Individual_' + individualData.person.id : 'Global'}_${selectedDate || 'Full'}.pdf`);
};
