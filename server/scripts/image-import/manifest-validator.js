import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Valid image extensions allowed for authentic catalog photography
export const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp"
]);

// Maximum file size: 10 MB per image asset
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Validates whether a string is a valid 24-character hexadecimal MongoDB ObjectId
 */
export function isValidObjectId(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validates an individual image file path on disk
 */
export function validateImageFile(filePath, basePath) {
  if (!filePath || typeof filePath !== "string") {
    return { valid: false, error: "Image path is missing or not a string" };
  }

  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(basePath, filePath);

  if (!fs.existsSync(resolvedPath)) {
    return { valid: false, error: `File not found at: ${resolvedPath}`, resolvedPath };
  }

  const stats = fs.statSync(resolvedPath);
  if (!stats.isFile()) {
    return { valid: false, error: `Path is not a regular file: ${resolvedPath}`, resolvedPath };
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Invalid file extension "${ext}". Allowed formats: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`,
      resolvedPath
    };
  }

  if (stats.size === 0) {
    return { valid: false, error: "File is empty (0 bytes)", resolvedPath };
  }

  if (stats.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds 10MB limit (${sizeMb} MB)`,
      resolvedPath
    };
  }

  return {
    valid: true,
    resolvedPath,
    extension: ext,
    sizeBytes: stats.size
  };
}

/**
 * Comprehensive validation of the entire manifest against local files and MongoDB
 */
