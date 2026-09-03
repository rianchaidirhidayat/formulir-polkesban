import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  ShieldCheck,
  Code,
  GitBranch,
  FileCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Question, ValidationRule, ConditionalLogic } from '../types';

interface FormValidationModalProps {
  isOpen: boolean;
  question: Question | null;
  allQuestions: Question[];
  onClose: () => void;
  onSave: (questionId: string, validation: ValidationRule, conditionalLogic?: ConditionalLogic) => void;
}

export const FormValidationModal: React.FC<FormValidationModalProps> = ({
  isOpen,
  question,
  allQuestions,
  onClose,
  onSave,
}) => {
  if (!isOpen || !question) return null;

  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'conditional'>('rules');

  // Local state for validation rules
  const [required, setRequired] = useState<boolean>(question.validation.required);
  const [valType, setValType] = useState<string>(question.validation.type || 'none');
  const [customRegex, setCustomRegex] = useState<string>(question.validation.customRegex || '');
  const [regexErrorMessage, setRegexErrorMessage] = useState<string>(
    question.validation.regexErrorMessage || ''
  );
  const [minLength, setMinLength] = useState<number | undefined>(question.validation.minLength);
  const [maxLength, setMaxLength] = useState<number | undefined>(question.validation.maxLength);
  const [minCheckbox, setMinCheckbox] = useState<number | undefined>(question.validation.minCheckbox);
  const [maxCheckbox, setMaxCheckbox] = useState<number | undefined>(question.validation.maxCheckbox);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState<number>(question.validation.maxFileSizeMb || 5);
  const [allowedFileTypes, setAllowedFileTypes] = useState<('pdf' | 'image' | 'doc' | 'sheet')[]>(
    question.validation.allowedFileTypes || ['pdf', 'image']
  );

  // Conditional logic state
  const [conditionalEnabled, setConditionalEnabled] = useState<boolean>(
    Boolean(question.conditionalLogic?.enabled)
  );
  const [parentQuestionId, setParentQuestionId] = useState<string>(
    question.conditionalLogic?.parentQuestionId || ''
  );
  const [operator, setOperator] = useState<'equals' | 'not_equals' | 'contains'>(
    question.conditionalLogic?.operator || 'equals'
  );
  const [conditionValue, setConditionValue] = useState<string>(
    question.conditionalLogic?.value || ''
  );

  // Available questions for conditional logic (excluding current question)
  const candidateParents = allQuestions.filter((q) => q.id !== question.id);

  // Regex Presets
  const applyPreset = (presetKey: string) => {
    switch (presetKey) {
      case 'email':
        setValType('email');
        setCustomRegex('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
        setRegexErrorMessage('Alamat email tidak valid. Pastikan format nama@domain.com');
        break;
      case 'phone_id':
        setValType('phone_id');
        setCustomRegex('^(\\+62|62|0)8[1-9][0-9]{7,11}$');
        setRegexErrorMessage('Nomor WhatsApp harus nomor Indonesia yang valid (contoh: 08123456789 atau +628123456789)');
        break;
      case 'nim_nik':
        setValType('nim_nik');
        setCustomRegex('^[0-9]{8,16}$');
        setRegexErrorMessage('Nomor identitas harus berupa angka 8 hingga 16 digit');
        break;
      case 'letters_only':
        setValType('regex');
        setCustomRegex('^[a-zA-Z\\s.,\'-]+$');
        setRegexErrorMessage('Hanya boleh berisi huruf dan karakter tanda baca nama');
        break;
      case 'url':
        setValType('regex');
        setCustomRegex('^https?:\\/\\/.+');
        setRegexErrorMessage('Harus berupa tautan URL web yang valid (dimulai dengan https://)');
        break;
      default:
        break;
    }
  };

  const handleToggleFileType = (type: 'pdf' | 'image' | 'doc' | 'sheet') => {
    if (allowedFileTypes.includes(type)) {
      setAllowedFileTypes(allowedFileTypes.filter((t) => t !== type));
    } else {
      setAllowedFileTypes([...allowedFileTypes, type]);
    }
  };

  const handleSave = () => {
    const newValidation: ValidationRule = {
      required,
      type: valType as any,
      customRegex: customRegex.trim() || undefined,
      regexErrorMessage: regexErrorMessage.trim() || undefined,
      minLength: minLength ? Number(minLength) : undefined,
      maxLength: maxLength ? Number(maxLength) : undefined,
      minCheckbox: minCheckbox ? Number(minCheckbox) : undefined,
      maxCheckbox: maxCheckbox ? Number(maxCheckbox) : undefined,
      maxFileSizeMb: Number(maxFileSizeMb) || 5,
      allowedFileTypes,
    };

    const newConditional: ConditionalLogic | undefined = conditionalEnabled
      ? {
          enabled: true,
          parentQuestionId: parentQuestionId || undefined,
          operator,
          value: conditionValue,
        }
      : undefined;

    onSave(question.id, newValidation, newConditional);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1C18]/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#22251F] rounded-2xl shadow-2xl border border-[#E5E2D1] dark:border-[#3B3E32] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FDFCF8] dark:bg-[#2A2D25] border-b border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#3D4035] dark:text-[#E8E6DF] text-base sm:text-lg">
                Pengaturan Validasi & Logika Kolom
              </h3>
              <p className="text-xs text-[#737766] dark:text-[#A3A796] truncate max-w-sm sm:max-w-md">
                {question.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF] hover:bg-[#829273]/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#E5E2D1] dark:border-[#3B3E32] px-6 bg-[#F9F8F4] dark:bg-[#22251F]">
          <button
            onClick={() => setActiveSubTab('rules')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === 'rules'
                ? 'border-[#829273] text-[#637254] dark:text-[#B5C4A6] font-bold'
                : 'border-transparent text-[#737766] dark:text-[#A3A796] hover:text-[#3D4035]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Aturan Validasi Input
          </button>
          <button
            onClick={() => setActiveSubTab('conditional')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === 'conditional'
                ? 'border-[#829273] text-[#637254] dark:text-[#B5C4A6] font-bold'
                : 'border-transparent text-[#737766] dark:text-[#A3A796] hover:text-[#3D4035]'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Logika Bersyarat (Skip Logic)
            {conditionalEnabled && (
              <span className="w-2 h-2 rounded-full bg-[#829273] animate-pulse" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-white dark:bg-[#22251F]">
          {activeSubTab === 'rules' ? (
            <div className="space-y-6">
              {/* Required Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F9F8F4] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32]">
                <div>
                  <span className="text-sm font-semibold text-[#3D4035] dark:text-[#E8E6DF] block">
                    Wajib Diisi (Mandatory Field)
                  </span>
                  <span className="text-xs text-[#737766] dark:text-[#A3A796]">
                    Responden tidak dapat mengirim formulir jika kolom ini kosong.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D8D5C4] peer-focus:outline-none rounded-full peer dark:bg-[#3B3E32] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#829273]"></div>
                </label>
              </div>

              {/* Text & Long text Regex & Presets */}
              {(question.type === 'short_text' || question.type === 'long_text') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-2">
                      Pola Validasi & Format Teks
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => applyPreset('email')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6] border border-[#829273]/30 hover:bg-[#829273]/25 transition-colors"
                      >
                        Format Email
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('phone_id')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6] border border-[#829273]/30 hover:bg-[#829273]/25 transition-colors"
                      >
                        WhatsApp / No HP Indonesia
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('nim_nik')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6] border border-[#829273]/30 hover:bg-[#829273]/25 transition-colors"
                      >
                        NIM / NIK (Angka 8-16 Digit)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('letters_only')}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] hover:bg-[#EAE6D7] transition-colors"
                      >
                        Huruf Saja (Nama)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('url')}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] hover:bg-[#EAE6D7] transition-colors"
                      >
                        Link URL (https://)
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs text-[#737766] dark:text-[#A3A796] mb-1">
                          <span>Ekspresi Reguler Kustom (Regex)</span>
                          <span className="text-[11px] text-[#A3A796]">Opsional</span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={customRegex}
                            onChange={(e) => setCustomRegex(e.target.value)}
                            placeholder="Contoh: ^[a-zA-Z0-9_-]{4,16}$"
                            className="w-full font-mono text-xs px-3 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273] focus:border-[#829273]"
                          />
                          <Code className="w-4 h-4 absolute right-3 top-3 text-[#A3A796] pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                          Pesan Kesalahan Kustom (Custom Error Message)
                        </label>
                        <input
                          type="text"
                          value={regexErrorMessage}
                          onChange={(e) => setRegexErrorMessage(e.target.value)}
                          placeholder="Pesan yang ditampilkan jika format tidak sesuai"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273] focus:border-[#829273]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Character Length Bounds */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                        Panjang Karakter Minimal
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={minLength ?? ''}
                        onChange={(e) =>
                          setMinLength(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        placeholder="Contoh: 3"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                        Panjang Karakter Maksimal
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={maxLength ?? ''}
                        onChange={(e) =>
                          setMaxLength(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        placeholder="Contoh: 250"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Checkboxes Validation */}
              {question.type === 'checkboxes' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-[#3D4035] dark:text-[#E8E6DF]">
                    Batasan Jumlah Pilihan (Checkbox Rule)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                        Pilih Minimal Berapa Opsi
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={question.options?.length || 10}
                        value={minCheckbox ?? ''}
                        onChange={(e) =>
                          setMinCheckbox(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        placeholder="Contoh: 1"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                        Pilih Maksimal Berapa Opsi
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={question.options?.length || 10}
                        value={maxCheckbox ?? ''}
                        onChange={(e) =>
                          setMaxCheckbox(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        placeholder="Contoh: 3"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload Constraints */}
              {question.type === 'file_upload' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-[#829273]" />
                    <h4 className="text-sm font-semibold text-[#3D4035] dark:text-[#E8E6DF]">
                      Batasan Berkas Unggahan
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF] mb-2">
                      Format Berkas yang Diperbolehkan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'pdf', label: 'Dokumen PDF (.pdf)' },
                        { key: 'image', label: 'Gambar (.png, .jpg, .webp)' },
                        { key: 'doc', label: 'Word (.doc, .docx)' },
                        { key: 'sheet', label: 'Excel (.xls, .xlsx)' },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-medium transition-colors ${
                            allowedFileTypes.includes(item.key as any)
                              ? 'bg-[#829273]/15 border-[#829273] text-[#3D4035] dark:text-[#E8E6DF]'
                              : 'bg-[#F9F8F4] dark:bg-[#2A2D25] border-[#E5E2D1] dark:border-[#3B3E32] text-[#737766] dark:text-[#A3A796]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={allowedFileTypes.includes(item.key as any)}
                            onChange={() => handleToggleFileType(item.key as any)}
                            className="rounded text-[#829273] focus:ring-[#829273]"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                      Ukuran Berkas Maksimal
                    </label>
                    <select
                      value={maxFileSizeMb}
                      onChange={(e) => setMaxFileSizeMb(parseInt(e.target.value))}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                    >
                      <option value={1}>1 MB</option>
                      <option value={2}>2 MB</option>
                      <option value={5}>5 MB (Standar Rekomendasi)</option>
                      <option value={10}>10 MB</option>
                      <option value={20}>20 MB</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Conditional Logic Tab */
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F9F8F4] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32]">
                <div>
                  <span className="text-sm font-semibold text-[#3D4035] dark:text-[#E8E6DF] block">
                    Aktifkan Logika Bersyarat (Tampilkan Berdasarkan Jawaban Sebelumnya)
                  </span>
                  <span className="text-xs text-[#737766] dark:text-[#A3A796]">
                    Kolom ini hanya akan muncul kepada responden jika kriteria di bawah ini terpenuhi.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conditionalEnabled}
                    onChange={(e) => setConditionalEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D8D5C4] peer-focus:outline-none rounded-full peer dark:bg-[#3B3E32] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#829273]"></div>
                </label>
              </div>

              {conditionalEnabled && (
                <div className="p-4 rounded-xl bg-[#829273]/10 dark:bg-[#829273]/20 border border-[#829273]/25 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#637254] dark:text-[#B5C4A6]">
                    <Sparkles className="w-4 h-4" />
                    Aturan Kondisi:
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                      Tampilkan kolom ini jika pertanyaan:
                    </label>
                    <select
                      value={parentQuestionId}
                      onChange={(e) => setParentQuestionId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                    >
                      <option value="">-- Pilih Pertanyaan Induk --</option>
                      {candidateParents.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.title} ({q.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                        Kondisi Logika:
                      </label>
                      <select
                        value={operator}
                        onChange={(e) => setOperator(e.target.value as any)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                      >
                        <option value="equals">Sama Dengan (Is Exactly)</option>
                        <option value="not_equals">Tidak Sama Dengan</option>
                        <option value="contains">Mengandung Teks</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                        Nilai Jawaban Acuan:
                      </label>
                      <input
                        type="text"
                        value={conditionValue}
                        onChange={(e) => setConditionValue(e.target.value)}
                        placeholder="Contoh: Mahasiswa Poltekkes"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-[#737766] dark:text-[#A3A796] italic">
                    Contoh penggunaan: Tampilkan kolom 'NIM Mahasiswa' hanya ketika responden memilih 'Mahasiswa Poltekkes' pada kategori status.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FDFCF8] dark:bg-[#2A2D25] border-t border-[#E5E2D1] dark:border-[#3B3E32] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#737766] dark:text-[#A3A796] bg-white dark:bg-[#1E201B] border border-[#E5E2D1] dark:border-[#3B3E32] hover:bg-[#F4F2E9] rounded-xl"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#C97C5D] hover:bg-[#B66E50] rounded-full shadow-md shadow-[#C97C5D]/20 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Simpan Aturan Validasi
          </button>
        </div>
      </div>
    </div>
  );
};
