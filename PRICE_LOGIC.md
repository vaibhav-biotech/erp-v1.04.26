# Product Price Logic - Size & Pot Variants

## Understanding the Price Structure (Based on Ugaoo Model)

### 1. **Plant Base Price (Size Variants)**
The plant price varies based on size selected:
- **Small**: ₹299 (base)
- **Medium**: ₹399
- **Large**: ₹599
- **XL**: ₹899

**When to show**: Plant price updates when user selects a different size variant.

---

### 2. **Pot Price (Independent)**
The pot adds to the total price:
- **No Pot**: ₹0 (just the plant)
- **Standard Pot**: ₹99
- **Premium Ceramic**: ₹199
- **Luxury Pot**: ₹399

**When to show**: Pot price is always shown separately, and can be added/removed.

---

### 3. **Final Price Calculation**
```
FINAL PRICE = Plant Price (selected size) + Pot Price (selected pot)
```

### Example Flow:
```
Default: Small (₹299) + No Pot (₹0) = ₹299

User selects Medium:
Medium (₹399) + No Pot (₹0) = ₹399

User selects Premium Ceramic Pot:
Medium (₹399) + Premium Ceramic (₹199) = ₹598

User changes to Large:
Large (₹599) + Premium Ceramic (₹199) = ₹798
```

---

## UI/UX Flow

### Step 1: Display Plant Base Price
**Location**: Product header, next to title
- Show the price of currently selected size
- Update in real-time when size changes

```
Price display: ₹299 (for Small - default)
When user clicks Medium: ₹399
When user clicks Large: ₹599
```

### Step 2: Size Variant Cards
**Show price on each card**:
```
[Small ₹299] [Medium ₹399] [Large ₹599]
```

### Step 3: Pot Selection
**Show pot prices on each card**:
```
[No Pot ₹0] [Standard ₹99] [Premium ₹199] [Luxury ₹399]
```

### Step 4: Dynamic Price Display
**Show running total**:
```
Plant Price: ₹399 (Medium selected)
Pot Price: ₹199 (Premium Ceramic selected)
────────────────
Total: ₹598
```

---

## Implementation Logic

### State Variables Needed:
```typescript
const [selectedSize, setSelectedSize] = useState(1); // Size variant ID
const [selectedPot, setSelectedPot] = useState(1); // Pot variant ID
const [plantPrice, setPlantPrice] = useState(0); // From size variant
const [potPrice, setPotPrice] = useState(0); // From pot variant
```

### Calculate Total Price:
```typescript
const totalPrice = plantPrice + potPrice;
const originalTotal = originalPlantPrice + (potPrice || 0);
const discountAmount = originalTotal - totalPrice;
```

### When to Update:
- **On Size Change**: Update plantPrice, recalculate total
- **On Pot Change**: Update potPrice, recalculate total
- **Both Independent**: Changes to one don't reset the other

---

## Price Display Strategy

### Option 1: Stacked Display (RECOMMENDED)
```
Base Price:      ₹399
Planter Price:   + ₹199
────────────────
TOTAL PRICE:     ₹598
```

### Option 2: Inline Display
```
Medium Plant (₹399) + Premium Pot (₹199) = ₹598
```

### Option 3: Compact Display
```
₹399 + ₹199 = ₹598
```

---

## Key Rules

1. ✅ **Variants are independent** - Changing size doesn't reset pot selection
2. ✅ **Always show breakdown** - User must see plant + pot = total
3. ✅ **Real-time updates** - Total updates immediately on any selection
4. ✅ **Default selection** - Start with Small + No Pot
5. ✅ **Add to cart uses total** - Cart gets the combined price
6. ✅ **Show original prices too** - For discount calculation if applicable

---

## Sample Data Structure

```typescript
interface SizeVariant {
  id: number;
  name: string;
  price: number;        // Plant price for this size
  originalPrice: number; // For discount calculation
}

interface PotVariant {
  id: number;
  name: string;
  price: number;        // Pot price (independent of plant)
  label?: string;       // e.g., "Most Loved"
}

// Product pricing:
{
  sizeVariants: [
    { id: 1, name: "Small", price: 299, originalPrice: 499 },
    { id: 2, name: "Medium", price: 399, originalPrice: 599 },
    { id: 3, name: "Large", price: 599, originalPrice: 899 }
  ],
  potVariants: [
    { id: 1, name: "No Pot", price: 0, originalPrice: 0 },
    { id: 2, name: "Standard", price: 99, originalPrice: 149 },
    { id: 3, name: "Premium", price: 199, originalPrice: 299, label: "Most Loved" }
  ]
}
```

---

## Cart Entry

When adding to cart, send:
```typescript
{
  productId: "69d618d1882284f3996c92de",
  sizeVariantId: 2,        // Medium
  potVariantId: 3,         // Premium
  quantity: 1,
  
  // Calculated values:
  plantPrice: 399,
  potPrice: 199,
  totalPrice: 598,
  
  // For invoice:
  breakdown: {
    plant: "Medium - ₹399",
    pot: "Premium - ₹199",
    total: "₹598"
  }
}
```

