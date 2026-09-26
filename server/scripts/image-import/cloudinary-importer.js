import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

/**
 * Configure Cloudinary with environment variables
 */
export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
  });
}

/**
 * Upload a single local image buffer to Cloudinary
 */
export async function uploadLocalFileToCloudinary(filePath, folder = "GrabItGo/products") {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Local file does not exist: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result || !result.secure_url) {
          return reject(new Error("Cloudinary returned empty secure_url"));
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Process Product Import Atomically
 * - Uploads all images in the gallery first.
 * - If ALL succeed, updates MongoDB.
 * - If ANY fails, leaves MongoDB completely untouched.
 */
export async function importProductRecord(productItem, ProductModel, options = {}) {
  const { dryRun = true, log = console.log } = options;
  const productId = productItem.productId || productItem.id;
  const productName = productItem.productName || productItem.name;
  const images = productItem.images || (productItem.sourceImage ? [productItem.sourceImage] : productItem.sourceImages) || [];

  if (dryRun) {
    return {
      status: "DRY_RUN",
      productId,
      productName,
      imageCount: images.length,
      message: `[DRY RUN] Would upload ${images.length} images to GrabItGo/products and update MongoDB record ${productId}`,
    };
  }

  // 1. Fetch current DB record
  const currentDoc = await ProductModel.findById(productId);
  if (!currentDoc) {
    throw new Error(`Product ${productId} not found in database`);
  }

  const previousImages = [...(currentDoc.image || [])];
  const uploadedUrls = [];

  try {
    // 2. Upload all images sequentially to Cloudinary
    for (let i = 0; i < images.length; i++) {
      const imgInfo = images[i];
      const filePath = imgInfo.resolvedPath || imgInfo;
      log(`   Uploading image [${i + 1}/${images.length}] for "${productName}"...`);
      
      const uploadResult = await uploadLocalFileToCloudinary(filePath, "GrabItGo/products");
      uploadedUrls.push(uploadResult.secure_url);
    }

    // 3. Atomically update MongoDB record
    await ProductModel.updateOne(
      { _id: productId },
      { $set: { image: uploadedUrls } }
    );

    return {
      status: "SUCCESS",
      productId,
      productName,
      uploadedCount: uploadedUrls.length,
      newUrls: uploadedUrls,
      previousImageCount: previousImages.length,
    };
  } catch (err) {
    // Failure safety: DB was NOT modified because updateOne happens only after all uploads succeed
    return {
      status: "FAILED",
      productId,
      productName,
      error: err.message || err,
      dbUntouched: true,
      previousImageCount: previousImages.length,
    };
  }
}

/**
 * Process Category Import Atomically
 */
export async function importCategoryRecord(categoryItem, CategoryModel, options = {}) {
  const { dryRun = true, log = console.log } = options;
  const categoryId = categoryItem.categoryId || categoryItem.id;
  const categoryName = categoryItem.categoryName || categoryItem.name;
  const imgInfo = categoryItem.image || categoryItem.sourceImage;

  if (dryRun) {
    return {
      status: "DRY_RUN",
      categoryId,
      categoryName,
      message: `[DRY RUN] Would upload image to GrabItGo/categories and update MongoDB record ${categoryId}`,
    };
  }

  const currentDoc = await CategoryModel.findById(categoryId);
  if (!currentDoc) {
    throw new Error(`Category ${categoryId} not found in database`);
  }

  const previousImage = currentDoc.image;

  try {
    const filePath = imgInfo.resolvedPath || imgInfo;
    log(`   Uploading category image for "${categoryName}"...`);
    const uploadResult = await uploadLocalFileToCloudinary(filePath, "GrabItGo/categories");

    await CategoryModel.updateOne(
      { _id: categoryId },
      { $set: { image: uploadResult.secure_url } }
    );

    return {
      status: "SUCCESS",
      categoryId,
      categoryName,
      newUrl: uploadResult.secure_url,
      previousImage,
    };
  } catch (err) {
    return {
      status: "FAILED",
      categoryId,
      categoryName,
      error: err.message || err,
      dbUntouched: true,
      previousImage,
    };
  }
}

/**
 * Process Subcategory Import Atomically
 */
export async function importSubCategoryRecord(subCategoryItem, SubCategoryModel, options = {}) {
  const { dryRun = true, log = console.log } = options;
  const subCategoryId = subCategoryItem.subCategoryId || subCategoryItem.id;
  const subCategoryName = subCategoryItem.subCategoryName || subCategoryItem.name;
  const imgInfo = subCategoryItem.image || subCategoryItem.sourceImage;

  if (dryRun) {
    return {
      status: "DRY_RUN",
      subCategoryId,
      subCategoryName,
      message: `[DRY RUN] Would upload image to GrabItGo/subcategories and update MongoDB record ${subCategoryId}`,
    };
  }

  const currentDoc = await SubCategoryModel.findById(subCategoryId);
  if (!currentDoc) {
    throw new Error(`Subcategory ${subCategoryId} not found in database`);
  }

  const previousImage = currentDoc.image;

  try {
    const filePath = imgInfo.resolvedPath || imgInfo;
    log(`   Uploading subcategory image for "${subCategoryName}"...`);
    const uploadResult = await uploadLocalFileToCloudinary(filePath, "GrabItGo/subcategories");

    await SubCategoryModel.updateOne(
      { _id: subCategoryId },
      { $set: { image: uploadResult.secure_url } }
    );

    return {
      status: "SUCCESS",
      subCategoryId,
      subCategoryName,
      newUrl: uploadResult.secure_url,
      previousImage,
    };
  } catch (err) {
    return {
      status: "FAILED",
      subCategoryId,
      subCategoryName,
      error: err.message || err,
      dbUntouched: true,
      previousImage,
    };
  }
}
