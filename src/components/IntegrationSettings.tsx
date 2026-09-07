import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Mail,
  Webhook,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Copy,
  Check,
  Code,
  ShieldCheck,
  Plus,
  Users,
  Lock,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { FormConfig, WebhookLog } from '../types';
import { createGoogleSheet, sendEmailViaGmail } from '../services/googleWorkspace';
import { triggerWebhook } from '../services/webhookService';
import { ConfirmationModal } from './ConfirmationModal';
import { EmployeeManager } from './EmployeeManager';

interface IntegrationSettingsProps {
  config: FormConfig;
  onChangeConfig: (newConfig: FormConfig) => void;
  accessToken: string | null;
  onConnectGoogle: () => void;
  webhookLogs: WebhookLog[];
  onAddWebhookLog: (log: WebhookLog) => void;
  onTriggerSyncSheets: () => void;
  isSyncingSheets: boolean;
  onNotify?: (title: string, description: string, type: 'success' | 'error' | 'info') => void;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  config,
  onChangeConfig,
  accessToken,
  onConnectGoogle,
  webhookLogs,
  onAddWebhookLog,
  onTriggerSyncSheets,
  isSyncingSheets,
  onNotify,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'sheets' | 'employees' | 'email' | 'webhook' | 'security'
  >('sheets');

  // Local state for Google Sheets
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [manualSheetId, setManualSheetId] = useState(
    config.integrations.googleSheets.spreadsheetId || ''
  );
  const [sheetConfirmModal, setSheetConfirmModal] = useState(false);

