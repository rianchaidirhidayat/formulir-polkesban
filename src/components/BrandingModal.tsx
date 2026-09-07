import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Building2,
  Tag,
  Check,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  Minimize2,
  Maximize2,
  Eye,
  Sliders,
} from 'lucide-react';
import { FormConfig, FormDensity, FormLayoutMode } from '../types';

interface BrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FormConfig;
  onChangeConfig: (newConfig: FormConfig) => void;
  onSaveForm?: () => void;
}

export const BrandingModal: React.FC<BrandingModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onSaveForm,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [brandName, setBrandName] = useState(config.theme.brandName || 'FormPro AI');
  const [brandTagline, setBrandTagline] = useState(config.theme.brandTagline || 'Natural Tones');
  const [showBrandTagline, setShowBrandTagline] = useState(config.theme.showBrandTagline !== false);
  const [logoUrl, setLogoUrl] = useState(config.theme.logoUrl || '');
  const [logoText, setLogoText] = useState(config.theme.logoText || 'F');
  const [formTitle, setFormTitle] = useState(config.title || '');
  const [formDesc, setFormDesc] = useState(config.description || '');
  const [density, setDensity] = useState<FormDensity>(config.theme.density || 'compact');
  const [layoutMode, setLayoutMode] = useState<FormLayoutMode>(config.theme.layoutMode || 'auto');
  const [showQuestionNumbers, setShowQuestionNumbers] = useState(Boolean(config.theme.showQuestionNumbers));

  // Handle local image upload with file reader & compression
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran berkas logo maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    const updatedConfig: FormConfig = {
      ...config,
      title: formTitle.trim() || 'Formulir Cerdas',
      description: formDesc,
      theme: {
        ...config.theme,
        brandName: brandName.trim() || 'Formulir',
        brandTagline: brandTagline.trim(),
        showBrandTagline,
        logoUrl: logoUrl.trim(),
        logoText: logoText.trim() || (brandName.trim().charAt(0) || 'F'),
        density,
        layoutMode,
        showQuestionNumbers,
      },
    };

    onChangeConfig(updatedConfig);
    if (onSaveForm) {
      onSaveForm();
    }
    onClose();
  };

  const handleResetToDefault = () => {
    setBrandName('FormPro AI');
    setBrandTagline('Natural Tones');
    setShowBrandTagline(true);
    setLogoUrl('');
    setLogoText('F');
    setDensity('compact');
    setLayoutMode('auto');
    setShowQuestionNumbers(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#22251F] rounded-2xl max-w-2xl w-full border border-[#E5E2D1] dark:border-[#3B3E32] shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-between bg-[#FDFCF8] dark:bg-[#1E201B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#829273] text-white flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                Kustomisasi Logo, Nama & Tata Letak Formulir
              </h3>
              <p className="text-xs text-[#737766] dark:text-[#A3A796]">
                Ganti identitas form dengan logo institusi Anda sendiri dan atur kerapatan tampilan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737766] hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Live Preview Bar */}
          <div>
            <label className="block text-xs font-bold text-[#737766] uppercase tracking-wider mb-2">
              Pratinjau Tampilan Header Langsung:
            </label>
            <div className="p-4 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1A1C18] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                {logoUrl ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-[#E5E2D1] dark:border-[#3B3E32] flex-shrink-0 bg-white flex items-center justify-center p-0.5">
                    <img
                      src={logoUrl}
                      alt="Preview Logo"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs flex-shrink-0 text-base uppercase"
                    style={{ backgroundColor: config.theme.primaryColor || '#829273' }}
                  >
                    {logoText || (brandName ? brandName.charAt(0) : 'F')}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#3D4035] dark:text-[#E8E6DF] truncate text-base">
                      {brandName || 'Nama Instansi/Brand'}
                    </span>
                    {showBrandTagline && brandTagline && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#829273]/15 text-[#637254] dark:bg-[#829273]/30 dark:text-[#B5C4A6]">
                        {brandTagline}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#737766] dark:text-[#A3A796] truncate">
                    {formTitle || 'Judul Formulir'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Logo Settings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-[#829273]" />
              Pengaturan Logo
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Upload Berkas */}
              <div className="p-4 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] space-y-3">
                <span className="text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF] block">
                  Unggah Logo dari Komputer / HP
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-[#1E201B] hover:bg-[#F4F2E9] dark:hover:bg-[#33372C] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#829273]" />
                    <span>Pilih Berkas Logo</span>
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-semibold cursor-pointer"
                      title="Hapus Logo"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                  Format PNG transparan atau SVG beresolusi persegi direkomendasikan.
                </p>
              </div>

              {/* Option B: Inisial Teks atau URL */}
              <div className="p-4 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                    Atau Tautkan URL Gambar Logo:
                  </label>
                  <input
                    type="url"
                    value={logoUrl.startsWith('data:') ? '' : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://instansi.ac.id/logo.png"
                    className="w-full px-3 py-1.5 rounded-lg text-xs border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                    Huruf Inisial (Bila Tanpa Gambar):
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value.toUpperCase())}
                    placeholder="Contoh: PK"
                    className="w-24 px-3 py-1.5 rounded-lg text-xs font-bold text-center uppercase border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Brand Name & Form Title */}
          <div className="space-y-4 pt-2 border-t border-[#E5E2D1] dark:border-[#3B3E32]">
            <h4 className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#829273]" />
              Nama Brand / Instansi & Judul Formulir
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Nama Brand / Instansi (Menggantikan FormPro AI):
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Misal: Poltekkes Kemenkes Bandung"
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF]">
                    Badge Tagline:
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-[#737766] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBrandTagline}
                      onChange={(e) => setShowBrandTagline(e.target.checked)}
                      className="rounded text-[#829273]"
                    />
                    Tampilkan
                  </label>
                </div>
                <input
                  type="text"
                  disabled={!showBrandTagline}
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  placeholder="Misal: Layanan OSDM"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                Judul Utama Formulir:
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Misal: Pemeriksaan Kesehatan Pegawai Berkala"
                className="w-full px-3.5 py-2 rounded-xl text-xs font-bold border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                Petunjuk / Deskripsi Pengisian:
              </label>
              <textarea
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Petunjuk ringkas bagi pegawai yang mengisi..."
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273]"
              />
            </div>
          </div>

          {/* Section 3: Layout & Space-Saving Options */}
          <div className="space-y-4 pt-2 border-t border-[#E5E2D1] dark:border-[#3B3E32]">
            <h4 className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5 text-[#829273]" />
              Pilihan Tampilan Form Hemat Ruang & Fleksibilitas Tata Letak
            </h4>

            {/* Density Picker */}
            <div>
              <label className="block text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-2">
                Tingkat Kerapatan (Hemat Ruang Layar):
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    density === 'compact'
                      ? 'border-[#829273] bg-[#829273]/10 dark:bg-[#829273]/25 ring-1 ring-[#829273]'
                      : 'border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] hover:border-[#829273]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                      Ringkas / Kompak
                    </span>
                    <Minimize2 className="w-3.5 h-3.5 text-[#829273]" />
                  </div>
                  <p className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                    Hemat ruang, jarak bantalan tipis, muat banyak kolom di satu layar.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDensity('comfortable')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    density === 'comfortable'
                      ? 'border-[#829273] bg-[#829273]/10 dark:bg-[#829273]/25 ring-1 ring-[#829273]'
                      : 'border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] hover:border-[#829273]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                      Standar
                    </span>
                    <Sliders className="w-3.5 h-3.5 text-[#829273]" />
                  </div>
                  <p className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                    Jarak seimbang antara teks dan kotak isian formulir.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDensity('spacious')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    density === 'spacious'
                      ? 'border-[#829273] bg-[#829273]/10 dark:bg-[#829273]/25 ring-1 ring-[#829273]'
                      : 'border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] hover:border-[#829273]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                      Lapang
                    </span>
                    <Maximize2 className="w-3.5 h-3.5 text-[#829273]" />
                  </div>
                  <p className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                    Bantalan ekstra lega untuk pengalaman pengisian yang santai.
                  </p>
                </button>
              </div>
            </div>

            {/* Layout Mode & Numbering */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1.5">
                  Mode Penataan Kolom Pertanyaan:
                </label>
                <select
                  value={layoutMode}
                  onChange={(e) => setLayoutMode(e.target.value as FormLayoutMode)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                >
                  <option value="auto">Fleksibel (Sesuai Pengaturan Tiap Pertanyaan: 100%, 50%, 33%)</option>
                  <option value="grid">Otomatis 2 Kolom Sejajar (Lebih Hemat Ruang)</option>
                  <option value="single">1 Kolom Vertikal Penuh (Gaya Klasik)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showQuestionNumbers}
                    onChange={(e) => setShowQuestionNumbers(e.target.checked)}
                    className="rounded text-[#829273] focus:ring-[#829273]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] block">
                      Tampilkan Label "Pertanyaan 01, 02"?
                    </span>
                    <span className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                      Bawaan dinonaktifkan agar form terlihat bersih & profesional
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#737766] hover:text-[#3D4035] dark:text-[#A3A796] dark:hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Atur Ulang Bawaan</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#737766] hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25] rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#829273] hover:bg-[#728263] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
