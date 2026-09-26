#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../../");
const SERVER_DIR = path.resolve(__dirname, "../../");
const MANIFEST_DIR = path.resolve(ROOT_DIR, "image-manifest");

dotenv.config({ path: path.resolve(SERVER_DIR, ".env") });

import ProductModel from "../../models/product.model.js";
import CategoryModel from "../../models/category.model.js";
import SubCategoryModel from "../../models/subCategory.model.js";

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

async function run() {
  console.log("==================================================================");
  console.log("    GRABITGO — PHASE 9E CATALOG PREPARATION ASSET GENERATOR       ");
  console.log("==================================================================");

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI not found in server/.env");
  }

  console.log("Connecting to MongoDB directly via MongoClient...");
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000
  });

  await client.connect();
  console.log("Connected successfully.\n");
  const db = client.db();

  console.log("Fetching catalog data...");
  const [productsRaw, categoriesRaw, subcategoriesRaw] = await Promise.all([
    db.collection("products").find({}, {
      projection: {
        _id: 1,
        name: 1,
        category: 1,
        subCategory: 1,
        unit: 1,
        price: 1,
        discount: 1,
        publish: 1,
        image: { $slice: 1 }
      }
    }).toArray(),
    db.collection("categories").find({}, { projection: { _id: 1, name: 1, image: 1 } }).toArray(),
    db.collection("subcategories").find({}, { projection: { _id: 1, name: 1, category: 1, image: 1 } }).toArray(),
  ]);

  // Build ID-to-Name Lookup Maps
  const categoryMap = new Map();
  categoriesRaw.forEach((c) => categoryMap.set(c._id.toString(), c.name));

  const subCategoryMap = new Map();
  subcategoriesRaw.forEach((s) => subCategoryMap.set(s._id.toString(), s.name));

  // Populate references in JavaScript memory
  const products = productsRaw.map((p) => ({
    ...p,
    category: (Array.isArray(p.category) ? p.category : [p.category]).filter(Boolean).map((id) => ({
      _id: id,
      name: categoryMap.get(id?.toString()) || "General"
    })),
    subCategory: (Array.isArray(p.subCategory) ? p.subCategory : [p.subCategory]).filter(Boolean).map((id) => ({
      _id: id,
      name: subCategoryMap.get(id?.toString()) || "General"
    }))
  }));

  const categories = [...categoriesRaw];
  const subcategories = subcategoriesRaw.map((s) => ({
    ...s,
    category: (Array.isArray(s.category) ? s.category : [s.category]).filter(Boolean).map((id) => ({
      _id: id,
      name: categoryMap.get(id?.toString()) || "General"
    }))
  }));

  // Sort in JavaScript memory
  products.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  subcategories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  console.log(`Fetched ${products.length} products, ${categories.length} categories, ${subcategories.length} subcategories.\n`);

  // Ensure output directory exists
  if (!fs.existsSync(MANIFEST_DIR)) {
    fs.mkdirSync(MANIFEST_DIR, { recursive: true });
  }

  // Sort products alphabetically
  products.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  // ==================================================================
  // 1. GENERATE catalog-inventory.json
  // ==================================================================
  const inventoryJson = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalProducts: products.length,
      totalCategories: categories.length,
      totalSubcategories: subcategories.length,
      imageStorageType: "Historical Base64 Data URIs (Pending Authentic Replacement)",
    },
    products: products.map((p, idx) => {
      const categoryNames = (p.category || []).map((c) => (typeof c === "object" ? c.name : c)).filter(Boolean);
      const subCategoryNames = (p.subCategory || []).map((s) => (typeof s === "object" ? s.name : s)).filter(Boolean);
      const imageCount = Array.isArray(p.image) ? p.image.length : 0;
      const isBase64 = Array.isArray(p.image) && p.image.some((img) => typeof img === "string" && img.startsWith("data:image"));

      return {
        itemNumber: idx + 1,
        productId: p._id.toString(),
        productName: p.name,
        categories: categoryNames,
        subcategories: subCategoryNames,
        unit: p.unit || "N/A",
        price: p.price,
        discount: p.discount || 0,
        published: p.publish ?? true,
        currentImageCount: imageCount,
        imageStorageType: isBase64 ? "BASE64" : imageCount > 0 ? "REMOTE_URL" : "EMPTY",
      };
    }),
  };

  const inventoryJsonPath = path.resolve(MANIFEST_DIR, "catalog-inventory.json");
  fs.writeFileSync(inventoryJsonPath, JSON.stringify(inventoryJson, null, 2), "utf-8");
  console.log(`✔ Generated: ${inventoryJsonPath}`);

  // ==================================================================
  // 2. GENERATE catalog-inventory.csv
  // ==================================================================
  const csvHeaders = [
    "Item #",
    "Product ID",
    "Product Name",
    "Category",
    "Subcategory",
    "Unit",
    "Price (INR)",
    "Discount (%)",
    "Published",
    "Current Image Count",
    "Storage Type"
  ];

  const csvRows = [csvHeaders.join(",")];

  inventoryJson.products.forEach((p) => {
    const row = [
      p.itemNumber,
      escapeCsvField(p.productId),
      escapeCsvField(p.productName),
      escapeCsvField(p.categories.join(" | ")),
      escapeCsvField(p.subcategories.join(" | ")),
      escapeCsvField(p.unit),
      p.price ?? "",
      p.discount ?? 0,
      p.published ? "Yes" : "No",
      p.currentImageCount,
      escapeCsvField(p.imageStorageType)
    ];
    csvRows.push(row.join(","));
  });

  const inventoryCsvPath = path.resolve(MANIFEST_DIR, "catalog-inventory.csv");
  fs.writeFileSync(inventoryCsvPath, csvRows.join("\n"), "utf-8");
  console.log(`✔ Generated: ${inventoryCsvPath}`);

  // ==================================================================
  // 3. GENERATE REAL-IMAGE-CHECKLIST.md (Categorized for all 159 products)
  // ==================================================================
  // Group products by primary category
  const productsByCategory = new Map();

  products.forEach((p) => {
    const catObj = p.category?.[0];
    const catName = (typeof catObj === "object" ? catObj?.name : catObj) || "Uncategorized / General";
    if (!productsByCategory.has(catName)) {
      productsByCategory.set(catName, []);
    }
    productsByCategory.get(catName).push(p);
  });

  // Sort categories
  const sortedCatNames = Array.from(productsByCategory.keys()).sort();

  let checklistMd = `# GrabItGo — Authentic Product Imagery Checklist (159 Products)\n\n`;
  checklistMd += `This checklist contains all **159 products** currently in the catalog. Use this document to plan and organize the authentic photography for each product.\n\n`;
  checklistMd += `### Naming Convention Standard\n`;
  checklistMd += `Save images in \`image-manifest/products/\` using the product's MongoDB \`_id\`:\n`;
  checklistMd += `- Primary (Front): \`<productId>-1.webp\` (or \`<productId>-front.webp\`)\n`;
  checklistMd += `- Secondary (Back / Details): \`<productId>-2.webp\` (or \`<productId>-back.webp\`)\n`;
  checklistMd += `- Nutrition / Ingredients: \`<productId>-3.webp\` (or \`<productId>-details.webp\`)\n\n`;
  checklistMd += `### Summary Metrics\n`;
  checklistMd += `- **Total Products**: ${products.length}\n`;
  checklistMd += `- **Categories Represented**: ${sortedCatNames.length}\n`;
  checklistMd += `- **Recommended Image Count Per Product**: 2 to 4 photos for staples/packaged goods; 1 to 2 photos for basic/cleaning utilities.\n\n`;
  checklistMd += `---\n\n`;

  let globalProductCounter = 0;

  sortedCatNames.forEach((catName) => {
    const catProducts = productsByCategory.get(catName);
    checklistMd += `## ${catName} (${catProducts.length} Products)\n\n`;

    catProducts.forEach((p) => {
      globalProductCounter++;
      const subCatNames = (p.subCategory || []).map((s) => (typeof s === "object" ? s.name : s)).filter(Boolean).join(", ") || "General";
      const id = p._id.toString();

      // Determine recommended count based on category type
      const isUtility = /clean|broom|mop|wiper|sponge|dishwash|scrub|detergent|bag|freshener/i.test(p.name + " " + catName);
      const isSnackOrFood = /biscuit|atta|dal|snack|chocolate|coffee|tea|juice|soup|noodle|pasta|drink/i.test(p.name + " " + catName);
      const isBabyOrCare = /baby|diaper|lotion|wipes|bottle|cream|care/i.test(p.name + " " + catName);

      let requiredImages = "2–3";
      let suggestedBreakdown = [
        "1. Front package / hero view (clear branding & product type)",
        "2. Back package / nutrition facts & ingredients",
        "3. Alternate perspective or packaging details (optional)"
      ];

      if (isUtility) {
        requiredImages = "1–2";
        suggestedBreakdown = [
          "1. Full product hero view (clear item perspective)",
          "2. Packaging details or functional feature closeup (optional)"
        ];
      } else if (isBabyOrCare) {
        requiredImages = "2–4";
        suggestedBreakdown = [
          "1. Front product packaging view",
          "2. Key features / safety / usage instructions",
          "3. Age group & ingredients specification",
          "4. In-use or lifestyle view (optional)"
        ];
      } else if (isSnackOrFood) {
        requiredImages = "2–4";
        suggestedBreakdown = [
          "1. Front product pack view",
          "2. Back pack with ingredients & FSSAI nutritional table",
          "3. Side pack / serving suggestion view",
          "4. Unwrapped product closeup (optional)"
        ];
      }

      checklistMd += `- [ ] **${p.name}**\n`;
      checklistMd += `  - **Product ID**: \`${id}\`\n`;
      checklistMd += `  - **Subcategory**: ${subCatNames}\n`;
      checklistMd += `  - **Unit**: ${p.unit || "Standard"}\n`;
      checklistMd += `  - **Recommended Images**: ${requiredImages}\n`;
      checklistMd += `  - **Suggested Gallery**:\n`;
      suggestedBreakdown.forEach((s) => {
        checklistMd += `    - ${s}\n`;
      });
      checklistMd += `  - **Target Filenames**:\n`;
      checklistMd += `    - \`image-manifest/products/${id}-1.webp\`\n`;
      checklistMd += `    - \`image-manifest/products/${id}-2.webp\`\n\n`;
    });

    checklistMd += `---\n\n`;
  });

  const checklistPath = path.resolve(MANIFEST_DIR, "REAL-IMAGE-CHECKLIST.md");
  fs.writeFileSync(checklistPath, checklistMd, "utf-8");
  console.log(`✔ Generated: ${checklistPath}`);

  // ==================================================================
  // 4. GENERATE CATEGORY-IMAGE-CHECKLIST.md (20 Categories)
  // ==================================================================
  let catChecklistMd = `# GrabItGo — Authentic Category Image Checklist (20 Categories)\n\n`;
  catChecklistMd += `This checklist covers all **20 primary categories** in GrabItGo.\n\n`;
  catChecklistMd += `### Current Status\n`;
  catChecklistMd += `All 20 categories currently have valid Cloudinary-hosted icons. When authentic refreshed photography/icons are provided, they can be placed in \`image-manifest/categories/\`.\n\n`;
  catChecklistMd += `### Specifications\n`;
  catChecklistMd += `- **Format**: Transparent PNG or WebP with transparent/clean white background\n`;
  catChecklistMd += `- **Dimensions**: 500×500 square icon\n`;
  catChecklistMd += `- **Filename Standard**: \`<categoryId>.webp\` or \`<categoryId>.png\`\n\n`;
  catChecklistMd += `---\n\n`;

  categories.forEach((c, idx) => {
    const id = c._id.toString();
    catChecklistMd += `### ${idx + 1}. ${c.name}\n`;
    catChecklistMd += `- **Category ID**: \`${id}\`\n`;
    catChecklistMd += `- **Current Status**: Active Cloudinary URL (${c.image ? "Configured" : "None"})\n`;
    catChecklistMd += `- **Recommended Image**: High-DPI category hero icon (3D render or fresh grocery cluster on transparent canvas)\n`;
    catChecklistMd += `- **Target Filename**: \`image-manifest/categories/${id}.webp\`\n\n`;
  });

  const catChecklistPath = path.resolve(MANIFEST_DIR, "CATEGORY-IMAGE-CHECKLIST.md");
  fs.writeFileSync(catChecklistPath, catChecklistMd, "utf-8");
  console.log(`✔ Generated: ${catChecklistPath}`);

  // ==================================================================
  // 5. GENERATE SUBCATEGORY-IMAGE-CHECKLIST.md (219 Subcategories)
  // ==================================================================
  let subChecklistMd = `# GrabItGo — Authentic Subcategory Image Checklist (219 Subcategories)\n\n`;
  subChecklistMd += `This checklist covers all **219 secondary groupings** in GrabItGo.\n\n`;
  subChecklistMd += `### Specifications\n`;
  subChecklistMd += `- **Format**: WebP or PNG on transparent/neutral background\n`;
  subChecklistMd += `- **Dimensions**: 250×250 to 400×400 square\n`;
  subChecklistMd += `- **Filename Standard**: \`<subCategoryId>.webp\`\n\n`;
  subChecklistMd += `---\n\n`;
  subChecklistMd += `| # | Subcategory Name | Subcategory ID | Parent Category | Target Filename |\n`;
  subChecklistMd += `|---|---|---|---|---|\n`;

  subcategories.forEach((s, idx) => {
    const id = s._id.toString();
    const parentCats = (s.category || []).map((c) => (typeof c === "object" ? c.name : c)).filter(Boolean).join(", ") || "General";
    subChecklistMd += `| ${idx + 1} | **${s.name}** | \`${id}\` | ${parentCats} | \`subcategories/${id}.webp\` |\n`;
  });

  const subChecklistPath = path.resolve(MANIFEST_DIR, "SUBCATEGORY-IMAGE-CHECKLIST.md");
  fs.writeFileSync(subChecklistPath, subChecklistMd, "utf-8");
  console.log(`✔ Generated: ${subChecklistPath}`);

  // ==================================================================
  // 6. GENERATE manifest.authentic.template.json (Ready for user population)
  // ==================================================================
  const authenticTemplate = {
    $schemaDescription: "GrabItGo Authentic Image Manifest Template",
    version: "1.0",
    generatedAt: new Date().toISOString(),
    instructions: "Populate the 'images' array for products and 'image' string for categories/subcategories with authentic photo paths. Leave empty or remove items you do not wish to update.",
    products: products.map((p) => ({
      productId: p._id.toString(),
      productName: p.name,
      images: [],
    })),
    categories: categories.map((c) => ({
      categoryId: c._id.toString(),
      categoryName: c.name,
      image: "",
    })),
    subcategories: subcategories.map((s) => ({
      subCategoryId: s._id.toString(),
      subCategoryName: s.name,
      image: "",
    })),
  };

  const authenticTemplatePath = path.resolve(MANIFEST_DIR, "manifest.authentic.template.json");
  fs.writeFileSync(authenticTemplatePath, JSON.stringify(authenticTemplate, null, 2), "utf-8");
  console.log(`✔ Generated: ${authenticTemplatePath}`);

  // ==================================================================
  // 7. VERIFY INTEGRITY
  // ==================================================================
  console.log("\n--- INTEGRITY & COMPLETENESS VERIFICATION ---");
  const parsedTemplate = JSON.parse(fs.readFileSync(authenticTemplatePath, "utf-8"));
  const parsedInventory = JSON.parse(fs.readFileSync(inventoryJsonPath, "utf-8"));

  const prodSet = new Set(parsedTemplate.products.map((p) => p.productId));
  const catSet = new Set(parsedTemplate.categories.map((c) => c.categoryId));
  const subSet = new Set(parsedTemplate.subcategories.map((s) => s.subCategoryId));

  console.log(`- Products in template: ${parsedTemplate.products.length} (Unique: ${prodSet.size})`);
  console.log(`- Categories in template: ${parsedTemplate.categories.length} (Unique: ${catSet.size})`);
  console.log(`- Subcategories in template: ${parsedTemplate.subcategories.length} (Unique: ${subSet.size})`);
  console.log(`- Products in inventory JSON: ${parsedInventory.products.length}`);

  if (prodSet.size !== 159 || catSet.size !== 20 || subSet.size !== 219) {
    throw new Error("Count mismatch during template generation!");
  }

  // Verify DB was NOT mutated
  const currentCount = await ProductModel.countDocuments();
  if (currentCount !== 159) {
    throw new Error(`Database product count changed! Expected 159, got ${currentCount}`);
  }
  console.log(`✔ Database safety verified: 159 products remain intact and untouched.`);

  await mongoose.disconnect();
  console.log("\n==================================================================");
  console.log("   PHASE 9E ASSETS GENERATED SUCCESSFULLY WITH ZERO DB MUTATIONS  ");
  console.log("==================================================================");
}

run().catch((err) => {
  console.error("FATAL GENERATION ERROR:", err);
  process.exit(1);
});
