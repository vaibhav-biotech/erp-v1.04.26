'use client';

import React, { useState } from 'react';
import { FiX, FiUpload, FiCheck, FiAlertCircle, FiEye, FiArrowRight } from 'react-icons/fi';
import { 
  readFile, 
  getFileType, 
  parseExcelFile, 
  parseCSVFile 
} from '../utils/parseExcelFile';

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

interface ParsedProduct {
  name: string;
  category: string;
  subcategory: string;
  originalPrice: number;
  finalPrice: number;
  discount?: number;
  rating: number;
  reviews: number;
  images: string[];
  description?: string;
  sizeVariants: any[];
  potVariants: any[];
  status: 'active' | 'inactive' | 'draft';
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
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'results'>('upload');

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
      if (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          droppedFile.type === 'application/vnd.ms-excel') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const parseExcelToProducts = async (excelFile: File): Promise<ParsedProduct[] | null> => {
    try {
      console.log('📄 Parsing file:', excelFile.name);
      setIsLoading(true);

      const fileData = await readFile(excelFile);
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

    // Step 1: Parse file
    const products = await parseExcelToProducts(file);
    
    if (!products || products.length === 0) {
      return;
    }

    // Step 2: Show preview
    setCurrentStep('preview');
  };

  const handleConfirmUpload = async () => {
    if (!parsedProducts || parsedProducts.length === 0) {
      setError('No products to upload');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('results');

    try {
      console.log(`📤 Uploading ${parsedProducts.length} products...`);

      const response = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: parsedProducts })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data: BulkUploadResponse = await response.json();
      setUploadResponse(data);
      
      if (onUploadComplete) {
        onUploadComplete(data);
      }

      console.log('✅ Upload complete!', data);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setUploadResponse(null);
    setParsedProducts(null);
    setParseErrors(null);
    setError(null);
    setDragActive(false);
    setCurrentStep('upload');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Products</h2>
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
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="inline-block px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer transition">
                    Choose File
                  </span>
                </label>
                <p className="text-sm text-gray-500 mt-4">
                  Supported formats: .xlsx, .xls
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
                <p className="text-sm text-blue-900 font-semibold mb-2">📋 Excel File Requirements:</p>
                <ul className="text-sm text-blue-800 space-y-1 ml-4">
                  <li>• Columns: Product Number, Names, Category, Subcategory, Original Price, etc.</li>
                  <li>• Drive image URLs or File IDs in the Image URLs column</li>
                  <li>• Size variants as comma-separated (e.g., "S,M,L")</li>
                  <li>• Size prices as comma-separated (e.g., "100,150,200")</li>
                </ul>
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

              {/* Preview Table */}
              <div className="mb-6 overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Category</th>
                      <th className="px-4 py-2 text-left">Price</th>
                      <th className="px-4 py-2 text-left">Images</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedProducts.slice(0, 5).map((product, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium truncate">{product.name}</td>
                        <td className="px-4 py-2 text-xs">{product.category}</td>
                        <td className="px-4 py-2">₹{product.finalPrice}</td>
                        <td className="px-4 py-2 text-xs">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {product.images.length}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedProducts.length > 5 && (
                  <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600">
                    ... and {parsedProducts.length - 5} more products
                  </div>
                )}
              </div>

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
              <div className="mt-6 flex justify-end">
                <button
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
