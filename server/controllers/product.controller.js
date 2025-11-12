import ProductModel from "../models/product.model.js";

/** ===============================
 *  CREATE PRODUCT
 * =============================== */
export const createProductController = async (req, res) => {
  try {
    const {
      name,
      image,
      category,
      subCategory,
      unit,
      stock,
      price,
      discount,
      description,
      more_details,
    } = req.body;

    if (!name || !image?.[0] || !category || !subCategory || !unit || !price || !description) {
      return res.status(400).json({
        message: "Enter all required fields",
        success: false,
        error: true,
      });
    }

    const product = new ProductModel({
      name,
      image,
      category,
      subCategory,
      unit,
      stock,
      price,
      discount,
      description,
      more_details,
    });

    const savedProduct = await product.save();

    return res.json({
      message: "Product created successfully",
      data: savedProduct,
      success: true,
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

/** ===============================
 *  GET ALL PRODUCTS (Paginated)
 * =============================== */
export const getProductController = async (req, res) => {
  try {
    let { page = 1, limit = 10, search } = req.body;

    const query = search
      ? { $text: { $search: search } }
      : {};

    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(), // ✅ Much faster
      ProductModel.countDocuments(query),
    ]);

    return res.json({
      message: "Product data fetched successfully",
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      success: true,
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

/** ===============================
 *  GET PRODUCT BY CATEGORY
 * =============================== */
export const getProductByCategory = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Provide category ID",
        success: false,
        error: true,
      });
    }

    const products = await ProductModel.find({ category: { $in: id } })
      .limit(15)
      .lean(); // ✅ Faster

    return res.json({
      message: "Category product list fetched successfully",
      data: products,
      success: true,
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

/** ===============================
 *  GET PRODUCT BY CATEGORY + SUBCATEGORY
 * =============================== */
export const getProductByCategoryAndSubCategory = async (req, res) => {
  try {
    let { categoryId, subCategoryId, page = 1, limit = 10 } = req.body;

    if (!categoryId || !subCategoryId) {
      return res.status(400).json({
        message: "Provide categoryId and subCategoryId",
        success: false,
        error: true,
      });
    }

    const query = {
      category: { $in: categoryId },
      subCategory: { $in: subCategoryId },
    };

    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(), // ✅ Faster
      ProductModel.countDocuments(query),
    ]);

    return res.json({
      message: "Product list fetched successfully",
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      success: true,
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

/** ===============================
 *  GET PRODUCT DETAILS (FAST)
 * =============================== */
export const getProductDetails = async (req, res) => {
  try {
    const { productId } = req.params; // ✅ Using params instead of body

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
        success: false,
        error: true,
      });
    }

    // ✅ Use lean() for faster JSON serialization
    const product = await ProductModel.findById(productId).lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
        error: true,
      });
    }

    return res.json({
      message: "Product details fetched successfully",
      data: product,
      success: true,
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};
