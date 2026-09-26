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
import SubCategoryModel from "../../models/subCategory.model.js";
import CategoryModel from "../../models/category.model.js";

async function analyzeZeroProductSubcats() {
  await mongoose.connect(process.env.MONGODB_URI);
  const categories = await CategoryModel.find({}).lean();
  const subcategories = await SubCategoryModel.find({}).lean();

  const catMap = new Map();
  categories.forEach(c => catMap.set(c._id.toString(), c.name));

  const incomingCatalogDir = path.resolve(ROOT_DIR, "image-manifest/incoming-catalog/subcategories");

  // Group base64 zero-product subcategories by parent category
  const groupedByCat = new Map();
  const isCloudinary = (img) => typeof img === "string" && img.includes("cloudinary.com");

  const base64Subcats = subcategories.filter(s => !isCloudinary(s.image));

  const protectedIds = new Set([
    "690e1792bb3427cd33190bd4", // Noodles
    "690e24debb3427cd33190e2a", // Oral Health & Eye Care
    "690e2467bb3427cd33190e0e", // Protections
  ]);

  for (const s of base64Subcats) {
    if (protectedIds.has(s._id.toString())) continue;
    const catName = (Array.isArray(s.category) && s.category.length > 0)
      ? catMap.get(s.category[0].toString()) || "Unknown"
      : catMap.get(s.category?.toString()) || "Unknown";

    if (!groupedByCat.has(catName)) {
      groupedByCat.set(catName, []);
    }

    // Check if asset exists
    const possiblePaths = [
      path.join(incomingCatalogDir, catName, `${s.name}.webp`),
      path.join(incomingCatalogDir, catName, `${s.name}.png`),
      path.join(incomingCatalogDir, catName, `${s.name}.jpg`),
      path.join(incomingCatalogDir, catName, `${s.name}.jpeg`),
      path.join(incomingCatalogDir, catName.replace(/&/g, ","), `${s.name}.webp`),
      path.join(incomingCatalogDir, `${s.name}.webp`),
    ];
    let matched = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        matched = p;
        break;
      }
    }

    groupedByCat.get(catName).push({
      id: s._id.toString(),
      name: s.name,
      hasAsset: !!matched,
      assetPath: matched ? path.relative(ROOT_DIR, matched) : null,
      size: matched ? fs.statSync(matched).size : 0
    });
  }

  console.log("=== Base64 Zero-Product Subcategories by Department ===");
  const sortedCats = Array.from(groupedByCat.entries()).sort((a, b) => b[1].length - a[1].length);
  for (const [catName, items] of sortedCats) {
    const withAssets = items.filter(i => i.hasAsset).length;
    console.log(`\nCategory: "${catName}" (${items.length} subcategories, ${withAssets} with verified assets):`);
    items.forEach(i => {
      console.log(`  - ${i.name} [${i.id}] -> ${i.hasAsset ? "Asset: " + i.assetPath + " (" + i.size + " bytes)" : "NO ASSET"}`);
    });
  }

  await mongoose.disconnect();
}

analyzeZeroProductSubcats().catch(console.error);
