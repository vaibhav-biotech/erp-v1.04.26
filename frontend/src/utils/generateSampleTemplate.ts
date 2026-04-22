import * as XLSX from 'xlsx';

export const generateSampleTemplate = () => {
  const sampleData = [
    {
      'Images Link': 'https://drive.google.com/uc?id=GOOGLE_DRIVE_ID_1,https://drive.google.com/uc?id=GOOGLE_DRIVE_ID_2',
      'Names': 'Monstera Deliciosa',
      'Category': 'Indoor Plants',
      'Subcategory': 'indoor-plants',
      'Description': 'Beautiful split-leaf plant',
      'Benefits': 'Improves air quality, Low maintenance',
      'Care': 'Water weekly, Indirect sunlight',
      'Stock': 50,
      'Size Variants': 'small, medium, large',
      'Size Original Prices': '599, 799, 999',
      'Discount': 20,
      'Rating': 4.5,
      'Status': 'active',
      'Reviews': 128
    },
    {
      'Images Link': 'https://drive.google.com/uc?id=GOOGLE_DRIVE_ID_3',
      'Names': 'Pothos Golden',
      'Category': 'Indoor Plants',
      'Subcategory': 'hanging-plants',
      'Description': 'Golden creeping vine',
      'Benefits': 'Tolerates low light, Quick growing',
      'Care': 'Water when soil is dry, Any light',
      'Stock': 75,
      'Size Variants': 'small, medium',
      'Size Original Prices': '399, 599',
      'Discount': 10,
      'Rating': 4.8,
      'Status': 'active',
      'Reviews': 256
    },
    {
      'Images Link': 'https://drive.google.com/uc?id=GOOGLE_DRIVE_ID_4',
      'Names': 'Snake Plant',
      'Category': 'Indoor Plants',
      'Subcategory': 'low-maintenance',
      'Description': 'Hardy succulent plant',
      'Benefits': 'Extremely hardy, Air purifying',
      'Care': 'Minimal watering, Low light tolerant',
      'Stock': 100,
      'Size Variants': 'small, medium, large',
      'Size Original Prices': '299, 499, 799',
      'Discount': 15,
      'Rating': 4.9,
      'Status': 'active',
      'Reviews': 512
    }
  ];

  // Create workbook
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  const columnWidths = [
    { wch: 50 },  // Images Link
    { wch: 20 },  // Names
    { wch: 18 },  // Category
    { wch: 20 },  // Subcategory
    { wch: 25 },  // Description
    { wch: 30 },  // Benefits
    { wch: 25 },  // Care
    { wch: 10 },  // Stock
    { wch: 25 },  // Size Variants
    { wch: 25 },  // Size Prices
    { wch: 15 },  // Original Price
    { wch: 12 },  // Discount
    { wch: 10 },  // Rating
    { wch: 12 },  // Status
    { wch: 10 }   // Reviews
  ];

  worksheet['!cols'] = columnWidths;

  // Style header row
  const headerStyle = {
    font: { bold: true, color: 'FFFFFF' },
    fill: { fgColor: { rgb: 'FF3B82F6' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
  };

  const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1'];
  headerCells.forEach(cell => {
    if (worksheet[cell]) {
      worksheet[cell].s = headerStyle;
    }
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  // Download
  XLSX.writeFile(workbook, 'Plants_Sample_Template.xlsx');
};

export const getColumnInstructions = () => {
  return [
    {
      column: 'Images Link',
      required: true,
      format: 'Comma-separated Google Drive URLs or File IDs',
      example: 'https://drive.google.com/uc?id=ABC123...,https://drive.google.com/file/d/XYZ789.../view'
    },
    {
      column: 'Names',
      required: true,
      format: 'Product name',
      example: 'Monstera Deliciosa'
    },
    {
      column: 'Category',
      required: true,
      format: 'Main category name',
      example: 'Indoor Plants'
    },
    {
      column: 'Subcategory',
      required: true,
      format: 'Comma-separated subcategory slugs (creates product per slug, auto-resolved to ID)',
      example: 'indoor-plants,flowering-plants'
    },
    {
      column: 'Description',
      required: false,
      format: 'Product description',
      example: 'Beautiful split-leaf plant'
    },
    {
      column: 'Benefits',
      required: false,
      format: 'Key benefits',
      example: 'Improves air quality, Low maintenance'
    },
    {
      column: 'Care',
      required: false,
      format: 'Care instructions',
      example: 'Water weekly, Indirect sunlight'
    },
    {
      column: 'Stock',
      required: true,
      format: 'Number of items in stock',
      example: '50'
    },
    {
      column: 'Size Variants',
      required: false,
      format: 'Comma-separated variant names',
      example: 'small, medium, large'
    },
    {
      column: 'Size Original Prices',
      required: false,
      format: 'Comma-separated original prices (before discount)',
      example: '599, 799, 999'
    },
    {
      column: 'Original Price',
      required: false,
      format: 'Price in INR (optional - uses first Size Price if not provided)',
      example: '999'
    },
    {
      column: 'Discount',
      required: true,
      format: 'Discount percentage (0-100)',
      example: '20'
    },
    {
      column: 'Rating',
      required: true,
      format: 'Rating 1-5',
      example: '4.5'
    },
    {
      column: 'Status',
      required: true,
      format: 'active, inactive, or draft',
      example: 'active'
    },
    {
      column: 'Reviews',
      required: true,
      format: 'Number of reviews',
      example: '128'
    }
  ];
};
