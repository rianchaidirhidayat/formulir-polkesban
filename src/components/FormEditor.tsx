import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Settings2,
  Type,
  AlignLeft,
  CheckSquare,
  CircleDot,
  SlidersHorizontal,
  UploadCloud,
  List,
  Calendar,
  Eye,
  AlertCircle,
  GitBranch,
  ShieldCheck,
  PenTool,
  UserCheck,
  Sparkles,
  Database,
} from 'lucide-react';
import { FormConfig, Question, QuestionType, ValidationRule, ConditionalLogic } from '../types';
import { FormValidationModal } from './FormValidationModal';

interface FormEditorProps {
  config: FormConfig;
  onChangeConfig: (newConfig: FormConfig) => void;
  onPreviewForm: () => void;
}

export const FormEditor: React.FC<FormEditorProps> = ({
  config,
  onChangeConfig,
  onPreviewForm,
}) => {
  const [selectedQuestionForModal, setSelectedQuestionForModal] = useState<Question | null>(null);

  const handleUpdateTitle = (title: string) => {
    onChangeConfig({ ...config, title });
  };

  const handleUpdateDescription = (description: string) => {
    onChangeConfig({ ...config, description });
  };

  const handleAddQuestion = (type: QuestionType = 'short_text') => {
    const newId = 'q_' + Math.random().toString(36).substring(2, 9);

    // Auto-detect existing questions for autofill mapping if adding NIP
    const autoNameId = config.questions.find((q) =>
      q.title.toLowerCase().includes('nama')
    )?.id || '';
    const autoPosId = config.questions.find((q) =>
      q.title.toLowerCase().includes('jabatan')
    )?.id || '';
    const autoUnitId = config.questions.find((q) =>
      q.title.toLowerCase().includes('unit') ||
      q.title.toLowerCase().includes('jurusan') ||
      q.title.toLowerCase().includes('divisi') ||
      q.title.toLowerCase().includes('bagian')
    )?.id || '';

    let questionTitle = 'Pertanyaan Baru';
    let questionDesc: string | undefined = undefined;

    if (type === 'nip') {
      questionTitle = 'Nomor Induk Pegawai (NIP)';
      questionDesc =
        'Ketik 18 digit NIP Anda. Nama dan Jabatan di bawahnya akan otomatis terisi dari database.';
    } else if (type === 'signature') {
      questionTitle = 'Tanda Tangan Digital Responden';
      questionDesc =
        'Goreskan tanda tangan digital atau ketik nama Anda sebagai bukti keabsahan';
    }

    const newQuestion: Question = {
      id: newId,
      title: questionTitle,
      description: questionDesc,
      type,
      options:
        type === 'multiple_choice' || type === 'checkboxes' || type === 'dropdown'
          ? ['Pilihan 1', 'Pilihan 2', 'Pilihan 3']
          : undefined,
      linearScale:
        type === 'linear_scale'
          ? {
              min: 1,
              max: 5,
              minLabel: 'Sangat Tidak Setuju',
              maxLabel: 'Sangat Setuju',
            }
          : undefined,
      validation: {
        required: type === 'signature' || type === 'nip' ? true : false,
        type: type === 'nip' ? 'nip' : undefined,
        exactLength: type === 'nip' ? 18 : undefined,
        maxFileSizeMb: type === 'file_upload' ? 5 : undefined,
        allowedFileTypes: type === 'file_upload' ? ['pdf', 'image'] : undefined,
      },
      nipAutofill:
        type === 'nip'
          ? {
              nameQuestionId: autoNameId,
              positionQuestionId: autoPosId,
              unitQuestionId: autoUnitId,
            }
          : undefined,
    };

    onChangeConfig({
      ...config,
      questions: [...config.questions, newQuestion],
    });
  };

  const handleUpdateQuestion = (index: number, updated: Partial<Question>) => {
    const newQuestions = [...config.questions];
    newQuestions[index] = { ...newQuestions[index], ...updated };
    onChangeConfig({ ...config, questions: newQuestions });
  };

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = config.questions.filter((_, i) => i !== index);
    onChangeConfig({ ...config, questions: newQuestions });
  };

  const handleDuplicateQuestion = (index: number) => {
    const original = config.questions[index];
    const duplicated: Question = {
      ...JSON.parse(JSON.stringify(original)),
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      title: `${original.title} (Salinan)`,
    };
    const newQuestions = [...config.questions];
    newQuestions.splice(index + 1, 0, duplicated);
    onChangeConfig({ ...config, questions: newQuestions });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === config.questions.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newQuestions = [...config.questions];
    const [moved] = newQuestions.splice(index, 1);
    newQuestions.splice(targetIndex, 0, moved);
    onChangeConfig({ ...config, questions: newQuestions });
  };

  const handleSaveValidation = (
    questionId: string,
    validation: ValidationRule,
    conditionalLogic?: ConditionalLogic
  ) => {
    const newQuestions = config.questions.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          validation,
          conditionalLogic,
        };
      }
      return q;
    });
    onChangeConfig({ ...config, questions: newQuestions });
  };

  // Question Type Icon helper
  const renderTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'short_text':
        return <Type className="w-4 h-4 text-sky-600" />;
      case 'long_text':
        return <AlignLeft className="w-4 h-4 text-indigo-600" />;
      case 'multiple_choice':
        return <CircleDot className="w-4 h-4 text-emerald-600" />;
      case 'checkboxes':
        return <CheckSquare className="w-4 h-4 text-teal-600" />;
      case 'linear_scale':
        return <SlidersHorizontal className="w-4 h-4 text-amber-600" />;
      case 'file_upload':
        return <UploadCloud className="w-4 h-4 text-purple-600" />;
      case 'dropdown':
        return <List className="w-4 h-4 text-blue-600" />;
      case 'date':
        return <Calendar className="w-4 h-4 text-pink-600" />;
      case 'signature':
        return <PenTool className="w-4 h-4 text-[#829273]" />;
      case 'nip':
        return <UserCheck className="w-4 h-4 text-[#829273]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#3D4035] dark:text-[#E8E6DF]">
            Penyunting Formulir (Form Builder)
          </h1>
          <p className="text-sm text-[#737766] dark:text-[#A3A796]">
            Sesuaikan pertanyaan, urutan, dan tambahkan aturan validasi input tingkat lanjut.
          </p>
        </div>

        <button
          onClick={onPreviewForm}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#C97C5D] hover:bg-[#B66E50] text-white rounded-full font-semibold text-xs shadow-lg shadow-[#C97C5D]/20 transition-all cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          Pratinjau & Isi Formulir
        </button>
      </div>

      {/* Header Card / Title Banner */}
      <div className="bg-white dark:bg-[#22251F] rounded-2xl shadow-sm border border-[#E5E2D1] dark:border-[#3B3E32] overflow-hidden mb-6 transition-colors">
        {/* Banner image preview */}
        {config.theme.bannerImage && (
          <div className="h-36 sm:h-48 w-full overflow-hidden relative">
            <img
              src={config.theme.bannerImage}
              alt="Form Banner"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        )}

        <div className="p-6 border-t-4 border-[#829273]">
          <div className="mb-2">
            <span className="text-xs font-bold text-[#829273] tracking-widest uppercase">
              Form Details
            </span>
          </div>
          <input
            type="text"
            value={config.title}
            onChange={(e) => handleUpdateTitle(e.target.value)}
            placeholder="Judul Formulir"
            className="w-full text-2xl sm:text-3xl font-bold text-[#3D4035] dark:text-[#E8E6DF] bg-transparent border-b border-transparent hover:border-[#E5E2D1] dark:hover:border-[#3B3E32] focus:border-[#829273] outline-none pb-2 transition-colors"
          />

          <textarea
            value={config.description}
            onChange={(e) => handleUpdateDescription(e.target.value)}
            placeholder="Deskripsi formulir atau petunjuk pengisian bagi responden..."
            rows={2}
            className="w-full mt-3 text-sm text-[#737766] dark:text-[#A3A796] bg-transparent border-b border-transparent hover:border-[#E5E2D1] dark:hover:border-[#3B3E32] focus:border-[#829273] outline-none resize-none transition-colors"
          />
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-5 mb-8">
        {config.questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white dark:bg-[#22251F] rounded-2xl shadow-sm border border-[#E5E2D1] dark:border-[#3B3E32] p-5 sm:p-6 transition-all hover:border-[#829273]/60"
          >
            {/* Top Bar: Question Title, Type Selector, Order */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#637254] dark:text-[#B5C4A6] bg-[#829273]/10 dark:bg-[#829273]/25 px-2 py-0.5 rounded-md">
                    No. {index + 1}
                  </span>
                  {question.validation.required && (
                    <span className="text-xs font-semibold text-[#C97C5D]">* Wajib</span>
                  )}
                </div>

                <input
                  type="text"
                  value={question.title}
                  onChange={(e) => handleUpdateQuestion(index, { title: e.target.value })}
                  placeholder="Masukkan teks pertanyaan..."
                  className="w-full text-base sm:text-lg font-semibold text-[#3D4035] dark:text-[#E8E6DF] bg-transparent border-b border-transparent hover:border-[#E5E2D1] dark:hover:border-[#3B3E32] focus:border-[#829273] outline-none pb-1"
                />

                <input
                  type="text"
                  value={question.description || ''}
                  onChange={(e) =>
                    handleUpdateQuestion(index, { description: e.target.value })
                  }
                  placeholder="Teks bantuan / instruksi tambahan (opsional)"
                  className="w-full text-xs text-[#737766] dark:text-[#A3A796] bg-transparent border-b border-transparent hover:border-[#E5E2D1] dark:hover:border-[#3B3E32] focus:border-[#829273] outline-none mt-1"
                />
              </div>

              {/* Question Type Selector */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={question.type}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      let options = question.options;
                      if (
                        (newType === 'multiple_choice' ||
                          newType === 'checkboxes' ||
                          newType === 'dropdown') &&
                        (!options || options.length === 0)
                      ) {
                        options = ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'];
                      }
                      let linearScale = question.linearScale;
                      if (newType === 'linear_scale' && !linearScale) {
                        linearScale = {
                          min: 1,
                          max: 5,
                          minLabel: 'Sangat Buruk',
                          maxLabel: 'Sangat Baik',
                        };
                      }
                      let validation = question.validation;
                      let nipAutofill = question.nipAutofill;
                      if (newType === 'nip') {
                        validation = {
                          ...validation,
                          required: true,
                          type: 'nip',
                          exactLength: 18,
                        };
                        if (!nipAutofill) {
                          const autoNameId = config.questions.find((q) =>
                            q.title.toLowerCase().includes('nama')
                          )?.id || '';
                          const autoPosId = config.questions.find((q) =>
                            q.title.toLowerCase().includes('jabatan')
                          )?.id || '';
                          const autoUnitId = config.questions.find((q) =>
                            q.title.toLowerCase().includes('unit') ||
                            q.title.toLowerCase().includes('jurusan') ||
                            q.title.toLowerCase().includes('divisi')
                          )?.id || '';
                          nipAutofill = {
                            nameQuestionId: autoNameId,
                            positionQuestionId: autoPosId,
                            unitQuestionId: autoUnitId,
                          };
                        }
                      }
                      handleUpdateQuestion(index, { type: newType, options, linearScale, validation, nipAutofill });
                    }}
                    className="appearance-none text-xs font-medium pl-8 pr-8 py-2 bg-[#F9F8F4] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-xl focus:ring-2 focus:ring-[#829273] outline-none cursor-pointer"
                  >
                    <option value="short_text">Jawaban Singkat</option>
                    <option value="long_text">Paragraf / Teks Panjang</option>
                    <option value="multiple_choice">Pilihan Ganda</option>
                    <option value="checkboxes">Kotak Centang</option>
                    <option value="linear_scale">Skala Linear</option>
                    <option value="file_upload">Upload Berkas</option>
                    <option value="dropdown">Menu Dropdown</option>
                    <option value="date">Tanggal</option>
                    <option value="signature">Tanda Tangan Digital</option>
                    <option value="nip">Nomor Induk Pegawai (NIP Auto-fill)</option>
                  </select>
                  <div className="absolute left-2.5 top-2.5 pointer-events-none">
                    {renderTypeIcon(question.type)}
                  </div>
                </div>
              </div>
            </div>

            {/* Type Specific Fields */}
            {/* Multiple Choice / Checkboxes / Dropdown Options */}
            {(question.type === 'multiple_choice' ||
              question.type === 'checkboxes' ||
              question.type === 'dropdown') && (
              <div className="mt-3 pl-2 border-l-2 border-[#E5E2D1] dark:border-[#3B3E32] space-y-2.5">
                {(question.options || []).map((opt, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <div className="text-[#829273]">
                      {question.type === 'multiple_choice' ? (
                        <CircleDot className="w-4 h-4" />
                      ) : question.type === 'checkboxes' ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-mono">{optIndex + 1}.</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...(question.options || [])];
                        newOptions[optIndex] = e.target.value;
                        handleUpdateQuestion(index, { options: newOptions });
                      }}
                      className="flex-1 text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:bg-white dark:focus:bg-[#22251F] focus:ring-1 focus:ring-[#829273]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = (question.options || []).filter(
                          (_, i) => i !== optIndex
                        );
                        handleUpdateQuestion(index, { options: newOptions });
                      }}
                      className="text-[#737766] hover:text-[#C97C5D] p-1"
                      title="Hapus Opsi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = [
                      ...(question.options || []),
                      `Opsi ${(question.options?.length || 0) + 1}`,
                    ];
                    handleUpdateQuestion(index, { options: newOptions });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-[#637254] dark:text-[#B5C4A6] hover:text-[#3D4035] font-semibold py-1 px-2.5 rounded-lg hover:bg-[#829273]/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Pilihan
                </button>
              </div>
            )}

            {/* Linear Scale Controls */}
            {question.type === 'linear_scale' && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#F9F8F4] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF]">
                    <span>Rentang Skala:</span>
                    <select
                      value={question.linearScale?.min || 1}
                      onChange={(e) =>
                        handleUpdateQuestion(index, {
                          linearScale: {
                            ...(question.linearScale || {
                              minLabel: 'Min',
                              maxLabel: 'Max',
                              max: 5,
                            }),
                            min: parseInt(e.target.value),
                          },
                        })
                      }
                      className="px-2 py-1 rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-xs"
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                    </select>
                    <span>sampai</span>
                    <select
                      value={question.linearScale?.max || 5}
                      onChange={(e) =>
                        handleUpdateQuestion(index, {
                          linearScale: {
                            ...(question.linearScale || {
                              minLabel: 'Min',
                              maxLabel: 'Max',
                              min: 1,
                            }),
                            max: parseInt(e.target.value),
                          },
                        })
                      }
                      className="px-2 py-1 rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-xs"
                    >
                      <option value={5}>5 (Skala Likert 5)</option>
                      <option value={7}>7 (Skala Likert 7)</option>
                      <option value={10}>10 (NPS / 10 Poin)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#737766] dark:text-[#A3A796] mb-1 font-medium">
                      Label Nilai Terendah ({question.linearScale?.min || 1}):
                    </label>
                    <input
                      type="text"
                      value={question.linearScale?.minLabel || ''}
                      onChange={(e) =>
                        handleUpdateQuestion(index, {
                          linearScale: {
                            ...(question.linearScale || { min: 1, max: 5 }),
                            minLabel: e.target.value,
                          },
                        })
                      }
                      placeholder="Contoh: Sangat Buruk"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#737766] dark:text-[#A3A796] mb-1 font-medium">
                      Label Nilai Tertinggi ({question.linearScale?.max || 5}):
                    </label>
                    <input
                      type="text"
                      value={question.linearScale?.maxLabel || ''}
                      onChange={(e) =>
                        handleUpdateQuestion(index, {
                          linearScale: {
                            ...(question.linearScale || { min: 1, max: 5 }),
                            maxLabel: e.target.value,
                          },
                        })
                      }
                      placeholder="Contoh: Sangat Baik"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* File Upload Info */}
            {question.type === 'file_upload' && (
              <div className="mt-3 p-3 rounded-xl bg-[#829273]/10 dark:bg-[#829273]/20 border border-[#829273]/30 text-xs text-[#3D4035] dark:text-[#E8E6DF] flex items-center justify-between">
                <span>
                  Batas Berkas: Maksimal {question.validation.maxFileSizeMb || 5}MB. Tipe: [
                  {(question.validation.allowedFileTypes || ['pdf', 'image']).join(', ')}].
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedQuestionForModal(question)}
                  className="font-semibold text-[#C97C5D] underline hover:text-[#B66E50]"
                >
                  Ubah Batasan
                </button>
              </div>
            )}

            {/* Signature Preview */}
            {question.type === 'signature' && (
              <div className="mt-3 p-4 rounded-xl bg-[#F9F8F4] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF]">
                    <PenTool className="w-4 h-4 text-[#829273]" />
                    <span>Area Pengisian Tanda Tangan Digital</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#637254] dark:text-[#B5C4A6] bg-[#829273]/15 px-2.5 py-0.5 rounded-full">
                    Gores / Ketik / Upload
                  </span>
                </div>
                <div className="h-20 rounded-xl border border-dashed border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] flex flex-col items-center justify-center relative overflow-hidden text-center px-4">
                  <div className="absolute inset-x-6 bottom-4 border-b border-dashed border-[#E5E2D1] dark:border-[#3B3E32]" />
                  <p className="text-xs text-[#737766] dark:text-[#A3A796] flex items-center gap-1.5 z-10">
                    <PenTool className="w-3.5 h-3.5 text-[#829273]" />
                    <span>Kanvas digital responsif mendukung sentuhan jari, mouse, dan stylus pen</span>
                  </p>
                </div>
              </div>
            )}

            {/* NIP Auto-fill Question Configuration */}
            {question.type === 'nip' && (
              <div className="mt-3 p-4 rounded-xl bg-[#829273]/10 dark:bg-[#829273]/15 border border-[#829273]/30 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#829273]/20 text-[#637254] dark:text-[#CBD5C0]">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-1.5">
                        <span>Konfigurasi Auto-fill Data Pegawai (18 Digit NIP)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#829273] text-white font-semibold">
                          Smart Lookup
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                        Saat pegawai mengetik NIP, sistem otomatis mencari di Database Pegawai dan mengisikan kolom berikut:
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mapping Target Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                      Auto-fill Nama Pegawai ke:
                    </label>
                    <select
                      value={question.nipAutofill?.nameQuestionId || ''}
                      onChange={(e) => {
                        const nipAutofill = {
                          ...(question.nipAutofill || {}),
                          nameQuestionId: e.target.value,
                        };
                        handleUpdateQuestion(index, { nipAutofill });
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#22251F] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
                    >
                      <option value="">-- Pilih Kolom Pertanyaan --</option>
                      {config.questions
                        .filter((q) => q.id !== question.id)
                        .map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.title || `Pertanyaan (ID: ${q.id})`}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                      Auto-fill Jabatan Pegawai ke:
                    </label>
                    <select
                      value={question.nipAutofill?.positionQuestionId || ''}
                      onChange={(e) => {
                        const nipAutofill = {
                          ...(question.nipAutofill || {}),
                          positionQuestionId: e.target.value,
                        };
                        handleUpdateQuestion(index, { nipAutofill });
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#22251F] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
                    >
                      <option value="">-- Pilih Kolom Pertanyaan --</option>
                      {config.questions
                        .filter((q) => q.id !== question.id)
                        .map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.title || `Pertanyaan (ID: ${q.id})`}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                      Auto-fill Unit Kerja / Jurusan ke:
                    </label>
                    <select
                      value={question.nipAutofill?.unitQuestionId || ''}
                      onChange={(e) => {
                        const nipAutofill = {
                          ...(question.nipAutofill || {}),
                          unitQuestionId: e.target.value,
                        };
                        handleUpdateQuestion(index, { nipAutofill });
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#22251F] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
                    >
                      <option value="">-- Pilih Kolom Pertanyaan --</option>
                      {config.questions
                        .filter((q) => q.id !== question.id)
                        .map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.title || `Pertanyaan (ID: ${q.id})`}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-[#525746] dark:text-[#CBD5C0]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#829273]" />
                    <span>Terhubung dengan database pegawai terpusat di tab Integrasi.</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#737766] dark:text-[#A3A796]">
                    Validasi 18 digit angka
                  </span>
                </div>
              </div>
            )}

            {/* Active Validation & Conditional Badges */}
            <div className="mt-4 pt-3 border-t border-[#E5E2D1] dark:border-[#3B3E32] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Validation Indicator Badges */}
                {question.validation.type && question.validation.type !== 'none' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#829273]/10 text-[#637254] dark:bg-[#829273]/25 dark:text-[#B5C4A6] border border-[#829273]/20">
                    <ShieldCheck className="w-3 h-3" />
                    Validasi: {question.validation.type}
                  </span>
                )}
                {question.validation.minLength && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#737766] dark:text-[#A3A796]">
                    Min {question.validation.minLength} char
                  </span>
                )}
                {question.conditionalLogic?.enabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <GitBranch className="w-3 h-3" />
                    Logika Bersyarat Aktif
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedQuestionForModal(question)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#637254] dark:text-[#B5C4A6] bg-[#829273]/10 dark:bg-[#829273]/20 hover:bg-[#829273]/20 border border-[#829273]/30 transition-colors"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Logika & Validasi
                </button>

                <div className="h-4 w-px bg-[#E5E2D1] dark:border-[#3B3E32] mx-1" />

                <button
                  type="button"
                  onClick={() => handleMoveQuestion(index, 'up')}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg text-[#737766] hover:text-[#3D4035] dark:hover:text-white disabled:opacity-30"
                  title="Pindah ke Atas"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveQuestion(index, 'down')}
                  disabled={index === config.questions.length - 1}
                  className="p-1.5 rounded-lg text-[#737766] hover:text-[#3D4035] dark:hover:text-white disabled:opacity-30"
                  title="Pindah ke Bawah"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateQuestion(index)}
                  className="p-1.5 rounded-lg text-[#737766] hover:text-[#3D4035] dark:hover:text-white"
                  title="Duplikat Pertanyaan"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(index)}
                  className="p-1.5 rounded-lg text-[#737766] hover:text-[#C97C5D]"
                  title="Hapus Pertanyaan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Question Floating Toolbar */}
      <div className="sticky bottom-6 z-30 p-4 rounded-2xl bg-[#FDFCF8]/95 dark:bg-[#22251F]/95 backdrop-blur-md shadow-lg border border-[#E5E2D1] dark:border-[#3B3E32] flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-[#737766] dark:text-[#A3A796] uppercase tracking-wider">
          Tambah Kolom Baru:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleAddQuestion('short_text')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#829273]/10 hover:border-[#829273] transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-[#829273]" />
            Teks Singkat
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion('multiple_choice')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#829273]/10 hover:border-[#829273] transition-colors"
          >
            <CircleDot className="w-3.5 h-3.5 text-[#829273]" />
            Pilihan Ganda
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion('checkboxes')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#829273]/10 hover:border-[#829273] transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#829273]" />
            Kotak Centang
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion('linear_scale')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#829273]/10 hover:border-[#829273] transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C97C5D]" />
            Skala Linear
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion('file_upload')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#829273]/10 hover:border-[#829273] transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#829273]" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion('long_text')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#829273]/10 hover:border-[#829273] transition-colors"
          >
            <AlignLeft className="w-3.5 h-3.5 text-[#829273]" />
            Paragraf
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion('signature')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#829273]/40 bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6] hover:bg-[#829273]/25 transition-colors font-semibold"
          >
            <PenTool className="w-3.5 h-3.5 text-[#829273]" />
            Tanda Tangan
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion('nip')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#829273] bg-[#829273] text-white hover:bg-[#728263] transition-all font-bold shadow-xs cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            NIP Auto-fill
          </button>
        </div>
      </div>

      {/* Validation & Logic Modal */}
      {selectedQuestionForModal && (
        <FormValidationModal
          isOpen={Boolean(selectedQuestionForModal)}
          question={selectedQuestionForModal}
          allQuestions={config.questions}
          onClose={() => setSelectedQuestionForModal(null)}
          onSave={handleSaveValidation}
        />
      )}
    </div>
  );
};
