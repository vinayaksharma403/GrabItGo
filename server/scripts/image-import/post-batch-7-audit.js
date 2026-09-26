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

function getImageDimensions(buffer, ext) {
  try {
    if (ext === ".png") {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return `${width}x${height}`;
    } else if (ext === ".webp") {
      const riff = buffer.toString("ascii", 0, 4);
      const webp = buffer.toString("ascii", 8, 12);
      if (riff === "RIFF" && webp === "WEBP") {
        const chunkType = buffer.toString("ascii", 12, 16);
        if (chunkType === "VP8 ") {
          const width = buffer.readUInt16LE(26) & 0x3fff;
          const height = buffer.readUInt16LE(28) & 0x3fff;
          return `${width}x${height}`;
        } else if (chunkType === "VP8L") {
          const b1 = buffer.readUInt8(21);
          const b2 = buffer.readUInt8(22);
          const b3 = buffer.readUInt8(23);
          const b4 = buffer.readUInt8(24);
          const width = 1 + (((b2 & 0x3f) << 8) | b1);
          const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
          return `${width}x${height}`;
        } else if (chunkType === "VP8X") {
          const width = 1 + buffer.readUIntLE(24, 3);
          const height = 1 + buffer.readUIntLE(27, 3);
          return `${width}x${height}`;
        }
      }
    } else if (ext === ".jpg" || ext === ".jpeg") {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (marker === 0xc0 || marker === 0xc2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return `${width}x${height}`;
        }
        offset += 2 + buffer.readUInt16BE(offset + 2);
      }
    }
  } catch (err) {
    return "unknown";
  }
  return "unknown";
}

