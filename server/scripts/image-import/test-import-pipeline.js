#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../../");
const SERVER_DIR = path.resolve(__dirname, "../../");

dotenv.config({ path: path.resolve(SERVER_DIR, ".env") });

import ProductModel from "../../models/product.model.js";
import CategoryModel from "../../models/category.model.js";
import SubCategoryModel from "../../models/subCategory.model.js";

import {
  validateManifest,
  validateImageFile,
  isValidObjectId,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from "./manifest-validator.js";

import {
  importProductRecord,
  importCategoryRecord,
  importSubCategoryRecord,
} from "./cloudinary-importer.js";

const TEST_SCRATCH_DIR = path.resolve(__dirname, "test-scratch");

async function runTests() {
  console.log("==================================================================");
  console.log("        GRABITGO — IMPORT PIPELINE TEST SUITE (PHASE 9D)          ");
  console.log("==================================================================");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✖ FAIL: ${message}`);
      failedTests++;
    }
  }

  // Setup test sandbox directory
  if (fs.existsSync(TEST_SCRATCH_DIR)) {
    fs.rmSync(TEST_SCRATCH_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_SCRATCH_DIR, { recursive: true });

  // Create valid test mock image files (dummy webp / png buffers)
  const validWebpPath = path.resolve(TEST_SCRATCH_DIR, "sample_prod.webp");
  const validPngPath = path.resolve(TEST_SCRATCH_DIR, "sample_cat.png");
  const validJpgPath = path.resolve(TEST_SCRATCH_DIR, "sample_sub.jpg");
  const invalidExtPath = path.resolve(TEST_SCRATCH_DIR, "sample.txt");
  const emptyFilePath = path.resolve(TEST_SCRATCH_DIR, "empty.webp");

  // Minimal valid 1x1 PNG header
  const minimalPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  fs.writeFileSync(validWebpPath, minimalPng);
  fs.writeFileSync(validPngPath, minimalPng);
  fs.writeFileSync(validJpgPath, minimalPng);
  fs.writeFileSync(invalidExtPath, "not an image");
  fs.writeFileSync(emptyFilePath, Buffer.alloc(0));

  console.log("\n--- TEST GROUP 1: UNIT VALIDATION RULES ---");

  // 1.1 Object ID validation
  assert(isValidObjectId("507f1f77bcf86cd799439011") === true, "Valid 24-hex ObjectId recognized");
  assert(isValidObjectId("invalid-id") === false, "Malformed string rejected as ObjectId");
  assert(isValidObjectId("507f1f77bcf86cd79943901") === false, "23-char string rejected as ObjectId");
  assert(isValidObjectId(null) === false, "Null rejected as ObjectId");

  // 1.2 File validation
  const validFileCheck = validateImageFile(validWebpPath, TEST_SCRATCH_DIR);
  assert(validFileCheck.valid === true, "Valid webp file accepted");

  const missingFileCheck = validateImageFile("non_existent_file.webp", TEST_SCRATCH_DIR);
  assert(missingFileCheck.valid === false && missingFileCheck.error.includes("File not found"), "Non-existent file flagged with 'File not found'");

  const invalidExtCheck = validateImageFile(invalidExtPath, TEST_SCRATCH_DIR);
  assert(invalidExtCheck.valid === false && invalidExtCheck.error.includes("Invalid file extension"), "Disallowed extension (.txt) rejected");

  const emptyFileCheck = validateImageFile(emptyFilePath, TEST_SCRATCH_DIR);
  assert(emptyFileCheck.valid === false && emptyFileCheck.error.includes("empty"), "Empty file (0 bytes) rejected");

  console.log("\n--- TEST GROUP 2: MANIFEST VALIDATION ENGINE ---");

  // 2.1 Manifest with duplicates & errors
  const invalidManifest = {
    products: [
      {
        productId: "507f1f77bcf86cd799439011",
        productName: "Test Product A",
        images: ["./sample_prod.webp", "./missing_file.jpg"],
      },
      {
        productId: "507f1f77bcf86cd799439011", // duplicate
        productName: "Test Product B Duplicate",
        images: ["./sample_prod.webp"],
      },
      {
        productId: "not-a-valid-hex-id", // invalid format
        productName: "Bad ID Product",
        images: ["./sample_prod.webp"],
      },
      {
        productId: "507f1f77bcf86cd799439012",
        productName: "No Images Product",
        images: [], // empty images
      },
    ],
    categories: [
      {
        categoryId: "507f1f77bcf86cd799439022",
        categoryName: "Test Category",
        image: "./sample.txt", // bad ext
      },
    ],
  };

  const validationResult = await validateManifest(invalidManifest, TEST_SCRATCH_DIR);
  assert(validationResult.valid === false, "Invalid manifest correctly flagged as invalid");
  assert(validationResult.summary.invalidProducts === 4, "All 4 flawed products correctly identified");
  assert(validationResult.errors.some((e) => e.includes("Duplicate productId")), "Duplicate productId detected");
  assert(validationResult.errors.some((e) => e.includes("Invalid MongoDB ObjectId format")), "Invalid ObjectId detected");
  assert(validationResult.errors.some((e) => e.includes("File not found")), "Missing image file detected");
  assert(validationResult.errors.some((e) => e.includes("must be a non-empty array")), "Empty image array detected");
  assert(validationResult.errors.some((e) => e.includes("Invalid file extension")), "Category bad extension detected");

  console.log("\n--- TEST GROUP 3: DATABASE SAFETY & DRY RUN INTEGRITY ---");
  await mongoose.connect(process.env.MONGODB_URI);

  // Read catalog baseline
  const initialProductCount = await ProductModel.countDocuments();
  const initialCategoryCount = await CategoryModel.countDocuments();
  const initialSubCategoryCount = await SubCategoryModel.countDocuments();

  const sampleProductBefore = await ProductModel.findOne({}).select("_id name image").lean();

  assert(initialProductCount === 159, `Catalog baseline verified: exactly 159 products exist`);
  assert(initialCategoryCount === 20, `Catalog baseline verified: exactly 20 categories exist`);
  assert(initialSubCategoryCount === 219, `Catalog baseline verified: exactly 219 subcategories exist`);

  // 3.1 Run Dry Run on a valid manifest referencing the sample product
  const validTestManifest = {
    products: [
      {
        productId: sampleProductBefore._id.toString(),
        productName: sampleProductBefore.name,
        images: ["./sample_prod.webp", "./sample_cat.png"],
      },
    ],
  };

  const validManifestResult = await validateManifest(validTestManifest, TEST_SCRATCH_DIR, {
    ProductModel,
    CategoryModel,
    SubCategoryModel,
  });

  assert(validManifestResult.valid === true, "Valid manifest against real DB record passes validation");
  assert(validManifestResult.summary.validProducts === 1, "Product correctly resolved in MongoDB");

  // Dry run simulation
  const dryRunRes = await importProductRecord(
    validManifestResult.products[0],
    ProductModel,
    { dryRun: true }
  );

  assert(dryRunRes.status === "DRY_RUN", "Dry run returns status DRY_RUN");

  // Verify MongoDB was NOT modified
  const sampleProductAfter = await ProductModel.findById(sampleProductBefore._id).select("_id name image").lean();
  assert(
    JSON.stringify(sampleProductBefore.image) === JSON.stringify(sampleProductAfter.image),
    "MongoDB product image array remains 100% UNCHANGED after dry run"
  );

  const finalProductCount = await ProductModel.countDocuments();
  assert(finalProductCount === initialProductCount, "Total product count unchanged in database (0 records created/deleted)");

  console.log("\n--- TEST GROUP 4: ATOMIC ROLLBACK SAFETY LOGIC ---");

  // Verify atomic rollback behavior: if an image upload fails, DB is untouched
  const mockFailedItem = {
    productId: sampleProductBefore._id.toString(),
    productName: sampleProductBefore.name,
    images: [{ resolvedPath: "/path/to/non/existent/file/force_fail.webp" }],
  };

  // Calling with dryRun: false but invalid file to trigger failure
  const failRes = await importProductRecord(mockFailedItem, ProductModel, {
    dryRun: false,
    log: () => {},
  });

  assert(failRes.status === "FAILED", "Importer catches error and returns status FAILED");
  assert(failRes.dbUntouched === true, "Importer explicitly guarantees dbUntouched = true on error");

  const sampleProductAfterFail = await ProductModel.findById(sampleProductBefore._id).select("_id name image").lean();
  assert(
    JSON.stringify(sampleProductBefore.image) === JSON.stringify(sampleProductAfterFail.image),
    "MongoDB image array preserved with zero corruption after simulated upload failure"
  );

  // Cleanup test scratch files
  fs.rmSync(TEST_SCRATCH_DIR, { recursive: true, force: true });
  await mongoose.disconnect();

  console.log("\n==================================================================");
  console.log(`TEST SUMMARY: ${passedTests} passed, ${failedTests} failed`);
  console.log("==================================================================");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("TEST SUITE FATAL ERROR:", err);
  process.exit(1);
});
