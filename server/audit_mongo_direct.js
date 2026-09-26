import dotenv from "dotenv";
dotenv.config();
import { MongoClient } from "mongodb";

async function fastAudit() {
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB directly via MongoClient");

    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log("Available Collections:", collections.map(c => c.name));

    // Determine collection names
    const prodCollName = collections.find(c => c.name.toLowerCase().includes("product"))?.name || "products";
    const catCollName = collections.find(c => c.name.toLowerCase().includes("categor") && !c.name.toLowerCase().includes("sub"))?.name || "categories";
    const subCollName = collections.find(c => c.name.toLowerCase().includes("sub"))?.name || "subcategories";

    const products = await db.collection(prodCollName).find({}).toArray();
    const categories = await db.collection(catCollName).find({}).toArray();
    const subcategories = await db.collection(subCollName).find({}).toArray();

    console.log("\n==============================");
    console.log("1. PRODUCTS AUDIT");
    console.log("==============================");
    console.log("Total Products in DB:", products.length);

    let prodWithValidArray = 0;
    let prodEmptyOrMissing = 0;
    let prodBase64Count = 0;
    let prodCloudinaryCount = 0;
    let prodMultipleImages = 0;
    let prodSingleImage = 0;
    let prodBrokenOrUnknown = 0;
    let prodOtherUrl = 0;

    const prodDetails = [];

    products.forEach((p, i) => {
      const imgs = p.image || [];
      const isArr = Array.isArray(imgs);
      const len = isArr ? imgs.length : 0;
      let types = [];

      if (!isArr || len === 0) {
        prodEmptyOrMissing++;
      } else {
        prodWithValidArray++;
        if (len === 1) prodSingleImage++;
        if (len > 1) prodMultipleImages++;

        imgs.forEach(img => {
          if (!img || typeof img !== "string" || img.trim() === "") {
            prodBrokenOrUnknown++;
            types.push("BROKEN_EMPTY");
          } else if (img.startsWith("data:image")) {
            prodBase64Count++;
            types.push("BASE64");
          } else if (img.includes("cloudinary.com") || img.includes("res.cloudinary.com")) {
            prodCloudinaryCount++;
            types.push("CLOUDINARY");
          } else if (img.startsWith("http://") || img.startsWith("https://")) {
            prodOtherUrl++;
            types.push("OTHER_URL");
          } else {
            prodBrokenOrUnknown++;
            types.push("INVALID_STRING");
          }
        });
      }

      prodDetails.push({
        name: p.name,
        imageCount: len,
        types,
        images: imgs
      });
    });

    console.log("Products Summary:", {
      totalProducts: products.length,
      productsWithValidArray: prodWithValidArray,
      productsWithoutImages: prodEmptyOrMissing,
      productsWithSingleImage: prodSingleImage,
      productsWithMultipleImages: prodMultipleImages,
      totalCloudinaryImages: prodCloudinaryCount,
      totalBase64Images: prodBase64Count,
      totalOtherUrls: prodOtherUrl,
      totalBrokenOrInvalid: prodBrokenOrUnknown
    });

    console.log("\nProducts Detail Table:");
    prodDetails.forEach((p, i) => {
      console.log(`${i + 1}. [${p.name}] — ${p.imageCount} img(s) (${p.types.join(", ") || "NO_IMAGES"})`);
      p.images.forEach((img, idx) => {
        console.log(`     img[${idx}]: ${img.substring(0, 80)}${img.length > 80 ? '...' : ''}`);
      });
    });

    console.log("\n==============================");
    console.log("2. CATEGORIES AUDIT");
    console.log("==============================");
    console.log("Total Categories in DB:", categories.length);
    let catValid = 0;
    let catMissing = 0;
    let catCloudinary = 0;
    let catBase64 = 0;
    let catOther = 0;

    const catDetails = categories.map((c, i) => {
      const img = c.image;
      let type = "UNKNOWN";
      if (!img || typeof img !== "string" || img.trim() === "") {
        catMissing++;
        type = "EMPTY_OR_MISSING";
      } else {
        catValid++;
        if (img.includes("cloudinary.com")) {
          catCloudinary++;
          type = "CLOUDINARY";
        } else if (img.startsWith("data:image")) {
          catBase64++;
          type = "BASE64";
        } else {
          catOther++;
          type = "OTHER";
        }
      }
      return { name: c.name, type, image: img };
    });

    console.log("Categories Summary:", {
      totalCategories: categories.length,
      categoriesWithValidImages: catValid,
      categoriesWithMissingImages: catMissing,
      cloudinaryImages: catCloudinary,
      base64Images: catBase64,
      otherImages: catOther
    });

    console.log("\nCategories Detail Table:");
    catDetails.forEach((c, i) => {
      console.log(`${i + 1}. [${c.name}] — [${c.type}] -> ${c.image ? c.image.substring(0, 80) + '...' : 'NONE'}`);
    });

    console.log("\n==============================");
    console.log("3. SUBCATEGORIES AUDIT");
    console.log("==============================");
    console.log("Total Subcategories in DB:", subcategories.length);
    let subValid = 0;
    let subMissing = 0;
    let subCloudinary = 0;
    let subBase64 = 0;
    let subOther = 0;

    const subDetails = subcategories.map((s, i) => {
      const img = s.image;
      let type = "UNKNOWN";
      if (!img || typeof img !== "string" || img.trim() === "") {
        subMissing++;
        type = "EMPTY_OR_MISSING";
      } else {
        subValid++;
        if (img.includes("cloudinary.com")) {
          subCloudinary++;
          type = "CLOUDINARY";
        } else if (img.startsWith("data:image")) {
          subBase64++;
          type = "BASE64";
        } else {
          subOther++;
          type = "OTHER";
        }
      }
      return { name: s.name, type, image: img };
    });

    console.log("Subcategories Summary:", {
      totalSubcategories: subcategories.length,
      subcategoriesWithValidImages: subValid,
      subcategoriesWithMissingImages: subMissing,
      cloudinaryImages: subCloudinary,
      base64Images: subBase64,
      otherImages: subOther
    });

    console.log("\nSubcategories Detail Table:");
    subDetails.forEach((s, i) => {
      console.log(`${i + 1}. [${s.name}] — [${s.type}] -> ${s.image ? s.image.substring(0, 80) + '...' : 'NONE'}`);
    });

  } catch (err) {
    console.error("Fast audit error:", err);
  } finally {
    await client.close();
    process.exit(0);
  }
}

fastAudit();
