import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  X,
  Send,
  RotateCcw,
  Sparkles,
  ExternalLink,
  PenTool,
} from 'lucide-react';
import {
  FormConfig,
  Question,
  UploadedFileMeta,
  FormResponse,
} from '../types';
import { SignaturePad } from './SignaturePad';

interface FormRespondentViewProps {
  config: FormConfig;
  onSubmit: (responseAnswers: Record<string, any>) => Promise<FormResponse>;
  onBackToEditor?: () => void;
}

export const FormRespondentView: React.FC<FormRespondentViewProps> = ({
  config,
  onSubmit,
  onBackToEditor,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<FormResponse | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Helper to check conditional logic visibility
  const isQuestionVisible = (q: Question): boolean => {
    if (!q.conditionalLogic?.enabled || !q.conditionalLogic.parentQuestionId) {
      return true;
    }
    const parentVal = answers[q.conditionalLogic.parentQuestionId];
    if (parentVal === undefined || parentVal === null) return false;

    const targetVal = q.conditionalLogic.value.toLowerCase().trim();
    const currentValStr = Array.isArray(parentVal)
      ? parentVal.join(', ').toLowerCase()
      : String(parentVal).toLowerCase();

    switch (q.conditionalLogic.operator) {
      case 'equals':
        return currentValStr.trim() === targetVal;
      case 'not_equals':
        return currentValStr.trim() !== targetVal;
      case 'contains':
        return currentValStr.includes(targetVal);
      default:
        return true;
    }
  };

  // Field validation engine
  const validateField = (q: Question, val: any): string | null => {
    if (!isQuestionVisible(q)) return null;

    const rule = q.validation;

    // Required check
    const isEmpty =
      val === undefined ||
      val === null ||
      (typeof val === 'string' && val.trim() === '') ||
      (Array.isArray(val) && val.length === 0) ||
      (q.type === 'file_upload' && (!val || !val.name)) ||
      (q.type === 'signature' && (!val || typeof val !== 'string' || !val.trim()));

    if (rule.required && isEmpty) {
      if (q.type === 'signature') {
        return 'Tanda tangan wajib dibubuhkan sebelum mengirimkan formulir.';
      }
      return 'Pertanyaan ini wajib diisi.';
    }

    if (isEmpty) return null; // If not required and empty, pass

    // String based validations
    if (typeof val === 'string') {
      const trimmed = val.trim();

      // Min length
      if (rule.minLength && trimmed.length < rule.minLength) {
        return (
          rule.regexErrorMessage ||
          `Panjang teks minimal ${rule.minLength} karakter (saat ini ${trimmed.length}).`
        );
      }

      // Max length
      if (rule.maxLength && trimmed.length > rule.maxLength) {
        return (
          rule.regexErrorMessage ||
          `Panjang teks maksimal ${rule.maxLength} karakter (saat ini ${trimmed.length}).`
        );
      }

      // Regex / Pattern checks
      if (rule.customRegex) {
        try {
          const reg = new RegExp(rule.customRegex);
          if (!reg.test(trimmed)) {
            return (
              rule.regexErrorMessage ||
              'Format jawaban yang dimasukkan belum sesuai ketentuan pola.'
            );
          }
        } catch (e) {
          console.warn('Regex error in rule:', e);
        }
      }

      // Email preset check
      if (rule.type === 'email') {
        const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailReg.test(trimmed)) {
          return rule.regexErrorMessage || 'Alamat email tidak valid (contoh: nama@domain.com)';
        }
      }

      // Phone preset check (Indonesian format)
      if (rule.type === 'phone_id') {
        const phoneReg = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;
        if (!phoneReg.test(trimmed.replace(/\s|-/g, ''))) {
          return (
            rule.regexErrorMessage ||
            'Nomor telepon tidak valid. Gunakan format WhatsApp Indonesia (08... atau +628...)'
          );
        }
      }

      // NIM / NIK
      if (rule.type === 'nim_nik') {
        const nimReg = /^[0-9]{8,16}$/;
        if (!nimReg.test(trimmed)) {
          return rule.regexErrorMessage || 'NIM / NIK harus berupa deret angka 8-16 digit.';
        }
      }
    }

    // Checkboxes count check
    if (q.type === 'checkboxes' && Array.isArray(val)) {
      if (rule.minCheckbox && val.length < rule.minCheckbox) {
        return (
          rule.regexErrorMessage ||
          `Pilih minimal ${rule.minCheckbox} opsi pilihan (saat ini ${val.length} dipilih).`
        );
      }
      if (rule.maxCheckbox && val.length > rule.maxCheckbox) {
        return (
          rule.regexErrorMessage ||
          `Pilih maksimal ${rule.maxCheckbox} opsi pilihan (saat ini ${val.length} dipilih).`
        );
      }
    }

    // File validation
    if (q.type === 'file_upload' && val && val.name) {
      const fileMeta = val as UploadedFileMeta;
      const maxBytes = (rule.maxFileSizeMb || 5) * 1024 * 1024;
      if (fileMeta.size > maxBytes) {
        return `Ukuran berkas (${Math.round(
          fileMeta.size / 1024 / 1024
        )}MB) melebihi batas maksimum ${rule.maxFileSizeMb || 5}MB.`;
      }
    }

    return null;
  };

  const handleChange = (question: Question, val: any) => {
    setAnswers((prev) => ({ ...prev, [question.id]: val }));
    if (touched[question.id]) {
      const err = validateField(question, val);
      setErrors((prev) => ({ ...prev, [question.id]: err || '' }));
    }
  };

  const handleBlur = (question: Question) => {
    setTouched((prev) => ({ ...prev, [question.id]: true }));
    const err = validateField(question, answers[question.id]);
    setErrors((prev) => ({ ...prev, [question.id]: err || '' }));
  };

  const handleCheckboxToggle = (question: Question, option: string) => {
    const currentList: string[] = Array.isArray(answers[question.id])
      ? answers[question.id]
      : [];
    let updated: string[];
    if (currentList.includes(option)) {
      updated = currentList.filter((item) => item !== option);
    } else {
      updated = [...currentList, option];
    }
    handleChange(question, updated);
  };

  const handleFileUpload = (question: Question, file: File) => {
    const maxBytes = (question.validation.maxFileSizeMb || 5) * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrors((prev) => ({
        ...prev,
        [question.id]: `Ukuran berkas melebihi batas maksimal ${
          question.validation.maxFileSizeMb || 5
        }MB`,
      }));
      return;
    }

    // Read as DataURL for client-side storage & preview
    const reader = new FileReader();
    reader.onload = () => {
      const meta: UploadedFileMeta = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
      };
      handleChange(question, meta);
      setErrors((prev) => ({ ...prev, [question.id]: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (questionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    if (fileInputRefs.current[questionId]) {
      fileInputRefs.current[questionId]!.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all visible questions
    const newErrors: Record<string, string> = {};
    let hasError = false;

    config.questions.forEach((q) => {
      if (isQuestionVisible(q)) {
        const err = validateField(q, answers[q.id]);
        if (err) {
          newErrors[q.id] = err;
          hasError = true;
        }
      }
    });

    setErrors(newErrors);
    setTouched(
      config.questions.reduce((acc, q) => ({ ...acc, [q.id]: true }), {})
    );

    if (hasError) {
      // Scroll to the first error element
      const firstErrorId = Object.keys(newErrors)[0];
      const element = document.getElementById(`field-${firstErrorId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await onSubmit(answers);
      setSubmittedResponse(resp);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(`Terjadi kendala saat mengirim: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Celebration submission success screen
  if (submittedResponse) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white dark:bg-[#22251F] rounded-2xl shadow-sm border border-[#E5E2D1] dark:border-[#3B3E32] p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-[#829273]/15 dark:bg-[#829273]/25 text-[#637254] dark:text-[#A7B998] mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-[#3D4035] dark:text-[#E8E6DF]">
            Tanggapan Anda Berhasil Dikirim!
          </h2>
          <p className="mt-2 text-sm text-[#737766] dark:text-[#A3A796]">
            Terima kasih telah berpartisipasi dalam {config.title}. Data Anda telah tersimpan secara
            aman.
          </p>

          {/* Sync Status Badges */}
          <div className="mt-6 pt-6 border-t border-[#E5E2D1] dark:border-[#3B3E32] grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs">
            <div className="p-3 rounded-xl bg-[#F9F8F4] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32]">
              <span className="text-[#737766] dark:text-[#A3A796] block font-medium">
                Google Spreadsheet:
              </span>
              <span className="font-semibold text-[#829273] dark:text-[#A7B998] flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {submittedResponse.googleSheetStatus === 'synced'
                  ? 'Tersinkronisasi Otomatis'
                  : 'Tercatat di Antrean Sinkron'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F9F8F4] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32]">
              <span className="text-[#737766] dark:text-[#A3A796] block font-medium">
                Notifikasi Email:
              </span>
              <span className="font-semibold text-[#C97C5D] dark:text-[#DDA088] flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Terkirim ke Admin & Responden
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSubmittedResponse(null);
                setAnswers({});
                setTouched({});
                setErrors({});
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#C97C5D] hover:bg-[#B66E50] text-white rounded-full text-xs font-semibold shadow-lg shadow-[#C97C5D]/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Kirim Tanggapan Lain
            </button>

            {onBackToEditor && (
              <button
                onClick={onBackToEditor}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F4F2E9] dark:bg-[#2A2D25] hover:bg-[#EAE6D7] dark:hover:bg-[#33372C] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-full text-xs font-semibold transition-all cursor-pointer"
              >
                Kembali ke Editor
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Title Card */}
        <div className="bg-white dark:bg-[#22251F] rounded-2xl shadow-sm border border-[#E5E2D1] dark:border-[#3B3E32] overflow-hidden">
          {config.theme.bannerImage && (
            <div className="h-40 sm:h-52 w-full overflow-hidden relative">
              <img
                src={config.theme.bannerImage}
                alt="Form Banner"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-8 border-t-4 border-[#829273]">
            <div className="mb-2">
              <span className="text-xs font-bold text-[#829273] tracking-widest uppercase">
                Form Overview
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3D4035] dark:text-[#E8E6DF] leading-tight">
              {config.title}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#737766] dark:text-[#A3A796] leading-relaxed whitespace-pre-line">
              {config.description}
            </p>

            <div className="mt-5 pt-4 border-t border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-between text-xs text-[#858977] dark:text-[#A3A796]">
              <span className="text-[#C97C5D] font-semibold">* Wajib diisi</span>
              <span>Validasi otomatis & real-time</span>
            </div>
          </div>
        </div>

        {/* Questions Loop */}
        {config.questions.map((question, index) => {
          if (!isQuestionVisible(question)) return null;

          const hasErr = Boolean(touched[question.id] && errors[question.id]);
          const currentVal = answers[question.id];

          return (
            <div
              id={`field-${question.id}`}
              key={question.id}
              className={`bg-white dark:bg-[#22251F] rounded-2xl shadow-sm p-6 sm:p-7 border transition-all ${
                hasErr
                  ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/10 ring-2 ring-rose-100 dark:ring-rose-950/40'
                  : 'border-[#E5E2D1] dark:border-[#3B3E32] focus-within:border-[#829273]'
              }`}
            >
              <div className="mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#829273] tracking-widest uppercase block mb-1">
                      Pertanyaan {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </span>
                    <label className="block text-base font-semibold text-[#3D4035] dark:text-[#E8E6DF]">
                      {question.title}
                      {question.validation.required && (
                        <span className="text-[#C97C5D] ml-1" title="Pertanyaan ini wajib diisi">
                          *
                        </span>
                      )}
                    </label>
                  </div>
                </div>
                {question.description && (
                  <p className="text-xs text-[#737766] dark:text-[#A3A796] mt-1">
                    {question.description}
                  </p>
                )}
              </div>

              {/* INPUT TYPE RENDERING */}
              {/* 1. Short text */}
              {question.type === 'short_text' && (
                <div>
                  <input
                    type="text"
                    value={currentVal || ''}
                    onChange={(e) => handleChange(question, e.target.value)}
                    onBlur={() => handleBlur(question)}
                    placeholder="Tuliskan jawaban Anda..."
                    className="w-full text-sm sm:text-base px-4 py-3 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273] focus:border-[#829273] transition-all placeholder:text-[#858977]/60"
                  />
                </div>
              )}

              {/* 2. Long text / Paragraph */}
              {question.type === 'long_text' && (
                <div>
                  <textarea
                    rows={4}
                    value={currentVal || ''}
                    onChange={(e) => handleChange(question, e.target.value)}
                    onBlur={() => handleBlur(question)}
                    placeholder="Tuliskan jawaban atau tanggapan lengkap Anda di sini..."
                    className="w-full text-sm sm:text-base px-4 py-3 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273] focus:border-[#829273] transition-all placeholder:text-[#858977]/60 resize-y"
                  />
                </div>
              )}

              {/* 3. Multiple Choice */}
              {question.type === 'multiple_choice' && (
                <div className="space-y-2.5">
                  {(question.options || []).map((option, optIdx) => (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all ${
                        currentVal === option
                          ? 'bg-[#829273]/10 dark:bg-[#829273]/25 border-[#829273] text-[#3D4035] dark:text-[#E8E6DF] ring-1 ring-[#829273]'
                          : 'bg-[#FDFCF8] dark:bg-[#1E201B] border-[#E5E2D1] dark:border-[#3B3E32] hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={currentVal === option}
                        onChange={() => handleChange(question, option)}
                        onBlur={() => handleBlur(question)}
                        className="w-4 h-4 text-[#829273] accent-[#829273] focus:ring-[#829273]"
                      />
                      <span className="text-sm font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* 4. Checkboxes */}
              {question.type === 'checkboxes' && (
                <div className="space-y-2.5">
                  {(question.options || []).map((option, optIdx) => {
                    const isChecked =
                      Array.isArray(currentVal) && currentVal.includes(option);
                    return (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#829273]/10 dark:bg-[#829273]/25 border-[#829273] text-[#3D4035] dark:text-[#E8E6DF] ring-1 ring-[#829273]'
                            : 'bg-[#FDFCF8] dark:bg-[#1E201B] border-[#E5E2D1] dark:border-[#3B3E32] hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={option}
                          checked={isChecked}
                          onChange={() => handleCheckboxToggle(question, option)}
                          onBlur={() => handleBlur(question)}
                          className="w-4 h-4 rounded text-[#829273] accent-[#829273] focus:ring-[#829273]"
                        />
                        <span className="text-sm font-medium">{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 5. Linear Scale (Survey Scale with Natural Tones rounded pill track) */}
              {question.type === 'linear_scale' && (
                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl sm:rounded-full bg-[#F9F8F4] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32]">
                    <span className="text-[10px] text-[#737766] dark:text-[#A3A796] uppercase font-bold sm:w-20 text-center sm:text-left">
                      {question.linearScale?.minLabel || 'Sangat Buruk'}
                    </span>

                    {/* Scale Circular Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                      {Array.from(
                        {
                          length:
                            (question.linearScale?.max || 5) -
                            (question.linearScale?.min || 1) +
                            1,
                        },
                        (_, i) => (question.linearScale?.min || 1) + i
                      ).map((score) => {
                        const isSelected = currentVal === score;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleChange(question, score)}
                            onBlur={() => handleBlur(question)}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#829273] text-white border border-[#829273] shadow-sm font-bold scale-105'
                                : 'bg-white dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] hover:bg-[#829273] hover:text-white hover:border-[#829273]'
                            }`}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>

                    <span className="text-[10px] text-[#737766] dark:text-[#A3A796] uppercase font-bold sm:w-20 text-center sm:text-right">
                      {question.linearScale?.maxLabel || 'Sangat Baik'}
                    </span>
                  </div>
                </div>
              )}

              {/* 6. File Upload with Natural Tones */}
              {question.type === 'file_upload' && (
                <div>
                  {currentVal && (currentVal as UploadedFileMeta).name ? (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#829273]/10 dark:bg-[#829273]/20 border border-[#829273]/40">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-[#829273]/20 text-[#637254] dark:text-[#B5C4A6] flex-shrink-0">
                          {(currentVal as UploadedFileMeta).type.includes('pdf') ? (
                            <FileText className="w-5 h-5" />
                          ) : (
                            <ImageIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-[#3D4035] dark:text-[#E8E6DF] truncate">
                            {(currentVal as UploadedFileMeta).name}
                          </p>
                          <p className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                            {Math.round(
                              ((currentVal as UploadedFileMeta).size || 0) / 1024
                            )}{' '}
                            KB • Terverifikasi
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(question.id)}
                        className="p-1.5 rounded-lg text-[#737766] hover:text-[#C97C5D] hover:bg-black/5"
                        title="Hapus berkas"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRefs.current[question.id]?.click()}
                      className="border-2 border-dashed border-[#E5E2D1] dark:border-[#3B3E32] hover:border-[#829273] rounded-xl p-8 text-center cursor-pointer transition-colors bg-[#FDFCF8] dark:bg-[#1E201B]"
                    >
                      <input
                        ref={(el) => (fileInputRefs.current[question.id] = el)}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(question, e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="w-9 h-9 rounded-full bg-[#829273]/10 text-[#829273] flex items-center justify-center mx-auto mb-2">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium text-[#3D4035] dark:text-[#E8E6DF]">
                        Drop files here or <span className="text-[#C97C5D] underline font-medium">browse</span>
                      </p>
                      <p className="text-[10px] text-[#858977] dark:text-[#A3A796] mt-2">
                        Validation: Max {question.validation.maxFileSizeMb || 5}MB, PDF/JPG/PNG only
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 7. Dropdown */}
              {question.type === 'dropdown' && (
                <div>
                  <select
                    value={currentVal || ''}
                    onChange={(e) => handleChange(question, e.target.value)}
                    onBlur={() => handleBlur(question)}
                    className="w-full text-sm sm:text-base px-4 py-3 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273] focus:border-[#829273]"
                  >
                    <option value="">-- Pilih salah satu --</option>
                    {(question.options || []).map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 8. Date */}
              {question.type === 'date' && (
                <div>
                  <input
                    type="date"
                    value={currentVal || ''}
                    onChange={(e) => handleChange(question, e.target.value)}
                    onBlur={() => handleBlur(question)}
                    className="w-full text-sm px-4 py-3 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
                  />
                </div>
              )}

              {/* 9. Signature (Tanda Tangan Digital) */}
              {question.type === 'signature' && (
                <div className="pt-1">
                  <SignaturePad
                    value={typeof currentVal === 'string' ? currentVal : ''}
                    onChange={(sigData) => {
                      handleChange(question, sigData);
                      handleBlur(question);
                    }}
                    onClear={() => {
                      handleChange(question, '');
                      handleBlur(question);
                    }}
                    required={question.validation.required}
                    signerNamePlaceholder={answers['q_nama'] || ''}
                  />
                </div>
              )}

              {/* Error Message Display */}
              {hasErr && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors[question.id]}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Submit Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#22251F] border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
          <div className="text-xs text-[#737766] dark:text-[#A3A796] text-center sm:text-left">
            <span>Data dikirimkan langsung ke sistem pencatatan resmi Google Workspace.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#C97C5D] hover:bg-[#B66E50] disabled:bg-stone-300 text-white rounded-full font-semibold text-xs uppercase tracking-wider shadow-lg shadow-[#C97C5D]/20 transition-all focus:ring-4 focus:ring-[#C97C5D]/30 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan & Menyinkronkan...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Formulir</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
