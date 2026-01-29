# Curv Office Furniture — Full Rebuild Specification (Same Supabase, New Layout)

This document captures the **full structure and behavior** of the current Curv Office Furniture website, so you can rebuild a **new website with a different layout** while still connecting to the **same Supabase project/database** and preserving the same customer/admin workflows.

---

## 1) Project overview

- **Current architecture**: Static HTML pages + inline JS (and a few shared JS modules in `js/`).
- **Backend**: **Supabase** (Postgres + Auth + Storage).
- **State**: Uses `localStorage` for the quote “cart” and admin session.
- **Shared chrome**: `header.html` + `footer.html`, injected into pages via loaders:
  - `js/header-loader.js`
  - `js/footer-loader.js`
- **Quote modal**: `quote-modal.html` injected + behavior in `js/modal.js`.
- **Service worker**: `sw.js` caches static assets and uses network-first for HTML.

---

## 2) Site map (pages & purpose)

These are the current HTML “routes” (static pages):

- **`index.html`** (Home)
  - Hero banner, trust signals, benefits
  - Dynamic category sections with horizontally scrollable product rows (per category)
  - Newsletter subscribe form (writes to Supabase)
  - Contact popup modal (writes to Supabase + uploads to Storage)

- **`collections.html`** (Category listing)
  - Loads all categories from Supabase `categories`
  - Links each category to `products.html?category=<id>`

- **`products.html`** (Products in category)
  - Reads `category` query param
  - Loads category row from `categories`
  - Loads products for category via join table `product_categories`
  - Displays a grid of product cards and “Add to Quote”

- **`product-detail.html`** (Single product page)
  - Reads `id` query param
  - Loads product + category + options/variants from Supabase
  - Supports gallery thumbnails, quantity, variant dropdown
  - “Add to Quote”

- **`search-results.html`** (Search)
  - Loads *all* products, then filters in-browser on name/description
  - Shows product grid and “Add to Quote”

- **`contact.html`** (Contact form page)
  - Form submits a “quote request” row to Supabase
  - Also sends an email via EmailJS

- **`profile.html`** (PDF viewer)
  - Shows `images/Moderna_Profiler.pdf` inside an `<iframe>`

### Admin pages

- **`admin-login.html`**
  - Supabase Auth login using email/password
  - Stores `adminSession` in `localStorage`

- **`admin-dashboard.html`**
  - Requires `adminSession` in `localStorage` (otherwise redirects to login)
  - Two tabs:
    - Products: create/edit products, categories, variants, gallery images; upload images to Supabase Storage
    - Quote Requests: view quote requests grouped by status + change status

- **`product-management.html`**
  - More advanced product/category/image management
  - Groups products by category, allows category reassignment
  - Uploads images to Supabase Storage and updates product `image_url`

### Other / legacy / partial pages

- **`category.html`**: older “collections” view that lists `products_with_categories` (not used as primary navigation)
- **`QuoteRequest.html`**: minimal example inserting into `quote_requests`
- **`quote-modal.html`**: HTML markup for quote modal; injected into pages
- **`quote-modal.js`** / `quote-modal.js` (root): legacy/partial script (references `attachments` bucket/table) — do not copy into new build unless you verify it’s in use
- **`footer.html` / `header.html`**: shared injected templates

---

## 3) Shared layout / chrome

### 3.1 Shared header

- **Template**: `header.html`
- **Injected by**: `js/header-loader.js`
- **Injection target element** (required on each page):
  - `<div id="my-header"></div>`

**Header contents (functional)**
- Contact bar (currently email only)
- Logo: `images/curv_.png`
- Desktop nav links:
  - Home → `index.html`
  - Products → `collections.html`
  - Contact → `contact.html`
  - Search → `search-results.html`
  - Login → `admin-login.html` (label changes to “Dashboard” if session exists)
- Mobile menu using checkbox toggle `#menu-toggle`

