import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../../");
const SERVER_DIR = path.resolve(__dirname, "../../");

dotenv.config({ path: path.resolve(SERVER_DIR, ".env") });
import ProductModel from "../../models/product.model.js";
import CategoryModel from "../../models/category.model.js";
import SubCategoryModel from "../../models/subCategory.model.js";

async function verifyPostLive() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Post-Live Import Verification.");

  const batch7ManifestPath = path.resolve(ROOT_DIR, "image-manifest/subcategory-batch-7-approved-9-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(batch7ManifestPath, "utf-8"));

  console.log("\n==================================================");
  console.log("INDIVIDUAL TARGET CLOUDINARY URL VERIFICATION");
  console.log("==================================================");

  const results = [];
  for (const s of manifest.subcategories) {
    const doc = await SubCategoryModel.findById(s.id).lean();
    const isCloudinary = doc?.image && doc.image.startsWith("https://res.cloudinary.com");
    console.log(`- ${s.name} [${s.id}]:`);
    console.log(`  URL: ${doc?.image}`);
    console.log(`  Valid Cloudinary URL: ${isCloudinary ? "YES" : "NO"}`);
    results.push({
      id: s.id,
      name: s.name,
      url: doc?.image,
      isCloudinary
    });
  }

  // Baseline verification
  const [totalProducts, totalCategories, totalSubcategories] = await Promise.all([
    ProductModel.countDocuments(),
    CategoryModel.countDocuments(),
    SubCategoryModel.countDocuments(),
  ]);

  const cloudinarySubcats = await SubCategoryModel.countDocuments({
    image: { $regex: "cloudinary\\.com" }
  });
  const base64Subcats = totalSubcategories - cloudinarySubcats;

  console.log("\n==================================================");
  console.log("DATABASE COUNTS & BASELINE");
  console.log("==================================================");
  console.log(`Products:      ${totalProducts} (Expected: 159)`);
  console.log(`Categories:    ${totalCategories} (Expected: 20)`);
  console.log(`Subcategories: ${totalSubcategories} (Expected: 219)`);
  console.log(`  - Cloudinary: ${cloudinarySubcats} (Expected: 69)`);
  console.log(`  - Base64:     ${base64Subcats} (Expected: 150)`);

  // Verify previous batches 1-6
  const previousBatchManifests = [
    "batch-1-manifest.json",
    "subcategory-batch-2-approved-10-manifest.json",
    "subcategory-batch-3-approved-12-manifest.json",
    "subcategory-batch-4-approved-11-manifest.json",
    "subcategory-batch-5-approved-12-manifest.json",
    "subcategory-batch-6-approved-11-manifest.json"
  ];

  console.log("\n==================================================");
  console.log("PREVIOUS BATCHES 1–6 PRESERVATION CHECK");
  console.log("==================================================");
  let allPreviousIntact = true;
  let prevCount = 0;
  for (let b = 0; b < previousBatchManifests.length; b++) {
    const mf = previousBatchManifests[b];
    const mfPath = path.resolve(ROOT_DIR, "image-manifest", mf);
    if (fs.existsSync(mfPath)) {
      const data = JSON.parse(fs.readFileSync(mfPath, "utf-8"));
      const items = data.subcategories || [];
      prevCount += items.length;
      let batchOk = true;
      for (const item of items) {
        const id = item.id || item.subCategoryId;
        const d = await SubCategoryModel.findById(id).select("_id name image").lean();
        if (!d || !d.image || !d.image.includes("cloudinary.com")) {
          batchOk = false;
          allPreviousIntact = false;
          console.error(`  ✖ Regression in ${mf}: ${item.name} (${id}) is not Cloudinary!`);
        }
      }
      console.log(`- Batch ${b + 1} (${mf}): ${items.length} records -> ${batchOk ? "INTACT" : "FAILED"}`);
    }
  }
  console.log(`Total previous items checked: ${prevCount} -> All Intact: ${allPreviousIntact ? "YES" : "NO"}`);

  // Protected exclusions check
  console.log("\n==================================================");
  console.log("PROTECTED EXCLUSIONS VERIFICATION");
  console.log("==================================================");
  const [noodles, oral, protections] = await Promise.all([
    SubCategoryModel.findById("690e1792bb3427cd33190bd4").select("_id name image").lean(),
    SubCategoryModel.findById("690e24debb3427cd33190e2a").select("_id name image").lean(),
    SubCategoryModel.findById("690e2467bb3427cd33190e0e").select("_id name image").lean(),
  ]);

  const isNoodlesBase64 = noodles?.image && !noodles.image.includes("cloudinary.com");
  const isOralBase64 = oral?.image && !oral.image.includes("cloudinary.com");
  const isProtectionsBase64 = protections?.image && !protections.image.includes("cloudinary.com");

  console.log(`- Noodles (690e1792bb3427cd33190bd4): ${isNoodlesBase64 ? "BASE64 (PASS)" : "CLOUDINARY (VIOLATION)"}`);
  console.log(`- Oral Health & Eye Care (690e24debb3427cd33190e2a): ${isOralBase64 ? "BASE64 (PASS)" : "CLOUDINARY (VIOLATION)"}`);
  console.log(`- Protections (690e2467bb3427cd33190e0e): ${isProtectionsBase64 ? "BASE64 (PASS)" : "CLOUDINARY (VIOLATION)"}`);

  await mongoose.disconnect();
}

verifyPostLive().catch(console.error);
