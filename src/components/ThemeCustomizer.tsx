import React from 'react';
import { Palette, Image as ImageIcon, Type, Sparkles, Check, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { FormConfig, FormTheme } from '../types';

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

  const handleUpdateTheme = (updated: Partial<FormTheme>) => {
    onChangeConfig({
      ...config,
      theme: {
        ...currentTheme,
        ...updated,
      },
    });
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
              {currentTheme.bannerImage && (
                <div className="h-16 w-full -mx-4 -mt-4 mb-3 overflow-hidden">
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
                  Pratinjau tema tampilan kustom.
                </p>
              </div>

              <div className="bg-white dark:bg-[#22251F] p-3 rounded-xl shadow-sm space-y-2 mb-3 border border-[#E5E2D1] dark:border-[#3B3E32]">
                <div className="text-[11px] font-semibold text-[#3D4035] dark:text-[#E8E6DF]">
                  1. Pertanyaan Sampel
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
