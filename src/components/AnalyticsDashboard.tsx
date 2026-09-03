import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Users,
  Star,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Filter,
  Trash2,
  Eye,
  FileCheck,
  PenTool,
} from 'lucide-react';
import { FormConfig, FormResponse, Question } from '../types';
import { exportResponsesToCSV, exportAnalyticsReportToPDF } from '../utils/exportUtils';
import { ConfirmationModal } from './ConfirmationModal';

interface AnalyticsDashboardProps {
  config: FormConfig;
  responses: FormResponse[];
  onSyncToSheets: () => void;
  isSyncing: boolean;
  onDeleteResponse: (responseId: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  config,
  responses,
  onSyncToSheets,
  isSyncing,
  onDeleteResponse,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'responses'>('visual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResponseForDetail, setSelectedResponseForDetail] = useState<FormResponse | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Compute stats
  const totalResponses = responses.length;

  // Calculate average rating from linear scale questions
  const linearQuestions = config.questions.filter((q) => q.type === 'linear_scale');
  let overallAvgScore = 0;
  if (linearQuestions.length > 0 && totalResponses > 0) {
    let sumTotal = 0;
    let countTotal = 0;
    linearQuestions.forEach((q) => {
      responses.forEach((r) => {
        const val = Number(r.answers[q.id]);
        if (!isNaN(val) && val > 0) {
          sumTotal += val;
          countTotal++;
        }
      });
    });
    overallAvgScore = countTotal > 0 ? Number((sumTotal / countTotal).toFixed(1)) : 0;
  }

  // Google Sheets sync count
  const syncedSheetsCount = responses.filter((r) => r.googleSheetStatus === 'synced').length;
  const syncPercentage =
    totalResponses > 0 ? Math.round((syncedSheetsCount / totalResponses) * 100) : 100;

  // Filtered responses
  const filteredResponses = responses.filter((r) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (r.respondentName || '').toLowerCase();
    const email = (r.respondentEmail || '').toLowerCase();
    const answersText = JSON.stringify(r.answers).toLowerCase();
    return name.includes(query) || email.includes(query) || answersText.includes(query);
  });

  const handleExportCSV = () => {
    exportResponsesToCSV(config, responses);
  };

  const handleExportPDF = () => {
    exportAnalyticsReportToPDF(config, responses);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Header & Export Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-[#3D4035] dark:text-[#E8E6DF]">
              Dashboard Analitik & Tanggapan
            </h1>
          </div>
          <p className="text-sm text-[#737766] dark:text-[#A3A796] mt-1">
            Pantau dan analisis hasil survei secara visual dan responsif secara real-time.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onSyncToSheets}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-[#22251F] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] hover:bg-[#F9F8F4] dark:hover:bg-[#2A2D25] shadow-sm transition-all cursor-pointer"
            title="Sinkronkan ke Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#829273]' : 'text-[#737766]'}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Google Sheets'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#829273] hover:bg-[#728263] text-white shadow-sm transition-all cursor-pointer"
            title="Download CSV untuk Excel/Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#C97C5D] hover:bg-[#B66E50] text-white shadow-sm transition-all cursor-pointer"
            title="Download Dokumen PDF Laporan"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#22251F] rounded-2xl p-5 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737766] dark:text-[#A3A796]">
              Total Respon
            </span>
            <div className="p-2 rounded-xl bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#3D4035] dark:text-[#E8E6DF]">
              {totalResponses}
            </span>
            <span className="text-xs font-semibold text-[#637254] dark:text-[#B5C4A6]">
              Aktif Real-time
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#737766] dark:text-[#A3A796]">
            {totalResponses > 0 ? 'Data tersimpan dengan aman' : 'Belum ada responden'}
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#22251F] rounded-2xl p-5 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737766] dark:text-[#A3A796]">
              Rata-rata Skor Kepuasan
            </span>
            <div className="p-2 rounded-xl bg-[#C97C5D]/15 text-[#C97C5D]">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#3D4035] dark:text-[#E8E6DF]">
              {overallAvgScore > 0 ? overallAvgScore : 'N/A'}
            </span>
            <span className="text-xs font-medium text-[#737766] dark:text-[#A3A796]">/ 5.0</span>
          </div>
          <p className="mt-1 text-[11px] text-[#737766] dark:text-[#A3A796]">
            Berdasarkan survei skala linear
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#22251F] rounded-2xl p-5 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737766] dark:text-[#A3A796]">
              Sinkronisasi Google Sheets
            </span>
            <div className="p-2 rounded-xl bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#3D4035] dark:text-[#E8E6DF]">
              {syncPercentage}%
            </span>
            <span className="text-xs font-semibold text-[#637254] dark:text-[#B5C4A6]">
              {syncedSheetsCount} terhubung
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#737766] dark:text-[#A3A796]">
            {config.integrations.googleSheets.spreadsheetId
              ? 'Terhubung ke Google Sheet'
              : 'Belum dihubungkan'}
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-[#22251F] rounded-2xl p-5 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737766] dark:text-[#A3A796]">
              Waktu Respon Terakhir
            </span>
            <div className="p-2 rounded-xl bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF] block truncate">
              {responses[0]
                ? new Date(responses[0].submittedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Belum ada'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#737766] dark:text-[#A3A796]">
            Notifikasi email real-time aktif
          </p>
        </div>
      </div>

      {/* Tab Switcher: Visual Overview vs Table Responses */}
      <div className="flex items-center justify-between border-b border-[#E5E2D1] dark:border-[#3B3E32] mb-6 pb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('visual')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'visual'
                ? 'border-[#829273] text-[#637254] dark:text-[#B5C4A6]'
                : 'border-transparent text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF]'
            }`}
          >
            Ringkasan Visual Pertanyaan
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'responses'
                ? 'border-[#829273] text-[#637254] dark:text-[#B5C4A6]'
                : 'border-transparent text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF]'
            }`}
          >
            Daftar Respon Lengkap ({responses.length})
          </button>
        </div>
      </div>

      {/* TAB 1: VISUAL CHARTS PER QUESTION */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          {config.questions.map((question, idx) => {
            // Compute answers count for this question
            const validResponses = responses.filter(
              (r) => r.answers[question.id] !== undefined && r.answers[question.id] !== ''
            );

            return (
              <div
                key={question.id}
                className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                      {idx + 1}. {question.title}
                    </h3>
                    <p className="text-xs text-[#737766] dark:text-[#A3A796] mt-0.5">
                      {validResponses.length} dari {totalResponses} responden menjawab kolom ini
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#637254] dark:text-[#B5C4A6]">
                    {question.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Multiple Choice & Checkboxes Visual Bars */}
                {(question.type === 'multiple_choice' ||
                  question.type === 'checkboxes' ||
                  question.type === 'dropdown') && (
                  <div className="space-y-3 mt-4">
                    {(question.options || []).map((option, optIdx) => {
                      let count = 0;
                      responses.forEach((r) => {
                        const ans = r.answers[question.id];
                        if (Array.isArray(ans) && ans.includes(option)) count++;
                        else if (ans === option) count++;
                      });
                      const percentage =
                        validResponses.length > 0
                          ? Math.round((count / validResponses.length) * 100)
                          : 0;

                      return (
                        <div key={optIdx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-[#3D4035] dark:text-[#E8E6DF]">{option}</span>
                            <span className="text-[#737766] dark:text-[#A3A796]">
                              {count} tanggapan ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-3 bg-[#F4F2E9] dark:bg-[#2A2D25] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#829273] dark:bg-[#A7B998] rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Linear Scale Visual Bars */}
                {question.type === 'linear_scale' && (
                  <div className="mt-4 space-y-4">
                    {/* Scale Average Indicator */}
                    {(() => {
                      let sum = 0;
                      let cnt = 0;
                      const distribution: Record<number, number> = {};
                      const min = question.linearScale?.min || 1;
                      const max = question.linearScale?.max || 5;

                      for (let i = min; i <= max; i++) distribution[i] = 0;

                      responses.forEach((r) => {
                        const val = Number(r.answers[question.id]);
                        if (!isNaN(val) && val >= min && val <= max) {
                          sum += val;
                          cnt++;
                          distribution[val] = (distribution[val] || 0) + 1;
                        }
                      });

                      const avg = cnt > 0 ? (sum / cnt).toFixed(2) : '0';

                      return (
                        <div>
                          <div className="flex items-center justify-between mb-4 p-3.5 rounded-xl bg-[#F9F8F4] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32]">
                            <div>
                              <span className="text-xs font-semibold text-[#737766] dark:text-[#A3A796] block">
                                Rata-rata Skor:
                              </span>
                              <span className="text-2xl font-bold text-[#C97C5D]">
                                {avg} <span className="text-xs font-normal">/ {max}</span>
                              </span>
                            </div>
                            <div className="text-right text-xs text-[#737766] dark:text-[#A3A796]">
                              <div>{question.linearScale?.minLabel} (Min)</div>
                              <div>{question.linearScale?.maxLabel} (Max)</div>
                            </div>
                          </div>

                          {/* Distribution breakdown */}
                          <div className="grid grid-cols-5 gap-2 text-center">
                            {Object.entries(distribution).map(([score, scoreCount]) => {
                              const pct = cnt > 0 ? Math.round((scoreCount / cnt) * 100) : 0;
                              return (
                                <div
                                  key={score}
                                  className="p-3 rounded-xl bg-[#FDFCF8] dark:bg-[#1E201B] border border-[#E5E2D1] dark:border-[#3B3E32]"
                                >
                                  <div className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                                    Poin {score}
                                  </div>
                                  <div className="text-xs text-[#637254] dark:text-[#B5C4A6] font-bold mt-1">
                                    {scoreCount}x
                                  </div>
                                  <div className="text-[10px] text-[#737766] dark:text-[#A3A796]">{pct}%</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Short text & Long text entries preview */}
                {(question.type === 'short_text' || question.type === 'long_text') && (
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    {validResponses.length === 0 ? (
                      <p className="text-xs text-[#737766] italic">Belum ada tanggapan masuk.</p>
                    ) : (
                      validResponses.slice(0, 5).map((r, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-[#FDFCF8] dark:bg-[#1E201B] border border-[#E5E2D1] dark:border-[#3B3E32] text-xs text-[#3D4035] dark:text-[#E8E6DF]"
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#737766] dark:text-[#A3A796] mb-1">
                            <span className="font-semibold text-[#3D4035] dark:text-[#E8E6DF]">
                              {r.respondentName || 'Responden Anonim'}
                            </span>
                            <span>
                              {new Date(r.submittedAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-line">
                            {String(r.answers[question.id])}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* File uploads preview list */}
                {question.type === 'file_upload' && (
                  <div className="mt-4 space-y-2">
                    {validResponses.length === 0 ? (
                      <p className="text-xs text-[#737766] italic">Belum ada berkas terunggah.</p>
                    ) : (
                      validResponses.map((r, i) => {
                        const fileMeta = r.answers[question.id] as any;
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-xl bg-[#FDFCF8] dark:bg-[#1E201B] border border-[#E5E2D1] dark:border-[#3B3E32] text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-[#829273]" />
                              <span className="font-medium text-[#3D4035] dark:text-[#E8E6DF]">
                                {fileMeta?.name || 'Berkas Terunggah'}
                              </span>
                              <span className="text-[10px] text-[#737766] dark:text-[#A3A796]">
                                ({Math.round((fileMeta?.size || 0) / 1024)} KB)
                              </span>
                            </div>
                            <span className="text-[#737766] dark:text-[#A3A796] text-[11px]">
                              Oleh: {r.respondentName || 'Responden'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 5. Signature Gallery */}
                {question.type === 'signature' && (
                  <div className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {validResponses.length === 0 ? (
                        <p className="text-xs text-[#737766] italic col-span-full">
                          Belum ada tanda tangan yang dibubuhkan responden.
                        </p>
                      ) : (
                        validResponses.map((r, i) => {
                          const sig = r.answers[question.id] as string;
                          return (
                            <div
                              key={i}
                              className="p-3.5 rounded-xl bg-[#FDFCF8] dark:bg-[#1E201B] border border-[#E5E2D1] dark:border-[#3B3E32] flex flex-col justify-between hover:shadow-sm transition-shadow"
                            >
                              <div className="h-20 bg-white dark:bg-[#2A2D25] rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-center p-2 mb-2.5 overflow-hidden">
                                {sig ? (
                                  <img
                                    src={sig}
                                    alt="Tanda Tangan"
                                    className="max-h-full max-w-full object-contain filter dark:brightness-110"
                                  />
                                ) : (
                                  <span className="text-[10px] text-[#A3A796] italic">Tidak ada goresan</span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E2D1]/60 dark:border-[#3B3E32]/60">
                                <span className="font-semibold text-[#3D4035] dark:text-[#E8E6DF] truncate">
                                  {r.respondentName || 'Responden'}
                                </span>
                                <span className="text-[10px] text-[#637254] dark:text-[#B5C4A6] font-bold bg-[#829273]/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Sah
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: FULL RESPONSES TABLE */}
      {activeTab === 'responses' && (
        <div className="bg-white dark:bg-[#22251F] rounded-2xl border border-[#E5E2D1] dark:border-[#3B3E32] overflow-hidden shadow-sm">
          {/* Search bar */}
          <div className="p-4 border-b border-[#E5E2D1] dark:border-[#3B3E32] flex items-center gap-3 bg-[#FDFCF8] dark:bg-[#2A2D25]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#A3A796]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari respon berdasarkan nama, email, atau isi jawaban..."
                className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F9F8F4] dark:bg-[#2A2D25] text-[#737766] dark:text-[#A3A796] uppercase text-[11px] font-bold border-b border-[#E5E2D1] dark:border-[#3B3E32]">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Responden</th>
                  <th className="px-4 py-3">Status Sheets</th>
                  <th className="px-4 py-3">Email Notif</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2D1] dark:divide-[#3B3E32]">
                {filteredResponses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#737766]">
                      Tidak ada respon yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredResponses.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-[#F9F8F4] dark:hover:bg-[#2A2D25] transition-colors"
                    >
                      <td className="px-4 py-3 text-[#737766] dark:text-[#A3A796] whitespace-nowrap">
                        {new Date(r.submittedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#3D4035] dark:text-[#E8E6DF]">
                          {r.respondentName || 'Responden Anonim'}
                        </div>
                        <div className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                          {r.respondentEmail || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.googleSheetStatus === 'synced'
                              ? 'bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {r.googleSheetStatus === 'synced' ? 'Tersinkron' : 'Antrean'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.emailNotificationStatus === 'sent'
                              ? 'bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]'
                              : 'bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#737766] dark:text-[#A3A796]'
                          }`}
                        >
                          {r.emailNotificationStatus === 'sent' ? 'Terkirim' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedResponseForDetail(r)}
                            className="p-1.5 rounded-lg text-[#637254] dark:text-[#B5C4A6] hover:bg-[#829273]/15"
                            title="Lihat Rincian Jawaban"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(r.id)}
                            className="p-1.5 rounded-lg text-[#737766] hover:text-[#C97C5D] hover:bg-[#C97C5D]/10"
                            title="Hapus Respon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Response Detail Modal */}
      {selectedResponseForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1C18]/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#22251F] rounded-2xl shadow-2xl border border-[#E5E2D1] dark:border-[#3B3E32] overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#FDFCF8] dark:bg-[#2A2D25] border-b border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#3D4035] dark:text-[#E8E6DF] text-base">
                  Rincian Formulir Responden
                </h3>
                <p className="text-xs text-[#737766] dark:text-[#A3A796]">
                  Dikirim pada{' '}
                  {new Date(selectedResponseForDetail.submittedAt).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponseForDetail(null)}
                className="text-[#737766] hover:text-[#3D4035] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-white dark:bg-[#22251F]">
              {config.questions.map((q, i) => {
                const ans = selectedResponseForDetail.answers[q.id];
                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl bg-[#F9F8F4] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32]"
                  >
                    <div className="text-xs font-semibold text-[#737766] dark:text-[#A3A796]">
                      {i + 1}. {q.title}
                    </div>
                    <div className="mt-1 text-sm font-medium text-[#3D4035] dark:text-[#E8E6DF]">
                      {ans === undefined || ans === '' ? (
                        <span className="text-[#737766] italic">Tidak diisi</span>
                      ) : q.type === 'signature' && typeof ans === 'string' && ans.startsWith('data:image/') ? (
                        <div className="mt-2 p-3 rounded-xl bg-white dark:bg-[#1E201B] border border-[#E5E2D1] dark:border-[#3B3E32] inline-block">
                          <img
                            src={ans}
                            alt="Tanda Tangan Digital"
                            className="max-h-24 max-w-full object-contain filter dark:brightness-110"
                          />
                          <div className="mt-2 pt-1 border-t border-[#E5E2D1] dark:border-[#3B3E32] flex items-center gap-1.5 text-[10px] font-semibold text-[#637254] dark:text-[#B5C4A6]">
                            <PenTool className="w-3 h-3 text-[#829273]" />
                            <span>Tanda Tangan Digital Terverifikasi</span>
                          </div>
                        </div>
                      ) : Array.isArray(ans) ? (
                        ans.join(', ')
                      ) : typeof ans === 'object' ? (
                        `Berkas: ${(ans as any).name}`
                      ) : (
                        String(ans)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 bg-[#FDFCF8] dark:bg-[#2A2D25] border-t border-[#E5E2D1] dark:border-[#3B3E32] flex justify-end">
              <button
                onClick={() => setSelectedResponseForDetail(null)}
                className="px-5 py-2 text-xs font-semibold bg-[#C97C5D] hover:bg-[#B66E50] text-white rounded-full transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirmId)}
        title="Hapus Respon Ini?"
        message="Respon ini akan dihapus dari daftar sistem lokal. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus Respon"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          if (deleteConfirmId) {
            onDeleteResponse(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
