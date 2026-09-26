#!/usr/bin/env node

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../../");
const SERVER_DIR = path.resolve(__dirname, "../../");

// Load .env from server directory
dotenv.config({ path: path.resolve(SERVER_DIR, ".env") });

import ProductModel from "../../models/product.model.js";
import CategoryModel from "../../models/category.model.js";
import SubCategoryModel from "../../models/subCategory.model.js";

import { validateManifest } from "./manifest-validator.js";
import {
  configureCloudinary,
  importProductRecord,
  importCategoryRecord,
  importSubCategoryRecord,
} from "./cloudinary-importer.js";
const DEFAULT_MANIFEST_PATH = path.resolve(ROOT_DIR, "image-manifest/manifest.json");
const MANIFEST_DIR = path.resolve(ROOT_DIR, "image-manifest");

// Parse CLI Arguments
const args = process.argv.slice(2);
const isExportTemplate = args.includes("--export-template");
const isApply = args.includes("--apply");
const isConfirm = args.includes("--confirm");
const isDryRun = !isApply || !isConfirm;

let customManifestPath = null;
const manifestIndex = args.indexOf("--manifest");
if (manifestIndex !== -1 && args[manifestIndex + 1]) {
  customManifestPath = path.resolve(process.cwd(), args[manifestIndex + 1]);
}
const manifestFilePath = customManifestPath || DEFAULT_MANIFEST_PATH;

/**
 * CLI Banner
 */
function printBanner() {
  console.log("==================================================================");
  console.log("       GRABITGO — REAL CATALOG IMAGE IMPORT PIPELINE (PHASE 9D)   ");
  console.log("==================================================================");
  if (isExportTemplate) {
    console.log("MODE: EXPORT MANIFEST TEMPLATE FROM MONGODB\n");
  } else if (isDryRun) {
    console.log("MODE: DRY RUN (NO DATABASE OR CLOUDINARY CHANGES WILL BE MADE)\n");
  } else {
    console.log("MODE: LIVE APPLY (UPLOADING TO CLOUDINARY & UPDATING MONGODB)\n");
  }
}

/**
 * Connect to MongoDB safely
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment (.env)");
  }
  await mongoose.connect(uri);
}

/**
 * Export a starter manifest template from MongoDB
 */
async function exportManifestTemplate() {
  console.log("Connecting to database to extract catalog structure...");
  await connectDB();

  // Query only lightweight fields without DB-side sort to avoid Base64 memory overhead
  const [products, categories, subcategories] = await Promise.all([
    ProductModel.find({}).select("_id name").lean(),
    CategoryModel.find({}).select("_id name").lean(),
    SubCategoryModel.find({}).select("_id name").lean(),
  ]);

  // Sort alphabetically in JavaScript memory
  products.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  subcategories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  console.log(`Retrieved ${products.length} products, ${categories.length} categories, ${subcategories.length} subcategories.`);

  const template = {
    $schemaDescription: "GrabItGo Authentic Image Manifest",
    version: "1.0",
    generatedAt: new Date().toISOString(),
    instructions: "Fill in the relative image file paths for items you wish to update. Remove any items you do not wish to modify.",
    products: products.map((p) => ({
      productId: p._id.toString(),
      productName: p.name,
      images: [
        `./products/${p._id}_1.webp`,
        `./products/${p._id}_2.webp`,
      ],
    })),
    categories: categories.map((c) => ({
      categoryId: c._id.toString(),
      categoryName: c.name,
      image: `./categories/${c._id}.webp`,
    })),
    subcategories: subcategories.map((s) => ({
      subCategoryId: s._id.toString(),
      subCategoryName: s.name,
      image: `./subcategories/${s._id}.webp`,
    })),
  };

  const outputPath = path.resolve(MANIFEST_DIR, "manifest.template.json");
  fs.writeFileSync(outputPath, JSON.stringify(template, null, 2), "utf-8");

  console.log(`\n Manifest template successfully exported to:`);
  console.log(`   ${outputPath}`);
  console.log("\nYou can copy this to manifest.json and place authentic photos in the respective folders.");
}

/**
 * Main Execution Function
 */
