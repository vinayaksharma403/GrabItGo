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

async function auditRemaining() {
  await mongoose.connect(process.env.MONGODB_URI);

  const [products, categories, subcategories] = await Promise.all([
    ProductModel.find({}).select("_id name category subCategory").lean(),
    CategoryModel.find({}).select("_id name").lean(),
    SubCategoryModel.find({}).select("_id name category image").lean(),
  ]);

  const isCloudinary = (img) => typeof img === "string" && img.includes("cloudinary.com");
  const isBase64 = (img) => typeof img === "string" && !img.includes("cloudinary.com");

  const catMap = new Map();
  categories.forEach(c => catMap.set(c._id.toString(), c.name));

  const subCatMap = new Map();
  subcategories.forEach(s => subCatMap.set(s._id.toString(), s));

  // Product counts
  const subcatProductCounts = new Map();
  products.forEach(p => {
    const subIds = Array.isArray(p.subCategory) ? p.subCategory : [p.subCategory];
    subIds.forEach(subIdObj => {
      const subId = subIdObj?._id?.toString() || subIdObj?.toString();
      if (subId) {
        subcatProductCounts.set(subId, (subcatProductCounts.get(subId) || 0) + 1);
      }
    });
  });

  const cloudinarySubcats = subcategories.filter(s => isCloudinary(s.image));
  const base64Subcats = subcategories.filter(s => isBase64(s.image));

  console.log("=== CURRENT DATABASE BASELINE ===");
  console.log(`Products:      ${products.length}`);
  console.log(`Categories:    ${categories.length}`);
  console.log(`Subcategories: ${subcategories.length}`);
  console.log(`  - Cloudinary-backed: ${cloudinarySubcats.length}`);
  console.log(`  - Base64-backed:     ${base64Subcats.length}`);

  const incomingCatalogDir = path.resolve(ROOT_DIR, "image-manifest/incoming-catalog/subcategories");

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

  const byDepartment = new Map();

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
                sId === "690e24debb3427cd33190e2a" ? "Dual-scope taxonomy ambiguity" :
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

    if (!byDepartment.has(catName)) {
      byDepartment.set(catName, []);
    }
    byDepartment.get(catName).push(itemRecord);

    if (pCount > 0) {
      classification.READY.push(itemRecord);
    } else {
      if (matchedFile) {
        classification.NO_ACTIVE_PRODUCTS.push(itemRecord);
      } else {
        classification.NEEDS_AUTHENTIC_IMAGE.push({
          id: sId,
          name: s.name,
          category: catName,
          reason: "Zero active products and source asset not found on disk."
        });
      }
    }
  }

  console.log("\n=== REMAINING CLASSIFICATION (139 Base64 records) ===");
  console.log(`READY (Active Product-Backed):    ${classification.READY.length}`);
  console.log(`NO_ACTIVE_PRODUCTS (Taxonomy):    ${classification.NO_ACTIVE_PRODUCTS.length}`);
  console.log(`NEEDS_AUTHENTIC_IMAGE:            ${classification.NEEDS_AUTHENTIC_IMAGE.length}`);
  console.log(`NEEDS_REVIEW:                     ${classification.NEEDS_REVIEW.length}`);
  console.log(`EXCLUDED_PROTECTED:               ${classification.EXCLUDED_PROTECTED.length}`);
  console.log(`Total:                            ${classification.READY.length + classification.NO_ACTIVE_PRODUCTS.length + classification.NEEDS_AUTHENTIC_IMAGE.length + classification.NEEDS_REVIEW.length + classification.EXCLUDED_PROTECTED.length}`);

  console.log("\n=== REMAINING DEPARTMENTS ===");
  const depts = Array.from(byDepartment.entries()).sort((a, b) => b[1].length - a[1].length);
  for (const [dept, items] of depts) {
    const withAssets = items.filter(i => i.hasSourceAsset).length;
    console.log(`- "${dept}": ${items.length} subcategories (${withAssets} with verified assets)`);
  }

  await mongoose.disconnect();
}

auditRemaining().catch(console.error);
