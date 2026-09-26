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

async function inspectCandidateGroups() {
  await mongoose.connect(process.env.MONGODB_URI);
  const incomingCatalogDir = path.resolve(ROOT_DIR, "image-manifest/incoming-catalog/subcategories");

  // Let's inspect Pet Care & Sauces & Spreads (10 items total)
  // or Tea, Coffee & Health Drink (6 items) & Sauces & Spreads (5 items) = 11 items total
  const depts = ["Tea, Coffee & Health Drink", "Sauces & Spreads", "Pet Care", "Cleaning Essentials", "Masala, Oil & More"];

  for (const dept of depts) {
    const cat = await CategoryModel.findOne({ name: dept }).lean();
    if (!cat) continue;
    const subcats = await SubCategoryModel.find({ category: cat._id }).lean();
    const isCloudinary = (img) => typeof img === "string" && img.includes("cloudinary.com");
    const base64Subcats = subcats.filter(s => !isCloudinary(s.image));

    console.log(`\n==================================================`);
    console.log(`Department: "${dept}" (Category ID: ${cat._id})`);
    console.log(`Total subcats: ${subcats.length}, Base64 remaining: ${base64Subcats.length}`);
    console.log(`==================================================`);

    for (const s of base64Subcats) {
      const possiblePaths = [
        path.join(incomingCatalogDir, dept, `${s.name}.webp`),
        path.join(incomingCatalogDir, dept, `${s.name}.png`),
        path.join(incomingCatalogDir, dept, `${s.name}.jpg`),
        path.join(incomingCatalogDir, dept, `${s.name}.jpeg`),
      ];
      let matched = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          matched = p;
          break;
        }
      }

      if (matched) {
        const buf = fs.readFileSync(matched);
        const ext = path.extname(matched).toLowerCase();
        const dims = getImageDimensions(buf, ext);
        const hash = crypto.createHash("sha256").update(buf).digest("hex");
        console.log(`- "${s.name}" [${s._id}]:`);
        console.log(`  Source: ${path.relative(ROOT_DIR, matched)}`);
        console.log(`  Format: ${ext} | Dims: ${dims} | Size: ${buf.length} B | SHA: ${hash}`);
      } else {
        console.log(`- "${s.name}" [${s._id}]: NO ASSET FOUND`);
      }
    }
  }

  await mongoose.disconnect();
}

inspectCandidateGroups().catch(console.error);
