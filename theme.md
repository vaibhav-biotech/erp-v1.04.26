# Storefront Themes Architecture Brief

You want to offer multiple themes for your stores. You mentioned two options: creating 5 native themes, or integrating WordPress (WP) themes. Here is a breakdown of the possibilities, pros, and cons.

---

## Architecture: The "Shopify-Style" Native Theme Engine
To give store owners Shopify-level control without leaving our Next.js environment, we will build a modular theme engine. Here is how we create and use it:

### 1. The Global Theme Configuration (JSON Schema)
Just like Shopify's `settings_schema.json`, each store in the database will have a `themeSettings` object. This controls the global look and feel.
*   **Colors:** Primary, Secondary, Background, Text colors.
*   **Typography:** Heading font, Body font (integrated with Google Fonts).
*   **Branding:** Logo URL, Favicon URL.
*   **Layout:** Container width, button border-radius (e.g., rounded vs sharp).

### 2. Sections and Blocks (Modular Components)
Shopify themes are built using Sections. We will build a library of React Components that act as Sections:
*   `HeroBanner` (Image, Headline, CTA)
*   `FeaturedProducts` (Grid of items)
*   `CategoriesGrid`
*   `Testimonials`
*   `RichText`

The Store database document will have a `sections` array defining the order and content of the homepage.
**Example Data Structure:**
```json
"sections": [
  { "id": "sec-1", "type": "HeroBanner", "data": { "headline": "Spring Sale", "buttonText": "Shop Now" } },
  { "id": "sec-2", "type": "FeaturedProducts", "data": { "limit": 4 } }
]
```

### 3. Dynamic Rendering (Next.js)
On the storefront frontend, we will build a `SectionRenderer` component. 
*   It loops through the store's `sections` array.
*   It dynamically imports and renders the React component (e.g., if `type === 'HeroBanner'`, render `<HeroBanner data={data} />`).
*   This gives the Store Manager the power to reorder their homepage without touching code.

### 4. CSS Variables for Styling (The Magic)
To make one codebase look like 5 different themes, we inject the `themeSettings` colors into the DOM as CSS Variables.
```css
:root {
  --theme-primary: ${store.themeSettings.primaryColor};
  --theme-font-heading: ${store.themeSettings.headingFont};
}
```
All of our React components will use these CSS variables instead of hardcoded Tailwind classes. For example, a button will use `bg-[var(--theme-primary)]`.

---

## The "5 Pre-built Themes" Approach
With the engine built, creating 5 "Themes" doesn't mean writing 5 completely different apps. It means we provide **5 Preset Configurations**.
1.  **"Minimalist":** White background, black text, sans-serif font, sharp edges.
2.  **"Eco/Organic":** Green primary color, earth tones, rounded buttons, serif headings.
3.  **"Bold":** Dark mode background, neon primary colors, heavy typography.
4.  **"Classic":** Blue primary color, standard layout, highly professional.
5.  **"Playful":** Pastel colors, bouncy animations, rounded containers.

When the Superadmin selects a theme during Store Creation, we simply copy the JSON preset of that theme into the store's `themeSettings` database record.

---

> [!IMPORTANT]
> **Next Steps:**
> If you approve of this Shopify-inspired component architecture, the next step would be to start building the **Theme Settings Data Model** in the database and constructing the first 2-3 universal Sections (like the Hero and Featured Products). Shall we proceed to implementation?
