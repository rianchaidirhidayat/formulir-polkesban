import React, { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, X, ShieldAlert, CheckCircle2, KeyRound } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = localStorage.getItem('app_admin_pin') || '1234';
    if (pin === storedPin || (storedPin === '1234' && (pin === '1234' || pin === 'admin'))) {
      setError(null);
      setPin('');
      sessionStorage.setItem('app_admin_auth', 'true');
      onSuccess();
      onClose();
    } else {
      setError('PIN tidak valid. Silakan masukkan PIN admin yang benar.');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = localStorage.getItem('app_admin_pin') || '1234';
    if (pin !== storedPin && !(storedPin === '1234' && (pin === '1234' || pin === 'admin'))) {
      setError('PIN lama salah.');
      return;
    }
    if (newPin.length < 4) {
      setError('PIN baru minimal harus 4 digit/karakter.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    localStorage.setItem('app_admin_pin', newPin);
    setSuccessNotice('PIN Admin berhasil diperbarui!');
    setError(null);
    setIsChangingPin(false);
    setPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FDFCF8] dark:bg-[#1E201B] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-between bg-white dark:bg-[#22251F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                Portal Pengelola (Admin)
              </h3>
              <p className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                Verifikasi Keamanan Akses Formulir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF] hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {!isChangingPin ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-[#829273]/10 border border-[#829273]/20 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#829273] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#525746] dark:text-[#CBD5C0] leading-relaxed">
                Halaman ini diproteksi. Masukkan PIN untuk mengaktifkan menu <strong>Builder, Analitik, Tema, dan Integrasi</strong>.
              </p>
            </div>

            {successNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1.5">
                PIN Admin:
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  placeholder="Masukkan PIN"
                  autoFocus
                  className="w-full text-center tracking-widest text-sm font-mono px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#22251F] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF] cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 font-medium">
                  {error}
                </p>
              )}
              <p className="text-[11px] text-[#737766] dark:text-[#A3A796] mt-1.5 text-center">
                PIN default awal: <span className="font-mono font-bold text-[#829273]">1234</span>
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(true);
                  setError(null);
                }}
                className="text-[11px] text-[#737766] hover:text-[#3D4035] dark:text-[#A3A796] dark:hover:text-white flex items-center gap-1 underline underline-offset-2 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>Ubah PIN</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#737766] dark:text-[#A3A796] hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#829273] hover:bg-[#728263] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Akses</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Form Ubah PIN */
          <form onSubmit={handleChangePin} className="p-5 space-y-3">
            <h4 className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-[#829273]" />
              <span>Perbarui PIN Keamanan Admin</span>
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-[#737766] dark:text-[#A3A796] mb-1">
                PIN Lama:
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN saat ini"
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#22251F] text-[#3D4035] dark:text-[#E8E6DF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#737766] dark:text-[#A3A796] mb-1">
                PIN Baru (min. 4 karakter):
              </label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Masukkan PIN baru"
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#22251F] text-[#3D4035] dark:text-[#E8E6DF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#737766] dark:text-[#A3A796] mb-1">
                Konfirmasi PIN Baru:
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ulangi PIN baru"
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#22251F] text-[#3D4035] dark:text-[#E8E6DF]"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setError(null);
                }}
                className="px-3 py-1.5 rounded-xl text-xs text-[#737766] hover:bg-[#F4F2E9]"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#829273] hover:bg-[#728263]"
              >
                Simpan PIN Baru
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
