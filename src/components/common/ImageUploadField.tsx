import React, { useState, useRef } from 'react';
import { Upload, Link2, Trash2, Image as ImageIcon, CheckCircle2, RefreshCw } from 'lucide-react';
import { fileToOptimizedDataUrl } from '../../lib/imageUtils';
import { toast } from 'sonner';
import { soundEngine } from '../../lib/sound';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  aspectHint?: string;
  maxDimension?: number;
  previewClassName?: string;
  id?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  helpText = 'PNG, JPG, SVG veya WEBP formatında görsel yükleyebilirsiniz.',
  placeholder = 'https://...',
  aspectHint,
  maxDimension = 600,
  previewClassName = 'h-14 w-28',
  id = 'image-upload-field',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin (PNG, JPG, SVG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB altında olmalıdır.');
      return;
    }

    try {
      setIsProcessing(true);
      const dataUrl = await fileToOptimizedDataUrl(file, maxDimension, maxDimension, 0.9);
      onChange(dataUrl);
      soundEngine.playSuccess();
      toast.success('Görsel başarıyla yüklendi!');
    } catch (err) {
      console.error('Image processing error:', err);
      toast.error('Görsel işlenirken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // reset input value so re-uploading same file triggers change
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClear = () => {
    soundEngine.playClick();
    onChange('');
  };

  const isDataUrl = value?.startsWith('data:image');

  return (
    <div id={id} className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-200">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>

        {/* Tab switch between File Upload and URL */}
        <div className="flex items-center bg-[#0d0918] p-0.5 rounded-lg border border-violet-800/30 text-[11px]">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('upload');
            }}
            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Dosya Yükle</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('url');
            }}
            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3 h-3" />
            <span>URL Linki</span>
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div className="space-y-2">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-violet-400 bg-violet-950/50 scale-[1.01]'
                : 'border-violet-800/50 hover:border-violet-600/70 bg-[#0d0918]/90 hover:bg-[#120b22]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                {isProcessing ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-violet-300" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  {isProcessing
                    ? 'Görsel optimize ediliyor...'
                    : 'Görsel Seçmek İçin Tıklayın veya Buraya Sürükleyin'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {aspectHint ? `${aspectHint} • ` : ''}PNG, JPG, SVG veya WEBP (Maks. 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full p-2.5 rounded-xl bg-[#0d0918] border border-violet-800/40 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Doğrudan görsel bağlantı adresini (URL) yapıştırabilirsiniz.
          </p>
        </div>
      )}

      {/* Image Preview & Details Card */}
      {value ? (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-violet-950/40 border border-violet-800/30 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`rounded-lg bg-[#0c0817] border border-violet-800/40 p-1 flex items-center justify-center shrink-0 ${previewClassName}`}>
              <img
                src={value}
                alt="Logo Önizleme"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Görsel Yüklendi</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-xs font-mono">
                {isDataUrl ? 'Cihazdan Yüklenmiş Dosya (Base64)' : value}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-violet-900/60 hover:bg-violet-800 text-violet-200 text-[11px] font-semibold border border-violet-700/40 transition-colors cursor-pointer"
            >
              Değiştir
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/30 transition-colors cursor-pointer"
              title="Görseli Kaldır"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {helpText && !value && (
        <p className="text-[11px] text-slate-400">{helpText}</p>
      )}
    </div>
  );
};