**Admin session behavior**
- Header checks `localStorage.getItem('adminSession')`
  - If present: changes Login link text to “Dashboard” and points to `admin-dashboard.html`

### 3.2 Shared footer

- **Template**: `footer.html`
- **Injected by**: `js/footer-loader.js`
- **Injection target element**:
  - `<div id="footer-placeholder"></div>`

Footer includes:
- “Companies who trust us” logos (Clearbit)
- Contact section with email link
- Copyright

---

## 4) Supabase configuration (must match in the new site)

This site connects to **one Supabase project**:

- **Supabase URL**: `https://rpncvcioutyrxntqvlnd.supabase.co`
- **Supabase anon key**: (present throughout current HTML/JS; reuse the same in the new project)

> Recommendation for the rebuild: define a single config module (e.g. `supabaseClient.ts`) and import it everywhere, rather than duplicating values inside every page.

### 4.1 Tables / views referenced by the frontend

The current code references the following:

#### Core catalog
- **`categories`**
  - Used on: `index.html`, `collections.html`, `products.html`, `admin-dashboard.html`, `product-management.html`
  - Fields observed: `id`, `name`, `description`, `image_url`

- **`products`**
  - Used on: `products.html`, `product-detail.html`, `search-results.html`, admin pages
  - Fields observed: `id`, `name`, `description`, `image_url`, `gallery_images` (array), `features` (array), `created_at`

- **`product_categories`** (join table)
  - Maps products to categories
  - Used on: `products.html`, `product-detail.html`, admin pages
  - Fields observed: `product_id`, `category_id`

- **`products_with_categories`** (view)
  - Used on: `index.html` and `category.html`
  - Columns observed: `product_id`, `product_name`, `product_image`, `category_id`, `category_name`

#### Product variants/options
- **`product_options`**
  - Used on: `product-detail.html`, `admin-dashboard.html`
  - Fields observed: `id`, `product_id`, `option_name`, `option_type`

- **`option_values`**
  - Used on: `product-detail.html`, `admin-dashboard.html`
  - Fields observed: `id`, `option_id`, `value`, `price_adjustment`

#### Quote flow (cart → submission)
- **`quote_requests`**
  - Inserted by:
    - `js/modal.js` (quote modal submission)
    - `contact.html` (contact form creates quote request)
    - `index.html` (contact popup modal uses `customers` table instead — see below)
  - Read/updated by:
    - `admin-dashboard.html` (lists requests + updates status)
  - Fields observed: `id`, `customer_name`, `customer_email`, `customer_phone`, `customer_comments`, `status`, `created_at`, `attachment_url`

- **`quote_items`**
  - Inserted by: `js/modal.js`
  - Read by: `admin-dashboard.html` (via join `quote_requests` → `quote_items`)
  - Fields observed: `quote_request_id`, `product_id`, `product_name`, `quantity`, `specifications`, `selected_variant_id` (optional)

#### Newsletter/contact
- **`newsletter_subscribers`**
  - Inserted by: `index.html` newsletter form
  - Fields observed: `name`, `email`, `phone`, `company`

- **`customers`**
  - Inserted by: `index.html` contact popup modal (not the same as `contact.html`)
  - Fields observed: `name`, `email`, `cell_number`, `message`, `created_at`, `attachment_url`, `attachment_urls`

### 4.2 Supabase Storage buckets referenced

- **Bucket**: `quote-attachments`
  - Used by: `js/modal.js` (quote attachment upload) and `index.html` contact popup upload

- **Bucket**: `moderna`
  - Used by: `admin-dashboard.html` and `product-management.html` to upload and list product images
  - Image URLs are generated using `getPublicUrl(...)`

> Rebuild requirement: the new website must point to these same bucket names (unless you change Supabase configuration).

---

## 5) Frontend state & flows (must be preserved)

### 5.1 Quote “cart” (localStorage)

