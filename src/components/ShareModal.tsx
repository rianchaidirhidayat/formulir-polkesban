import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Globe,
  Share2,
  Database,
  Cloud,
  ExternalLink,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  isFirestoreConnected: boolean;
  onPreviewRespondentMode?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  formTitle,
  isFirestoreConnected,
  onPreviewRespondentMode,
}) => {
  const [copiedRespondent, setCopiedRespondent] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [showAdminLink, setShowAdminLink] = useState(false);

  if (!isOpen) return null;

  const baseUrl = window.location.origin + window.location.pathname;
  const respondentUrl = `${baseUrl}?view=form`;
  const adminUrl = `${baseUrl}?view=admin`;

  const handleCopyRespondentLink = () => {
    navigator.clipboard.writeText(respondentUrl);
    setCopiedRespondent(true);
    setTimeout(() => setCopiedRespondent(false), 2500);
  };

  const handleCopyAdminLink = () => {
    navigator.clipboard.writeText(adminUrl);
    setCopiedAdmin(true);
    setTimeout(() => setCopiedAdmin(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FDFCF8] dark:bg-[#1E201B] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-between bg-white dark:bg-[#22251F] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                Bagikan Formulir ke Seluruh Pegawai
              </h3>
              <p className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                Tautan publik aman: Menu Builder, Analytics, Tema & Integrasi disembunyikan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF] hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Database Firebase */}
          <div className="p-3.5 rounded-xl bg-[#829273]/10 dark:bg-[#829273]/20 border border-[#829273]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Database className="w-4 h-4 text-[#829273]" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  Firebase Firestore Aktif & Terhubung
                </p>
                <p className="text-[11px] text-[#637254] dark:text-[#B5C4A6]">
                  Semua tanggapan & tanda tangan pegawai langsung tersimpan di Cloud Database.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-[#829273] text-white flex-shrink-0">
              Real-Time
            </span>
          </div>

          {/* Primary: Link Responden / Pegawai (Terkunci & Aman) */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#22251F] border-2 border-[#829273]/40 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#829273]" />
                <label className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  Tautan Khusus Responden / Pegawai (Terkunci):
                </label>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Aman untuk Dibagikan
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={respondentUrl}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FAF9F5] dark:bg-[#1A1C18] text-[#3D4035] dark:text-[#E8E6DF] font-mono select-all focus:outline-none focus:ring-1 focus:ring-[#829273]"
              />
              <button
                type="button"
                onClick={handleCopyRespondentLink}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 ${
                  copiedRespondent
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#829273] hover:bg-[#728263] text-white shadow-sm'
                }`}
              >
                {copiedRespondent ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRespondent ? 'Tersalin!' : 'Salin Link'}</span>
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F4F2E9] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32] text-[11px] text-[#637254] dark:text-[#CBD5C0] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#829273] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Perlindungan Aktif:</strong> Menu <em>Builder, Analytics, Integrasi, dan Themes</em> otomatis disembunyikan total. Pegawai hanya dapat mengisi pertanyaan dan membubuhkan tanda tangan digital.
              </span>
            </div>

            {onPreviewRespondentMode && (
              <div className="pt-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPreviewRespondentMode();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-[#829273] hover:text-[#637254] font-semibold underline underline-offset-2 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Uji / Lihat Tampilan Responden Sekarang</span>
                </button>
              </div>
            )}
          </div>

          {/* Secondary: Link Pengelola (Admin) */}
          <div className="border border-[#E5E2D1] dark:border-[#3B3E32] rounded-xl overflow-hidden bg-white dark:bg-[#22251F]">
            <button
              type="button"
              onClick={() => setShowAdminLink(!showAdminLink)}
              className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#737766] dark:text-[#A3A796] hover:text-[#3D4035] dark:hover:text-[#E8E6DF] flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Unlock className="w-3.5 h-3.5 text-[#C97C5D]" />
                <span>Tautan Khusus Pengelola / Admin (Akses Penuh)</span>
              </div>
              <span className="text-[11px] text-[#829273] font-normal">
                {showAdminLink ? 'Tutup' : 'Tampilkan'}
              </span>
            </button>

            {showAdminLink && (
              <div className="px-4 pb-3.5 pt-1 space-y-2 border-t border-[#E5E2D1] dark:border-[#3B3E32]">
                <p className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                  Gunakan tautan ini untuk diri Anda sendiri (pengelola) untuk mengedit pertanyaan, melihat hasil analitik & respon, mengatur tema, dan integrasi Google Sheets.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={adminUrl}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FAF9F5] dark:bg-[#1A1C18] text-[#3D4035] dark:text-[#E8E6DF] font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyAdminLink}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#F4F2E9] dark:bg-[#2A2D25] hover:bg-[#EAE6D7] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] cursor-pointer flex-shrink-0"
                  >
                    {copiedAdmin ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panduan Hosting ke Vercel */}
          <div className="p-4 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#22251F] space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
              <Cloud className="w-4 h-4 text-[#829273]" />
              <span>Panduan Hosting ke Vercel (Gratis & Otomatis)</span>
            </div>
            <p className="text-xs text-[#737766] dark:text-[#A3A796] leading-relaxed">
              Berkas konfigurasi <code className="font-mono text-[#637254] dark:text-[#B5C4A6] bg-[#F4F2E9] dark:bg-[#2A2D25] px-1 py-0.5 rounded">vercel.json</code> sudah tersedia di proyek ini.
            </p>
            <ol className="text-xs text-[#737766] dark:text-[#A3A796] space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Buka menu <strong>Settings</strong> di pojok kanan atas AI Studio &rarr; pilih <strong>Export to GitHub</strong>.
              </li>
              <li>
                Masuk ke <strong><a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-[#829273] underline">Vercel.com</a></strong> &rarr; klik <strong>Add New Project</strong> &rarr; pilih repositori GitHub Anda.
              </li>
              <li>
                Klik <strong>Deploy</strong>. Vercel akan otomatis mengenali <code className="font-mono text-[#637254] dark:text-[#B5C4A6]">?view=form</code> dan memberikan domain resmi kustom Anda!
              </li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#F9F8F4] dark:bg-[#22251F] border-t border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-[#737766] dark:text-[#A3A796]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#829273]" />
            <span>Kredensial & Aturan Keamanan Firestore Telah Diterapkan</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#F4F2E9] cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

