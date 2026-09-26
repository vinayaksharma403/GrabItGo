# GrabItGo — Authentic Image Import Pipeline Guide

This directory (`image-manifest/`) provides a structured, automated, and safe mechanism to map and import authentic production photography for all **159 products**, **20 categories**, and **219 subcategories** in the GrabItGo catalog.

---

## 1. Directory Structure

```
image-manifest/
├── README.md                     # This instructions guide
├── manifest.json                 # Active import manifest (or manifest.template.json)
├── products/                     # Place authentic product images here
│   ├── 690e21b2bb3427cd33190da2_1.webp
│   ├── 690e21b2bb3427cd33190da2_2.webp
│   └── ...
├── categories/                   # Place authentic category images here
│   ├── 690a1e879dae4dbb7e20c128.webp
│   └── ...
└── subcategories/                # Place authentic subcategory images here
    ├── 690e2308bb3427cd33190dce.webp
    └── ...
```

---

## 2. Image Specifications & Rules

| Property | Supported / Recommended |
| :--- | :--- |
| **Allowed Formats** | `.webp`, `.png`, `.jpg`, `.jpeg` |
| **Transparency** | Transparent PNG and WebP are fully supported with neutral backgrounds |
| **Max File Size** | 10 MB per image asset |
| **Recommended Aspect Ratio** | 1:1 square (e.g. 800×800 or 1000×1000) for product cards and thumbnails |
| **Gallery Ordering** | The `images` array order in the manifest is strictly preserved (index 0 is primary) |

---

## 3. Workflow Steps

### Step 1: Export Manifest Template (Pre-populated with all IDs)
Generate a fresh template directly from MongoDB:
```bash
node server/scripts/image-import/import-pipeline.js --export-template
```
This generates `image-manifest/manifest.template.json` containing all 159 products, 20 categories, and 219 subcategories with their exact MongoDB `_id`s and current names pre-filled.

### Step 2: Prepare Your Authentic Photos
1. Copy `manifest.template.json` to `manifest.json`.
2. Add your high-resolution photos into `products/`, `categories/`, and `subcategories/`.
3. Update the file paths in `manifest.json`. (You can import as few as 1 item or all 159 items).

### Step 3: Run Dry-Run Validation (Zero Database Changes)
Test everything safely before any uploads:
```bash
node server/scripts/image-import/import-pipeline.js
# Or explicitly:
node server/scripts/image-import/import-pipeline.js --dry-run
```
The dry run will:
- Verify that every referenced file exists on disk.
- Validate MIME types, extensions, and file sizes.
- Check MongoDB to ensure every `_id` is authentic and matches the catalog.
- Verify that **NO database changes or Cloudinary uploads occur**.

### Step 4: Live Import (When Ready in a Future Phase)
```bash
node server/scripts/image-import/import-pipeline.js --apply --confirm
```
The live importer:
- Uploads images to Cloudinary in folders `GrabItGo/products`, `GrabItGo/categories`, `GrabItGo/subcategories`.
- Atomically replaces the product's image array **only after all images for that product succeed**.
- Generates a timestamped JSON audit log in `image-manifest/import-log-<timestamp>.json`.