async function runAudit() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Post-Batch-7 Audit.");

  const [products, categories, subcategories] = await Promise.all([
    ProductModel.find({}).select("_id name category subCategory").lean(),
    CategoryModel.find({}).select("_id name image").lean(),
    SubCategoryModel.find({}).select("_id name category image").lean(),
  ]);

  const isCloudinary = (img) => typeof img === "string" && img.includes("cloudinary.com");
  const isBase64 = (img) => typeof img === "string" && !img.includes("cloudinary.com");

  const catMap = new Map();
  categories.forEach(c => catMap.set(c._id.toString(), c.name));

  const subCatMap = new Map();
  subcategories.forEach(s => subCatMap.set(s._id.toString(), s));

  // Product mapping
  const subcatProductCounts = new Map();
  const subcatProducts = new Map();

  products.forEach(p => {
    const subIds = Array.isArray(p.subCategory) ? p.subCategory : [p.subCategory];
    subIds.forEach(subIdObj => {
      const subId = subIdObj?._id?.toString() || subIdObj?.toString();
      if (subId) {
        subcatProductCounts.set(subId, (subcatProductCounts.get(subId) || 0) + 1);
        if (!subcatProducts.has(subId)) subcatProducts.set(subId, []);
        subcatProducts.get(subId).push(p);
      }
    });
  });

  const cloudinarySubcats = subcategories.filter(s => isCloudinary(s.image));
  const base64Subcats = subcategories.filter(s => isBase64(s.image));
  const missingImgSubcats = subcategories.filter(s => !s.image || s.image.trim() === "");

  console.log("\n==================================================");
  console.log("1. CURRENT DATABASE BASELINE");
  console.log("==================================================");
  console.log(`Products:                 ${products.length} (Expected: 159)`);
  console.log(`Categories:               ${categories.length} (Expected: 20)`);
  console.log(`Subcategories:            ${subcategories.length} (Expected: 219)`);
  console.log(`  - Cloudinary-backed:    ${cloudinarySubcats.length} (Expected: 69)`);
  console.log(`  - Base64-backed:        ${base64Subcats.length} (Expected: 150)`);
  console.log(`  - Missing/Empty Images: ${missingImgSubcats.length} (Expected: 0)`);

  // Active product coverage
  let activeProductsWithCloudinarySubcat = 0;
  let activeProductsWithBase64Subcat = 0;

  products.forEach(p => {
    const subIds = Array.isArray(p.subCategory) ? p.subCategory : [p.subCategory];
    let hasCloudinary = false;
    subIds.forEach(subIdObj => {
      const subId = subIdObj?._id?.toString() || subIdObj?.toString();
      const subDoc = subCatMap.get(subId);
      if (subDoc && isCloudinary(subDoc.image)) {
        hasCloudinary = true;
      }
    });
    if (hasCloudinary) {
      activeProductsWithCloudinarySubcat++;
    } else {
      activeProductsWithBase64Subcat++;
    }
  });

  console.log("\n==================================================");
  console.log("ACTIVE PRODUCT COVERAGE");
  console.log("==================================================");
  console.log(`Total Active Products:             ${products.length}`);
  console.log(`Products under Cloudinary Subcat:  ${activeProductsWithCloudinarySubcat} (${((activeProductsWithCloudinarySubcat/products.length)*100).toFixed(1)}%)`);
  console.log(`Products under Base64 Subcat:      ${activeProductsWithBase64Subcat} (${((activeProductsWithBase64Subcat/products.length)*100).toFixed(1)}%)`);

  // Check Base64 subcats with active products
  console.log("\nBase64 Subcategories with Active Products:");
  base64Subcats.forEach(s => {
    const pCount = subcatProductCounts.get(s._id.toString()) || 0;
    if (pCount > 0) {
      const catName = (Array.isArray(s.category) && s.category.length > 0)
        ? catMap.get(s.category[0].toString()) || "Unknown"
        : catMap.get(s.category?.toString()) || "Unknown";
      console.log(`- [${catName}] "${s.name}" (ID: ${s._id}) -> ${pCount} active products: ${subcatProducts.get(s._id.toString()).map(p => p.name).join(", ")}`);
    }
  });

  // Verify batches 1-7
  const batchManifestFiles = [
    { name: "Batch 1", file: "batch-1-manifest.json", count: 14 },
    { name: "Batch 2", file: "subcategory-batch-2-approved-10-manifest.json", count: 10 },
    { name: "Batch 3", file: "subcategory-batch-3-approved-12-manifest.json", count: 12 },
    { name: "Batch 4", file: "subcategory-batch-4-approved-11-manifest.json", count: 11 },
    { name: "Batch 5", file: "subcategory-batch-5-approved-12-manifest.json", count: 12 },
    { name: "Batch 6", file: "subcategory-batch-6-approved-11-manifest.json", count: 11 },
    { name: "Batch 7", file: "subcategory-batch-7-approved-9-manifest.json", count: 9 },
  ];

  console.log("\n==================================================");
  console.log("2. VERIFY ALL PREVIOUS MIGRATIONS (BATCHES 1–7)");
  console.log("==================================================");
  let totalChecked = 0;
  let allPreviousIntact = true;

  const migratedIds = new Set();
  const migratedSourcePaths = new Set();

  for (const b of batchManifestFiles) {
    const mPath = path.resolve(ROOT_DIR, "image-manifest", b.file);
    if (fs.existsSync(mPath)) {
      const data = JSON.parse(fs.readFileSync(mPath, "utf-8"));
      const items = data.subcategories || [];
      let batchOk = true;
      for (const item of items) {
        const id = item.id || item.subCategoryId;
        migratedIds.add(id);
        const img = item.sourceImage || item.image;
        if (img) migratedSourcePaths.add(img);

        const doc = subCatMap.get(id);
        if (!doc || !isCloudinary(doc.image)) {
          batchOk = false;
          allPreviousIntact = false;
          console.error(`  ✖ Regression in ${b.name}: ${item.name} (${id}) is not Cloudinary!`);
        }
      }
      totalChecked += items.length;
      console.log(`- ${b.name} (${b.file}): ${items.length} records -> ${batchOk ? "100% INTACT (Cloudinary)" : "REGRESSION"}`);
    }
  }
  console.log(`Total Cloudinary records in DB: ${cloudinarySubcats.length} | All 69 verified intact: ${allPreviousIntact && cloudinarySubcats.length === 69 ? "YES" : "NO"}`);

  // Protected exclusions check
  console.log("\n==================================================");
  console.log("3. PROTECTED EXCLUSION VERIFICATION");
  console.log("==================================================");
  const [noodles, oral, protections] = await Promise.all([
    SubCategoryModel.findById("690e1792bb3427cd33190bd4").select("_id name image").lean(),
    SubCategoryModel.findById("690e24debb3427cd33190e2a").select("_id name image").lean(),
    SubCategoryModel.findById("690e2467bb3427cd33190e0e").select("_id name image").lean(),
  ]);

  console.log(`- Noodles (690e1792bb3427cd33190bd4): ${isBase64(noodles?.image) ? "BASE64 (INTACT)" : "VIOLATION"} | Active Products: ${subcatProductCounts.get("690e1792bb3427cd33190bd4") || 0} | Reason: Low-resolution source asset`);
  console.log(`- Oral Health & Eye Care (690e24debb3427cd33190e2a): ${isBase64(oral?.image) ? "BASE64 (INTACT)" : "VIOLATION"} | Active Products: ${subcatProductCounts.get("690e24debb3427cd33190e2a") || 0} | Reason: Dual-scope taxonomy ambiguity`);
  console.log(`- Protections (690e2467bb3427cd33190e0e): ${isBase64(protections?.image) ? "BASE64 (INTACT)" : "VIOLATION"} | Active Products: ${subcatProductCounts.get("690e2467bb3427cd33190e0e") || 0} | Reason: Sensitive personal care policy`);

  // Scan remaining local assets in incoming-catalog
  const incomingCatalogDir = path.resolve(ROOT_DIR, "image-manifest/incoming-catalog/subcategories");

  // Group remaining base64 subcategories by parent category
  const protectedIds = new Set([
    "690e1792bb3427cd33190bd4", // Noodles
    "690e24debb3427cd33190e2a", // Oral Health & Eye Care
    "690e2467bb3427cd33190e0e", // Protections
  ]);

  const classification = {
    READY: [],
    NEEDS_REVIEW: [],
    NEEDS_AUTHENTIC_IMAGE: [],
    NO_ACTIVE_PRODUCTS: [],
    EXCLUDED_PROTECTED: []
  };

  const remainingByDepartment = new Map();

  for (const s of base64Subcats) {
    const sId = s._id.toString();
    const pCount = subcatProductCounts.get(sId) || 0;
    const catName = (Array.isArray(s.category) && s.category.length > 0)
      ? catMap.get(s.category[0].toString()) || "Unknown"
      : catMap.get(s.category?.toString()) || "Unknown";

    if (protectedIds.has(sId)) {
      classification.EXCLUDED_PROTECTED.push({
        id: sId,
        name: s.name,
        category: catName,
        productCount: pCount,
        reason: sId === "690e1792bb3427cd33190bd4" ? "Low-resolution source asset" :
                sId === "690e24debb3427cd33190e2a" ? "Dual-scope taxonomy ambiguity (Oral Health vs Eye Care)" :
                "Sensitive personal care policy"
      });
      continue;
    }

    // Look for matching local asset
    const possiblePaths = [
      path.join(incomingCatalogDir, catName, `${s.name}.webp`),
      path.join(incomingCatalogDir, catName, `${s.name}.png`),
      path.join(incomingCatalogDir, catName, `${s.name}.jpg`),
      path.join(incomingCatalogDir, catName, `${s.name}.jpeg`),
      path.join(incomingCatalogDir, catName.replace(/&/g, ","), `${s.name}.webp`),
      path.join(incomingCatalogDir, `${s.name}.webp`),
    ];

    let matchedFile = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        matchedFile = p;
        break;
      }
    }

    if (!matchedFile) {
      // Check if this is one of the known minor naming discrepancies
      if (s.name === "Wound , Care & Pain Relief") {
        const alt = path.join(incomingCatalogDir, "Pharma & Wellness/Wound Care And Pain Relief.webp");
        if (fs.existsSync(alt)) matchedFile = alt;
      } else if (s.name === "Protein & Sports supplements") {
        const alt = path.join(incomingCatalogDir, "Pharma & Wellness/Proten & Sports supplements.webp");
        if (fs.existsSync(alt)) matchedFile = alt;
      }
    }

    let assetDetails = null;
    if (matchedFile) {
      const buf = fs.readFileSync(matchedFile);
      const ext = path.extname(matchedFile).toLowerCase();
      const dims = getImageDimensions(buf, ext);
      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      assetDetails = {
        path: path.relative(path.resolve(ROOT_DIR, "image-manifest"), matchedFile),
        format: ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : "image/jpeg",
        dimensions: dims,
        size: buf.length,
        sha256: hash
      };
    }

    const itemRecord = {
      id: sId,
      name: s.name,
      category: catName,
      productCount: pCount,
      hasSourceAsset: !!matchedFile,
      assetDetails
    };

    if (!remainingByDepartment.has(catName)) {
      remainingByDepartment.set(catName, []);
    }
    remainingByDepartment.get(catName).push(itemRecord);

    if (pCount > 0) {
      // Should never reach here for non-excluded, as all non-excluded product-backed are migrated
      classification.READY.push(itemRecord);
    } else {
      if (matchedFile) {
        classification.NO_ACTIVE_PRODUCTS.push(itemRecord);
      } else {
        classification.NEEDS_AUTHENTIC_IMAGE.push({
          id: sId,
          name: s.name,
          category: catName,
          reason: "Zero active products and source asset not found under standard path."
        });
      }
    }
  }

  console.log("\n==================================================");
  console.log("4. CLASSIFICATION OF ALL 150 REMAINING BASE64 RECORDS");
  console.log("==================================================");
  console.log(`READY (Active Product-Backed):    ${classification.READY.length}`);
  console.log(`NO_ACTIVE_PRODUCTS (Taxonomy):    ${classification.NO_ACTIVE_PRODUCTS.length}`);
  console.log(`NEEDS_AUTHENTIC_IMAGE:            ${classification.NEEDS_AUTHENTIC_IMAGE.length}`);
  console.log(`NEEDS_REVIEW:                     ${classification.NEEDS_REVIEW.length}`);
  console.log(`EXCLUDED_PROTECTED:               ${classification.EXCLUDED_PROTECTED.length}`);
  console.log(`Total Classified:                 ${classification.READY.length + classification.NO_ACTIVE_PRODUCTS.length + classification.NEEDS_AUTHENTIC_IMAGE.length + classification.NEEDS_REVIEW.length + classification.EXCLUDED_PROTECTED.length}`);

  console.log("\n==================================================");
  console.log("REMAINING DEPARTMENTS AND ASSET READINESS");
  console.log("==================================================");
  const deptList = Array.from(remainingByDepartment.entries()).sort((a, b) => b[1].length - a[1].length);
  for (const [dept, items] of deptList) {
    const withAssets = items.filter(i => i.hasSourceAsset).length;
    console.log(`- Department: "${dept}" -> ${items.length} subcategories (${withAssets}/${items.length} with verified assets)`);
  }

  await mongoose.disconnect();
}

runAudit().catch(console.error);
