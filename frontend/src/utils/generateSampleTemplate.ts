import * as XLSX from 'xlsx';

export const generateSampleTemplate = () => {
  const sampleData = [
    {
      'Images Link': 'https://drive.google.com/uc?id=GOOGLE_DRIVE_ID_1,https://drive.google.com/uc?id=GOOGLE_DRIVE_ID_2',
      'Names': 'Monstera Deliciosa',
      'Category': 'Indoor Plants',
      'Subcategory': 'indoor-plants',
      'Tags': 'indoor-plants,air-purifying,office',
      'Description': 'Beautiful split-leaf plant',
      'Benefits': 'Improves air quality, Low maintenance',
      'Care': 'Water weekly, Indirect sunlight',
      'Stock': 50,
      'Size Variants': 'small:599,medium:799,large:999',
      'Original Price': 999,
      'Discount': 20,
      'Rating': 4.5,
      'Status': 'active',
      'Reviews': 128,
    },
    {
      'Images Link': 'https://drive.google.com/uc?id=GOOGLE_DRIVE_ID_3',
      'Names': 'Pothos Golden',
      'Category': 'Indoor Plants',
      'Subcategory': 'hanging-plants',
      'Tags': 'hanging-plants,indoor-plants,low-light',
      'Description': 'Golden creeping vine',
      'Benefits': 'Tolerates low light, Quick growing',
      'Care': 'Water when soil is dry, Any light',
      'Stock': 75,
      'Size Variants': 'small:399,medium:599',
      'Original Price': 599,
      'Discount': 10,
      'Rating': 4.8,
      'Status': 'active',
      'Reviews': 256,
    },
    {
      'Images Link': 'https://drive.google.com/uc?id=GOOGLE_DRIVE_ID_4',
      'Names': 'Snake Plant',
      'Category': 'Indoor Plants',
      'Subcategory': 'low-maintenance',
      'Tags': 'low-maintenance,indoor-plants,air-purifying',
      'Description': 'Hardy succulent plant',
      'Benefits': 'Extremely hardy, Air purifying',
      'Care': 'Minimal watering, Low light tolerant',
      'Stock': 100,
      'Size Variants': 'small:299,medium:499,large:799',
      'Original Price': 799,
      'Discount': 15,
      'Rating': 4.9,
      'Status': 'active',
      'Reviews': 512,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 50 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 30 },
    { wch: 25 },
    { wch: 30 },
    { wch: 25 },
    { wch: 10 },
    { wch: 36 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  XLSX.writeFile(workbook, 'Plants_Sample_Template.xlsx');
};

export const getColumnInstructions = () => {
  return [
    {
      column: 'Images Link',
      required: true,
      format: 'Comma-separated Google Drive URLs or File IDs',
      example: 'https://drive.google.com/uc?id=ABC123...',
    },
    {
      column: 'Names',
      required: true,
      format: 'Product name',
      example: 'Monstera Deliciosa',
    },
    {
      column: 'Category',
      required: true,
      format: 'Main category name',
      example: 'Indoor Plants',
    },
    {
      column: 'Subcategory',
      required: true,
      format: 'Single subcategory slug',
      example: 'indoor-plants',
    },
    {
      column: 'Tags',
      required: false,
      format: 'Comma-separated tag slugs',
      example: 'indoor-plants,air-purifying',
    },
    {
      column: 'Description',
      required: false,
      format: 'Product description',
      example: 'Beautiful split-leaf plant',
    },
    {
      column: 'Benefits',
      required: false,
      format: 'Key benefits',
      example: 'Improves air quality',
    },
    {
      column: 'Care',
      required: false,
      format: 'Care instructions',
      example: 'Water weekly',
    },
    {
      column: 'Stock',
      required: true,
      format: 'Number in stock',
      example: '50',
    },
    {
      column: 'Size Variants',
      required: false,
      format: 'Single column: name:price pairs',
      example: 'small:599,medium:799,large:999',
    },
    {
      column: 'Original Price',
      required: false,
      format: 'Optional base price; if empty, uses highest variant price',
      example: '999',
    },
    {
      column: 'Size Original Prices',
      required: false,
      format: 'Optional two-column format (with Size Variants as names only)',
      example: '599, 799, 999',
    },
    {
      column: 'Discount',
      required: true,
      format: 'Discount percentage (0-100)',
      example: '20',
    },
    {
      column: 'Rating',
      required: true,
      format: 'Rating 1-5',
      example: '4.5',
    },
    {
      column: 'Status',
      required: true,
      format: 'active, inactive, or draft',
      example: 'active',
    },
    {
      column: 'Reviews',
      required: true,
      format: 'Number of reviews',
      example: '128',
    },
  ];
};
