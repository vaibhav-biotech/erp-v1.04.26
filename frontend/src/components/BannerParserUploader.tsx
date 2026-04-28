'use client';

import { useEffect, useState } from 'react';

export interface ParsedBannerFile {
  file: File;
  width: number;
  height: number;
}

interface BannerParserUploaderProps {
  onFilesSelect: (files: ParsedBannerFile[]) => void;
  clearSignal?: number;
}

export default function BannerParserUploader({ onFilesSelect, clearSignal }: BannerParserUploaderProps) {
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<ParsedBannerFile[]>([]);
  const [inputKey, setInputKey] = useState(0);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        resolve({ width: image.width, height: image.height });
        URL.revokeObjectURL(objectUrl);
      };

      image.onerror = () => {
        reject(new Error('Invalid image file'));
        URL.revokeObjectURL(objectUrl);
      };

      image.src = objectUrl;
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      setError('');

      const parsedFiles = await Promise.all(
        files.map(async (file) => {
          const parsed = await getImageDimensions(file);
          return {
            file,
            width: parsed.width,
            height: parsed.height,
          };
        })
      );

      setSelectedFiles(parsedFiles);
      onFilesSelect(parsedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setSelectedFiles([]);
      onFilesSelect([]);
    }
  };

  useEffect(() => {
    if (clearSignal === undefined) return;

    setError('');
    setSelectedFiles([]);
    setInputKey((prev) => prev + 1);
    onFilesSelect([]);
  }, [clearSignal]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase text-gray-600">Banner Parser (Upload Image)</label>
      <input
        key={inputKey}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
      />
      {selectedFiles.length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          <p>Selected: {selectedFiles.length} image(s)</p>
          <div className="max-h-20 overflow-auto border border-gray-200 rounded-md p-2 bg-gray-50">
            {selectedFiles.map((item) => (
              <p key={`${item.file.name}-${item.file.size}`} className="truncate">
                {item.file.name} ({item.width} × {item.height})
              </p>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-gray-500">Recommended size: 1920 × 600</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