- Key: **`localStorage.quoteItems`**
- Shape differs slightly depending on page, but generally:
  - `id` (product id)
  - `name`
  - `quantity`
  - `variant` (string)
  - `variant_id` (optional)
  - `specifications` (optional; admin uses this field to show variant/specs)

### 5.2 Quote modal

- Markup loaded from: `quote-modal.html`
- Logic in: `js/modal.js`
- Floating button: `#quote-floating-btn`
- Overlay: `#quote-modal-overlay`
- Close button: `#quote-modal-close`
- Table: `#quote-items-table tbody`
- Form: `#quote-form`
  - Name: `#quote-name`
  - Email: `#quote-email`
  - Phone: `#quote-phone`
  - File: `#quote-attachment`
  - Comments: `#quote-comments`

**Submission behavior (current):**
1. Optional upload attachment to Storage bucket `quote-attachments`
2. Insert into `quote_requests`
3. If there are cart items, insert into `quote_items`
4. Clear `localStorage.quoteItems`, reset form, close modal

### 5.3 Home page: category rows + product cards

`index.html` dynamically:
- Loads categories from `categories`
- For each category, fetches products from `products_with_categories` view
- Renders a horizontal scroll row per category
- “Add to Quote” buttons push items into `localStorage.quoteItems`

### 5.4 Collections page (categories)

`collections.html`:
- Fetches categories from `categories`
- Renders cards linking to `products.html?category=<id>`

### 5.5 Products page (category products)

`products.html`:
- Uses `?category=<id>`
- Loads category details from `categories`
- Loads products by joining `products` with `product_categories`
- Renders cards linking to `product-detail.html?id=<product.id>`
- Adds to quote by updating `localStorage.quoteItems` and updating the quote modal table

### 5.6 Product detail page

`product-detail.html`:
- Uses `?id=<productId>`
- Loads:
  - `products` row
  - `product_categories(categories(name))` to show category and build “back” link
  - `product_options(option_values(*))` to populate the variants dropdown
- Supports gallery via `gallery_images`
- “Add to Quote” merges by `(productId, variant)` and updates quantity

### 5.7 Search

`search-results.html`:
- Fetches all `products` (plus `categories(*)` in the select)
- Filters in-browser by name/description

### 5.8 Contact page

`contact.html` does **two things**:
- Inserts a row into `quote_requests`
- Sends an email notification using **EmailJS**

EmailJS config is embedded in `contact.html`:
- `emailjs.init("tweJU50C9CxCHnUN3");`
- uses `emailjs.send('service_gc3chia', 'template_rtt96d9', ...)`

> Rebuild requirement: replicate the behavior (or replace with a new email provider), but keep inserting into the same Supabase `quote_requests` table if you want admins to see these submissions.

---

## 6) Admin flows (must be preserved)

### 6.1 Authentication

- `admin-login.html` uses `supabase.auth.signInWithPassword({ email, password })`
- Stores `data.session` in localStorage key `adminSession`
- `admin-dashboard.html` checks `adminSession` existence and redirects if missing

### 6.2 Product CRUD

Handled in `admin-dashboard.html`:
- Create product in `products`
- Create join row in `product_categories`
- Create option in `product_options` and value rows in `option_values` (variants)
- Edit flow:
  - Update `products`
  - Replace `product_categories` link
  - Recreate options/values

### 6.3 Image management

Two variants:
- `admin-dashboard.html` image picker:
  - Lists Storage objects from bucket `moderna`
  - Uses `getPublicUrl(image.name)` and sets URL into inputs
- Uploading new images:
  - Uploads to `moderna` bucket (fileName uses timestamp/random)
  - Writes public URL into `products.image_url` or gallery URLs

### 6.4 Quote request management

`admin-dashboard.html` loads:
- `quote_requests` with nested `quote_items`
- Normalizes status: `new` → `To Quote`
- Renders four sections:
  - To Quote
  - Quoted
  - Quote Revised
  - Order Placed
