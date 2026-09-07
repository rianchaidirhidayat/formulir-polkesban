import React, { useRef } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Type,
  Sparkles,
  Check,
  Save,
  Loader2,
  CheckCircle2,
  Building2,
  Tag,
  Upload,
  LayoutGrid,
  Minimize2,
  Maximize2,
  Sliders,
  Hash,
} from 'lucide-react';
import { FormConfig, FormTheme, FormDensity, FormLayoutMode } from '../types';

interface ThemeCustomizerProps {
  config: FormConfig;
  onChangeConfig: (newConfig: FormConfig) => void;
  onSaveForm?: () => void;
  isSaving?: boolean;
  justSaved?: boolean;
  lastSavedTime?: string | null;
  hasUnsavedChanges?: boolean;
}

const PRESET_THEMES: {
  id: string;
  name: string;
  primaryColor: string;
  backgroundColor: string;
  bannerImage?: string;
}[] = [
  {
    id: 'natural-tones',
    name: 'Natural Tones (Sage & Terracotta)',
    primaryColor: '#829273',
    backgroundColor: '#FDFCF8',
    bannerImage:
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'poltekkes-emerald',
    name: 'Poltekkes Kemenkes (Teal & Emerald)',
    primaryColor: '#0f766e',
    backgroundColor: '#f0fdfa',
    bannerImage:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'deep-sapphire',
    name: 'Deep Sapphire Blue',
    primaryColor: '#1d4ed8',
    backgroundColor: '#eff6ff',
    bannerImage:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Orange & Amber',
    primaryColor: '#d97706',
    backgroundColor: '#fffbeb',
    bannerImage:
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'modern-purple',
    name: 'Academic Violet & Indigo',
    primaryColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
    bannerImage:
      'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'rose-berry',
    name: 'Berry Crimson',
    primaryColor: '#e11d48',
    backgroundColor: '#fff1f2',
    bannerImage:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'monochrome',
    name: 'Slate Minimalist',
    primaryColor: '#334155',
    backgroundColor: '#f8fafc',
    bannerImage:
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
  },
];

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  config,
  onChangeConfig,
  onSaveForm,
  isSaving = false,
  justSaved = false,
  lastSavedTime = null,
  hasUnsavedChanges = false,
}) => {
  const currentTheme = config.theme;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpdateTheme = (updated: Partial<FormTheme>) => {
    onChangeConfig({
      ...config,
      theme: {
        ...currentTheme,
        ...updated,
      },
    });
  };

  const handleUpdateBranding = (field: 'title' | 'description', val: string) => {
    onChangeConfig({
      ...config,
      [field]: val,
    });
  };

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
        handleUpdateTheme({ logoUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (preset: (typeof PRESET_THEMES)[0]) => {
    handleUpdateTheme({
      primaryColor: preset.primaryColor,
      backgroundColor: preset.backgroundColor,
      bannerImage: preset.bannerImage,
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#3D4035] dark:text-[#E8E6DF]">
            Kustomisasi Tema & Tampilan Visual
          </h1>
          <p className="text-sm text-[#737766] dark:text-[#A3A796] mt-1">
            Pilih palet warna estetis, banner institusi, dan gaya tampilan formulir agar lebih menarik bagi responden.
          </p>
        </div>

        {onSaveForm && (
          <button
            type="button"
            onClick={onSaveForm}
            disabled={isSaving}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs shadow-md transition-all cursor-pointer ${
              justSaved
                ? 'bg-emerald-600 text-white shadow-emerald-600/25'
                : hasUnsavedChanges
                ? 'bg-[#829273] hover:bg-[#728263] text-white ring-2 ring-[#829273]/40 shadow-[#829273]/30'
                : 'bg-[#829273] hover:bg-[#728263] text-white shadow-[#829273]/20'
            } disabled:opacity-75`}
            title={
              lastSavedTime
                ? `Terakhir disimpan: ${lastSavedTime}. Klik untuk menerapkan tema ke tampilan live responden.`
                : 'Simpan perubahan tema ke live responden'
            }
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : justSaved ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {isSaving
                ? 'Menyimpan...'
                : justSaved
                ? 'Tema Tersimpan!'
                : 'Simpan Perubahan Tema'}
            </span>
            {hasUnsavedChanges && !isSaving && !justSaved && (
              <span
                className="w-2 h-2 rounded-full bg-amber-300 animate-ping"
                title="Ada perubahan belum disimpan"
              />
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Theme Controls */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Logo & Brand Identity */}
          <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D1] dark:border-[#3B3E32]">
              <h3 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#829273]" />
                Identitas, Logo & Nama Formulir Sendiri
              </h3>
              <span className="text-[11px] font-semibold text-[#829273] bg-[#829273]/10 dark:bg-[#829273]/25 px-2.5 py-0.5 rounded-full">
                Kustom
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo Upload */}
              <div className="p-4 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                    Logo Formulir
                  </span>
                  {currentTheme.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleUpdateTheme({ logoUrl: '' })}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer font-semibold"
                    >
                      Hapus Logo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {currentTheme.logoUrl ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-xs border border-[#E5E2D1] dark:border-[#3B3E32] bg-white flex items-center justify-center p-1 flex-shrink-0">
                      <img
                        src={currentTheme.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-xs text-lg uppercase flex-shrink-0"
                      style={{ backgroundColor: currentTheme.primaryColor }}
                    >
                      {currentTheme.logoText || (currentTheme.brandName ? currentTheme.brandName.charAt(0) : 'F')}
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-[#1E201B] hover:bg-[#F4F2E9] dark:hover:bg-[#33372C] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#829273]" />
                      <span>Unggah Gambar Logo</span>
                    </button>
                    <p className="text-[10px] text-[#737766] dark:text-[#A3A796]">
                      Bisa PNG, JPG, atau SVG
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E2D1] dark:border-[#3B3E32] flex items-center gap-2">
                  <span className="text-[11px] text-[#737766] whitespace-nowrap font-medium">Inisial Huruf:</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={currentTheme.logoText || ''}
                    onChange={(e) => handleUpdateTheme({ logoText: e.target.value.toUpperCase() })}
                    placeholder="Contoh: PK"
                    className="w-20 px-2 py-1 rounded-lg text-xs font-bold text-center uppercase border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                  />
                </div>
              </div>

              {/* Brand Name & Tagline */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                    Nama Instansi / Brand:
                  </label>
                  <input
                    type="text"
                    value={currentTheme.brandName || ''}
                    onChange={(e) => handleUpdateTheme({ brandName: e.target.value })}
                    placeholder="Contoh: Poltekkes Kemenkes Bandung"
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273]"
                  />
                  <p className="text-[10px] text-[#737766] mt-0.5">
                    Menggantikan tulisan "FormPro AI" di bagian paling atas
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                      Tagline / Badge:
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-[11px] text-[#737766] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentTheme.showBrandTagline !== false}
                        onChange={(e) => handleUpdateTheme({ showBrandTagline: e.target.checked })}
                        className="rounded text-[#829273]"
                      />
                      Tampilkan
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={currentTheme.showBrandTagline === false}
                    value={currentTheme.brandTagline || ''}
                    onChange={(e) => handleUpdateTheme({ brandTagline: e.target.value })}
                    placeholder="Contoh: Layanan Terpadu OSDM"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Form Title & Description */}
            <div className="space-y-3 pt-3 border-t border-[#E5E2D1] dark:border-[#3B3E32]">
              <div>
                <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Judul Utama Formulir:
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => handleUpdateBranding('title', e.target.value)}
                  placeholder="Judul Formulir..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-bold border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Deskripsi / Petunjuk Pengisian Formulir:
                </label>
                <textarea
                  rows={2}
                  value={config.description}
                  onChange={(e) => handleUpdateBranding('description', e.target.value)}
                  placeholder="Keterangan atau panduan bagi pengisi..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Space-saving Layout & Density Mode */}
          <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D1] dark:border-[#3B3E32]">
              <h3 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[#829273]" />
                Tampilan Hemat Ruang & Tata Letak Fleksibel
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Efisien
              </span>
            </div>

            {/* Density Selector */}
            <div>
              <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-2">
                Kerapatan Tampilan (Bantalan Ruang & Ukuran):
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleUpdateTheme({ density: 'compact' })}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    (currentTheme.density || 'compact') === 'compact'
                      ? 'border-[#829273] bg-[#829273]/10 dark:bg-[#829273]/20 ring-1 ring-[#829273]'
                      : 'border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                      Ringkas / Kompak
                    </span>
                    <Minimize2 className="w-3.5 h-3.5 text-[#829273]" />
                  </div>
                  <p className="text-[10px] text-[#737766] dark:text-[#A3A796]">
                    Hemat ruang maksimal, jarak antar isian rapat, muat banyak pertanyaan dalam satu layar.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateTheme({ density: 'comfortable' })}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    currentTheme.density === 'comfortable'
                      ? 'border-[#829273] bg-[#829273]/10 dark:bg-[#829273]/20 ring-1 ring-[#829273]'
                      : 'border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                      Standar
                    </span>
                    <Sliders className="w-3.5 h-3.5 text-[#829273]" />
                  </div>
                  <p className="text-[10px] text-[#737766] dark:text-[#A3A796]">
                    Proporsi seimbang antara jarak dan teks.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateTheme({ density: 'spacious' })}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    currentTheme.density === 'spacious'
                      ? 'border-[#829273] bg-[#829273]/10 dark:bg-[#829273]/20 ring-1 ring-[#829273]'
                      : 'border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                      Lapang
                    </span>
                    <Maximize2 className="w-3.5 h-3.5 text-[#829273]" />
                  </div>
                  <p className="text-[10px] text-[#737766] dark:text-[#A3A796]">
                    Bantalan ekstra lega untuk formulir bertahap.
                  </p>
                </button>
              </div>
            </div>

            {/* Layout Mode & Question Numbering */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1.5">
                  Tata Letak Kolom:
                </label>
                <select
                  value={currentTheme.layoutMode || 'auto'}
                  onChange={(e) => handleUpdateTheme({ layoutMode: e.target.value as FormLayoutMode })}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                >
                  <option value="auto">Fleksibel (Sesuai Lebar Pertanyaan: 100%, 50%, 33%)</option>
                  <option value="grid">Otomatis 2 Kolom Sejajar (Hemat Tempat)</option>
                  <option value="single">1 Kolom Vertikal Penuh</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(currentTheme.showQuestionNumbers)}
                    onChange={(e) => handleUpdateTheme({ showQuestionNumbers: e.target.checked })}
                    className="rounded text-[#829273] focus:ring-[#829273]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] block">
                      Tampilkan Label "Pertanyaan 01, 02"?
                    </span>
                    <span className="text-[10px] text-[#737766] dark:text-[#A3A796]">
                      Bawaan: Dimatikan agar tampilan bersih & rapi
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          {/* Preset Cards */}
          <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
            <h3 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#829273]" />
              Pilihan Tema Siap Pakai (Presets)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_THEMES.map((preset) => {
                const isActive = currentTheme.primaryColor === preset.primaryColor;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isActive
                        ? 'border-[#829273] bg-[#829273]/10 dark:bg-[#829273]/20 ring-1 ring-[#829273]'
                        : 'border-[#E5E2D1] dark:border-[#3B3E32] hover:border-[#829273]/60 bg-[#FDFCF8] dark:bg-[#2A2D25]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg shadow-sm border border-black/10 flex items-center justify-center text-white"
                        style={{ backgroundColor: preset.primaryColor }}
                      >
                        {isActive && <Check className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                          {preset.name}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Color Controls */}
          <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#829273]" />
              Penyesuaian Warna Kustom
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Warna Aksen Utama (Tombol & Sorotan):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentTheme.primaryColor}
                    onChange={(e) => handleUpdateTheme({ primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-[#E5E2D1] dark:border-[#3B3E32] p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={currentTheme.primaryColor}
                    onChange={(e) => handleUpdateTheme({ primaryColor: e.target.value })}
                    className="w-28 text-xs font-mono px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Warna Latar Belakang Formulir:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentTheme.backgroundColor}
                    onChange={(e) => handleUpdateTheme({ backgroundColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-[#E5E2D1] dark:border-[#3B3E32] p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={currentTheme.backgroundColor}
                    onChange={(e) => handleUpdateTheme({ backgroundColor: e.target.value })}
                    className="w-28 text-xs font-mono px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Banner Image Setting */}
          <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#829273]" />
              Gambar Header / Banner Formulir
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                URL Gambar Header (Banner):
              </label>
              <input
                type="url"
                value={currentTheme.bannerImage || ''}
                onChange={(e) => handleUpdateTheme({ bannerImage: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273]"
              />
              <p className="text-[11px] text-[#737766] dark:text-[#A3A796] mt-1">
                Gunakan tautan gambar lanskap beresolusi tinggi untuk hasil terbaik.
              </p>
            </div>

            {currentTheme.bannerImage && (
              <div className="relative rounded-xl overflow-hidden border border-[#E5E2D1] dark:border-[#3B3E32] h-28">
                <img
                  src={currentTheme.bannerImage}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateTheme({ bannerImage: '' })}
                  className="absolute top-2 right-2 px-3 py-1 bg-[#1A1C18]/80 hover:bg-[#1A1C18] text-white rounded-full text-xs font-medium cursor-pointer"
                >
                  Hapus Banner
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Mini Preview */}
        <div>
          <div className="sticky top-24 bg-white dark:bg-[#22251F] rounded-2xl p-5 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
            <h3 className="text-xs font-bold text-[#737766] uppercase tracking-wider mb-4">
              Pratinjau Tema Langsung:
            </h3>

            <div
              className="rounded-xl p-4 border border-[#E5E2D1] dark:border-[#3B3E32] overflow-hidden shadow-inner"
              style={{ backgroundColor: currentTheme.backgroundColor }}
            >
              {/* Mini Brand Bar */}
              <div className="flex items-center gap-2 mb-2 px-1">
                {currentTheme.logoUrl ? (
                  <div className="w-6 h-6 rounded-md overflow-hidden bg-white border border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-center p-0.5 shadow-2xs">
                    <img
                      src={currentTheme.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-2xs"
                    style={{ backgroundColor: currentTheme.primaryColor }}
                  >
                    {currentTheme.logoText || (currentTheme.brandName ? currentTheme.brandName.charAt(0) : 'F')}
                  </div>
                )}
                <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] truncate">
                  {currentTheme.brandName || 'FormPro AI'}
                </span>
                {currentTheme.showBrandTagline !== false && currentTheme.brandTagline && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#829273]/20 font-semibold truncate max-w-[90px]">
                    {currentTheme.brandTagline}
                  </span>
                )}
              </div>

              {currentTheme.bannerImage && (
                <div className="h-16 w-full -mx-4 mb-3 overflow-hidden">
                  <img
                    src={currentTheme.bannerImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div
                className="bg-white dark:bg-[#22251F] p-3.5 rounded-xl shadow-sm border-t-4 mb-3 border-[#E5E2D1] dark:border-[#3B3E32]"
                style={{ borderTopColor: currentTheme.primaryColor }}
              >
                <h4 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF] truncate">
                  {config.title}
                </h4>
                <p className="text-[11px] text-[#737766] truncate mt-0.5">
                  {config.description || 'Pratinjau tema tampilan kustom.'}
                </p>
              </div>

              <div className="bg-white dark:bg-[#22251F] p-3 rounded-xl shadow-sm space-y-2 mb-3 border border-[#E5E2D1] dark:border-[#3B3E32]">
                <div className="text-[11px] font-semibold text-[#3D4035] dark:text-[#E8E6DF]">
                  {currentTheme.showQuestionNumbers ? '1. ' : ''}Pertanyaan Sampel
                </div>
                <div
                  className="p-2 rounded-lg text-[11px] font-medium border flex items-center justify-between"
                  style={{
                    backgroundColor: `${currentTheme.primaryColor}15`,
                    borderColor: currentTheme.primaryColor,
                    color: currentTheme.primaryColor,
                  }}
                >
                  <span>Pilihan Terpilih</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>

              <button
                type="button"
                className="w-full py-2 rounded-full text-xs font-bold text-white shadow-sm text-center"
                style={{ backgroundColor: currentTheme.primaryColor }}
              >
                Tombol Kirim
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
