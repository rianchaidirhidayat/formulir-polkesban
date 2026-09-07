import React, { useMemo } from 'react';
import {
  Activity,
  HeartPulse,
  Scale,
  Ruler,
  Droplet,
  CheckCircle2,
  AlertTriangle,
  Info,
  CircleDot,
  Calculator,
} from 'lucide-react';
import { HealthMetricType, HealthCheckupValues } from '../types';

export const HEALTH_METRIC_CONFIGS: Record<
  HealthMetricType,
  {
    label: string;
    unit: string;
    placeholder: string;
    helperText: string;
    icon: React.ComponentType<{ className?: string }>;
    normalText: string;
    step?: string;
  }
> = {
  tinggi_badan: {
    label: 'Tinggi Badan',
    unit: 'cm',
    placeholder: 'Contoh: 168',
    helperText: 'Satuan sentimeter (cm), diukur tanpa alas kaki',
    icon: Ruler,
    normalText: 'Rentang standar dewasa: 145 - 195 cm',
    step: '0.5',
  },
  berat_badan: {
    label: 'Berat Badan',
    unit: 'kg',
    placeholder: 'Contoh: 65.5',
    helperText: 'Satuan kilogram (kg), timbangan terkalibrasi',
    icon: Scale,
    normalText: 'Gunakan angka desimal jika diperlukan (misal: 62.5)',
    step: '0.1',
  },
  tekanan_darah: {
    label: 'Tekanan Darah',
    unit: 'mmHg',
    placeholder: '120/80',
    helperText: 'Format: Sistol / Diastol (Contoh: 120/80 mmHg)',
    icon: HeartPulse,
    normalText: 'Normal: Sistol < 120 dan Diastol < 80 mmHg',
  },
  lingkar_pinggang: {
    label: 'Lingkar Pinggang',
    unit: 'cm',
    placeholder: 'Contoh: 82',
    helperText: 'Diukur setinggi pusar dengan pita pengukur (cm)',
    icon: CircleDot,
    normalText: 'Batas aman: Pria < 90 cm, Wanita < 80 cm',
    step: '0.5',
  },
  kolesterol: {
    label: 'Kolesterol Total',
    unit: 'mg/dL',
    placeholder: 'Contoh: 185',
    helperText: 'Kadar kolesterol total dalam darah (mg/dL)',
    icon: Activity,
    normalText: 'Normal: < 200 mg/dL | Tinggi: ≥ 240 mg/dL',
    step: '1',
  },
  gula_darah: {
    label: 'Gula Darah',
    unit: 'mg/dL',
    placeholder: 'Contoh: 110',
    helperText: 'Kadar glukosa darah (mg/dL)',
    icon: Droplet,
    normalText: 'GDS Normal: < 140 mg/dL | GDP Normal: 70 - 99 mg/dL',
    step: '1',
  },
  custom: {
    label: 'Pemeriksaan Klinis',
    unit: '',
    placeholder: 'Nilai hasil pemeriksaan',
    helperText: 'Hasil pemeriksaan laboratorium atau fisik',
    icon: Activity,
    normalText: 'Sesuai rujukan laboratorium',
  },
};

// Helper to evaluate blood pressure category
export const evaluateBloodPressure = (sistol?: number, diastol?: number) => {
  if (!sistol || !diastol) return null;
  if (sistol >= 140 || diastol >= 90) {
    return {
      label: 'Hipertensi',
      color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800',
    };
  }
  if (sistol >= 120 || diastol >= 80) {
    return {
      label: 'Pra-Hipertensi / Waspada',
      color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
    };
  }
  if (sistol < 90 || diastol < 60) {
    return {
      label: 'Hipotensi (Rendah)',
      color: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800',
    };
  }
  return {
    label: 'Normal Optimal',
    color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
  };
};

// Helper to evaluate BMI (Indeks Massa Tubuh)
export const calculateBMI = (tbCm?: number, bbKg?: number) => {
  if (!tbCm || !bbKg || tbCm < 50 || bbKg < 20) return null;
  const tbMeter = tbCm / 100;
  const bmi = bbKg / (tbMeter * tbMeter);
  const rounded = Math.round(bmi * 10) / 10;

  // Kategori Kemenkes RI
  if (rounded < 18.5) {
    return {
      bmi: rounded,
      category: 'Berat Badan Kurang (Underweight)',
      color: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800',
    };
  }
  if (rounded <= 22.9) {
    return {
      bmi: rounded,
      category: 'Normal / Ideal',
      color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
    };
  }
  if (rounded <= 24.9) {
    return {
      bmi: rounded,
      category: 'Kelebihan Berat Badan (Overweight)',
      color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
    };
  }
  return {
    bmi: rounded,
    category: 'Obesitas',
    color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800',
  };
};

