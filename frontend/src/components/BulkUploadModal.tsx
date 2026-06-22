'use client';

import React, { useState } from 'react';
import { FiX, FiUpload, FiCheck, FiAlertCircle, FiEye, FiArrowRight, FiDownload, FiInfo } from 'react-icons/fi';
import { 
  readFile, 
  getFileType, 
  parseExcelFile, 
  parseCSVFile 
} from '../utils/parseExcelFile';
import { generateSampleTemplate, getColumnInstructions } from '../utils/generateSampleTemplate';
import BulkUploadPreviewTable from './BulkUploadPreviewTable';
import type { ParsedProduct } from '@/utils/parseExcelFile';

interface UploadResult {
  success: boolean;
  productName?: string;
  productId?: string;
  s3ImageUrls?: string[];
  errors?: string[];
  driveImageUrls?: string[];
}

interface BulkUploadResponse {
  totalProducts: number;
  successCount: number;
  failureCount: number;
  results: UploadResult[];
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (response: BulkUploadResponse) => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<BulkUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[] | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'processing' | 'results'>('upload');
  const [cachedFileData, setCachedFileData] = useState<ArrayBuffer | string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    percent: 0,
    processed: 0,
    total: 0,
    currentProduct: null as string | null,
    successCount: 0,
    failureCount: 0,
  });

  const isAcceptedFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    return ext === 'xlsx' || ext === 'xls' || ext === 'csv';
  };

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isAcceptedFile(droppedFile)) {
        void selectAndParseFile(droppedFile);
      } else {
        setError('Please upload .xlsx, .xls, or .csv');
      }
    }
  };

  const selectAndParseFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setUploadResponse(null);
    setCurrentStep('upload');
    setCachedFileData(null);
    const products = await parseExcelToProducts(selectedFile, false);
    if (products && products.length > 0) {
      setCurrentStep('preview');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void selectAndParseFile(e.target.files[0]);
    }
  };

  const parseExcelToProducts = async (excelFile: File, useCache: boolean = false): Promise<ParsedProduct[] | null> => {
    try {
      console.log('📄 Parsing file:', excelFile.name, 'useCache:', useCache);
      setIsLoading(true);

      // Read file only if not cached
      let fileData = cachedFileData;
      if (!fileData || !useCache) {
        console.log('📥 Reading file (not in cache)');
        fileData = await readFile(excelFile);
        setCachedFileData(fileData); // Cache for later use
      } else {
        console.log('📦 Using cached file data');
      }

      const fileType = getFileType(excelFile.name);

      let result;
      if (fileType === 'excel') {
        result = parseExcelFile(fileData as ArrayBuffer);
      } else if (fileType === 'csv') {
        result = parseCSVFile(fileData as string);
      } else {
        throw new Error('Unsupported file format. Please use .xlsx, .xls, or .csv');
      }

      if (!result.success) {
        setParseErrors(result.errors || ['Unknown parsing error']);
        setParsedProducts(null);
        return null;
      }

      setParsedProducts(result.data || []);
      setParseErrors(null);
      return result.data || null;
    } catch (err: any) {
      console.error('Parse error:', err);
      setError(err.message || 'Failed to parse file');
      setParseErrors(null);
      setParsedProducts(null);
      setCachedFileData(null); // Clear cache on error
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    // Step 1: Parse file (read only once, cache the result)
    const products = await parseExcelToProducts(file, false); // false = read fresh
    
    if (!products || products.length === 0) {
      return;
    }

    // Step 2: Show preview
    setCurrentStep('preview');
  };

  const pollBulkUploadJob = async (jobId: string): Promise<BulkUploadResponse> => {
    for (;;) {
      const res = await fetch(`/api/products/bulk-upload/status/${jobId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get upload status');
      }
      const data = await res.json();

      setUploadProgress({
        percent: data.percent ?? 0,
        processed: data.processed ?? 0,
        total: data.totalProducts ?? 0,
        currentProduct: data.currentProduct ?? null,
        successCount: data.successCount ?? 0,
        failureCount: data.failureCount ?? 0,
      });

      if (data.status === 'completed') {
        return {
          totalProducts: data.totalProducts,
          successCount: data.successCount,
          failureCount: data.failureCount,
          results: data.results || [],
        };
      }
      if (data.status === 'failed') {
        throw new Error(data.error || 'Upload failed');
      }

      await new Promise((r) => setTimeout(r, 1000));
    }
  };

  const runBulkUpload = async (products: ParsedProduct[]) => {
    setIsLoading(true);
    setError(null);
    setCurrentStep('processing');
    setUploadProgress({
      percent: 0,
      processed: 0,
      total: products.length,
      currentProduct: null,
      successCount: 0,
      failureCount: 0,
    });

    try {
      const response = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'Upload failed to start');
      }

      const jobId = body.jobId as string;
      if (!jobId) {
        throw new Error('Server did not return a job id');
      }

      const data = await pollBulkUploadJob(jobId);
      setUploadResponse(data);
      setCurrentStep('results');
      onUploadComplete?.(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setCurrentStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!parsedProducts || parsedProducts.length === 0) {
      setError('No products to upload');
      return;
    }
    await runBulkUpload(parsedProducts);
  };

  const handleRetryFailed = async () => {
    if (!uploadResponse || !parsedProducts) return;
    const failedNames = new Set(
      uploadResponse.results.filter((r) => !r.success).map((r) => r.productName)
    );
    const toRetry = parsedProducts.filter((p) => failedNames.has(p.name));
    if (toRetry.length === 0) return;
    await runBulkUpload(toRetry);
  };

  const handleClose = () => {
    setFile(null);
    setUploadResponse(null);
    setParsedProducts(null);
    setParseErrors(null);
    setError(null);
    setDragActive(false);
    setCachedFileData(null);
    setCurrentStep('upload');
    setUploadProgress({
      percent: 0,
      processed: 0,
      total: 0,
      currentProduct: null,
      successCount: 0,
      failureCount: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg w-full max-h-[92vh] overflow-y-auto shadow-xl ${
          currentStep === 'preview' ? 'max-w-[96vw] xl:max-w-7xl' : 'max-w-2xl'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'upload' && !uploadResponse && (
            <>
              {/* File Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                  dragActive
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <FiUpload className="mx-auto mb-4" size={48} color={dragActive ? '#10b981' : '#9ca3af'} />
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {file ? `Selected: ${file.name}` : 'Drag and drop your Excel file here'}
                </p>
                <p className="text-gray-600 mb-4">or</p>
                <label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="inline-block px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer transition">
                    Choose File
                  </span>
                </label>
                <p className="text-sm text-gray-500 mt-4">
                  Supported: .xlsx, .xls, .csv — parses automatically on select
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Parse Errors */}
              {parseErrors && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Parsing Issues:</p>
                  <ul className="text-xs text-yellow-800 space-y-1">
                    {parseErrors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm text-blue-900 font-semibold">📋 Excel File Requirements:</p>
                  <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    <FiInfo size={18} />
                  </button>
                </div>
                <ul className="text-sm text-blue-800 space-y-1 ml-4 mb-4">
                  <li>• Size variants (one column): <code className="bg-blue-100 px-1 rounded">small:599,medium:799,large:999</code></li>
                  <li>• Google Drive image URLs — auto-optimized and uploaded to S3</li>
                  <li>• Original Price optional (uses highest variant if empty)</li>
                  <li>• Live progress while uploading; retry failed rows after</li>
                </ul>

                {/* Instructions Expandable */}
                {showInstructions && (
                  <div className="mt-4 p-3 bg-white rounded border border-blue-300 max-h-64 overflow-y-auto">
                    <p className="font-semibold text-blue-900 mb-3 text-sm">Column Details:</p>
                    {getColumnInstructions().map((col, idx) => (
                      <div key={idx} className="mb-2 text-xs">
                        <div className="font-semibold text-blue-800">
                          {col.column} {col.required ? <span className="text-red-600">*</span> : ''}
                        </div>
                        <div className="text-blue-700 ml-2">Format: {col.format}</div>
                        <div className="text-gray-600 ml-2">Example: {col.example}</div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => generateSampleTemplate()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition mt-2"
                >
                  <FiDownload size={16} />
                  Download Sample Template
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || isLoading}
                  className={`px-6 py-2 rounded-lg text-white font-medium transition flex items-center gap-2 ${
                    !file || isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Parsing...
                    </>
                  ) : (
                    <>
                      <FiEye size={18} />
                      Preview
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {currentStep === 'preview' && parsedProducts && !uploadResponse && (
            <>
              {/* Preview Title */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  📋 Preview - {parsedProducts.length} Products Found
                </h3>
                <p className="text-sm text-gray-600 mt-1">Review the data before uploading</p>
              </div>

              <BulkUploadPreviewTable products={parsedProducts} />

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={isLoading}
                  className={`px-6 py-2 rounded-lg text-white font-medium transition flex items-center gap-2 ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload size={18} />
                      Confirm & Upload
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {currentStep === 'processing' && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Uploading products…</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Images download from Drive, optimize, then save to S3
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>
              <p className="text-sm text-gray-700 text-center font-medium">
                {uploadProgress.percent}% — {uploadProgress.processed} / {uploadProgress.total} products
              </p>
              {uploadProgress.currentProduct && (
                <p className="text-sm text-gray-500 text-center truncate">
                  Processing: {uploadProgress.currentProduct}
                </p>
              )}
              <div className="flex justify-center gap-6 text-sm">
                <span className="text-green-700">✅ {uploadProgress.successCount} ok</span>
                <span className="text-red-700">❌ {uploadProgress.failureCount} failed</span>
              </div>
            </div>
          )}

          {currentStep === 'results' && uploadResponse && (
            <>
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                  <p className="text-lg font-bold text-gray-900 mb-3">📊 Upload Summary</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900">{uploadResponse.totalProducts}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">✅ Success</p>
                      <p className="text-2xl font-bold text-green-600">{uploadResponse.successCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">❌ Failed</p>
                      <p className="text-2xl font-bold text-red-600">{uploadResponse.failureCount}</p>
                    </div>
                  </div>
                </div>

                {/* Results List */}
                <div>
                  <p className="text-lg font-bold text-gray-900 mb-3">Details</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {uploadResponse.results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {result.success ? (
                            <FiCheck className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                          ) : (
                            <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                              {result.productName}
                            </p>
                            {result.success && result.productId && (
                              <p className="text-xs text-gray-600 break-all">ID: {result.productId}</p>
                            )}
                            {result.errors && result.errors.length > 0 && (
                              <ul className="text-xs text-red-700 mt-1 space-y-1">
                                {result.errors.map((err, i) => (
                                  <li key={i}>• {err}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex gap-3 justify-end">
                {uploadResponse.failureCount > 0 && parsedProducts && (
                  <button
                    type="button"
                    onClick={() => void handleRetryFailed()}
                    disabled={isLoading}
                    className="px-6 py-2 border border-amber-400 text-amber-800 rounded-lg hover:bg-amber-50 transition font-medium disabled:opacity-50"
                  >
                    Retry failed ({uploadResponse.failureCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
