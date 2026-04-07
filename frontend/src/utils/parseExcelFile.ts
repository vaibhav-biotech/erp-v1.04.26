/**
 * Excel/CSV Parser Utility
 * Converts Excel and CSV files to Product objects
 */

import * as XLSX from 'xlsx';

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
  sizeVariants: Array<{ id: number; name: string; price: number; tag?: string }>;
  potVariants: Array<{ id: number; name: string; price: number; tag?: string }>;
  status: 'active' | 'inactive' | 'draft';
}

interface ParseResult {
  success: boolean;
  data?: ParsedProduct[];
  errors?: string[];
}

/**
 * Parse Excel file buffer to Product objects
 */
export const parseExcelFile = (buffer: ArrayBuffer): ParseResult => {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      return {
        success: false,
        errors: ['Excel file is empty']
      };
    }

    return transformData(rawData);
  } catch (error: any) {
    return {
      success: false,
      errors: [`Failed to parse Excel file: ${error.message}`]
    };
  }
};

/**
 * Parse CSV text to Product objects
 */
export const parseCSVFile = (csvText: string): ParseResult => {
  try {
    // Split by newline and filter empty lines
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return {
        success: false,
        errors: ['CSV file is empty or has no data rows']
      };
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());

    // Parse data rows
    const rawData = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      return row;
    });

    return transformData(rawData);
  } catch (error: any) {
    return {
      success: false,
      errors: [`Failed to parse CSV file: ${error.message}`]
    };
  }
};

/**
 * Transform raw data to Product objects
 */
const transformData = (rawData: any[]): ParseResult => {
  const products: ParsedProduct[] = [];
  const errors: string[] = [];

  rawData.forEach((row, index) => {
    try {
      // Required fields
      const name = String(row.Names || row.name || '').trim();
      const category = String(row.Category || row.category || '').trim();
      const subcategory = String(row.Subcategory || row.subcategory || '').trim();
      const originalPriceRaw = row['Original Price'] || row.originalPrice || row['Original price'];
      const originalPrice = parseFloat(String(originalPriceRaw));
      const discountRaw = row.Discount || row.discount || 0;
      const discount = parseFloat(String(discountRaw));
      const ratingRaw = row.Rating || row.rating || 4.5;
      const rating = parseFloat(String(ratingRaw));
      const reviewsRaw = row.Reviews || row.reviews || 0;
      const reviews = parseInt(String(reviewsRaw));

      // Validate required fields
      if (!name) {
        errors.push(`Row ${index + 2}: Product name is required`);
        return;
      }
      if (!category) {
        errors.push(`Row ${index + 2}: Category is required`);
        return;
      }
      if (!subcategory) {
        errors.push(`Row ${index + 2}: Subcategory is required`);
        return;
      }
      if (isNaN(originalPrice) || originalPrice <= 0) {
        errors.push(`Row ${index + 2}: Original Price must be a valid number > 0`);
        return;
      }

      // Calculate final price
      const finalPrice = Math.round(originalPrice - (originalPrice * discount) / 100);

      // Parse images
      const imageUrlsRaw = row['Image URLs'] || row.imageUrls || row['images'] || '';
      const images = String(imageUrlsRaw)
        .split(';')
        .map((url: string) => url.trim())
        .filter((url: string) => url.length > 0);

      if (images.length === 0) {
        errors.push(`Row ${index + 2}: At least one image URL is required`);
        return;
      }

      // Parse size variants
      const sizeVariantsRaw = row['Size Variants'] || row.sizeVariants || '';
      const sizePricesRaw = row['Size Prices'] || row.sizePrices || '';
      const sizeVariants = parseSizeVariants(sizeVariantsRaw, sizePricesRaw, index);

      // Parse pot variants
      const potVariantsRaw = row['Pot Variants'] || row.potVariants || '';
      const potPricesRaw = row['Pot Prices'] || row.potPrices || '';
      const potVariants = parsePotVariants(potVariantsRaw, potPricesRaw, index);

      // Description (combine if multiple columns)
      const description = [
        row.Description || row.description || '',
        row.Benefits || row.benefits || '',
        row.Care || row.care || ''
      ]
        .filter(text => text)
        .join(' | ');

      // Status
      const status = (row.Status || row.status || 'active').toLowerCase();
      if (!['active', 'inactive', 'draft'].includes(status)) {
        errors.push(`Row ${index + 2}: Status must be active, inactive, or draft`);
        return;
      }

      const product: ParsedProduct = {
        name,
        category,
        subcategory,
        originalPrice,
        finalPrice,
        discount: discount > 0 ? discount : undefined,
        rating: isNaN(rating) || rating < 0 || rating > 5 ? 4.5 : rating,
        reviews: isNaN(reviews) || reviews < 0 ? 0 : reviews,
        images,
        description: description || undefined,
        sizeVariants,
        potVariants,
        status: status as any
      };

      products.push(product);
    } catch (error: any) {
      errors.push(`Row ${index + 2}: ${error.message}`);
    }
  });

  if (products.length === 0 && errors.length === 0) {
    errors.push('No valid products found in file');
  }

  return {
    success: products.length > 0,
    data: products.length > 0 ? products : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Parse size variants from comma-separated strings
 * Format: "S,M,L" and "100,150,200"
 */
const parseSizeVariants = (
  names: string,
  prices: string,
  rowIndex: number
): Array<{ id: number; name: string; price: number; tag?: string }> => {
  if (!names || !prices) return [];

  try {
    const nameArray = String(names).split(',').map(n => n.trim());
    const priceArray = String(prices).split(',').map(p => p.trim());

    return nameArray
      .map((name, idx) => ({
        id: idx + 1,
        name,
        price: parseFloat(priceArray[idx]) || 0,
        tag: undefined
      }))
      .filter(v => v.price > 0);
  } catch (error) {
    console.warn(`Warning: Failed to parse size variants for row ${rowIndex + 2}`);
    return [];
  }
};

/**
 * Parse pot variants from comma-separated strings
 * Format: "5L,10L,15L" and "500,750,1000"
 */
const parsePotVariants = (
  names: string,
  prices: string,
  rowIndex: number
): Array<{ id: number; name: string; price: number; tag?: string }> => {
  if (!names || !prices) return [];

  try {
    const nameArray = String(names).split(',').map(n => n.trim());
    const priceArray = String(prices).split(',').map(p => p.trim());

    return nameArray
      .map((name, idx) => ({
        id: idx + 1,
        name,
        price: parseFloat(priceArray[idx]) || 0,
        tag: undefined
      }))
      .filter(v => v.price > 0);
  } catch (error) {
    console.warn(`Warning: Failed to parse pot variants for row ${rowIndex + 2}`);
    return [];
  }
};

/**
 * Detect file type from file extension
 */
export const getFileType = (fileName: string): 'excel' | 'csv' | 'unknown' => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'csv') return 'csv';
  if (extension === 'xlsx' || extension === 'xls') return 'excel';

  return 'unknown';
};

/**
 * Read file as ArrayBuffer (for Excel) or text (for CSV)
 */
export const readFile = (file: File): Promise<ArrayBuffer | string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (result instanceof ArrayBuffer || typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    const fileType = getFileType(file.name);
    if (fileType === 'excel') {
      reader.readAsArrayBuffer(file);
    } else if (fileType === 'csv') {
      reader.readAsText(file);
    } else {
      reject(new Error('Unsupported file format'));
    }
  });
};