export async function validateManifest(manifestData, basePath, dbModels = {}) {
  const results = {
    valid: true,
    summary: {
      totalProductsInManifest: 0,
      validProducts: 0,
      invalidProducts: 0,
      totalProductImages: 0,
      totalCategoriesInManifest: 0,
      validCategories: 0,
      invalidCategories: 0,
      totalSubCategoriesInManifest: 0,
      validSubCategories: 0,
      invalidSubCategories: 0,
    },
    products: [],
    categories: [],
    subcategories: [],
    errors: [],
    warnings: [],
  };

  const seenProductIds = new Set();
  const seenCategoryIds = new Set();
  const seenSubCategoryIds = new Set();
  const seenImagePaths = new Map(); // path -> { type, id }

  // 1. PRODUCT VALIDATION
  const rawProducts = manifestData.products || [];
  results.summary.totalProductsInManifest = rawProducts.length;

  for (let idx = 0; idx < rawProducts.length; idx++) {
    const item = rawProducts[idx];
    const resolvedProductId = item.productId || item.id;
    const resolvedProductName = item.productName || item.name || "Unnamed";
    const resolvedImages = item.images || (item.sourceImage ? [item.sourceImage] : (item.sourceImages || []));

    const productResult = {
      index: idx,
      productId: resolvedProductId,
      productName: resolvedProductName,
      valid: true,
      images: [],
      errors: [],
      warnings: [],
      dbRecord: null
    };

    // A. Validate Product ID
    if (!resolvedProductId) {
      productResult.valid = false;
      productResult.errors.push("Missing required field 'productId' or 'id'");
    } else if (!isValidObjectId(resolvedProductId)) {
      productResult.valid = false;
      productResult.errors.push(`Invalid MongoDB ObjectId format: "${resolvedProductId}"`);
    } else if (seenProductIds.has(resolvedProductId)) {
      productResult.valid = false;
      productResult.errors.push(`Duplicate productId in manifest: "${resolvedProductId}"`);
    } else {
      seenProductIds.add(resolvedProductId);
    }

    // B. Validate Image Array
    if (!Array.isArray(resolvedImages) || resolvedImages.length === 0) {
      productResult.valid = false;
      productResult.errors.push("Field 'images' must be a non-empty array of file paths");
    } else {
      for (let imgIdx = 0; imgIdx < resolvedImages.length; imgIdx++) {
        const imgPath = resolvedImages[imgIdx];
        const fileVal = validateImageFile(imgPath, basePath);
        productResult.images.push(fileVal);

        if (!fileVal.valid) {
          productResult.valid = false;
          productResult.errors.push(`Image [${imgIdx + 1}]: ${fileVal.error}`);
        } else {
          results.summary.totalProductImages++;
          if (seenImagePaths.has(fileVal.resolvedPath)) {
            const prev = seenImagePaths.get(fileVal.resolvedPath);
            productResult.warnings.push(
              `Image [${imgIdx + 1}] "${imgPath}" is also used by ${prev.type} ID: ${prev.id}`
            );
          } else {
            seenImagePaths.set(fileVal.resolvedPath, { type: "Product", id: resolvedProductId });
          }
        }
      }
    }

    // C. Check against Database (if ProductModel provided)
    if (dbModels.ProductModel && isValidObjectId(resolvedProductId)) {
      try {
        const dbProd = await dbModels.ProductModel.findById(resolvedProductId).lean();
        if (!dbProd) {
          productResult.valid = false;
          productResult.errors.push(`Product ID "${resolvedProductId}" not found in database`);
        } else {
          productResult.dbRecord = dbProd;
          if (resolvedProductName && resolvedProductName.toLowerCase() !== dbProd.name.toLowerCase()) {
            productResult.warnings.push(
              `Manifest name "${resolvedProductName}" differs from DB name "${dbProd.name}"`
            );
          }
        }
      } catch (err) {
        productResult.valid = false;
        productResult.errors.push(`Database lookup failed: ${err.message}`);
      }
    }

    if (productResult.valid) {
      results.summary.validProducts++;
    } else {
      results.valid = false;
      results.summary.invalidProducts++;
      results.errors.push(`Product #${idx + 1} (${resolvedProductName || resolvedProductId}): ${productResult.errors.join("; ")}`);
    }

    if (productResult.warnings.length > 0) {
      results.warnings.push(`Product #${idx + 1} (${resolvedProductName || resolvedProductId}): ${productResult.warnings.join("; ")}`);
    }

    results.products.push(productResult);
  }

  // 2. CATEGORY VALIDATION
  const rawCategories = manifestData.categories || [];
  results.summary.totalCategoriesInManifest = rawCategories.length;

  for (let idx = 0; idx < rawCategories.length; idx++) {
    const item = rawCategories[idx];
    const resolvedCategoryId = item.categoryId || item.id;
    const resolvedCategoryName = item.categoryName || item.name || "Unnamed";
    const resolvedImage = item.image || item.sourceImage;

    const catResult = {
      index: idx,
      categoryId: resolvedCategoryId,
      categoryName: resolvedCategoryName,
      valid: true,
      image: null,
      errors: [],
      warnings: [],
      dbRecord: null
    };

    if (!resolvedCategoryId) {
      catResult.valid = false;
      catResult.errors.push("Missing required field 'categoryId' or 'id'");
    } else if (!isValidObjectId(resolvedCategoryId)) {
      catResult.valid = false;
      catResult.errors.push(`Invalid MongoDB ObjectId format: "${resolvedCategoryId}"`);
    } else if (seenCategoryIds.has(resolvedCategoryId)) {
      catResult.valid = false;
      catResult.errors.push(`Duplicate categoryId in manifest: "${resolvedCategoryId}"`);
    } else {
      seenCategoryIds.add(resolvedCategoryId);
    }

    if (!resolvedImage) {
      catResult.valid = false;
      catResult.errors.push("Field 'image' or 'sourceImage' must be a valid file path");
    } else {
      const fileVal = validateImageFile(resolvedImage, basePath);
      catResult.image = fileVal;
      if (!fileVal.valid) {
        catResult.valid = false;
        catResult.errors.push(`Image: ${fileVal.error}`);
      }
    }

    if (dbModels.CategoryModel && isValidObjectId(resolvedCategoryId)) {
      try {
        const dbCat = await dbModels.CategoryModel.findById(resolvedCategoryId).lean();
        if (!dbCat) {
          catResult.valid = false;
          catResult.errors.push(`Category ID "${resolvedCategoryId}" not found in database`);
        } else {
          catResult.dbRecord = dbCat;
          if (resolvedCategoryName && resolvedCategoryName.toLowerCase() !== dbCat.name.toLowerCase()) {
            catResult.warnings.push(
              `Manifest name "${resolvedCategoryName}" differs from DB name "${dbCat.name}"`
            );
          }
        }
      } catch (err) {
        catResult.valid = false;
        catResult.errors.push(`Database lookup failed: ${err.message}`);
      }
    }

    if (catResult.valid) {
      results.summary.validCategories++;
    } else {
      results.valid = false;
      results.summary.invalidCategories++;
      results.errors.push(`Category #${idx + 1} (${resolvedCategoryName || resolvedCategoryId}): ${catResult.errors.join("; ")}`);
    }

    if (catResult.warnings.length > 0) {
      results.warnings.push(`Category #${idx + 1} (${resolvedCategoryName || resolvedCategoryId}): ${catResult.warnings.join("; ")}`);
    }

    results.categories.push(catResult);
  }

  // 3. SUBCATEGORY VALIDATION
  const rawSubCategories = manifestData.subcategories || [];
  results.summary.totalSubCategoriesInManifest = rawSubCategories.length;

  for (let idx = 0; idx < rawSubCategories.length; idx++) {
    const item = rawSubCategories[idx];
    const resolvedSubCategoryId = item.subCategoryId || item.id;
    const resolvedSubCategoryName = item.subCategoryName || item.name || "Unnamed";
    const resolvedImage = item.image || item.sourceImage;

    const subResult = {
      index: idx,
      subCategoryId: resolvedSubCategoryId,
      subCategoryName: resolvedSubCategoryName,
      valid: true,
      image: null,
      errors: [],
      warnings: [],
      dbRecord: null
    };

    if (!resolvedSubCategoryId) {
      subResult.valid = false;
      subResult.errors.push("Missing required field 'subCategoryId' or 'id'");
    } else if (!isValidObjectId(resolvedSubCategoryId)) {
      subResult.valid = false;
      subResult.errors.push(`Invalid MongoDB ObjectId format: "${resolvedSubCategoryId}"`);
    } else if (seenSubCategoryIds.has(resolvedSubCategoryId)) {
      subResult.valid = false;
      subResult.errors.push(`Duplicate subCategoryId in manifest: "${resolvedSubCategoryId}"`);
    } else {
      seenSubCategoryIds.add(resolvedSubCategoryId);
    }

    if (!resolvedImage) {
      subResult.valid = false;
      subResult.errors.push("Field 'image' or 'sourceImage' must be a valid file path");
    } else {
      const fileVal = validateImageFile(resolvedImage, basePath);
      subResult.image = fileVal;
      if (!fileVal.valid) {
        subResult.valid = false;
        subResult.errors.push(`Image: ${fileVal.error}`);
      }
    }

    if (dbModels.SubCategoryModel && isValidObjectId(resolvedSubCategoryId)) {
      try {
        const dbSub = await dbModels.SubCategoryModel.findById(resolvedSubCategoryId).lean();
        if (!dbSub) {
          subResult.valid = false;
          subResult.errors.push(`Subcategory ID "${resolvedSubCategoryId}" not found in database`);
        } else {
          subResult.dbRecord = dbSub;
          if (resolvedSubCategoryName && resolvedSubCategoryName.toLowerCase() !== dbSub.name.toLowerCase()) {
            subResult.warnings.push(
              `Manifest name "${resolvedSubCategoryName}" differs from DB name "${dbSub.name}"`
            );
          }
        }
      } catch (err) {
        subResult.valid = false;
        subResult.errors.push(`Database lookup failed: ${err.message}`);
      }
    }

    if (subResult.valid) {
      results.summary.validSubCategories++;
    } else {
      results.valid = false;
      results.summary.invalidSubCategories++;
      results.errors.push(`Subcategory #${idx + 1} (${resolvedSubCategoryName || resolvedSubCategoryId}): ${subResult.errors.join("; ")}`);
    }

    if (subResult.warnings.length > 0) {
      results.warnings.push(`Subcategory #${idx + 1} (${resolvedSubCategoryName || resolvedSubCategoryId}): ${subResult.warnings.join("; ")}`);
    }

    results.subcategories.push(subResult);
  }

  return results;
}