- Status changes update `quote_requests.status`

---

## 7) Assets, icons, and PWA

### 7.1 Favicons

Favicons live in:
- `favicon/` (primary)
- `favicon_im/` (duplicate set)

Safari often prefers:
- `apple-touch-icon`
- `favicon.ico`

Currently **only `index.html`** includes explicit favicon tags. For a rebuild, every page should include:
- `<link rel="icon" href="/favicon/favicon.ico">`
- `<link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png">`
- `<link rel="manifest" href="/favicon/site.webmanifest">`

### 7.2 Service worker

- File: `sw.js`
- Caches core assets, uses **network-first** for:
  - HTML
  - `/favicon/*` paths

Rebuild note: if you keep the SW, keep the cache name versioned and be explicit about HTML caching to avoid stale header/footer.

---

## 8) Critical DOM hooks (IDs/classes new layout must preserve OR you must refactor)

If you want to keep the existing JS modules unchanged, preserve these:

- **Header injection**: `#my-header`
- **Footer injection**: `#footer-placeholder`
- **Main content blur target (some pages)**: `#main-content`
- **Quote modal container**: `#quote-modal-container`
- **Quote modal elements**: `#quote-floating-btn`, `#quote-modal-overlay`, `#quote-modal-close`, `#quote-form`, `#quote-items-table`

If you rebuild with a new layout and new JS, you can change IDs—but then your new implementation must reproduce the same Supabase writes/reads.

---

## 9) Known inconsistencies / cleanup opportunities (for the rebuild)

These are not “requirements” but are important if you want a clean new build:

- **Supabase config duplication**: Many pages inline the URL/key. Prefer a single shared module.
- **Multiple Supabase client instances**: Can trigger “Multiple GoTrueClient instances detected”.
- **`index.html` has an event listener for `#hero-quote-btn`** but the element doesn’t exist (JS error). Fix in rebuild.
- **`product-detail.html` includes a WhatsApp button with placeholder** `https://wa.me/your_number` and related CSS/scripts.
- Two different “contact” implementations:
  - `contact.html` inserts into `quote_requests` + EmailJS
  - `index.html` popup inserts into `customers` + uploads to `quote-attachments`
  Decide what the new site should do and unify.

---

## 10) Rebuild contract (what the new site MUST do)

To “link to the same Supabase database” and behave equivalently:

1. Use the same **Supabase project URL** and **anon key**.
2. Read catalog data from:
   - `categories`
   - `products` + `product_categories`
   - (optional) `products_with_categories` view
3. Support product options/variants via:
   - `product_options` + `option_values`
4. Preserve quote workflow:
   - Store cart in `localStorage.quoteItems` (or change, but keep insert outputs compatible)
   - Insert `quote_requests`
   - Insert `quote_items`
   - Upload attachments to Storage bucket `quote-attachments` if used
5. Preserve admin workflow:
   - Supabase Auth login and `adminSession` concept (or replace with a better auth pattern, but keep access controlled)
   - Product CRUD including images in Storage bucket `moderna`
   - Quote request viewing/updating status

---

## 11) Suggested new-project structure (recommended for the “different layout” rebuild)

If you want a modern, maintainable layout while keeping Supabase:

- `src/`
  - `lib/`
    - `supabaseClient.ts` (single source of truth)
    - `types.ts` (Category, Product, QuoteRequest, QuoteItem, etc.)
  - `components/`
    - `Header.tsx` / `Footer.tsx`
    - `ProductCard.tsx`
    - `CategoryCard.tsx`
    - `QuoteDrawerOrModal.tsx`
  - `pages/` (or `app/` if Next.js)
    - Home
    - Collections
    - Products
    - ProductDetail
    - Search
    - Contact
    - Admin (protected)

If you tell me what framework you want for the rebuild (plain HTML, Next.js, React+Vite, etc.), I can tailor this doc into an implementation blueprint with exact component props and routes.

