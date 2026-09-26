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

async function validatePreDryRun() {
  const manifestPath = path.resolve(ROOT_DIR, "image-manifest/subcategory-batch-7-approved-9-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const manifestDir = path.dirname(manifestPath);

  console.log("==================================================");
  console.log("BATCH 7 PRE-DRY-RUN VALIDATION GATES");
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

  // 1. Manifest has exactly 9 subcategories
  gate(1, "Manifest has exactly 9 subcategories", manifest.subcategories && manifest.subcategories.length === 9, `Count: ${manifest.subcategories?.length}`);

  // 2. Manifest has 0 categories
  gate(2, "Manifest has 0 categories", !manifest.categories || manifest.categories.length === 0, `Count: ${manifest.categories?.length || 0}`);

  // 3. Manifest has 0 products
  gate(3, "Manifest has 0 products", !manifest.products || manifest.products.length === 0, `Count: ${manifest.products?.length || 0}`);

  // Connect to DB
  await mongoose.connect(process.env.MONGODB_URI);

  const subcatIds = (manifest.subcategories || []).map(s => s.id);
  const dbSubcats = await SubCategoryModel.find({ _id: { $in: subcatIds } }).lean();

  // 4. Every target ID exists in MongoDB
  gate(4, "Every target ID exists in MongoDB", dbSubcats.length === 9, `Found: ${dbSubcats.length}/9`);

  // 5. Every target is currently Base64-backed
  const isCloudinary = (img) => typeof img === "string" && img.includes("cloudinary.com");
  const base64Count = dbSubcats.filter(s => !isCloudinary(s.image)).length;
  gate(5, "Every target is currently Base64-backed", base64Count === 9, `Base64 count: ${base64Count}/9`);

  // 6. Every source file exists
  let allFilesExist = true;
  for (const s of manifest.subcategories) {
    const fPath = path.resolve(manifestDir, s.sourceImage);
    if (!fs.existsSync(fPath)) {
      allFilesExist = false;
      console.error(`  Missing file: ${fPath}`);
    }
  }
  gate(6, "Every source file exists", allFilesExist, "9/9 verified on disk");

  // 7. Every source SHA256 matches
  let allHashesMatch = true;
  for (const s of manifest.subcategories) {
    const fPath = path.resolve(manifestDir, s.sourceImage);
    if (fs.existsSync(fPath)) {
      const buf = fs.readFileSync(fPath);
      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      if (hash !== s.sha256) {
        allHashesMatch = false;
        console.error(`  Hash mismatch for ${s.name}: expected ${s.sha256}, got ${hash}`);
      }
    }
  }
  gate(7, "Every source SHA256 matches", allHashesMatch, "9/9 hashes match");

  // 8. No target overlaps Batches 1–6
  const previousBatchManifests = [
    "batch-1-manifest.json",
    "subcategory-batch-2-approved-10-manifest.json",
    "subcategory-batch-3-approved-12-manifest.json",
    "subcategory-batch-4-approved-11-manifest.json",
    "subcategory-batch-5-approved-12-manifest.json",
    "subcategory-batch-6-approved-11-manifest.json"
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
  gate(8, "No target overlaps Batches 1–6", overlap.length === 0, `Overlap count: ${overlap.length}`);

  // 9. No protected exclusion is present
  const protectedIds = new Set([
    "690e1792bb3427cd33190bd4", // Noodles
    "690e24debb3427cd33190e2a", // Oral Health & Eye Care
    "690e2467bb3427cd33190e0e", // Protections
  ]);
  const protectedOverlap = subcatIds.filter(id => protectedIds.has(id));
  gate(9, "No protected exclusion is present in manifest", protectedOverlap.length === 0, `Protected overlap: ${protectedOverlap.length}`);

  // 10. Database baseline remains 159 / 20 / 219 / 60 / 159
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
    cloudCount === 60 &&
    base64Total === 159
  );
  gate(10, "Database baseline is exactly 159 / 20 / 219 / 60 / 159", baselineValid, `Prod: ${totalProducts}, Cat: ${totalCategories}, Sub: ${totalSubcategories}, Cloud: ${cloudCount}, Base64: ${base64Total}`);

  await mongoose.disconnect();

  console.log("==================================================");
  if (allPassed) {
    console.log(">>> ALL 10 PRE-DRY-RUN GATES PASSED <<<");
    process.exit(0);
  } else {
    console.error(">>> PRE-DRY-RUN GATES FAILED <<<");
    process.exit(1);
  }
}

validatePreDryRun().catch(console.error);
