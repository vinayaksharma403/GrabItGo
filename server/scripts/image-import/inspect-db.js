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

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  const manifestPath = path.resolve(ROOT_DIR, "image-manifest/subcategory-batch-6-approved-11-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  
  console.log("==================================================");
  console.log("Checking all 11 Batch 6 subcategories in DB:");
  console.log("==================================================");
  for (const s of manifest.subcategories) {
    const doc = await SubCategoryModel.findById(s.id).lean();
    const isCloud = doc?.image?.includes("cloudinary.com");
    console.log(`- ${s.name} (${s.id}):`);
    console.log(`  Cloudinary URL: ${doc?.image}`);
    console.log(`  Status: ${isCloud ? "CLOUDINARY_BACKED" : "BASE64_BACKED"}`);
  }
  
  // Use regex / substring aggregation to avoid downloading base64 strings
  const [totalProducts, totalCategories, totalSubcategories] = await Promise.all([
    ProductModel.countDocuments(),
    CategoryModel.countDocuments(),
    SubCategoryModel.countDocuments(),
  ]);
  
  const cloudinarySubcats = await SubCategoryModel.countDocuments({
    image: { $regex: "cloudinary\\.com" }
  });
  
  const base64Subcats = totalSubcategories - cloudinarySubcats;
  
  console.log(`\n==================================================`);
  console.log(`Overall Database Counts:`);
  console.log(`==================================================`);
  console.log(`Products:      ${totalProducts}`);
  console.log(`Categories:    ${totalCategories}`);
  console.log(`Subcategories: ${totalSubcategories}`);
  console.log(`  - Cloudinary: ${cloudinarySubcats}`);
  console.log(`  - Base64:     ${base64Subcats}`);
  
  // Check exclusions
  const [noodles, oral, protections] = await Promise.all([
    SubCategoryModel.findById("690e1792bb3427cd33190bd4").select("_id name image").lean(),
    SubCategoryModel.findById("690e24debb3427cd33190e2a").select("_id name image").lean(),
    SubCategoryModel.findById("690e2467bb3427cd33190e0e").select("_id name image").lean(),
  ]);
  
  console.log(`\n==================================================`);
  console.log(`Protected Exclusions Check:`);
  console.log(`==================================================`);
  console.log(`- Noodles (690e1792bb3427cd33190bd4): ${noodles?.image?.includes("cloudinary.com") ? "Cloudinary (VIOLATION)" : "Base64 (INTACT)"}`);
  console.log(`- Oral Health & Eye Care (690e24debb3427cd33190e2a): ${oral?.image?.includes("cloudinary.com") ? "Cloudinary (VIOLATION)" : "Base64 (INTACT)"}`);
  console.log(`- Protections (690e2467bb3427cd33190e0e): ${protections?.image?.includes("cloudinary.com") ? "Cloudinary (VIOLATION)" : "Base64 (INTACT)"}`);

  await mongoose.disconnect();
}

inspect().catch(console.error);
