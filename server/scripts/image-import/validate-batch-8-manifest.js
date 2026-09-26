import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../../");
const SERVER_DIR = path.resolve(__dirname, "../../");

dotenv.config({ path: path.resolve(SERVER_DIR, ".env") });
import ProductModel from "../../models/product.model.js";
import CategoryModel from "../../models/category.model.js";
import SubCategoryModel from "../../models/subCategory.model.js";

async function validateManifestFull() {
  const manifestPath = path.resolve(ROOT_DIR, "image-manifest/subcategory-batch-8-approved-11-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const manifestDir = path.dirname(manifestPath);

  console.log("==================================================");
  console.log("BATCH 8 MANIFEST COMPREHENSIVE VALIDATION");
  console.log("==================================================");

  let allPassed = true;
  function gate(num, name, condition, details = "") {
    if (condition) {
      console.log(`[PASS] Gate ${num}: ${name} ${details ? "(" + details + ")" : ""}`);
    } else {
      console.error(`[FAIL] Gate ${num}: ${name} ${details ? "(" + details + ")" : ""}`);
      allPassed = false;
    }
  }

  // 1. 11 subcategories exactly
  gate(1, "Manifest contains exactly 11 subcategories", manifest.subcategories && manifest.subcategories.length === 11, `Count: ${manifest.subcategories?.length}`);

  // 2. 0 categories
  gate(2, "Manifest contains 0 categories", !manifest.categories || manifest.categories.length === 0, `Count: ${manifest.categories?.length || 0}`);

  // 3. 0 products
  gate(3, "Manifest contains 0 products", !manifest.products || manifest.products.length === 0, `Count: ${manifest.products?.length || 0}`);

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);

  const subcatIds = (manifest.subcategories || []).map(s => s.id);
  const dbSubcats = await SubCategoryModel.find({ _id: { $in: subcatIds } }).lean();

  // 4. All IDs exist in MongoDB
  gate(4, "All 11 target IDs exist in MongoDB", dbSubcats.length === 11, `Found: ${dbSubcats.length}/11`);

  // 5. All IDs are Base64-backed
  const isCloudinary = (img) => typeof img === "string" && img.includes("cloudinary.com");
  const base64Count = dbSubcats.filter(s => !isCloudinary(s.image)).length;
  gate(5, "All 11 target IDs are currently Base64-backed", base64Count === 11, `Base64 count: ${base64Count}/11`);

  // 6. All source files exist
  let allFilesExist = true;
  for (const s of manifest.subcategories) {
    const fPath = path.resolve(manifestDir, s.sourceImage);
    if (!fs.existsSync(fPath)) {
      allFilesExist = false;
      console.error(`  Missing: ${fPath}`);
    }
  }
  gate(6, "All 11 source image files exist on disk", allFilesExist, "11/11 verified");

  // 7. All SHA256 hashes match
  let allHashesMatch = true;
  for (const s of manifest.subcategories) {
    const fPath = path.resolve(manifestDir, s.sourceImage);
    if (fs.existsSync(fPath)) {
      const buf = fs.readFileSync(fPath);
      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      if (hash !== s.sha256) {
        allHashesMatch = false;
        console.error(`  Hash mismatch for ${s.name}: manifest has ${s.sha256}, disk has ${hash}`);
      }
    }
  }
  gate(7, "All 11 source SHA256 hashes match exactly", allHashesMatch, "11/11 hashes verified");

  // 8. No collision with previous 69 records
  const previousBatchManifests = [
    "batch-1-manifest.json",
    "subcategory-batch-2-approved-10-manifest.json",
    "subcategory-batch-3-approved-12-manifest.json",
    "subcategory-batch-4-approved-11-manifest.json",
    "subcategory-batch-5-approved-12-manifest.json",
    "subcategory-batch-6-approved-11-manifest.json",
    "subcategory-batch-7-approved-9-manifest.json"
  ];
  const previousIds = new Set();
  for (const pm of previousBatchManifests) {
    const pPath = path.resolve(manifestDir, pm);
    if (fs.existsSync(pPath)) {
      const data = JSON.parse(fs.readFileSync(pPath, "utf-8"));
      (data.subcategories || []).forEach(s => previousIds.add(s.id || s.subCategoryId));
    }
  }
  const overlap = subcatIds.filter(id => previousIds.has(id));
  gate(8, "Zero overlap with previous 69 migrated subcategories", overlap.length === 0, `Overlap count: ${overlap.length}`);

  // 9. No protected exclusions present
  const protectedIds = new Set([
    "690e1792bb3427cd33190bd4", // Noodles
    "690e24debb3427cd33190e2a", // Oral Health & Eye Care
    "690e2467bb3427cd33190e0e", // Protections
  ]);
  const protectedOverlap = subcatIds.filter(id => protectedIds.has(id));
  gate(9, "Zero overlap with protected exclusions", protectedOverlap.length === 0, `Protected overlap count: ${protectedOverlap.length}`);

  // 10. Database baseline remains 159 / 20 / 219 / 69 / 150
  const [totalProducts, totalCategories, totalSubcategories] = await Promise.all([
    ProductModel.countDocuments(),
    CategoryModel.countDocuments(),
    SubCategoryModel.countDocuments()
  ]);
  const cloudCount = await SubCategoryModel.countDocuments({ image: { $regex: "cloudinary\\.com" } });
  const base64Total = totalSubcategories - cloudCount;

  const baselineValid = (
    totalProducts === 159 &&
    totalCategories === 20 &&
    totalSubcategories === 219 &&
    cloudCount === 69 &&
    base64Total === 150
  );
  gate(10, "Database baseline is exactly 159 / 20 / 219 / 69 / 150", baselineValid, `Prod: ${totalProducts}, Cat: ${totalCategories}, Sub: ${totalSubcategories}, Cloud: ${cloudCount}, Base64: ${base64Total}`);

  await mongoose.disconnect();

  console.log("==================================================");
  if (allPassed) {
    console.log(">>> ALL BATCH 8 MANIFEST VALIDATION GATES PASSED <<<");
    process.exit(0);
  } else {
    console.error(">>> MANIFEST VALIDATION FAILED <<<");
    process.exit(1);
  }
}

validateManifestFull().catch(console.error);
