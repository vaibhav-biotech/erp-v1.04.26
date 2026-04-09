# Typography System - ERP Platform

## Font Stack
- **Headlines & Display**: Playfair Display (600, 700, 800 weights)
- **Body & UI**: Montserrat (300, 400, 500, 600, 700, 800 weights)

---

## Typography Hierarchy

### 1. **Page Headings (H1)**
- **Size**: text-3xl (30px)
- **Weight**: font-normal (400)
- **Font**: Playfair Display
- **Color**: text-gray-900
- **Usage**: Main page titles (e.g., "Indoor Plants", "Dashboard")
- **Example**: 
```tsx
<h1 className="text-3xl font-playfair font-normal text-gray-900">
  {title}
</h1>
```

### 2. **Section Headings (H2/H3)**
- **Size**: text-sm (14px)
- **Weight**: font-normal (400)
- **Font**: Montserrat
- **Color**: text-gray-900
- **Transform**: uppercase
- **Usage**: Sub-sections, filter labels, variant selectors
- **Example**:
```tsx
<h3 className="text-sm font-normal text-gray-900 uppercase mb-3">
  Select Size
</h3>
```

### 3. **Body Text / Regular**
- **Size**: text-sm (14px)
- **Weight**: font-normal (400)
- **Font**: Montserrat
- **Color**: text-gray-700 or text-gray-600
- **Usage**: Descriptions, labels, regular content
- **Example**:
```tsx
<p className="text-sm font-montserrat text-gray-700">
  Product description text
</p>
```

### 4. **Emphasis / Semi-Bold**
- **Size**: text-sm (14px)
- **Weight**: font-medium (500) or font-semibold (600)
- **Font**: Montserrat
- **Color**: text-gray-900
- **Usage**: Important labels, highlights
- **Example**:
```tsx
<span className="text-sm font-montserrat font-semibold text-gray-900">
  Important label
</span>
```

### 5. **Price Display**
- **Size**: text-3xl (30px)
- **Weight**: font-bold (700)
- **Font**: Montserrat
- **Color**: text-gray-900
- **Usage**: Main product prices
- **Example**:
```tsx
<span className="text-3xl font-bold text-gray-900">₹{price}</span>
```

### 6. **Buttons & CTAs**
- **Size**: text-sm (14px)
- **Weight**: font-normal (400)
- **Font**: Montserrat
- **Color**: Varies by variant (white, gray-900, etc.)
- **Usage**: Button text
- **Example**:
```tsx
<button className="text-sm font-montserrat font-normal">
  APPLY
</button>
```

### 7. **Small Text / Captions**
- **Size**: text-xs (12px)
- **Weight**: font-normal (400)
- **Font**: Montserrat
- **Color**: text-gray-600 or text-gray-500
- **Usage**: Helper text, secondary info, price labels
- **Example**:
```tsx
<span className="text-xs text-gray-600 font-montserrat">
  Min: ₹{price}
</span>
```

---

## Color Palette

### Primary Colors
- **Dark Gray**: text-gray-900 (main text)
- **Medium Gray**: text-gray-700 (secondary text)
- **Light Gray**: text-gray-600, text-gray-500 (tertiary/helper text)
- **Very Light Gray**: text-gray-400 (strikethrough, disabled)

### Accent Colors
- **Green**: text-green-600 (CTAs, success, discount badge)
- **Amber**: text-amber-400 (rating stars)
- **Red**: text-red-600 (danger/alerts)
- **Blue**: text-blue-700 (links, info)

---

## Application Guidelines

### For Page Headings
- Always use **Playfair Display** for main page titles
- Use **text-3xl with font-normal** for a light, elegant feel
- Pair with **text-gray-900** for good contrast

### For Section Content
- Use **Montserrat** for all body and UI text
- Use **text-sm** as default body size
- Keep weights light (normal/400 for regular text)
- Use **uppercase** for section labels

### For Emphasis
- Use **font-semibold (600)** for important labels
- Use **font-bold (700)** only for prices and major CTAs

### Consistency Rules
1. ✅ Never mix font families in the same section
2. ✅ Use consistent uppercase for all section headings
3. ✅ Keep body text at text-sm throughout
4. ✅ Use text-gray-900 for main headings, text-gray-600 for secondary
5. ✅ Maintain light weights (300-500) for a premium feel
6. ✅ Reserve bold (700+) for prices and primary CTAs only

---

## Examples by Component

### ProductDetailCard
- Page Heading: text-3xl font-playfair font-normal text-gray-900
- Section Headings: text-sm font-normal uppercase text-gray-900
- Price: text-3xl font-bold text-gray-900
- Body: text-sm font-normal text-gray-700

### ProductGrid / Filter Page
- Page Title: text-3xl font-playfair font-normal text-gray-900
- Filter Labels: text-sm font-normal uppercase text-gray-900
- Body Text: text-sm font-normal text-gray-700
- Button Text: text-sm font-normal text-white/gray-900

### Dashboard
- Page Heading: text-3xl font-playfair font-normal text-gray-900
- Section Titles: text-sm font-normal uppercase text-gray-900
- Card Content: text-sm font-normal text-gray-700
- Stats: text-2xl font-bold text-gray-900

