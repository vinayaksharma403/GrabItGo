import fs from "fs";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../../");
const SERVER_DIR = path.resolve(__dirname, "../../");

dotenv.config({ path: path.resolve(SERVER_DIR, ".env") });

import ProductModel from "../../models/product.model.js";
import CategoryModel from "../../models/category.model.js";
import SubCategoryModel from "../../models/subCategory.model.js";

const MANIFEST_PATH = path.resolve(ROOT_DIR, "image-manifest/subcategory-batch-6-approved-11-manifest.json");

async function checkGates() {
  console.log("==================================================");
  console.log("PHASE 9G.22 — PRE-LIVE SAFETY GATES VERIFICATION");
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

  // Read manifest
  const rawManifest = fs.readFileSync(MANIFEST_PATH, "utf-8");
  const manifest = JSON.parse(rawManifest);

  // Gate 1: Manifest contains exactly 11 subcategories
  gate(1, "Manifest contains exactly 11 subcategories", manifest.subcategories && manifest.subcategories.length === 11, `Count: ${manifest.subcategories?.length}`);

  // Gate 2: Manifest contains 0 categories
  gate(2, "Manifest contains 0 categories", !manifest.categories || manifest.categories.length === 0, `Count: ${manifest.categories?.length || 0}`);

  // Gate 3: Manifest contains 0 products
  gate(3, "Manifest contains 0 products", !manifest.products || manifest.products.length === 0, `Count: ${manifest.products?.length || 0}`);

  // Connect DB
  await mongoose.connect(process.env.MONGODB_URI);

  const subcatIds = manifest.subcategories.map(s => s.id);

  // Check subcategories in DB
  const dbSubcats = await SubCategoryModel.find({ _id: { $in: subcatIds } }).lean();
  gate(4, "All 11 target IDs exist in MongoDB", dbSubcats.length === 11, `Found ${dbSubcats.length}/11`);

  // Gate 5: All 11 targets are currently Base64-backed
  const isBase64 = (img) => typeof img === "string" && (img.startsWith("data:image") || (!img.includes("cloudinary.com") && !img.startsWith("http")));
  const isCloudinary = (img) => typeof img === "string" && img.includes("cloudinary.com");

  const base64Count = dbSubcats.filter(s => isBase64(s.image)).length;
  gate(5, "All 11 targets are currently Base64-backed", base64Count === 11, `Base64 count: ${base64Count}/11`);

  // Gate 6: None of the 11 targets is already Cloudinary-backed
  const cloudCount = dbSubcats.filter(s => isCloudinary(s.image)).length;
  gate(6, "None of the 11 targets is already Cloudinary-backed", cloudCount === 0, `Cloudinary count: ${cloudCount}`);

  // Gate 7: All 11 source files exist and are readable
  const manifestDir = path.dirname(MANIFEST_PATH);
  let filesReadable = true;
  let fileDetails = [];
  for (const item of manifest.subcategories) {
    const filePath = path.resolve(manifestDir, item.sourceImage);
    if (!fs.existsSync(filePath)) {
      filesReadable = false;
      fileDetails.push(`Missing: ${item.sourceImage}`);
    } else {
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
      } catch {
        filesReadable = false;
        fileDetails.push(`Unreadable: ${item.sourceImage}`);
      }
    }
  }
  gate(7, "All 11 source files exist and are readable", filesReadable, fileDetails.length ? fileDetails.join(", ") : "All 11 verified");

  // Gate 8: All manifest SHA256 hashes still match
  let hashesMatch = true;
  let hashDetails = [];
  for (const item of manifest.subcategories) {
    const filePath = path.resolve(manifestDir, item.sourceImage);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const computedHash = crypto.createHash("sha256").update(buffer).digest("hex");
      if (computedHash !== item.sha256) {
        hashesMatch = false;
        hashDetails.push(`Mismatch for ${item.name}: expected ${item.sha256}, got ${computedHash}`);
      }
    }
  }
  gate(8, "All manifest SHA256 hashes still match", hashesMatch, hashDetails.length ? hashDetails.join(", ") : "All 11 hashes match");

  // Gate 9: Noodles is absent from manifest
  const noodlesId = "690e1792bb3427cd33190bd4";
  const noodlesPresent = manifest.subcategories.some(s => s.id === noodlesId || (s.name && s.name.toLowerCase() === "noodles"));
  gate(9, "Noodles is absent from manifest", !noodlesPresent, `Noodles present: ${noodlesPresent}`);

  // Gate 10: Oral Health & Eye Care is absent from manifest
  const oralHealthId = "690e24debb3427cd33190e2a";
  const oralHealthPresent = manifest.subcategories.some(s => s.id === oralHealthId || (s.name && s.name.toLowerCase().includes("oral health")));
  gate(10, "Oral Health & Eye Care is absent from manifest", !oralHealthPresent, `Oral Health present: ${oralHealthPresent}`);

  // Gate 11: Protections is absent from manifest
  const protectionsId = "690e2467bb3427cd33190e0e";
  const protectionsPresent = manifest.subcategories.some(s => s.id === protectionsId || (s.name && s.name.toLowerCase() === "protections"));
  gate(11, "Protections is absent from manifest", !protectionsPresent, `Protections present: ${protectionsPresent}`);

  // Gate 12: Database baseline
  const totalProducts = await ProductModel.countDocuments();
  const totalCategories = await CategoryModel.countDocuments();
  const allSubcategories = await SubCategoryModel.find({}).select("_id name image").lean();
  const totalSubcategories = allSubcategories.length;

  const totalCloudinarySubcats = allSubcategories.filter(s => isCloudinary(s.image)).length;
  const totalBase64Subcats = allSubcategories.filter(s => !isCloudinary(s.image)).length;

  const baselineValid = (
    totalProducts === 159 &&
    totalCategories === 20 &&
    totalSubcategories === 219 &&
    totalCloudinarySubcats === 49 &&
    totalBase64Subcats === 170
  );

  gate(
    12,
    "Database baseline is exactly 159 prod / 20 cat / 219 subcat / 49 Cloudinary / 170 Base64",
    baselineValid,
    `Products: ${totalProducts}/159, Categories: ${totalCategories}/20, Subcategories: ${totalSubcategories}/219 (Cloudinary: ${totalCloudinarySubcats}/49, Base64: ${totalBase64Subcats}/170)`
  );

  // Check excluded items baseline in DB
  const [noodlesDoc, oralDoc, protectionsDoc] = await Promise.all([
    SubCategoryModel.findById(noodlesId).lean(),
    SubCategoryModel.findById(oralHealthId).lean(),
    SubCategoryModel.findById(protectionsId).lean(),
  ]);

  console.log("\nExcluded items current state in DB:");
  console.log(`- Noodles (${noodlesId}): ${isCloudinary(noodlesDoc?.image) ? "Cloudinary" : "Base64"}`);
  console.log(`- Oral Health & Eye Care (${oralHealthId}): ${isCloudinary(oralDoc?.image) ? "Cloudinary" : "Base64"}`);
  console.log(`- Protections (${protectionsId}): ${isCloudinary(protectionsDoc?.image) ? "Cloudinary" : "Base64"}`);

  await mongoose.disconnect();

  console.log("\n==================================================");
  if (allPassed) {
    console.log(">>> ALL 12 PRE-LIVE SAFETY GATES PASSED <<<");
    console.log("==================================================");
    process.exit(0);
  } else {
    console.error(">>> PRE-LIVE SAFETY GATES FAILED — STOPPING <<<");
    console.log("==================================================");
    process.exit(1);
  }
}

checkGates().catch(err => {
  console.error("Error during pre-live check:", err);
  process.exit(1);
});
