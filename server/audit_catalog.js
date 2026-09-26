import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import productModel from "./models/product.model.js";
import categoryModel from "./models/category.model.js";
import subCategoryModel from "./models/subCategory.model.js";

async function auditCatalog() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully");

    const products = await productModel.find({}).lean();
    const categories = await categoryModel.find({}).lean();
    const subCategories = await subCategoryModel.find({}).lean();

    console.log("\n==============================");
    console.log("1. PRODUCTS AUDIT");
    console.log("==============================");
    console.log("Total Products:", products.length);

    let prodWithValidArray = 0;
    let prodEmptyOrMissing = 0;
    let prodBase64Count = 0;
    let prodCloudinaryCount = 0;
    let prodMultipleImages = 0;
    let prodSingleImage = 0;
    let prodBrokenOrUnknown = 0;
    let prodOtherUrl = 0;

    const allProductList = [];

    products.forEach((p) => {
      const imgs = p.image || [];
      const isArr = Array.isArray(imgs);
      const len = isArr ? imgs.length : 0;
      
      let status = "ok";
      let imgTypes = [];

      if (!isArr || len === 0) {
        prodEmptyOrMissing++;
        status = "empty";
      } else {
        prodWithValidArray++;
        if (len > 1) prodMultipleImages++;
        if (len === 1) prodSingleImage++;

        imgs.forEach((img) => {
          if (!img || typeof img !== "string" || img.trim() === "") {
            prodBrokenOrUnknown++;
            imgTypes.push("broken_empty");
          } else if (img.startsWith("data:image")) {
            prodBase64Count++;
            imgTypes.push("base64");
          } else if (img.includes("cloudinary.com") || img.includes("res.cloudinary.com")) {
            prodCloudinaryCount++;
            imgTypes.push("cloudinary");
          } else if (img.startsWith("http://") || img.startsWith("https://")) {
            prodOtherUrl++;
            imgTypes.push("other_url");
          } else {
            prodBrokenOrUnknown++;
            imgTypes.push("invalid_string");
          }
        });
      }

      allProductList.push({
        id: p._id,
        name: p.name,
        imageCount: len,
        imgTypes,
        status,
        images: imgs
      });
    });

    console.log("Product Stats:", {
      totalProducts: products.length,
      prodWithValidArray,
      prodEmptyOrMissing,
      prodSingleImage,
      prodMultipleImages,
      prodCloudinaryImagesTotal: prodCloudinaryCount,
      prodBase64ImagesTotal: prodBase64Count,
      prodOtherUrlImagesTotal: prodOtherUrl,
      prodBrokenOrUnknownImagesTotal: prodBrokenOrUnknown
    });

    console.log("\nProducts Detail List:");
    allProductList.forEach(p => {
      console.log(`- [${p.id}] ${p.name}: ${p.imageCount} image(s) -> ${p.imgTypes.join(", ") || "NO_IMAGES"}`);
      if (p.images && p.images.length > 0) {
        p.images.forEach((img, i) => {
          console.log(`    img[${i}]: ${img.substring(0, 70)}${img.length > 70 ? '...' : ''}`);
        });
      }
    });

    console.log("\n==============================");
    console.log("2. CATEGORIES AUDIT");
    console.log("==============================");
    console.log("Total Categories:", categories.length);
    let catValid = 0;
    let catMissing = 0;
    let catCloudinary = 0;
    let catBase64 = 0;
    let catOther = 0;

    const catDetails = categories.map((c) => {
      const img = c.image;
      let type = "unknown";
      if (!img || typeof img !== "string" || img.trim() === "") {
        catMissing++;
        type = "empty_or_missing";
      } else {
        catValid++;
        if (img.includes("cloudinary.com")) {
          catCloudinary++;
          type = "cloudinary";
        } else if (img.startsWith("data:image")) {
          catBase64++;
          type = "base64";
        } else {
          catOther++;
          type = "other";
        }
      }
      return { id: c._id, name: c.name, type, image: img };
    });

    console.log("Category Stats:", {
      totalCategories: categories.length,
      catValid,
      catMissing,
      catCloudinary,
      catBase64,
      catOther
    });

    console.log("\nCategories Detail List:");
    catDetails.forEach(c => console.log(`- [${c.id}] ${c.name}: [${c.type}] -> ${c.image ? c.image.substring(0, 70) + "..." : "NONE"}`));

    console.log("\n==============================");
    console.log("3. SUBCATEGORIES AUDIT");
    console.log("==============================");
    console.log("Total Subcategories:", subCategories.length);
    let subValid = 0;
    let subMissing = 0;
    let subCloudinary = 0;
    let subBase64 = 0;
    let subOther = 0;

    const subDetails = subCategories.map((s) => {
      const img = s.image;
      let type = "unknown";
      if (!img || typeof img !== "string" || img.trim() === "") {
        subMissing++;
        type = "empty_or_missing";
      } else {
        subValid++;
        if (img.includes("cloudinary.com")) {
          subCloudinary++;
          type = "cloudinary";
        } else if (img.startsWith("data:image")) {
          subBase64++;
          type = "base64";
        } else {
          subOther++;
          type = "other";
        }
      }
      return { id: s._id, name: s.name, type, image: img };
    });

    console.log("Subcategory Stats:", {
      totalSubCategories: subCategories.length,
      subValid,
      subMissing,
      subCloudinary,
      subBase64,
      subOther
    });

    console.log("\nSubcategories Detail List:");
    subDetails.forEach(s => console.log(`- [${s.id}] ${s.name}: [${s.type}] -> ${s.image ? s.image.substring(0, 70) + "..." : "NONE"}`));

    await mongoose.disconnect();
    console.log("\n=== AUDIT FINISHED ===");
    process.exit(0);
  } catch (err) {
    console.error("Audit error:", err);
    process.exit(1);
  }
}

auditCatalog();
