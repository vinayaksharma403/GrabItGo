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

// Helper to extract image dimensions from PNG/WebP/JPEG headers
function getImageDimensions(buffer, ext) {
  try {
    if (ext === ".png") {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return `${width}x${height}`;
    } else if (ext === ".webp") {
      // VP8 / VP8L / VP8X header parsing
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

async function verifyBatch7() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Batch 7 Verification.");

  const batch7Targets = [
    { id: "690e2769bb3427cd33190ea8", name: "Cakes & Rolls", file: "Cakes & Rolls.webp" },
    { id: "690e2776bb3427cd33190eac", name: "Candies & Gum", file: "Candies & Gum.webp" },
    { id: "690e2782bb3427cd33190eb0", name: "Chocolates", file: "Chocolates.png" },
    { id: "690e2794bb3427cd33190eb4", name: "Energy Bars", file: "Energy Bars.png" },
    { id: "690e27a3bb3427cd33190eb8", name: "Flavoured Yougurts", file: "Flavoured Yougurts.webp" },
    { id: "690e27b1bb3427cd33190ebc", name: "Ice Cream & Frozen Dessert", file: "Ice Cream & Frozen Dessert.webp" },
    { id: "690e27bdbb3427cd33190ec0", name: "Indian Sweets", file: "Indian Sweets.webp" },
    { id: "690e27cdbb3427cd33190ec4", name: "Mouth Fresheners", file: "Mouth Fresheners.webp" },
    { id: "690e27e1bb3427cd33190ec8", name: "Syrups", file: "Syrups.webp" },
  ];

  const subcatDir = path.resolve(ROOT_DIR, "image-manifest/incoming-catalog/subcategories/Sweet Tooth");

  // Read all existing manifest files to check for collisions
  const manifestDir = path.resolve(ROOT_DIR, "image-manifest");
  const manifestFiles = fs.readdirSync(manifestDir).filter(f => f.includes("manifest") && f.endsWith(".json"));
  const previousMigratedIds = new Set();
  const previousMigratedAssets = new Set();

  for (const mf of manifestFiles) {
    if (mf.includes("template")) continue;
    const content = JSON.parse(fs.readFileSync(path.join(manifestDir, mf), "utf-8"));
    (content.subcategories || []).forEach(s => {
      const id = s.id || s.subCategoryId;
      if (id) previousMigratedIds.add(id);
      const img = s.sourceImage || s.image;
      if (img) previousMigratedAssets.add(img);
    });
  }

  const protectedIds = new Set([
    "690e1792bb3427cd33190bd4", // Noodles
    "690e24debb3427cd33190e2a", // Oral Health & Eye Care
    "690e2467bb3427cd33190e0e", // Protections
  ]);

  const categories = await CategoryModel.find({}).lean();
  const catMap = new Map();
  categories.forEach(c => catMap.set(c._id.toString(), c.name));

  const allProducts = await ProductModel.find({}).select("_id name category subCategory").lean();

  const results = [];
  const hashes = new Set();

  console.log("\n==================================================");
  console.log("EXACT 9-TARGET DETAILED VERIFICATION");
  console.log("==================================================");

  for (let i = 0; i < batch7Targets.length; i++) {
    const target = batch7Targets[i];
    const doc = await SubCategoryModel.findById(target.id).lean();

    // 1. DB existence & state
    const exists = !!doc;
    const isCloudinary = doc?.image && doc.image.includes("cloudinary.com");
    const isBase64 = doc?.image && !doc.image.includes("cloudinary.com");

    // Parent category
    let parentCatName = "Unknown";
    let parentCatId = null;
    if (doc?.category) {
      if (Array.isArray(doc.category) && doc.category.length > 0) {
        parentCatId = doc.category[0].toString();
        parentCatName = catMap.get(parentCatId) || "Unknown";
      } else {
        parentCatId = doc.category.toString();
        parentCatName = catMap.get(parentCatId) || "Unknown";
      }
    }

    // Active product count
    const matchingProducts = allProducts.filter(p => {
      const sIds = Array.isArray(p.subCategory) ? p.subCategory : [p.subCategory];
      return sIds.some(sid => (sid?._id?.toString() || sid?.toString()) === target.id);
    });

    // 2. Source file verification
    const filePath = path.join(subcatDir, target.file);
    const fileExists = fs.existsSync(filePath);
    let fileSize = 0;
    let sha256 = "N/A";
    let dimensions = "N/A";
    let ext = path.extname(target.file).toLowerCase();
    let format = ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : "image/jpeg";
    let readable = false;

    if (fileExists) {
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
        readable = true;
        const buf = fs.readFileSync(filePath);
        fileSize = buf.length;
        sha256 = crypto.createHash("sha256").update(buf).digest("hex");
        dimensions = getImageDimensions(buf, ext);
      } catch (err) {
        readable = false;
      }
    }

    // Check collisions
    const isCollisionWithPreviousBatch = previousMigratedIds.has(target.id);
    const isProtectedCollision = protectedIds.has(target.id);
    const isDuplicateHashInBatch = hashes.has(sha256);
    if (sha256 !== "N/A") hashes.add(sha256);

    const relSourcePath = `incoming-catalog/subcategories/Sweet Tooth/${target.file}`;

    console.log(`\nTarget #${i + 1}: "${target.name}"`);
    console.log(`  - MongoDB ID:          ${target.id}`);
    console.log(`  - Exists in MongoDB:   ${exists ? "YES" : "NO"}`);
    console.log(`  - DB Name Match:       ${doc?.name === target.name ? "EXACT (" + doc?.name + ")" : "MISMATCH"}`);
    console.log(`  - Parent Category:     "${parentCatName}" [${parentCatId}]`);
    console.log(`  - Current Image State: ${isCloudinary ? "CLOUDINARY (COLLISION)" : isBase64 ? "BASE64 (VALID)" : "EMPTY"}`);
    console.log(`  - Active Products:     ${matchingProducts.length}`);
    console.log(`  - Source Asset:        ${relSourcePath}`);
    console.log(`  - File Exists & Read:  ${fileExists && readable ? "PASS" : "FAIL"}`);
    console.log(`  - Format / MIME:       ${format}`);
    console.log(`  - Dimensions:          ${dimensions}`);
    console.log(`  - File Size:           ${fileSize} bytes`);
    console.log(`  - SHA256:              ${sha256}`);
    console.log(`  - Collision Check:     Batches 1-6: ${isCollisionWithPreviousBatch ? "COLLISION" : "NONE"} | Protected: ${isProtectedCollision ? "COLLISION" : "NONE"}`);

    results.push({
      targetNum: i + 1,
      id: target.id,
      name: target.name,
      dbName: doc?.name,
      parentCategoryName: parentCatName,
      parentCategoryId: parentCatId,
      currentImageState: isCloudinary ? "Cloudinary" : "Base64",
      activeProductCount: matchingProducts.length,
      sourceImagePath: relSourcePath,
      fileExists,
      readable,
      format,
      dimensions,
      fileSize,
      sha256,
      collisionPrevious: isCollisionWithPreviousBatch,
      collisionProtected: isProtectedCollision,
      duplicateHash: isDuplicateHashInBatch
    });
  }

  // Database Baseline
  const totalProducts = await ProductModel.countDocuments();
  const totalCategories = await CategoryModel.countDocuments();
  const allSubcats = await SubCategoryModel.find({}).select("_id image").lean();
  const totalSubcategories = allSubcats.length;
  const cloudSubcats = allSubcats.filter(s => s.image && s.image.includes("cloudinary.com")).length;
  const base64Subcats = allSubcats.filter(s => !s.image || !s.image.includes("cloudinary.com")).length;

  console.log("\n==================================================");
  console.log("DATABASE BASELINE CONFIRMATION");
  console.log("==================================================");
  console.log(`Products:      ${totalProducts} (Expected: 159)`);
  console.log(`Categories:    ${totalCategories} (Expected: 20)`);
  console.log(`Subcategories: ${totalSubcategories} (Expected: 219)`);
  console.log(`  - Cloudinary: ${cloudSubcats} (Expected: 60)`);
  console.log(`  - Base64:     ${base64Subcats} (Expected: 159)`);

  // Write audit json
  const auditPath = path.resolve(ROOT_DIR, "image-manifest/batch-7-source-audit.json");
  fs.writeFileSync(auditPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    batchName: "Batch 7 — Sweet Tooth",
    scope: {
      categories: 0,
      products: 0,
      subcategories: 9
    },
    targets: results,
    baseline: {
      products: totalProducts,
      categories: totalCategories,
      subcategories: totalSubcategories,
      cloudinary: cloudSubcats,
      base64: base64Subcats
    }
  }, null, 2), "utf-8");

  console.log(`\nAudit saved to: ${auditPath}`);

  await mongoose.disconnect();
}

verifyBatch7().catch(console.error);