async function run() {
  printBanner();

  if (isExportTemplate) {
    await exportManifestTemplate();
    await mongoose.disconnect();
    process.exit(0);
  }

  // Check manifest file existence
  if (!fs.existsSync(manifestFilePath)) {
    console.error(`ERROR: Manifest file not found at: ${manifestFilePath}`);
    console.log("\nTo generate a starter template, run:");
    console.log("  node server/scripts/image-import/import-pipeline.js --export-template\n");
    process.exit(1);
  }

  // Load and parse JSON
  let manifestData;
  try {
    const rawContent = fs.readFileSync(manifestFilePath, "utf-8");
    manifestData = JSON.parse(rawContent);
  } catch (err) {
    console.error(`ERROR: Failed to parse manifest JSON: ${err.message}`);
    process.exit(1);
  }

  console.log(`Manifest loaded: ${manifestFilePath}`);
  console.log("Connecting to database for ID resolution...");
  await connectDB();

  // Run validation
  const basePath = path.dirname(manifestFilePath);
  const validation = await validateManifest(manifestData, basePath, {
    ProductModel,
    CategoryModel,
    SubCategoryModel,
  });

  // Display validation report
  console.log("\n------------------------------------------------------------------");
  console.log("                      VALIDATION REPORT                           ");
  console.log("------------------------------------------------------------------");
  console.log(`Products:      ${validation.summary.validProducts} valid / ${validation.summary.totalProductsInManifest} in manifest (${validation.summary.totalProductImages} image files)`);
  console.log(`Categories:    ${validation.summary.validCategories} valid / ${validation.summary.totalCategoriesInManifest} in manifest`);
  console.log(`Subcategories: ${validation.summary.validSubCategories} valid / ${validation.summary.totalSubCategoriesInManifest} in manifest`);

  if (validation.warnings.length > 0) {
    console.log("\nWarnings:");
    validation.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  }

  if (validation.errors.length > 0) {
    console.log("\nValidation Errors:");
    validation.errors.forEach((e) => console.log(`  ✖ ${e}`));
  }

  if (!validation.valid) {
    console.log("\n✖ VALIDATION FAILED: Resolve the errors above before continuing.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("\n✔ All manifest items and local image assets passed validation!");

  // DRY RUN OUTPUT
  if (isDryRun) {
    console.log("\n------------------------------------------------------------------");
    console.log("                 DRY RUN AUDIT SUMMARY — NO MUTATIONS             ");
    console.log("------------------------------------------------------------------");
    console.log(`- Would upload and replace imagery for ${validation.summary.validProducts} products`);
    console.log(`- Would upload and replace imagery for ${validation.summary.validCategories} categories`);
    console.log(`- Would upload and replace imagery for ${validation.summary.validSubCategories} subcategories`);
    console.log("- MongoDB database state: 100% UNTOUCHED (0 changes made)");
    console.log("- Cloudinary storage: 100% UNTOUCHED (0 uploads performed)");
    console.log("\nTo execute this import in a future phase with authentic images:");
    console.log("  node server/scripts/image-import/import-pipeline.js --apply --confirm\n");
    await mongoose.disconnect();
    process.exit(0);
  }

  // LIVE APPLY MODE
  console.log("\n------------------------------------------------------------------");
  console.log("                  EXECUTING LIVE CLOUDINARY IMPORT                ");
  console.log("------------------------------------------------------------------");
  configureCloudinary();

  const auditLog = {
    startedAt: new Date().toISOString(),
    products: [],
    categories: [],
    subcategories: [],
  };

  // 1. Process Products
  for (const p of validation.products) {
    console.log(`\nProcessing Product: "${p.productName}" [${p.productId}]...`);
    const res = await importProductRecord(p, ProductModel, {
      dryRun: false,
      log: console.log,
    });
    auditLog.products.push(res);
    if (res.status === "SUCCESS") {
      console.log(`  ✔ Successfully uploaded ${res.uploadedCount} images and updated MongoDB record.`);
    } else {
      console.error(`  ✖ Failed to import product: ${res.error} (Database record was preserved).`);
    }
  }

  // 2. Process Categories
  for (const c of validation.categories) {
    console.log(`\nProcessing Category: "${c.categoryName}" [${c.categoryId}]...`);
    const res = await importCategoryRecord(c, CategoryModel, {
      dryRun: false,
      log: console.log,
    });
    auditLog.categories.push(res);
    if (res.status === "SUCCESS") {
      console.log(`  ✔ Successfully uploaded image and updated MongoDB record.`);
    } else {
      console.error(`  ✖ Failed to import category: ${res.error} (Database record was preserved).`);
    }
  }

  // 3. Process Subcategories
  for (const s of validation.subcategories) {
    console.log(`\nProcessing Subcategory: "${s.subCategoryName}" [${s.subCategoryId}]...`);
    const res = await importSubCategoryRecord(s, SubCategoryModel, {
      dryRun: false,
      log: console.log,
    });
    auditLog.subcategories.push(res);
    if (res.status === "SUCCESS") {
      console.log(`  ✔ Successfully uploaded image and updated MongoDB record.`);
    } else {
      console.error(`  ✖ Failed to import subcategory: ${res.error} (Database record was preserved).`);
    }
  }

  auditLog.completedAt = new Date().toISOString();
  const logPath = path.resolve(MANIFEST_DIR, `import-log-${Date.now()}.json`);
  fs.writeFileSync(logPath, JSON.stringify(auditLog, null, 2), "utf-8");

  console.log(`\n==================================================================`);
  console.log(`Import completed. Audit log written to: ${logPath}`);
  console.log(`==================================================================`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("FATAL PIPELINE ERROR:", err);
  process.exit(1);
});
