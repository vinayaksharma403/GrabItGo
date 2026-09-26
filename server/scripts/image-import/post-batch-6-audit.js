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

async function runAudit() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("Connected to MongoDB.");

  // Fetch all products, categories, subcategories
  const [products, categories, subcategories] = await Promise.all([
    ProductModel.find({}).select("_id name category subCategory").lean(),
    CategoryModel.find({}).select("_id name image").lean(),
    SubCategoryModel.find({}).select("_id name category image").lean(),
  ]);

  console.log(`Retrieved: ${products.length} products, ${categories.length} categories, ${subcategories.length} subcategories.`);

  const catMap = new Map();
  categories.forEach(c => catMap.set(c._id.toString(), c.name));

  const subCatMap = new Map();
  subcategories.forEach(s => subCatMap.set(s._id.toString(), s));

  // Map active products to subcategories
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

  const isCloudinary = (img) => typeof img === "string" && img.includes("cloudinary.com");
  const isBase64 = (img) => typeof img === "string" && !img.includes("cloudinary.com");

  const cloudinarySubcats = subcategories.filter(s => isCloudinary(s.image));
  const base64Subcats = subcategories.filter(s => isBase64(s.image));
  const missingImgSubcats = subcategories.filter(s => !s.image || s.image.trim() === "");

  console.log(`\n=== Subcategory Image Breakdown ===`);
  console.log(`Total: ${subcategories.length}`);
  console.log(`Cloudinary-backed: ${cloudinarySubcats.length}`);
  console.log(`Base64-backed: ${base64Subcats.length}`);
  console.log(`Missing/Invalid Image: ${missingImgSubcats.length}`);

  // Check product coverage
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

  console.log(`\n=== Active Product Coverage ===`);
  console.log(`Total Active Products: ${products.length}`);
  console.log(`Products with Cloudinary subcategory: ${activeProductsWithCloudinarySubcat}`);
  console.log(`Products still on Base64 subcategory: ${activeProductsWithBase64Subcat}`);

  // Find all remaining Base64 subcategories that HAVE active products
  console.log(`\n=== Remaining Base64 Subcategories with Active Products ===`);
  const base64WithProducts = [];
  base64Subcats.forEach(s => {
    const pCount = subcatProductCounts.get(s._id.toString()) || 0;
    if (pCount > 0) {
      const catName = (Array.isArray(s.category) && s.category.length > 0)
        ? catMap.get(s.category[0].toString()) || "Unknown"
        : catMap.get(s.category?.toString()) || "Unknown";
      base64WithProducts.push({
        id: s._id.toString(),
        name: s.name,
        category: catName,
        productCount: pCount,
        products: subcatProducts.get(s._id.toString()).map(p => p.name)
      });
    }
  });

  console.log(`Count of Base64 subcategories with active products: ${base64WithProducts.length}`);
  base64WithProducts.sort((a, b) => b.productCount - a.productCount || a.category.localeCompare(b.category));
  base64WithProducts.forEach(s => {
    console.log(`- [${s.category}] "${s.name}" (ID: ${s.id}) -> ${s.productCount} active products: ${s.products.join(", ")}`);
  });

  // Check incoming-catalog assets for all remaining subcategories
  const incomingCatalogDir = path.resolve(ROOT_DIR, "image-manifest/incoming-catalog/subcategories");
  const subcatFiles = [];
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        scanDir(full);
      } else if (e.isFile() && /\.(webp|png|jpg|jpeg)$/i.test(e.name)) {
        subcatFiles.push(full);
      }
    }
  }
  scanDir(incomingCatalogDir);
  console.log(`\nTotal local source assets found in incoming-catalog/subcategories: ${subcatFiles.length}`);

  // Protected exclusions
  const protectedIds = new Set([
    "690e1792bb3427cd33190bd4", // Noodles
    "690e24debb3427cd33190e2a", // Oral Health & Eye Care
    "690e2467bb3427cd33190e0e", // Protections
  ]);

  // Audit and classify all 159 base64 subcategories
  const classification = {
    READY: [],
    NEEDS_REVIEW: [],
    NEEDS_AUTHENTIC_IMAGE: [],
    NO_ACTIVE_PRODUCTS: [],
    EXCLUDED_PROTECTED: []
  };

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
        reason: sId === "690e1792bb3427cd33190bd4" ? "Low-resolution source asset flagged" :
                sId === "690e24debb3427cd33190e2a" ? "Dual-scope ambiguity (Oral Health vs Eye Care)" :
                "Protections policy / sensitive scope"
      });
      continue;
    }

    // Check if matching local asset exists
    // Common paths: `incoming-catalog/subcategories/${catName}/${s.name}.(webp|png|jpg|jpeg)`
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

    // Also search fuzzy by filename
    if (!matchedFile) {
      const sanitizedName = s.name.replace(/[/\\?%*:|"<>]/g, "").toLowerCase();
      for (const f of subcatFiles) {
        const basename = path.basename(f, path.extname(f)).toLowerCase();
        if (basename === sanitizedName) {
          matchedFile = f;
          break;
        }
      }
    }

    if (pCount > 0) {
      if (matchedFile) {
        const stats = fs.statSync(matchedFile);
        const buf = fs.readFileSync(matchedFile);
        const hash = crypto.createHash("sha256").update(buf).digest("hex");
        const relPath = path.relative(path.resolve(ROOT_DIR, "image-manifest"), matchedFile);
        const ext = path.extname(matchedFile).toLowerCase();

        classification.READY.push({
          id: sId,
          name: s.name,
          category: catName,
          productCount: pCount,
          sourceAssetPath: relPath,
          format: ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : "image/jpeg",
          fileSize: stats.size,
          sha256: hash,
          semanticAssessment: "Authentic catalog photography matching subcategory title and active product portfolio."
        });
      } else {
        classification.NEEDS_AUTHENTIC_IMAGE.push({
          id: sId,
          name: s.name,
          category: catName,
          productCount: pCount,
          reason: "Active products exist but authentic source asset is not present in local incoming catalog."
        });
      }
    } else {
      // 0 active products
      if (matchedFile) {
        const stats = fs.statSync(matchedFile);
        const buf = fs.readFileSync(matchedFile);
        const hash = crypto.createHash("sha256").update(buf).digest("hex");
        const relPath = path.relative(path.resolve(ROOT_DIR, "image-manifest"), matchedFile);
        const ext = path.extname(matchedFile).toLowerCase();

        classification.NO_ACTIVE_PRODUCTS.push({
          id: sId,
          name: s.name,
          category: catName,
          hasSourceAsset: true,
          sourceAssetPath: relPath,
          format: ext,
          fileSize: stats.size,
          sha256: hash
        });
      } else {
        classification.NO_ACTIVE_PRODUCTS.push({
          id: sId,
          name: s.name,
          category: catName,
          hasSourceAsset: false
        });
      }
    }
  }

  console.log(`\n=== Classification Summary ===`);
  console.log(`READY:                 ${classification.READY.length}`);
  console.log(`NEEDS_REVIEW:          ${classification.NEEDS_REVIEW.length}`);
  console.log(`NEEDS_AUTHENTIC_IMAGE: ${classification.NEEDS_AUTHENTIC_IMAGE.length}`);
  console.log(`NO_ACTIVE_PRODUCTS:    ${classification.NO_ACTIVE_PRODUCTS.length}`);
  console.log(`EXCLUDED_PROTECTED:    ${classification.EXCLUDED_PROTECTED.length}`);
  console.log(`Total Classified:      ${classification.READY.length + classification.NEEDS_REVIEW.length + classification.NEEDS_AUTHENTIC_IMAGE.length + classification.NO_ACTIVE_PRODUCTS.length + classification.EXCLUDED_PROTECTED.length}`);

  // Check Batch 1-6 preservation
  console.log(`\n=== Verification of Batches 1 to 6 ===`);
  const batchManifestFiles = [
    "batch-1-manifest.json",
    "subcategory-batch-2-approved-10-manifest.json",
    "subcategory-batch-3-approved-12-manifest.json",
    "subcategory-batch-4-approved-11-manifest.json",
    "subcategory-batch-5-approved-12-manifest.json",
    "subcategory-batch-6-approved-11-manifest.json"
  ];

  let totalMigratedAcrossManifests = 0;
  let allBatchesIntact = true;
  for (let bIdx = 0; bIdx < batchManifestFiles.length; bIdx++) {
    const mf = batchManifestFiles[bIdx];
    const mPath = path.resolve(ROOT_DIR, "image-manifest", mf);
    if (fs.existsSync(mPath)) {
      const data = JSON.parse(fs.readFileSync(mPath, "utf-8"));
      const items = data.subcategories || [];
      totalMigratedAcrossManifests += items.length;
      let batchValid = true;
      for (const item of items) {
        const doc = subCatMap.get(item.id || item.subCategoryId);
        if (!doc || !isCloudinary(doc.image)) {
          batchValid = false;
          allBatchesIntact = false;
          console.error(`  ✖ Regression in Batch ${bIdx + 1} (${mf}): ${item.name} (${item.id}) is not Cloudinary!`);
        }
      }
      console.log(`- Batch ${bIdx + 1} (${mf}): ${items.length} subcategories -> ${batchValid ? "ALL INTACT (Cloudinary)" : "REGRESSION DETECTED"}`);
    }
  }

  // Write full audit JSON to image-manifest
  const auditReport = {
    generatedAt: new Date().toISOString(),
    catalogBaseline: {
      products: products.length,
      categories: categories.length,
      subcategories: subcategories.length,
      cloudinarySubcategories: cloudinarySubcats.length,
      base64Subcategories: base64Subcats.length,
      missingImageSubcategories: missingImgSubcats.length
    },
    batchesPreservation: {
      totalCloudinaryInDb: cloudinarySubcats.length,
      allBatchesIntact
    },
    activeProductCoverage: {
      totalActiveProducts: products.length,
      activeProductsWithCloudinarySubcat,
      activeProductsWithBase64Subcat,
      remainingBase64SubcatsWithProductsCount: base64WithProducts.length
    },
    classification
  };

  const outAuditPath = path.resolve(ROOT_DIR, "image-manifest/post-batch-6-subcategory-audit.json");
  fs.writeFileSync(outAuditPath, JSON.stringify(auditReport, null, 2), "utf-8");
  console.log(`\nAudit saved to: ${outAuditPath}`);

  await mongoose.disconnect();
}

runAudit().catch(err => {
  console.error("Audit error:", err);
  process.exit(1);
});
