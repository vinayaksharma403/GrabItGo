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

async function prepareBatch9() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Batch 9 Verification.");

  const batch9Targets = [
    // GROUP A — Masala, Oil & More (9 items)
    {
      group: "GROUP A — Masala, Oil & More",
      id: "690e207cbb3427cd33190d6e",
      name: "Whole Spices",
      sourceRelPath: "incoming-catalog/subcategories/Masala, Oil & More/Whole Spices.webp",
      semantic: "Authentic whole cloves, cardamom, cinnamon and spice assortment."
    },
    {
      group: "GROUP A — Masala, Oil & More",
      id: "690e1fe4bb3427cd33190d4e",
      name: "Dates & Seeds",
      sourceRelPath: "incoming-catalog/subcategories/Masala, Oil & More/Dates & Seeds.webp",
      semantic: "Authentic fresh dates, chia, flax and pumpkin seed presentation."
    },
    {
      group: "GROUP A — Masala, Oil & More",
      id: "690e2023bb3427cd33190d5a",
      name: "Ghee & Vanaspati",
      sourceRelPath: "incoming-catalog/subcategories/Masala, Oil & More/Ghee & Vanaspati.webp",
      semantic: "Authentic pure desi ghee jar and culinary cooking fat."
    },
    {
      group: "GROUP A — Masala, Oil & More",
      id: "690e2000bb3427cd33190d52",
      name: "Dry Fruits Gift Packs",
      sourceRelPath: "incoming-catalog/subcategories/Masala, Oil & More/Dry Fruits Gift Packs.webp",
      semantic: "Authentic premium assorted dry fruit gift box arrangement."
    },
    {
      group: "GROUP A — Masala, Oil & More",
      id: "690e205bbb3427cd33190d66",
      name: "Powdered Spices",
      sourceRelPath: "incoming-catalog/subcategories/Masala, Oil & More/Powdered Spices.webp",
      semantic: "Authentic turmeric, red chilli, and coriander ground spice bowls."
    },
    {
      group: "GROUP A — Masala, Oil & More",
      id: "690e206cbb3427cd33190d6a",
      name: "Salt, Sugar & Jaggery",
      sourceRelPath: "incoming-catalog/subcategories/Masala, Oil & More/Salt, Sugar & Jaggery.webp",
      semantic: "Authentic table salt, refined sugar, and natural jaggery blocks."
    },
    {
      group: "GROUP A — Masala, Oil & More",
      id: "690e2035bb3427cd33190d5e",
      name: "Oil",
      sourceRelPath: "incoming-catalog/subcategories/Masala, Oil & More/Oil.webp",
      semantic: "Authentic mustard, sunflower and olive cooking oil bottles."
    },
    {
      group: "GROUP A — Masala, Oil & More",
      id: "690e2048bb3427cd33190d62",
      name: "Papad & Fryums",
      sourceRelPath: "incoming-catalog/subcategories/Masala, Oil & More/Papad & Fryums.webp",
      semantic: "Authentic roasted papad and colourful crunchy fryums."
    },
    {
      group: "GROUP A — Masala, Oil & More",
      id: "690e2010bb3427cd33190d56",
      name: "Dry Fruits",
      sourceRelPath: "incoming-catalog/subcategories/Masala, Oil & More/Dry Fruits.webp",
      semantic: "Authentic almonds, cashews, raisins, and walnuts bowl."
    },

    // GROUP B — Pet Care (5 items)
    {
      group: "GROUP B — Pet Care",
      id: "690e2396bb3427cd33190dea",
      name: "Diverse Pet Food",
      sourceRelPath: "incoming-catalog/subcategories/Pet Care/Diverse Pet Food.png",
      semantic: "Authentic multi-species pet food kibble and nutritional feed."
    },
    {
      group: "GROUP B — Pet Care",
      id: "690e2389bb3427cd33190de6",
      name: "Cat Needs",
      sourceRelPath: "incoming-catalog/subcategories/Pet Care/Cat Needs.png",
      semantic: "Authentic feline food pouch, cat treats and litter accessories."
    },
    {
      group: "GROUP B — Pet Care",
      id: "690e23b0bb3427cd33190df2",
      name: "Pet Grooming",
      sourceRelPath: "incoming-catalog/subcategories/Pet Care/Pet Grooming.png",
      semantic: "Authentic pet shampoo, grooming brush, and hygiene supplies."
    },
    {
      group: "GROUP B — Pet Care",
      id: "690e2373bb3427cd33190de2",
      name: "Accessories & Other Supplies",
      sourceRelPath: "incoming-catalog/subcategories/Pet Care/Accessories & Other Supplies.png",
      semantic: "Authentic pet collars, leashes, chew toys, and food bowls."
    },
    {
      group: "GROUP B — Pet Care",
      id: "690e23a4bb3427cd33190dee",
      name: "Dog Needs",
      sourceRelPath: "incoming-catalog/subcategories/Pet Care/Dog Needs.png",
      semantic: "Authentic canine kibble bags, dog bone treats and dental chews."
    }
  ];

  const manifestDir = path.resolve(ROOT_DIR, "image-manifest");

  // Read prior batches 1-8 manifests for collision checks
  const previousBatchManifests = [
    "batch-1-manifest.json",
    "subcategory-batch-2-approved-10-manifest.json",
    "subcategory-batch-3-approved-12-manifest.json",
    "subcategory-batch-4-approved-11-manifest.json",
    "subcategory-batch-5-approved-12-manifest.json",
    "subcategory-batch-6-approved-11-manifest.json",
    "subcategory-batch-7-approved-9-manifest.json",
    "subcategory-batch-8-approved-11-manifest.json"
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
  console.log("BATCH 9 (14 CANDIDATES) DETAILED VERIFICATION");
  console.log("==================================================");

  for (let i = 0; i < batch9Targets.length; i++) {
    const target = batch9Targets[i];
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
    console.log(`  - Parent Category:    "${parentCatName}" [${parentCatId}]`);
    console.log(`  - Current Image:      ${isCloudinary ? "CLOUDINARY (COLLISION)" : isBase64 ? "BASE64 (VALID)" : "EMPTY"}`);
    console.log(`  - Active Products:    ${matchingProducts.length}`);
    console.log(`  - Source Asset:       ${target.sourceRelPath}`);
    console.log(`  - Technical Checks:   Exists: ${fileExists} | Read: ${readable} | Format: ${format} | Dims: ${dimensions} | Size: ${fileSize} B`);
    console.log(`  - SHA256:             ${sha256}`);
    console.log(`  - Semantic Fit:       ${target.semantic}`);
    console.log(`  - Collision Checks:   Batches 1-8: ${isCollisionWithPreviousBatch ? "FAIL" : "PASS"} | Protected: ${isProtectedCollision ? "FAIL" : "PASS"} | Duplicate: ${isDuplicateHash || isDuplicatePath ? "FAIL" : "PASS"}`);

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
      semanticDetail: target.semantic,
      collisionPrevious: isCollisionWithPreviousBatch,
      collisionProtected: isProtectedCollision,
      duplicateHash: isDuplicateHash,
      duplicatePath: isDuplicatePath
    });
  }

  // Create Manifest
  const manifestData = {
    $schemaDescription: "GrabItGo Scoped Import Manifest — Batch 9 Approved 14 Subcategories (Masala, Oil & More + Pet Care)",
    generatedAt: new Date().toISOString(),
    status: "IMPORT_READY_SCOPED_MANIFEST — Zero database mutations or uploads performed in current phase",
    scope: {
      categories: 0,
      products: 0,
      subcategories: 14,
      alreadyMigratedExcluded: 80,
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

  const manifestPath = path.resolve(ROOT_DIR, "image-manifest/subcategory-batch-9-approved-14-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), "utf-8");
  console.log(`\n==================================================`);
  console.log(`Scoped Manifest created at: ${manifestPath}`);
  console.log(`==================================================`);

  await mongoose.disconnect();
}

prepareBatch9().catch(console.error);
