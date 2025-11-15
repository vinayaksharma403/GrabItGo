import { request, response } from "express";
import ProductModel from "../models/product.model.js";

const listCache = new Map();

const CACHE_TTL_MS = 60_000; // 1 minute

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
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

/** GET ALL PRODUCTS (FAST + CACHED) */
export const getProductController = async (req, res) => {
  console.time("getProductController_total");
  try {
    // read from query params
    let { page = 1, limit = 20, search = "" } = req.query;
    page = Number(page) || 1;
    limit = Number(limit) || 20;
    search = (search || "").trim();

    const cacheKey = `${page}:${limit}:${search}`;
    if (listCache.has(cacheKey)) {
      console.log("getProductController: cache hit", cacheKey);
      console.timeEnd("getProductController_total");
      return res.json(listCache.get(cacheKey));
    }

    const skip = (page - 1) * limit;

    const query = search
      ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      }
      : {};

    console.time("MongoQuery");
    const [data, totalCount] = await Promise.all([
      ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name price image stock unit brand createdAt") // small payload
        .lean(),
      ProductModel.countDocuments(query),
    ]);
    console.timeEnd("MongoQuery");

    const responsePayload = {
      message: "Product data fetched successfully",
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      success: true,
      error: false,
    };

    // cache it for TTL
    listCache.set(cacheKey, responsePayload);
    setTimeout(() => listCache.delete(cacheKey), CACHE_TTL_MS);

    console.timeEnd("getProductController_total");
    return res.json(responsePayload);
  } catch (error) {
    console.timeEnd("getProductController_total");
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

/** GET PRODUCT BY CATEGORY */
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
      .select("name price image stock unit brand")
      .lean();

    return res.json({
      message: "Category product list fetched successfully",
      data: products,
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

/** GET PRODUCT BY CATEGORY + SUBCATEGORY */
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

    page = Number(page) || 1;
    limit = Number(limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      category: { $in: categoryId },
      subCategory: { $in: subCategoryId },
    };

    const [data, totalCount] = await Promise.all([
      ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("name price image stock unit brand createdAt")
        .lean(),
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
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

/** GET PRODUCT DETAILS (FAST) */
export const getProductDetails = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
        success: false,
        error: true,
      });
    }

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
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

export const updateProductDetails = async (request, response) => {
  try {
    const { _id } = request.body

    if (!_id) {
      return response.status(400).json({
        message: "Provide product _id",
        error: true,
        success: false
      })
    }

    const updateProduct = await ProductModel.updateOne({ _id: _id }, {
      ...request.body
    })

    return response.json({
      message: "Updated Successfully",
      data: updateProduct,
      error: false,
      success: true
    })
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    })

  }
}

// export const deleteProductDetails = async (request, response) => {
//   try {
//     console.log("QUERY:", request.query);
//     console.log("BODY:", request.body);
//     console.log("PARAMS:", request.params);

//     const { _id } = request.query

//     if (!_id) {
//       return response.status(400).json({
//         message: "Provide _id",
//         error: true,
//         success: false
//       })


//     }

//     const deleteProduct = await ProductModel.deleteOne({ _id: _id })

//     return response.json({
//       message: "Deleted Successfully",
//       error: false,
//       success: true,
//       data: deleteProduct
//     })
//   } catch (error) {
//     return response.status(500).json({
//       message: error.message || error,
//       error: true,
//       success: false
//     })

//   }
// }

export async function deleteProductDetails(req, res) {
  try {
    console.log("👉 DELETE HIT");
    console.log("Query:", req.query);
    console.log("Body:", req.body);
    console.log("User:", req.user);

    const productId = req.query._id || req.body._id;

    console.log("Product ID received:", productId);

    if (!productId) {
      return res.status(400).json({
        message: "Product ID missing",
        error: true,
        success: false
      });
    }

    const deletedProduct = await ProductModel.findByIdAndDelete(productId);

    console.log("Deleted product:", deletedProduct);

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found",
        error: true,
        success: false,
      });
    }

    return res.json({
      message: "Product deleted successfully",
      success: true,
    });

  } catch (err) {
    console.log("🔥 Delete error:", err);
    return res.status(500).json({
      message: err.message,
      error: true,
      success: false,
    });
  }
}




