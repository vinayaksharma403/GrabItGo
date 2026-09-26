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

async function verifyBatch8() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Batch 8 Verification.");

  const batch8Targets = [
    // Group A — Tea, Coffee & Health Drink
    {
      group: "GROUP A — Tea, Coffee & Health Drink",
      id: "690e27f5bb3427cd33190ecc",
      name: "Coffee",
      expectedCatId: "690a1db49dae4dbb7e20c114",
      expectedCatName: "Tea, Coffee & Health Drink",
      sourceRelPath: "incoming-catalog/subcategories/Tea, Coffee & Health Drink/Coffee.jpg",
      semanticDetail: "Authentic roasted coffee beans & instant coffee jar photography."
    },
    {
      group: "GROUP A — Tea, Coffee & Health Drink",
      id: "690e285fbb3427cd33190eec",
      name: "Tea",
      expectedCatId: "690a1db49dae4dbb7e20c114",
      expectedCatName: "Tea, Coffee & Health Drink",
      sourceRelPath: "incoming-catalog/subcategories/Tea, Coffee & Health Drink/Tea.webp",
      semanticDetail: "Authentic premium black/chai tea leaves & cup presentation."
    },
    {
      group: "GROUP A — Tea, Coffee & Health Drink",
      id: "690e2829bb3427cd33190edc",
      name: "Green & Flavoured Tea",
      expectedCatId: "690a1db49dae4dbb7e20c114",
      expectedCatName: "Tea, Coffee & Health Drink",
      sourceRelPath: "incoming-catalog/subcategories/Tea, Coffee & Health Drink/Green & Flavoured Tea.webp",
      semanticDetail: "Authentic fresh green tea leaves and herbal infusion teabags."
    },
    {
      group: "GROUP A — Tea, Coffee & Health Drink",
      id: "690e2834bb3427cd33190ee0",
      name: "Herbal Drinks",
      expectedCatId: "690a1db49dae4dbb7e20c114",
      expectedCatName: "Tea, Coffee & Health Drink",
      sourceRelPath: "incoming-catalog/subcategories/Tea, Coffee & Health Drink/Herbal Drinks.webp",
      semanticDetail: "Authentic botanical wellness beverage and herbal infusion shot."
    },
    {
      group: "GROUP A — Tea, Coffee & Health Drink",
      id: "690e2841bb3427cd33190ee4",
      name: "Hot Chocolate",
      expectedCatId: "690a1db49dae4dbb7e20c114",
      expectedCatName: "Tea, Coffee & Health Drink",
      sourceRelPath: "incoming-catalog/subcategories/Tea, Coffee & Health Drink/Hot Chocolate.webp",
      semanticDetail: "Authentic rich cocoa powder & hot chocolate mug presentation."
    },
    {
      group: "GROUP A — Tea, Coffee & Health Drink",
      id: "690e284fbb3427cd33190ee8",
      name: "Imported Tea & Coffee",
      expectedCatId: "690a1db49dae4dbb7e20c114",
      expectedCatName: "Tea, Coffee & Health Drink",
      sourceRelPath: "incoming-catalog/subcategories/Tea, Coffee & Health Drink/Imported Tea & Coffee.webp",
      semanticDetail: "Authentic premium global international coffee & specialty tea packs."
    },

    // Group B — Sauces & Spreads
    {
      group: "GROUP B — Sauces & Spreads",
      id: "690e2612bb3427cd33190e55",
      name: "Asian Sauces",
      expectedCatId: "690a1e169dae4dbb7e20c11f",
      expectedCatName: "Sauces & Spreads",
      sourceRelPath: "incoming-catalog/subcategories/Sauces & Spreads/Asian Sauces.webp",
      semanticDetail: "Authentic soy, chilli, and oriental stir-fry sauce bottles."
    },
    {
      group: "GROUP B — Sauces & Spreads",
      id: "690e264abb3427cd33190e65",
      name: "Tomato & Chilli Ketchup",
      expectedCatId: "690a1e169dae4dbb7e20c11f",
      expectedCatName: "Sauces & Spreads",
      sourceRelPath: "incoming-catalog/subcategories/Sauces & Spreads/Tomato & Chilli Ketchup.webp",
      semanticDetail: "Authentic red tomato ketchup and spicy chilli condiment bottles."
    },
    {
      group: "GROUP B — Sauces & Spreads",
      id: "690e262cbb3427cd33190e5d",
      name: "Indian Chutney & Pickle",
      expectedCatId: "690a1e169dae4dbb7e20c11f",
      expectedCatName: "Sauces & Spreads",
      sourceRelPath: "incoming-catalog/subcategories/Sauces & Spreads/Indian Chutney & Pickle.webp",
      semanticDetail: "Authentic traditional Indian achar (pickle) and spicy chutney jars."
    },
    {
      group: "GROUP B — Sauces & Spreads",
      id: "690e263bbb3427cd33190e61",
      name: "Jam & Spreads",
      expectedCatId: "690a1e169dae4dbb7e20c11f",
      expectedCatName: "Sauces & Spreads",
      sourceRelPath: "incoming-catalog/subcategories/Sauces & Spreads/Jam & Spreads.webp",
      semanticDetail: "Authentic mixed fruit jam, peanut butter, and sweet breakfast spreads."
    },
    {
      group: "GROUP B — Sauces & Spreads",
      id: "690e261ebb3427cd33190e59",
      name: "Cooking Sauces & Vinegar",
      expectedCatId: "690a1e169dae4dbb7e20c11f",
      expectedCatName: "Sauces & Spreads",
      sourceRelPath: "incoming-catalog/subcategories/Sauces & Spreads/Cooking Sauces & Vinegar.webp",
      semanticDetail: "Authentic culinary cooking sauces, white vinegar, and marinade glass bottles."
    }
  ];

  const manifestDir = path.resolve(ROOT_DIR, "image-manifest");

  // Read prior batches 1-7 manifests for collision check
  const previousBatchManifests = [
    "batch-1-manifest.json",
    "subcategory-batch-2-approved-10-manifest.json",
    "subcategory-batch-3-approved-12-manifest.json",
    "subcategory-batch-4-approved-11-manifest.json",
    "subcategory-batch-5-approved-12-manifest.json",
    "subcategory-batch-6-approved-11-manifest.json",
    "subcategory-batch-7-approved-9-manifest.json"
  ];

  const previousMigratedIds = new Set();
  const previousMigratedSourcePaths = new Set();

  for (const mf of previousBatchManifests) {
    const pPath = path.join(manifestDir, mf);
    if (fs.existsSync(pPath)) {
      const data = JSON.parse(fs.readFileSync(pPath, "utf-8"));
      (data.subcategories || []).forEach(s => {
        const id = s.id || s.subCategoryId;
        if (id) previousMigratedIds.add(id);
        const img = s.sourceImage || s.image;
        if (img) previousMigratedSourcePaths.add(img);
      });
    }
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
  const seenPaths = new Set();

  console.log("\n==================================================");
  console.log("EXACT 11-TARGET VERIFICATION FOR BATCH 8");
  console.log("==================================================");

  for (let i = 0; i < batch8Targets.length; i++) {
    const target = batch8Targets[i];
    const doc = await SubCategoryModel.findById(target.id).lean();

    const exists = !!doc;
    const isCloudinary = doc?.image && doc.image.includes("cloudinary.com");
    const isBase64 = doc?.image && !doc.image.includes("cloudinary.com");

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

    const matchingProducts = allProducts.filter(p => {
      const sIds = Array.isArray(p.subCategory) ? p.subCategory : [p.subCategory];
      return sIds.some(sid => (sid?._id?.toString() || sid?.toString()) === target.id);
    });

    const fullFilePath = path.resolve(manifestDir, target.sourceRelPath);
    const fileExists = fs.existsSync(fullFilePath);
    let fileSize = 0;
    let sha256 = "N/A";
    let dimensions = "N/A";
    let ext = path.extname(target.sourceRelPath).toLowerCase();
    let format = ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : "image/jpeg";
    let readable = false;

    if (fileExists) {
      try {
        fs.accessSync(fullFilePath, fs.constants.R_OK);
        readable = true;
        const buf = fs.readFileSync(fullFilePath);
        fileSize = buf.length;
        sha256 = crypto.createHash("sha256").update(buf).digest("hex");
        dimensions = getImageDimensions(buf, ext);
      } catch (err) {
        readable = false;
      }
    }

    const isCollisionWithPreviousBatch = previousMigratedIds.has(target.id);
    const isProtectedCollision = protectedIds.has(target.id);
    const isDuplicateHash = hashes.has(sha256);
    if (sha256 !== "N/A") hashes.add(sha256);

    const isDuplicatePath = seenPaths.has(target.sourceRelPath);
    seenPaths.add(target.sourceRelPath);

    console.log(`\nTarget #${i + 1} [${target.group}]: "${target.name}"`);
    console.log(`  - ID:                 ${target.id}`);
    console.log(`  - Exists in MongoDB:  ${exists ? "YES" : "NO"}`);
    console.log(`  - Parent Category:    "${parentCatName}" [${parentCatId}] (Expected: "${target.expectedCatName}") -> ${parentCatId === target.expectedCatId ? "MATCH" : "MISMATCH"}`);
    console.log(`  - Current Image:      ${isCloudinary ? "CLOUDINARY" : isBase64 ? "BASE64" : "EMPTY"}`);
    console.log(`  - Active Products:    ${matchingProducts.length}`);
    console.log(`  - Source Asset:       ${target.sourceRelPath}`);
    console.log(`  - Technical Checks:   Exists: ${fileExists} | Read: ${readable} | Format: ${format} | Dims: ${dimensions} | Size: ${fileSize} B`);
    console.log(`  - SHA256:             ${sha256}`);
    console.log(`  - Semantic Fit:       ${target.semanticDetail}`);
    console.log(`  - Collision Checks:   Batches 1-7: ${isCollisionWithPreviousBatch ? "FAIL" : "PASS"} | Protected: ${isProtectedCollision ? "FAIL" : "PASS"} | Duplicate: ${isDuplicateHash || isDuplicatePath ? "FAIL" : "PASS"}`);

    results.push({
      targetNum: i + 1,
      group: target.group,
      id: target.id,
      name: target.name,
      dbName: doc?.name,
      parentCategoryName: parentCatName,
      parentCategoryId: parentCatId,
      currentImageState: isCloudinary ? "Cloudinary" : "Base64",
      activeProductCount: matchingProducts.length,
      sourceImagePath: target.sourceRelPath,
      fileExists,
      readable,
      format,
      dimensions,
      fileSize,
      sha256,
      semanticDetail: target.semanticDetail,
      collisionPrevious: isCollisionWithPreviousBatch,
      collisionProtected: isProtectedCollision,
      duplicateHash: isDuplicateHash,
      duplicatePath: isDuplicatePath
    });
  }

  // Create Manifest
  const manifestData = {
    $schemaDescription: "GrabItGo Scoped Import Manifest — Batch 8 Approved 11 Subcategories (Pantry & Beverages)",
    generatedAt: new Date().toISOString(),
    status: "IMPORT_READY_SCOPED_MANIFEST — Zero database mutations or uploads performed in current phase",
    scope: {
      categories: 0,
      products: 0,
      subcategories: 11,
      alreadyMigratedExcluded: 69,
      flaggedRecordsExcluded: 3,
      protectionsExcluded: 1,
      lowResNoodlesExcluded: 1,
      dualScopeOralHealthEyeCareExcluded: 1
    },
    categories: [],
    products: [],
    subcategories: results.map(r => ({
      id: r.id,
      name: r.name,
      categoryId: r.parentCategoryId,
      categoryName: r.parentCategoryName,
      sourceImage: r.sourceImagePath,
      expectedFormat: r.format,
      expectedDimensions: r.dimensions,
      fileSize: r.fileSize,
      sha256: r.sha256,
      currentImageState: r.currentImageState
    }))
  };

  const manifestPath = path.resolve(ROOT_DIR, "image-manifest/subcategory-batch-8-approved-11-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), "utf-8");
  console.log(`\n==================================================`);
  console.log(`Scoped Manifest created at: ${manifestPath}`);
  console.log(`==================================================`);

  // Database baseline
  const [totalProducts, totalCategories, totalSubcategories] = await Promise.all([
    ProductModel.countDocuments(),
    CategoryModel.countDocuments(),
    SubCategoryModel.countDocuments(),
  ]);
  const cloudinarySubcats = await SubCategoryModel.countDocuments({
    image: { $regex: "cloudinary\\.com" }
  });
  const base64Subcats = totalSubcategories - cloudinarySubcats;

  console.log("\nDATABASE BASELINE CONFIRMATION:");
  console.log(`Products:      ${totalProducts} (159)`);
  console.log(`Categories:    ${totalCategories} (20)`);
  console.log(`Subcategories: ${totalSubcategories} (219)`);
  console.log(`  - Cloudinary: ${cloudinarySubcats} (69)`);
  console.log(`  - Base64:     ${base64Subcats} (150)`);

  await mongoose.disconnect();
}

verifyBatch8().catch(console.error);
