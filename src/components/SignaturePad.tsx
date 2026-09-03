import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  PenTool,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Type,
  Upload,
  Undo2,
  Sparkles,
  Download,
} from 'lucide-react';

interface SignaturePadProps {
  value?: string; // base64 data URL
  onChange: (signatureDataUrl: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  required?: boolean;
  signerNamePlaceholder?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  onClear,
  disabled = false,
  required = false,
  signerNamePlaceholder = '',
}) => {
  const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [inkColor, setInkColor] = useState<string>('#1E201B'); // default official dark
  const [lineWidth, setLineWidth] = useState<number>(2.5);
  const [hasDrawn, setHasDrawn] = useState<boolean>(Boolean(value));
  const [typedName, setTypedName] = useState<string>(signerNamePlaceholder);
  const [typedFont, setTypedFont] = useState<'script' | 'cursive' | 'serif'>('script');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const strokesHistoryRef = useRef<ImageData[]>([]);

  // Setup canvas resolution and DPR
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(300, Math.floor(rect.width));
    const height = 180;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = lineWidth;

      // Save initial blank state for undo
      strokesHistoryRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    }
  }, [inkColor, lineWidth]);

  useEffect(() => {
    if (mode === 'draw') {
      // Small timeout to allow DOM to measure dimensions accurately
      const timer = setTimeout(() => {
        setupCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mode, setupCanvas]);

  // Window resize observer
  useEffect(() => {
    if (!containerRef.current || mode !== 'draw') return;

    const ro = new ResizeObserver(() => {
      // Only re-setup if canvas hasn't been drawn yet, or preserve strokes
      if (!hasDrawn) {
        setupCanvas();
      }
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [mode, hasDrawn, setupCanvas]);

  // Get pointer coordinates relative to canvas
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDrawingRef.current = false;
    ctx.closePath();

    // Push state to history
    strokesHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setHasDrawn(true);

    // Emit PNG data URL
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokesHistoryRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    }
    setHasDrawn(false);
    if (onClear) onClear();
    onChange('');
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || strokesHistoryRef.current.length <= 1) return;

    // Pop the current state
    strokesHistoryRef.current.pop();
    const previousState = strokesHistoryRef.current[strokesHistoryRef.current.length - 1];
    ctx.putImageData(previousState, 0, 0);

    if (strokesHistoryRef.current.length === 1) {
      setHasDrawn(false);
      onChange('');
    } else {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  // Convert typed name to canvas signature image
  const generateTypedSignature = () => {
    if (!typedName.trim()) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 600;
    tempCanvas.height = 200;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.fillStyle = inkColor;

    let fontStyle = 'italic 52px "Caveat", "Brush Script MT", "Segoe Script", cursive';
    if (typedFont === 'cursive') {
      fontStyle = 'italic 46px "Lucida Handwriting", "Great Vibes", cursive';
    } else if (typedFont === 'serif') {
      fontStyle = 'italic 48px "Georgia", serif';
    }

    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName.trim(), tempCanvas.width / 2, tempCanvas.height / 2 - 10);

    // Add subtle stylistic underline
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tempCanvas.width / 2 - 140, tempCanvas.height / 2 + 25);
    ctx.quadraticCurveTo(
      tempCanvas.width / 2,
      tempCanvas.height / 2 + 35,
      tempCanvas.width / 2 + 140,
      tempCanvas.height / 2 + 20
    );
    ctx.stroke();

    const dataUrl = tempCanvas.toDataURL('image/png');
    setHasDrawn(true);
    onChange(dataUrl);
  };

  // Upload image handler
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon unggah berkas gambar (PNG atau JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setHasDrawn(true);
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // If already signed, show verified state with option to re-sign
  if (value && hasDrawn) {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-[#829273]/10 dark:bg-[#829273]/20 border border-[#829273]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#22251F] border border-[#829273]/30 flex items-center justify-center text-[#637254] dark:text-[#B5C4A6] shadow-sm flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#829273]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  Tanda Tangan Digital Telah Terverifikasi
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#829273] text-white">
                  Siap Dikirim
                </span>
              </div>
              <p className="text-[11px] text-[#737766] dark:text-[#A3A796] mt-0.5">
                Tanda tangan tersimpan secara aman sebagai bukti persetujuan formulir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#22251F] text-[#C97C5D] border border-[#C97C5D]/30 hover:bg-[#C97C5D]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tanda Tangan Ulang</span>
            </button>
          </div>
        </div>

        {/* Signature Preview Thumbnail */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E201B] border border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-center min-h-[120px]">
          <img
            src={value}
            alt="Pratinjau Tanda Tangan"
            className="max-h-24 max-w-full object-contain filter dark:brightness-110"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-[#E5E2D1] dark:border-[#3B3E32] pb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'draw'
                ? 'bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]'
                : 'text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Gores Tangan</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('type')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'type'
                ? 'bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]'
                : 'text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF]'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Ketik Nama</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'upload'
                ? 'bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]'
                : 'text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Gambar</span>
          </button>
        </div>

        {/* Ink Colors for drawing mode */}
        {mode === 'draw' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#737766] font-medium hidden sm:inline">
              Warna Tinta:
            </span>
            <button
              type="button"
              onClick={() => setInkColor('#1E201B')}
              className={`w-4 h-4 rounded-full bg-[#1E201B] border transition-all ${
                inkColor === '#1E201B' ? 'ring-2 ring-offset-1 ring-[#829273] scale-110' : ''
              }`}
              title="Tinta Hitam Dokumen"
            />
            <button
              type="button"
              onClick={() => setInkColor('#1E3A8A')}
              className={`w-4 h-4 rounded-full bg-[#1E3A8A] border transition-all ${
                inkColor === '#1E3A8A' ? 'ring-2 ring-offset-1 ring-[#829273] scale-110' : ''
              }`}
              title="Tinta Biru Resmi"
            />
            <button
              type="button"
              onClick={() => setInkColor('#637254')}
              className={`w-4 h-4 rounded-full bg-[#637254] border transition-all ${
                inkColor === '#637254' ? 'ring-2 ring-offset-1 ring-[#829273] scale-110' : ''
              }`}
              title="Tinta Sage"
            />
          </div>
        )}
      </div>

      {/* MODE 1: CANVAS DRAWING */}
      {mode === 'draw' && (
        <div className="space-y-2">
          <div className="relative rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#1E201B] overflow-hidden shadow-inner touch-none">
            {/* Signature Baseline Guide */}
            <div className="absolute inset-x-6 bottom-9 border-b border-dashed border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-between pointer-events-none select-none">
              <span className="text-[11px] font-serif text-[#A3A796]/70 dark:text-[#737766]">
                ✕ Tanda tangan di atas garis ini
              </span>
              <span className="text-[10px] text-[#A3A796]/60 uppercase tracking-widest">
                Digital Pad
              </span>
            </div>

            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-[180px] cursor-crosshair block relative z-10"
              style={{ touchAction: 'none' }}
            />
          </div>

          {/* Canvas Controls */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokesHistoryRef.current.length <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#F4F2E9] disabled:opacity-40 transition-colors cursor-pointer"
                title="Batalkan goresan terakhir"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] text-[#C97C5D] hover:bg-[#C97C5D]/10 transition-colors cursor-pointer"
                title="Bersihkan kanvas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            </div>

            <span className="text-[11px] text-[#737766] dark:text-[#A3A796]">
              Gunakan mouse, stylus, atau jari Anda di layar sentuh
            </span>
          </div>
        </div>
      )}

      {/* MODE 2: TYPED NAME SIGNATURE */}
      {mode === 'type' && (
        <div className="p-5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
              Ketik Nama Lengkap Penandatangan:
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Contoh: Siti Nurhaliza"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#22251F] text-[#3D4035] dark:text-[#E8E6DF] focus:ring-2 focus:ring-[#829273]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#737766] dark:text-[#A3A796]">Gaya Huruf:</span>
            <button
              type="button"
              onClick={() => setTypedFont('script')}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                typedFont === 'script'
                  ? 'bg-[#829273] text-white'
                  : 'bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF]'
              }`}
            >
              Kaligrafi Santai
            </button>
            <button
              type="button"
              onClick={() => setTypedFont('cursive')}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                typedFont === 'cursive'
                  ? 'bg-[#829273] text-white'
                  : 'bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF]'
              }`}
            >
              Tulisan Tangan Halus
            </button>
            <button
              type="button"
              onClick={() => setTypedFont('serif')}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                typedFont === 'serif'
                  ? 'bg-[#829273] text-white'
                  : 'bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF]'
              }`}
            >
              Formal Seremoni
            </button>
          </div>

          {/* Live Typing Preview */}
          <div className="p-6 rounded-xl border border-dashed border-[#E5E2D1] dark:border-[#3B3E32] bg-white dark:bg-[#22251F] text-center min-h-[100px] flex items-center justify-center">
            {typedName.trim() ? (
              <span
                className={`text-2xl sm:text-3xl italic tracking-wide text-[#1E201B] dark:text-[#E8E6DF] ${
                  typedFont === 'serif' ? 'font-serif' : 'font-sans font-medium'
                }`}
              >
                {typedName}
              </span>
            ) : (
              <span className="text-xs text-[#A3A796] italic">
                Ketik nama di atas untuk melihat tanda tangan otomatis
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={generateTypedSignature}
            disabled={!typedName.trim()}
            className="w-full py-2.5 bg-[#829273] hover:bg-[#728263] disabled:opacity-40 text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gunakan Sebagai Tanda Tangan Resmi</span>
          </button>
        </div>
      )}

      {/* MODE 3: UPLOAD SIGNATURE IMAGE */}
      {mode === 'upload' && (
        <div className="p-6 rounded-xl border-2 border-dashed border-[#E5E2D1] dark:border-[#3B3E32] hover:border-[#829273] bg-[#FDFCF8] dark:bg-[#1E201B] text-center transition-colors">
          <label className="cursor-pointer block">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleUploadImage}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-[#829273]/10 text-[#829273] flex items-center justify-center mx-auto mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
              Pilih Berkas Foto / Scan Tanda Tangan
            </p>
            <p className="text-[11px] text-[#737766] dark:text-[#A3A796] mt-1">
              Format PNG (latar transparan disarankan) atau JPG. Maksimal 2MB.
            </p>
          </label>
        </div>
      )}
    </div>
  );
};