  // Email test state
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  // Webhook test state
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);
  const [hasCopiedKey, setHasCopiedKey] = useState(false);

  // Admin PIN Management state
  const [currentPin, setCurrentPin] = useState(() => localStorage.getItem('app_admin_pin') || '1234');
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleChangeAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);

    const activeStoredPin = localStorage.getItem('app_admin_pin') || '1234';

    if (oldPinInput !== activeStoredPin) {
      setPinMessage({
        text: 'PIN Lama salah. Masukkan PIN yang sedang berlaku saat ini.',
        type: 'error',
      });
      return;
    }

    if (!newPinInput.trim() || newPinInput.trim().length < 4) {
      setPinMessage({
        text: 'PIN Baru harus minimal 4 karakter (angka atau huruf).',
        type: 'error',
      });
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinMessage({
        text: 'Konfirmasi PIN Baru tidak cocok dengan PIN Baru.',
        type: 'error',
      });
      return;
    }

    localStorage.setItem('app_admin_pin', newPinInput.trim());
    setCurrentPin(newPinInput.trim());
    setOldPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinMessage({
      text: 'PIN Admin berhasil diubah! Gunakan PIN baru ini untuk membuka akses pengelola.',
      type: 'success',
    });
  };

  const handleResetPinDefault = () => {
    if (window.confirm('Kembalikan PIN Admin ke standar bawaan (1234)?')) {
      localStorage.setItem('app_admin_pin', '1234');
      setCurrentPin('1234');
      setOldPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setPinMessage({
        text: 'PIN Admin telah direset kembali ke standar bawaan: 1234',
        type: 'success',
      });
    }
  };

  const sheetsConfig = config.integrations.googleSheets;
  const emailConfig = config.integrations.emailNotifications;
  const webhookConfig = config.integrations.webhook;

  // Handler to automatically create a Google Sheet in user's Drive
  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      onConnectGoogle();
      return;
    }

    setIsCreatingSheet(true);
    try {
      const headers = [
        'Timestamp',
        'ID Respon',
        'Nama Responden',
        'Email Responden',
        ...config.questions.map((q) => q.title),
      ];

      const res = await createGoogleSheet(config.title, headers, accessToken);
      onChangeConfig({
        ...config,
        integrations: {
          ...config.integrations,
          googleSheets: {
            ...config.integrations.googleSheets,
            enabled: true,
            spreadsheetId: res.spreadsheetId,
            spreadsheetUrl: res.spreadsheetUrl,
            lastSyncedAt: new Date().toISOString(),
          },
        },
      });
      alert(`Google Spreadsheet berhasil dibuat secara otomatis!\nID: ${res.spreadsheetId}`);
    } catch (err: any) {
      alert(`Gagal membuat Google Sheet: ${err.message}`);
    } finally {
      setIsCreatingSheet(false);
      setSheetConfirmModal(false);
    }
  };

  const handleSaveManualSheet = () => {
    // Extract ID if user pasted full URL
    let parsedId = manualSheetId.trim();
    if (parsedId.includes('/d/')) {
      const match = parsedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) parsedId = match[1];
    }

    onChangeConfig({
      ...config,
      integrations: {
        ...config.integrations,
        googleSheets: {
          ...config.integrations.googleSheets,
          enabled: true,
          spreadsheetId: parsedId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${parsedId}/edit`,
        },
      },
    });
    alert('ID Google Sheet berhasil disimpan!');
  };

  // Test Email Dispatch via Gmail API
  const handleSendTestEmail = async () => {
    if (!accessToken) {
      onConnectGoogle();
      return;
    }

    setIsSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      await sendEmailViaGmail({
        to: emailConfig.adminEmail,
        subject: `[Uji Coba Notifikasi] ${config.title}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f766e; margin-top: 0;">Uji Coba Notifikasi Email Berhasil! 🎉</h2>
            <p style="color: #334155;">Halo, email ini dikirimkan melalui integrasi resmi Gmail API untuk memastikan notifikasi formulir real-time Anda berfungsi.</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <strong>Formulir:</strong> ${config.title}<br/>
              <strong>Tujuan:</strong> ${emailConfig.adminEmail}<br/>
              <strong>Status:</strong> Terhubung Aktif
            </div>
            <p style="color: #64748b; font-size: 12px;">Pesan otomatis dari Sistem Formulir Cerdas Google Workspace.</p>
          </div>
        `,
        accessToken,
      });
      setTestEmailStatus('Email notifikasi berhasil dikirimkan ke ' + emailConfig.adminEmail);
    } catch (err: any) {
      setTestEmailStatus(`Gagal mengirim email: ${err.message}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Test Webhook Dispatch
  const handleTestWebhook = async () => {
    if (!webhookConfig.url) {
      alert('Masukkan URL Webhook terlebih dahulu');
      return;
    }

    setIsTestingWebhook(true);
    setTestWebhookStatus(null);
    const dummyPayload = {
      event: 'form_response_submitted',
      formId: config.id,
      formTitle: config.title,
      timestamp: new Date().toISOString(),
      sampleData: {
        respondent: 'Budi Santoso',
        email: 'budi.santoso@example.com',
        rating: 5,
      },
    };

    const log = await triggerWebhook(webhookConfig.url, webhookConfig.apiKey, dummyPayload);
    onAddWebhookLog(log);

    if (log.status === 'success') {
      setTestWebhookStatus('Webhook berhasil terkirim! Kode respons: ' + (log.statusCode || 200));
    } else {
      setTestWebhookStatus('Pengiriman webhook gagal: ' + log.message);
    }
    setIsTestingWebhook(false);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(webhookConfig.apiKey);
    setHasCopiedKey(true);
    setTimeout(() => setHasCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#3D4035] dark:text-[#E8E6DF]">
          Pengaturan Integrasi & API Otomatis
        </h1>
        <p className="text-sm text-[#737766] dark:text-[#A3A796] mt-1">
          Hubungkan formulir dengan Google Sheets, Gmail API, Webhook eksternal, dan API pihak ketiga.
        </p>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-[#E5E2D1] dark:border-[#3B3E32] mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('sheets')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'sheets'
              ? 'border-[#829273] text-[#637254] dark:text-[#B5C4A6]'
              : 'border-transparent text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-[#829273]" />
          Google Sheets
        </button>

        <button
          onClick={() => setActiveSubTab('employees')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'employees'
              ? 'border-[#829273] text-[#637254] dark:text-[#B5C4A6]'
              : 'border-transparent text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF]'
          }`}
        >
          <Users className="w-4 h-4 text-[#829273]" />
          Database Pegawai (NIP)
        </button>

        <button
          onClick={() => setActiveSubTab('email')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'email'
              ? 'border-[#829273] text-[#637254] dark:text-[#B5C4A6]'
              : 'border-transparent text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF]'
          }`}
        >
          <Mail className="w-4 h-4 text-[#C97C5D]" />
          Notifikasi Gmail
        </button>

        <button
          onClick={() => setActiveSubTab('webhook')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'webhook'
              ? 'border-[#829273] text-[#637254] dark:text-[#B5C4A6]'
              : 'border-transparent text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF]'
          }`}
        >
          <Webhook className="w-4 h-4 text-[#829273]" />
          Webhook & API
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'security'
              ? 'border-[#829273] text-[#637254] dark:text-[#B5C4A6]'
              : 'border-transparent text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#C97C5D]" />
          Keamanan & PIN Admin
        </button>
      </div>

      {/* TAB 1: GOOGLE SHEETS */}
      {activeSubTab === 'sheets' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E2D1] dark:border-[#3B3E32]">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                    Sinkronisasi Google Spreadsheet
                  </h3>
                  <p className="text-xs text-[#737766] dark:text-[#A3A796] mt-0.5">
                    Setiap tanggapan yang masuk dari responden akan otomatis ditambahkan sebagai baris baru.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {sheetsConfig.spreadsheetId ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6] border border-[#829273]/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terhubung ke Spreadsheet
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#737766] dark:text-[#A3A796]">
                    Belum Terhubung
                  </span>
                )}
              </div>
            </div>

            {/* If not connected or wants to create new */}
            <div className="mt-6 space-y-6">
              <div className="p-5 rounded-xl bg-[#FDFCF8] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                    Opsi 1: Buat Spreadsheet Baru Otomatis
                  </h4>
                  <p className="text-xs text-[#737766] dark:text-[#A3A796] mt-1 max-w-lg">
                    Sistem akan membuat Google Spreadsheet resmi di Google Drive akun Anda dengan kolom header yang otomatis disesuaikan dengan seluruh pertanyaan formulir.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSheetConfirmModal(true)}
                  disabled={isCreatingSheet}
                  className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#829273] hover:bg-[#728263] disabled:bg-[#A3A796] text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingSheet ? 'Sedang Membuat...' : 'Buat Spreadsheet Otomatis'}</span>
                </button>
              </div>

              <div className="p-5 rounded-xl bg-[#FDFCF8] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32] space-y-3">
                <h4 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  Opsi 2: Hubungkan Spreadsheet yang Sudah Ada
                </h4>
                <p className="text-xs text-[#737766] dark:text-[#A3A796]">
                  Tempelkan URL lengkap atau Spreadsheet ID dari Google Sheets Anda di bawah ini:
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={manualSheetId}
                    onChange={(e) => setManualSheetId(e.target.value)}
                    placeholder="Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA.../edit atau ID"
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveManualSheet}
                    className="px-5 py-2.5 bg-[#C97C5D] hover:bg-[#B66E50] text-white rounded-full text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Simpan Sambungan
                  </button>
                </div>
              </div>

              {/* Active sheet link and controls */}
              {sheetsConfig.spreadsheetId && (
                <div className="p-4 rounded-xl bg-[#829273]/10 dark:bg-[#829273]/20 border border-[#829273]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#637254] dark:text-[#B5C4A6] block">
                      Spreadsheet Aktif:
                    </span>
                    <span className="text-xs text-[#3D4035] dark:text-[#E8E6DF] font-mono break-all">
                      {sheetsConfig.spreadsheetId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={onTriggerSyncSheets}
                      disabled={isSyncingSheets}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#22251F] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] hover:bg-[#F9F8F4] cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin text-[#829273]' : ''}`}
                      />
                      <span>{isSyncingSheets ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                    </button>

                    <a
                      href={sheetsConfig.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetsConfig.spreadsheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#829273] hover:bg-[#728263] text-white shadow-sm"
                    >
                      <span>Buka di Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GMAIL NOTIFICATIONS */}
      {activeSubTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
            <div className="flex items-start gap-3 pb-6 border-b border-[#E5E2D1] dark:border-[#3B3E32]">
              <div className="p-3 rounded-2xl bg-[#C97C5D]/15 text-[#C97C5D]">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  Notifikasi Email Real-Time (Gmail API)
                </h3>
                <p className="text-xs text-[#737766] dark:text-[#A3A796] mt-0.5">
                  Kirimkan notifikasi instan langsung ke pengelola dan tanda terima ke responden saat formulir diserahkan.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {/* Admin Email Configuration */}
              <div>
                <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Alamat Email Admin / Pengelola (Penerima Notifikasi Respon Baru):
                </label>
                <input
                  type="email"
                  value={emailConfig.adminEmail}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      integrations: {
                        ...config.integrations,
                        emailNotifications: {
                          ...emailConfig,
                          adminEmail: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273]"
                  placeholder="rianchaidirhidayat@staff.poltekkesbandung.ac.id"
                />
                <p className="text-[11px] text-[#737766] dark:text-[#A3A796] mt-1">
                  Default dihubungkan ke: rianchaidirhidayat@staff.poltekkesbandung.ac.id
                </p>
              </div>

              {/* Toggle Respondent Receipt */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#FDFCF8] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32]">
                <div>
                  <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] block">
                    Kirim Salinan Tanda Terima ke Responden
                  </span>
                  <span className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                    Otomatis mengirimkan ringkasan jawaban ke email yang dimasukkan oleh responden.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailConfig.notifyRespondent}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        integrations: {
                          ...config.integrations,
                          emailNotifications: {
                            ...emailConfig,
                            notifyRespondent: e.target.checked,
                          },
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E5E2D1] peer-focus:outline-none rounded-full peer dark:bg-[#3B3E32] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#829273]"></div>
                </label>
              </div>

              {/* Subject Template */}
              <div>
                <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Subjek Email Notifikasi:
                </label>
                <input
                  type="text"
                  value={emailConfig.subjectTemplate}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      integrations: {
                        ...config.integrations,
                        emailNotifications: {
                          ...emailConfig,
                          subjectTemplate: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273]"
                />
              </div>

              {/* Test Button & Status */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTestEmail}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#829273] hover:bg-[#728263] disabled:bg-[#A3A796] text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingTestEmail ? 'Mengirim Uji Coba...' : 'Kirim Email Uji Coba Sekarang'}</span>
                </button>

                {testEmailStatus && (
                  <span className="text-xs font-semibold text-[#637254] dark:text-[#B5C4A6]">
                    {testEmailStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEBHOOK & 3RD PARTY API */}
      {activeSubTab === 'webhook' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
            <div className="flex items-start gap-3 pb-6 border-b border-[#E5E2D1] dark:border-[#3B3E32]">
              <div className="p-3 rounded-2xl bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]">
                <Webhook className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  Integrasi Webhook & API Pihak Ketiga
                </h3>
                <p className="text-xs text-[#737766] dark:text-[#A3A796] mt-0.5">
                  Hubungkan data formulir ke Zapier, Make, n8n, Slack, Discord, atau sistem backend aplikasi Anda secara otomatis.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {/* Webhook URL */}
              <div>
                <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Target Endpoint URL (Webhook POST):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={webhookConfig.url}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        integrations: {
                          ...config.integrations,
                          webhook: {
                            ...webhookConfig,
                            url: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="https://api.domain-anda.com/webhooks/form-submission"
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] font-mono focus:ring-2 focus:ring-[#829273]"
                  />
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={isTestingWebhook}
                    className="px-5 py-2.5 bg-[#C97C5D] hover:bg-[#B66E50] text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    {isTestingWebhook ? 'Menguji...' : 'Uji Webhook'}
                  </button>
                </div>
                {testWebhookStatus && (
                  <p className="text-xs font-semibold text-[#C97C5D] mt-1">
                    {testWebhookStatus}
                  </p>
                )}
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Kunci Rahasia API (X-Form-Secret-Key):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookConfig.apiKey}
                    className="flex-1 text-xs font-mono px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] select-all"
                  />
                  <button
                    type="button"
                    onClick={copyApiKey}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] text-xs font-semibold hover:bg-[#E5E2D1] cursor-pointer"
                  >
                    {hasCopiedKey ? <Check className="w-4 h-4 text-[#829273]" /> : <Copy className="w-4 h-4" />}
                    <span>{hasCopiedKey ? 'Tersalin' : 'Salin Kunci'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#737766] dark:text-[#A3A796] mt-1">
                  Sertakan header ini dalam permintaan dari aplikasi pihak ketiga untuk autentikasi data.
                </p>
              </div>

              {/* Developer Code Sample */}
              <div className="p-4 rounded-xl bg-[#1E201B] text-[#E8E6DF] text-xs font-mono overflow-x-auto space-y-2 border border-[#3B3E32]">
                <div className="text-[11px] text-[#A3A796] flex items-center justify-between pb-2 border-b border-[#3B3E32]">
                  <span>Contoh Payload JSON Webhook yang Dikirimkan:</span>
                  <Code className="w-4 h-4" />
                </div>
                <pre className="text-[11px] text-[#A7B998] leading-relaxed">
{`{
  "event": "form_response_submitted",
  "formId": "${config.id}",
  "submittedAt": "${new Date().toISOString()}",
  "answers": {
    "q_nama": "Rian Chaidir Hidayat",
    "q_email": "rianchaidirhidayat@staff.poltekkesbandung.ac.id",
    "q_kepuasan_skala": 5
  }
}`}
                </pre>
              </div>

              {/* Webhook Audit Log */}
              {webhookLogs.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] uppercase mb-2">
                    Riwayat Pengiriman Webhook Terakhir:
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {webhookLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-[#FDFCF8] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32] text-xs flex items-center justify-between"
                      >
                        <div>
                          <span
                            className={`font-bold ${
                              log.status === 'success' ? 'text-[#637254] dark:text-[#B5C4A6]' : 'text-[#C97C5D]'
                            }`}
                          >
                            [{log.status.toUpperCase()}]
                          </span>{' '}
                          <span className="text-[#3D4035] dark:text-[#E8E6DF]">{log.message}</span>
                        </div>
                        <span className="text-[10px] text-[#737766] dark:text-[#A3A796]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER PEGAWAI (NIP & AUTO-FILL) */}
      {activeSubTab === 'employees' && (
        <EmployeeManager onNotify={onNotify} />
      )}

      {/* TAB 5: KEAMANAN & UBAH PIN ADMIN */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E2D1] dark:border-[#3B3E32]">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-[#C97C5D]/15 text-[#C97C5D]">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                    Pengaturan Keamanan & PIN Admin Pengelola
                  </h3>
                  <p className="text-xs text-[#737766] dark:text-[#A3A796] mt-0.5">
                    Ubah PIN autentikasi untuk membatasi akses pengeditan form, database hasil respon, dan integrasi hanya untuk Anda.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6] border border-[#829273]/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Mode Admin Aktif
                </span>
              </div>
            </div>

            <div className="mt-6 max-w-xl space-y-6">
              {/* Information Box */}
              <div className="p-4 rounded-xl bg-[#FDFCF8] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  <KeyRound className="w-4 h-4 text-[#829273]" />
                  <span>Informasi Hak Akses</span>
                </div>
                <p className="text-[#737766] dark:text-[#A3A796] leading-relaxed">
                  Pegawai yang membuka formulir publik tidak akan melihat tombol admin ataupun menu pengeditan. Untuk masuk kembali ke dashboard pengelola, Anda akan diminta memasukkan PIN rahasia ini.
                </p>
                <div className="pt-2 text-[11px] font-medium text-[#525746] dark:text-[#CBD5C0]">
                  <span className="font-bold text-[#829273]">PIN : </span> informasi PIN hubungi Tim Kerja OSDM
                </div>
              </div>

              {/* Form Change PIN */}
              <form onSubmit={handleChangeAdminPin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1.5">
                    PIN Lama <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={oldPinInput}
                    onChange={(e) => setOldPinInput(e.target.value)}
                    placeholder="Masukkan PIN yang sedang aktif"
                    required
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1.5">
                      PIN Baru <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      placeholder="Minimal 4 digit/karakter"
                      required
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1.5">
                      Konfirmasi PIN Baru <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value)}
                      placeholder="Ketik ulang PIN baru"
                      required
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
                    />
                  </div>
                </div>

                {pinMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      pinMessage.type === 'success'
                        ? 'bg-[#829273]/15 text-[#637254] dark:text-[#CBD5C0] border border-[#829273]/30'
                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                    }`}
                  >
                    {pinMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#829273] shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span>{pinMessage.text}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#829273] hover:bg-[#728263] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPinDefault}
                    className="text-xs text-[#737766] hover:text-[#C97C5D] dark:text-[#A3A796] dark:hover:text-[#E89E82] underline cursor-pointer"
                  >
                    Reset ke Standar (1234)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Creating Google Sheet */}
      <ConfirmationModal
        isOpen={sheetConfirmModal}
        title="Buat Google Spreadsheet di Akun Anda?"
        message={`Aplikasi akan membuat Google Spreadsheet baru berjudul "${config.title}" di Google Drive Anda dan mengatur kolom-kolomnya.`}
        confirmLabel="Ya, Buat Sekarang"
        cancelLabel="Batal"
        onConfirm={handleCreateNewSheet}
        onCancel={() => setSheetConfirmModal(false)}
      />
    </div>
  );
};
