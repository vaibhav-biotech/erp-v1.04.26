# Variant Format Guide

## 📊 Supported Formats for Size & Pot Variants

### Format 1: Old Colon-Separated (Still Works ✅)
```
sizeVariants: "small:599,medium:799,large:999"
potVariants: "no-pot:0,standard:99,premium:199"
```

**Used in:** Single cell input, comma-separated

---

### Format 2: Two-Column Format (Recommended 🎯)

**Column A - Variant Names:**
```
small, medium, large
```

**Column B - Prices:**
```
599, 799, 999
```

This is the **cleaner spreadsheet format** you prefer!

---

## 🔄 How It Works

### Data Entry (Spreadsheet):
| Variant Names | Prices |
|---|---|
| small, medium, large | 599, 799, 999 |
| no-pot, standard, premium | 0, 99, 199 |

### Backend Processing:
The system automatically detects the format:
1. Checks if it's colon-separated (old format)
2. If not, treats as separate names and prices
3. Combines into proper array: `[{id: 1, name: 'small', price: 599}, ...]`

### Database Storage:
```json
{
  "sizeVariants": [
    {"id": 1, "name": "small", "price": 599},
    {"id": 2, "name": "medium", "price": 799},
    {"id": 3, "name": "large", "price": 999}
  ]
}
```

### Frontend Display:
✅ Automatically parsed and displayed in variant selector

---

## ✅ CSV/Spreadsheet Format Examples

### Complete Row:
```
Images | Names | Category | Subcategory | Description | Benefits | Care | Stock | Size Variants | Size Prices | Pot Variants | Pot Prices | Original Price | Discount | Rating | Status | Reviews

https://s3.../img.jpg | Anthurium | plants | indoor-plants | Beautiful anthurium... | Air purifying | Water twice weekly | 20 | small, medium, large | 599, 799, 999 | no-pot, standard, premium | 0, 99, 199 | 999 | 20 | 4.5 | active | 187
```

### Clean Breakdown:
| Column | Value |
|--------|-------|
| **Images** | https://s3.../img.jpg |
| **Names** | Anthurium |
| **Category** | plants |
| **Subcategory** | indoor-plants |
| **Description** | Beautiful anthurium... |
| **Benefits** | Air purifying, Long lasting |
| **Care** | Water twice weekly, Indirect light |
| **Stock** | 20 |
| **Size Variants** | small, medium, large |
| **Size Prices** | 599, 799, 999 |
| **Pot Variants** | no-pot, standard, premium |
| **Pot Prices** | 0, 99, 199 |
| **Original Price** | 999 |
| **Discount** | 20 |
| **Rating** | 4.5 |
| **Status** | active |
| **Reviews** | 187 |

---

## 🎯 Benefits of Two-Column Format

✅ **More readable** - Clearer separation in spreadsheet  
✅ **Less error-prone** - Can't mix up price with name  
✅ **Easier to edit** - Just update numbers without touching format  
✅ **Better organized** - One column per data type  
✅ **Backward compatible** - Old colon format still works!  

---

## 💡 Examples

### Example 1: Plants with Size Variants
```
Size Variants: small, medium, large
Size Prices: 399, 599, 799
```
Result: Small plant ₹399, Medium ₹599, Large ₹799

### Example 2: Planters with Pot Variants
```
Pot Variants: no-pot, ceramic, premium-ceramic
Pot Prices: 0, 149, 299
```
Result: No pot FREE, Ceramic ₹149, Premium ₹299

### Example 3: Combination
```
Size: small, medium, large
Prices: 299, 399, 599

Pot: none, basic, deluxe
Prices: 0, 79, 179
```

---

## ⚠️ Important Notes

- **No spaces around commas:** Use `small, medium` NOT `small , medium`
- **Matching count:** Must have same number of names and prices
- **Numbers only in prices:** `599` NOT `₹599` or `599.00`
- **Both columns needed:** Either old format OR both name+price columns

