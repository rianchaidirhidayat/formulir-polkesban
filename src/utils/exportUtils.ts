import { jsPDF } from 'jspdf';
import { FormConfig, FormResponse, UploadedFileMeta } from '../types';

export const exportResponsesToCSV = (config: FormConfig, responses: FormResponse[]) => {
  // Headers
  const headers = [
    'ID Respon',
    'Waktu Pengisian',
    'Nama Responden',
    'Email Responden',
    ...config.questions.map((q) => q.title),
    'Status Sinkron Google Sheets',
    'Status Notifikasi Email',
  ];

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '""';
    let str = '';
    if (Array.isArray(value)) {
      str = value.join(', ');
    } else if (typeof value === 'object') {
      const file = value as UploadedFileMeta;
      str = file.name ? `Berkas: ${file.name} (${Math.round((file.size || 0) / 1024)} KB)` : JSON.stringify(value);
    } else if (typeof value === 'string' && value.startsWith('data:image/')) {
      str = '[Tanda Tangan Digital Terverifikasi]';
    } else {
      str = String(value);
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = responses.map((r) => {
    const questionValues = config.questions.map((q) => {
      return escapeCSV(r.answers[q.id]);
    });

    return [
      escapeCSV(r.id),
      escapeCSV(new Date(r.submittedAt).toLocaleString('id-ID')),
      escapeCSV(r.respondentName || '-'),
      escapeCSV(r.respondentEmail || '-'),
      ...questionValues,
      escapeCSV(r.googleSheetStatus),
      escapeCSV(r.emailNotificationStatus),
    ].join(',');
  });

  // UTF-8 BOM for Microsoft Excel compatibility
  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `respon_${config.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportAnalyticsReportToPDF = (
  config: FormConfig,
  responses: FormResponse[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header Banner & Branding
  doc.setFillColor(15, 118, 110); // Teal
  doc.rect(14, yPos, pageWidth - 28, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN RINGKASAN SURVEI & RESPON', 20, yPos + 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Diekspor pada: ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    20,
    yPos + 17
  );

  yPos += 30;

  // Form Details
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(config.title, 14, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const splitDesc = doc.splitTextToSize(config.description, pageWidth - 28);
  doc.text(splitDesc, 14, yPos);
  yPos += splitDesc.length * 4 + 4;

  // Summary Metrics Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, yPos, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total Respon Masuk: ${responses.length}`, 20, yPos + 8);
  doc.text(`Jumlah Pertanyaan: ${config.questions.length}`, 80, yPos + 8);

  const syncedCount = responses.filter((r) => r.googleSheetStatus === 'synced').length;
  doc.text(`Tersinkron ke Sheets: ${syncedCount}/${responses.length}`, 140, yPos + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Admin Email: ${config.integrations.emailNotifications.adminEmail}`, 20, yPos + 15);
  doc.text(
    `Status Integrasi: ${config.integrations.googleSheets.enabled ? 'Google Sheets Aktif' : 'Lokal'}`,
    140,
    yPos + 15
  );

  yPos += 28;

  // Question Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Ringkasan Pertanyaan & Distribusi Jawaban', 14, yPos);
  yPos += 8;

  config.questions.forEach((q, idx) => {
    // Page break check
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 118, 110);
    doc.text(`${idx + 1}. ${q.title}`, 14, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Tipe: ${q.type.replace('_', ' ').toUpperCase()} | Wajib: ${q.validation.required ? 'Ya' : 'Tidak'}`, 16, yPos);
    yPos += 5;

    if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') {
      const options = q.options || [];
      options.forEach((opt) => {
        let count = 0;
        responses.forEach((r) => {
          const ans = r.answers[q.id];
          if (Array.isArray(ans) && ans.includes(opt)) count++;
          else if (ans === opt) count++;
        });
        const pct = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
        doc.setTextColor(51, 65, 85);
        doc.text(`- ${opt}: ${count} responden (${pct}%)`, 18, yPos);
        yPos += 4;
      });
    } else if (q.type === 'linear_scale') {
      let sum = 0;
      let count = 0;
      responses.forEach((r) => {
        const val = Number(r.answers[q.id]);
        if (!isNaN(val) && val > 0) {
          sum += val;
          count++;
        }
      });
      const avg = count > 0 ? (sum / count).toFixed(2) : '0';
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Rata-rata Skor: ${avg} / ${q.linearScale?.max || 5} (${q.linearScale?.minLabel || 'Min'} s/d ${q.linearScale?.maxLabel || 'Max'})`,
        18,
        yPos
      );
      yPos += 4;
    } else {
      const totalAnswers = responses.filter((r) => Boolean(r.answers[q.id])).length;
      doc.setTextColor(51, 65, 85);
      doc.text(`Total entri terisi: ${totalAnswers} responden`, 18, yPos);
      yPos += 4;
    }

    yPos += 4;
  });

  // Footer page numbering
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Halaman ${i} dari ${pageCount} - Formulir Cerdas & Survei`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(
    `laporan_survei_${config.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`
  );
};