interface SingleHealthMetricInputProps {
  type: HealthMetricType;
  value: any;
  onChange: (val: any) => void;
  sugarType?: string;
  onSugarTypeChange?: (st: string) => void;
  disabled?: boolean;
  isCompact?: boolean;
  unit?: string;
}

export const SingleHealthMetricInput: React.FC<SingleHealthMetricInputProps> = ({
  type,
  value,
  onChange,
  sugarType = 'Sewaktu',
  onSugarTypeChange,
  disabled = false,
  isCompact = false,
  unit,
}) => {
  const config = HEALTH_METRIC_CONFIGS[type] || HEALTH_METRIC_CONFIGS.custom;
  const displayUnit = unit || config.unit;
  const IconComp = config.icon;

  // Special renderer for blood pressure (Tekanan Darah)
  if (type === 'tekanan_darah') {
    // Parse value if string like "120/80" or object
    let sistolStr = '';
    let diastolStr = '';

    if (typeof value === 'object' && value !== null) {
      sistolStr = String(value.sistol || '');
      diastolStr = String(value.diastol || '');
    } else if (typeof value === 'string' && value.includes('/')) {
      const parts = value.replace('mmHg', '').trim().split('/');
      sistolStr = parts[0]?.trim() || '';
      diastolStr = parts[1]?.trim() || '';
    } else if (typeof value === 'string') {
      sistolStr = value;
    }

    const sistolNum = parseFloat(sistolStr);
    const diastolNum = parseFloat(diastolStr);
    const bpEvaluation = evaluateBloodPressure(sistolNum, diastolNum);

    const handleBpChange = (newSis: string, newDia: string) => {
      if (!newSis && !newDia) {
        onChange('');
        return;
      }
      const combined = `${newSis || ''}/${newDia || ''} mmHg`;
      onChange(combined);
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Sistol */}
          <div className="flex-1 min-w-[110px]">
            <label className="block text-[11px] font-semibold text-[#737766] dark:text-[#A3A796] mb-1">
              Sistol (Atas)
            </label>
            <div className="relative">
              <input
                type="number"
                min="50"
                max="260"
                disabled={disabled}
                value={sistolStr}
                onChange={(e) => handleBpChange(e.target.value, diastolStr)}
                placeholder="120"
                className={`w-full font-mono text-center font-bold text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-xl bg-white dark:bg-[#1E201B] focus:ring-2 focus:ring-[#829273] outline-none ${
                  isCompact ? 'py-1.5 px-2 text-sm' : 'py-2.5 px-3 text-base'
                }`}
              />
            </div>
          </div>

          <span className="text-xl font-bold text-[#737766] pt-4 select-none">/</span>

          {/* Diastol */}
          <div className="flex-1 min-w-[110px]">
            <label className="block text-[11px] font-semibold text-[#737766] dark:text-[#A3A796] mb-1">
              Diastol (Bawah)
            </label>
            <div className="relative">
              <input
                type="number"
                min="30"
                max="160"
                disabled={disabled}
                value={diastolStr}
                onChange={(e) => handleBpChange(sistolStr, e.target.value)}
                placeholder="80"
                className={`w-full font-mono text-center font-bold text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-xl bg-white dark:bg-[#1E201B] focus:ring-2 focus:ring-[#829273] outline-none ${
                  isCompact ? 'py-1.5 px-2 text-sm' : 'py-2.5 px-3 text-base'
                }`}
              />
            </div>
          </div>

          {/* Unit Badge */}
          <div className="pt-5 sm:pt-4">
            <span className="inline-flex items-center px-3 py-2 bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] font-bold text-xs rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] whitespace-nowrap shadow-2xs">
              {displayUnit}
            </span>
          </div>
        </div>

        {/* Live Interpretation Badge */}
        {bpEvaluation && (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${bpEvaluation.color}`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Kategori: {bpEvaluation.label}</span>
          </div>
        )}
      </div>
    );
  }

  // Special renderer for blood sugar (Gula Darah)
  if (type === 'gula_darah') {
    let numericVal = '';
    let selectedState = sugarType || 'Sewaktu';

    if (typeof value === 'string') {
      const match = value.match(/(\d+(\.\d+)?)/);
      numericVal = match ? match[0] : value;
      if (value.toLowerCase().includes('puasa')) selectedState = 'Puasa';
      else if (value.toLowerCase().includes('2 jam') || value.toLowerCase().includes('pp'))
        selectedState = '2 Jam PP';
      else if (value.toLowerCase().includes('sewaktu')) selectedState = 'Sewaktu';
    } else if (typeof value === 'number') {
      numericVal = String(value);
    }

    const handleSugarChange = (num: string, state: string) => {
      if (!num) {
        onChange('');
        return;
      }
      onChange(`${num} mg/dL (${state})`);
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Sugar Sample Type Selector */}
          <select
            value={selectedState}
            disabled={disabled}
            onChange={(e) => {
              const newState = e.target.value;
              if (onSugarTypeChange) onSugarTypeChange(newState);
              handleSugarChange(numericVal, newState);
            }}
            className={`rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] font-semibold text-xs focus:ring-2 focus:ring-[#829273] outline-none ${
              isCompact ? 'py-1.5 px-2.5' : 'py-2.5 px-3'
            }`}
          >
            <option value="Sewaktu">Gula Darah Sewaktu (GDS)</option>
            <option value="Puasa">Gula Darah Puasa (GDP)</option>
            <option value="2 Jam PP">Gula Darah 2 Jam PP</option>
          </select>

          {/* Numeric Input */}
          <div className="relative flex-1 min-w-[100px]">
            <input
              type="number"
              step="1"
              min="20"
              max="600"
              disabled={disabled}
              value={numericVal}
              onChange={(e) => handleSugarChange(e.target.value, selectedState)}
              placeholder="Contoh: 110"
              className={`w-full font-mono font-bold text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-xl bg-white dark:bg-[#1E201B] focus:ring-2 focus:ring-[#829273] outline-none ${
                isCompact ? 'py-1.5 pl-3 pr-16 text-sm' : 'py-2.5 pl-3 pr-16 text-base'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#737766] dark:text-[#A3A796] select-none">
              {displayUnit}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Standard Health Metric Input (Tinggi Badan, Berat Badan, Lingkar Pinggang, Kolesterol, Custom)
  const stringVal =
    typeof value === 'number'
      ? String(value)
      : typeof value === 'string'
      ? value.replace(/[^\d.]/g, '')
      : '';

  const handleStandardChange = (valStr: string) => {
    if (!valStr) {
      onChange('');
      return;
    }
    onChange(`${valStr} ${displayUnit}`.trim());
  };

  return (
    <div className="relative max-w-sm">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-[#829273] pointer-events-none">
          <IconComp className={isCompact ? 'w-4 h-4' : 'w-4 h-4'} />
        </div>

        <input
          type="number"
          step={config.step || '1'}
          disabled={disabled}
          value={stringVal}
          onChange={(e) => handleStandardChange(e.target.value)}
          placeholder={config.placeholder}
          className={`w-full pl-9 pr-16 font-mono font-bold text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-xl bg-white dark:bg-[#1E201B] focus:ring-2 focus:ring-[#829273] outline-none transition-all ${
            isCompact ? 'py-1.5 text-sm' : 'py-2.5 text-base'
          }`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <span className="px-2 py-0.5 bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] font-bold text-xs rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] select-none">
            {displayUnit}
          </span>
        </div>
      </div>
    </div>
  );
};

interface HealthCheckupPanelProps {
  value: HealthCheckupValues | Record<string, any> | undefined;
  onChange: (val: HealthCheckupValues) => void;
  disabled?: boolean;
  isCompact?: boolean;
}

export const HealthCheckupPanel: React.FC<HealthCheckupPanelProps> = ({
  value = {},
  onChange,
  disabled = false,
  isCompact = false,
}) => {
  const currentValues: HealthCheckupValues = typeof value === 'object' && value !== null ? value : {};

  const handleFieldChange = (field: keyof HealthCheckupValues, val: any) => {
    const updated: HealthCheckupValues = {
      ...currentValues,
      [field]: val,
    };

    // Calculate BMI automatically if TB and BB are present
    const tbNum = parseFloat(String(updated.tinggiBadan || '').replace(/[^\d.]/g, ''));
    const bbNum = parseFloat(String(updated.beratBadan || '').replace(/[^\d.]/g, ''));
    if (tbNum > 50 && bbNum > 20) {
      const bmiRes = calculateBMI(tbNum, bbNum);
      if (bmiRes) {
        updated.bmi = bmiRes.bmi;
        updated.bmiCategory = bmiRes.category;
      }
    }

    onChange(updated);
  };

  const tbNum = parseFloat(String(currentValues.tinggiBadan || '').replace(/[^\d.]/g, ''));
  const bbNum = parseFloat(String(currentValues.beratBadan || '').replace(/[^\d.]/g, ''));
  const bmiInfo = useMemo(() => calculateBMI(tbNum, bbNum), [tbNum, bbNum]);

  return (
    <div
      className={`rounded-2xl border border-[#829273]/30 bg-[#FDFCF8] dark:bg-[#1E201B] ${
        isCompact ? 'p-4 space-y-4' : 'p-5 sm:p-6 space-y-5'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E2D1] dark:border-[#3B3E32]">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-[#829273]" />
          <h4 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF]">
            Panel Pemeriksaan Kesehatan Lengkap
          </h4>
        </div>
        <span className="text-[11px] font-semibold text-[#829273] bg-[#829273]/10 dark:bg-[#829273]/25 px-2.5 py-0.5 rounded-full w-fit">
          Satuan Standar Klinis (Kemenkes)
        </span>
      </div>

      {/* Grid of Medical Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Tinggi Badan */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center justify-between">
            <span>Tinggi Badan (TB)</span>
            <span className="text-[10px] text-[#737766]">cm</span>
          </label>
          <SingleHealthMetricInput
            type="tinggi_badan"
            value={currentValues.tinggiBadan}
            onChange={(val) => handleFieldChange('tinggiBadan', val)}
            disabled={disabled}
            isCompact={isCompact}
          />
        </div>

        {/* 2. Berat Badan */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center justify-between">
            <span>Berat Badan (BB)</span>
            <span className="text-[10px] text-[#737766]">kg</span>
          </label>
          <SingleHealthMetricInput
            type="berat_badan"
            value={currentValues.beratBadan}
            onChange={(val) => handleFieldChange('beratBadan', val)}
            disabled={disabled}
            isCompact={isCompact}
          />
        </div>

        {/* 3. Lingkar Pinggang */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center justify-between">
            <span>Lingkar Pinggang (LP)</span>
            <span className="text-[10px] text-[#737766]">cm</span>
          </label>
          <SingleHealthMetricInput
            type="lingkar_pinggang"
            value={currentValues.lingkarPinggang}
            onChange={(val) => handleFieldChange('lingkarPinggang', val)}
            disabled={disabled}
            isCompact={isCompact}
          />
        </div>

        {/* 4. Tekanan Darah */}
        <div className="space-y-1 sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center justify-between">
            <span>Tekanan Darah (Sistol / Diastol)</span>
            <span className="text-[10px] text-[#737766]">mmHg</span>
          </label>
          <SingleHealthMetricInput
            type="tekanan_darah"
            value={currentValues.tekananDarah}
            onChange={(val) => handleFieldChange('tekananDarah', val)}
            disabled={disabled}
            isCompact={isCompact}
          />
        </div>

        {/* 5. Kolesterol */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center justify-between">
            <span>Kolesterol Total</span>
            <span className="text-[10px] text-[#737766]">mg/dL</span>
          </label>
          <SingleHealthMetricInput
            type="kolesterol"
            value={currentValues.kolesterol}
            onChange={(val) => handleFieldChange('kolesterol', val)}
            disabled={disabled}
            isCompact={isCompact}
          />
        </div>

        {/* 6. Gula Darah */}
        <div className="space-y-1 sm:col-span-2 lg:col-span-3">
          <label className="block text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center justify-between">
            <span>Gula Darah (Glukosa)</span>
            <span className="text-[10px] text-[#737766]">mg/dL</span>
          </label>
          <SingleHealthMetricInput
            type="gula_darah"
            value={currentValues.gulaDarah}
            onChange={(val) => handleFieldChange('gulaDarah', val)}
            disabled={disabled}
            isCompact={isCompact}
          />
        </div>
      </div>

      {/* Auto BMI Calculation Bar */}
      {bmiInfo && (
        <div className="p-3.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#252822] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#829273]/10 text-[#829273]">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] block">
                Indeks Massa Tubuh (IMT / BMI): <span className="font-mono text-sm">{bmiInfo.bmi}</span> kg/m²
              </span>
              <span className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                Dihitung otomatis dari Tinggi Badan ({tbNum} cm) & Berat Badan ({bbNum} kg)
              </span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 w-fit ${bmiInfo.color}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{bmiInfo.category}</span>
          </span>
        </div>
      )}
    </div>
  );
};
