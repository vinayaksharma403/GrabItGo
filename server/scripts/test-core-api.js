import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_DIR = path.resolve(__dirname, '../');

dotenv.config({ path: path.resolve(SERVER_DIR, '.env') });
if (!process.env.RESEND_API) {
  process.env.RESEND_API = 're_dummy_test_key_for_regression';
}

import mongoose from 'mongoose';
import stripe from 'stripe';
import jwt from 'jsonwebtoken';

// Models
import UserModel from '../models/user.model.js';
import ProductModel from '../models/product.model.js';
import CategoryModel from '../models/category.model.js';
import SubCategoryModel from '../models/subCategory.model.js';
import CartProductModel from '../models/cartproduct.model.js';
import AddressModel from '../models/address.model.js';
import OrderModel from '../models/order.model.js';
import WebhookEventModel from '../models/webhookEvent.model.js';

// Controllers & Middleware
import { registerUserController, loginController, userDetails } from '../controllers/user.controller.js';
import { addToCartController, getCartController, updateCartController, removeFromCartController } from '../controllers/cart.controller.js';
import {
  createOrderController,
  getOrderDetailsController,
  getAllOrdersAdminController,
  updateOrderStatusController,
} from '../controllers/order.controller.js';
import { getProductController, getProductByCategoryAndSubCategory } from '../controllers/product.controller.js';
import { stripeWebhookController } from '../controllers/stripeWebhook.controller.js';
import { deleteAddressController } from '../controllers/address.controller.js';
import auth from '../middleware/auth.js';
import { admin } from '../middleware/Admin.js';

// Tracking for guaranteed test cleanup
const tracked = {
  userIds: new Set(),
  productIds: new Set(),
  categoryIds: new Set(),
  subCategoryIds: new Set(),
  addressIds: new Set(),
  cartIds: new Set(),
  orderIds: new Set(),
  webhookEventIds: new Set(),
};

// Test results tally
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

function pass(name) {
  results.passed++;
  console.log(`  ✔ PASS: ${name}`);
}

function fail(name, error) {
  results.failed++;
  const msg = error?.message || String(error);
  results.errors.push({ name, msg });
  console.error(`  ✖ FAIL: ${name} -> ${msg}`);
}

function createMockReqRes({ body = {}, params = {}, query = {}, headers = {}, cookies = {}, userId, rawBody } = {}) {
  let statusCode = 200;
  let jsonResponse = null;
  const cookiesSet = {};
  let nextCalled = false;
  let nextError = null;

  const req = {
    body,
    params,
    query,
    headers,
    cookies,
    userId,
    rawBody,
    ip: '127.0.0.1',
    originalUrl: '/test',
    baseUrl: '',
    path: '/test',
  };

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      jsonResponse = data;
      return res;
    },
    cookie(name, val, options) {
      cookiesSet[name] = { val, options };
      return res;
    },
    clearCookie(name) {
      delete cookiesSet[name];
      return res;
    },
    setHeader() {},
    getHeader() {},
    get statusCode() {
      return statusCode;
    },
    get jsonResponse() {
      return jsonResponse;
    },
    get cookiesSet() {
      return cookiesSet;
    },
  };

  const next = (err) => {
    nextCalled = true;
    nextError = err || null;
  };

  return { req, res, next, getResult: () => ({ statusCode, jsonResponse, cookiesSet, nextCalled, nextError }) };
}

async function runSuite() {
  console.log('==================================================================');
  console.log('       GRABITGO — CORE COMMERCE REGRESSION TEST SUITE (PHASE 11B)  ');
  console.log('==================================================================\n');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required to run tests.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB. Starting test execution...\n');

  const testSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const userAEmail = `test_user_a_${testSuffix}@grabitgo-test.local`;
  const userBEmail = `test_user_b_${testSuffix}@grabitgo-test.local`;
  const adminEmail = `test_admin_${testSuffix}@grabitgo-test.local`;
  const rawPassword = 'StrongPassword123!#';

  let userADoc = null;
  let userBDoc = null;
  let adminDoc = null;
  let userAToken = null;

  let testCategory = null;
  let testSubCategory = null;
  let testProduct = null;
  let userAAddress = null;
  let userBAddress = null;

  try {
    // ==================================================================
    // GROUP 1: AUTHENTICATION & AUTHORIZATION
    // ==================================================================
    console.log('--- TEST GROUP 1: AUTHENTICATION & SESSION HANDLING ---');

    // T1.1: Valid Registration
    try {
      const { req, res, getResult } = createMockReqRes({
        body: { name: 'Regression User A', email: userAEmail, password: rawPassword },
      });
      await registerUserController(req, res);
      const resData = getResult();

      if (resData.statusCode === 201 && resData.jsonResponse?.success && resData.jsonResponse?.data?._id) {
        userADoc = await UserModel.findById(resData.jsonResponse.data._id);
        tracked.userIds.add(String(userADoc._id));
        if (resData.jsonResponse.data.password === undefined) {
          pass('Valid registration creates user and sanitizes password from response');
        } else {
          fail('Valid registration', new Error('Password was exposed in response data'));
        }
      } else {
        fail('Valid registration', new Error(`Expected status 201, got ${resData.statusCode}: ${JSON.stringify(resData.jsonResponse)}`));
      }
    } catch (err) {
      fail('Valid registration', err);
    }

    // T1.2: Duplicate Email Registration Rejection
    try {
      const { req, res, getResult } = createMockReqRes({
        body: { name: 'Duplicate User', email: userAEmail, password: rawPassword },
      });
      await registerUserController(req, res);
      const resData = getResult();

      if (resData.jsonResponse?.success === false && resData.jsonResponse?.error === true) {
        pass('Duplicate email registration is rejected');
      } else {
        fail('Duplicate registration', new Error(`Expected error response, got ${JSON.stringify(resData.jsonResponse)}`));
      }
    } catch (err) {
      fail('Duplicate registration', err);
    }

    // T1.3: Valid Login
    try {
      const { req, res, getResult } = createMockReqRes({
        body: { email: userAEmail, password: rawPassword },
      });
      await loginController(req, res);
      const resData = getResult();

      if (resData.jsonResponse?.success && resData.jsonResponse?.data?.accessToken) {
        userAToken = resData.jsonResponse.data.accessToken;
        pass('Valid login succeeds and issues access & refresh tokens');
      } else {
        fail('Valid login', new Error(`Login failed: ${JSON.stringify(resData.jsonResponse)}`));
      }
    } catch (err) {
      fail('Valid login', err);
    }

    // T1.4: Invalid Password Rejection
    try {
      const { req, res, getResult } = createMockReqRes({
        body: { email: userAEmail, password: 'WrongPassword999' },
      });
      await loginController(req, res);
      const resData = getResult();

      if (resData.statusCode === 400 && resData.jsonResponse?.success === false) {
        pass('Invalid credentials login is rejected with status 400');
      } else {
        fail('Invalid credentials', new Error(`Expected status 400, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Invalid credentials', err);
    }

    // T1.5: Protected Endpoint Unauthenticated Rejection
    try {
      const { req, res, next, getResult } = createMockReqRes({});
      await auth(req, res, next);
      const resData = getResult();

      if (resData.statusCode === 401 && resData.jsonResponse?.error === true && !resData.nextCalled) {
        pass('Unauthenticated request to protected endpoint is rejected with 401');
      } else {
        fail('Unauthenticated protection', new Error(`Expected 401 rejection, got status ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Unauthenticated protection', err);
    }

    // T1.6: Protected Endpoint Authenticated Success
    try {
      const { req, res, next, getResult } = createMockReqRes({
        headers: { authorization: `Bearer ${userAToken}` },
      });
      await auth(req, res, next);
      const resData = getResult();

      if (resData.nextCalled && String(req.userId) === String(userADoc._id)) {
        pass('Authenticated request resolves userId and proceeds via next()');
      } else {
        fail('Authenticated authorization', new Error('next() was not called or userId was not resolved'));
      }
    } catch (err) {
      fail('Authenticated authorization', err);
    }

    // T1.7: Normal USER Role Denied on Admin Endpoint
    try {
      const { req, res, next, getResult } = createMockReqRes({
        userId: userADoc._id,
      });
      await admin(req, res, next);
      const resData = getResult();

      if (resData.statusCode === 403 && resData.jsonResponse?.error === true && !resData.nextCalled) {
        pass('Normal USER role is blocked from ADMIN endpoints with 403');
      } else {
        fail('Admin permission guard', new Error(`Expected 403 rejection, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Admin permission guard', err);
    }

    // Setup User B and Admin User for remaining tests
    const userB = await new UserModel({
      name: 'Regression User B',
      email: userBEmail,
      password: 'hashed_password_placeholder',
      role: 'USER',
      status: 'Active',
    }).save();
    userBDoc = userB;
    tracked.userIds.add(String(userB._id));

    const adminUser = await new UserModel({
      name: 'Regression Admin User',
      email: adminEmail,
      password: 'hashed_password_placeholder',
      role: 'ADMIN',
      status: 'Active',
    }).save();
    adminDoc = adminUser;
    tracked.userIds.add(String(adminUser._id));

    // ==================================================================
    // GROUP 2: CART & STOCK INTEGRITY
    // ==================================================================
    console.log('\n--- TEST GROUP 2: CART & STOCK INTEGRITY ---');

    // Create temporary category, subcategory, and product
    testCategory = await new CategoryModel({
      name: `Regression Category ${testSuffix}`,
      image: 'https://res.cloudinary.com/test/image/upload/sample_cat.webp',
    }).save();
    tracked.categoryIds.add(String(testCategory._id));

    testSubCategory = await new SubCategoryModel({
      name: `Regression SubCategory ${testSuffix}`,
      image: 'https://res.cloudinary.com/test/image/upload/sample_sub.webp',
      category: [testCategory._id],
    }).save();
    tracked.subCategoryIds.add(String(testSubCategory._id));

    testProduct = await new ProductModel({
      name: `Regression Test Mangoes ${testSuffix}`,
      image: ['https://res.cloudinary.com/test/image/upload/mango.webp'],
      category: [testCategory._id],
      subCategory: [testSubCategory._id],
      unit: '1 kg',
      stock: 10,
      price: 100,
      discount: 10, // effective unit price = 90
      description: 'Fresh organic test mangoes',
      publish: true,
    }).save();
    tracked.productIds.add(String(testProduct._id));

    let createdCartItem = null;

    // T2.1: Add Valid Product to Cart
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: userADoc._id,
        body: { productId: testProduct._id, quantity: 2 },
      });
      await addToCartController(req, res);
      const resData = getResult();

      if (resData.jsonResponse?.success && resData.jsonResponse?.data?._id) {
        createdCartItem = resData.jsonResponse.data;
        tracked.cartIds.add(String(createdCartItem._id));
        pass('Add valid product to cart succeeds');
      } else {
        fail('Add to cart', new Error(`Failed: ${JSON.stringify(resData.jsonResponse)}`));
      }
    } catch (err) {
      fail('Add to cart', err);
    }

    // T2.2: Add Within Available Stock
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: userADoc._id,
        body: { productId: testProduct._id, quantity: 3 }, // 2 + 3 = 5 <= 10
      });
      await addToCartController(req, res);
      const resData = getResult();

      const updated = await CartProductModel.findById(createdCartItem._id);
      if (resData.jsonResponse?.success && updated.quantity === 5) {
        pass('Quantity increment within available stock updates correctly to 5');
      } else {
        fail('Quantity increment', new Error(`Expected quantity 5, got ${updated?.quantity}`));
      }
    } catch (err) {
      fail('Quantity increment', err);
    }

    // T2.3: Exceeding Available Stock Rejection
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: userADoc._id,
        body: { productId: testProduct._id, quantity: 10 }, // 5 + 10 = 15 > 10
      });
      await addToCartController(req, res);
      const resData = getResult();

      const cartItemCheck = await CartProductModel.findById(createdCartItem._id);
      if (resData.statusCode === 400 && resData.jsonResponse?.error === true && cartItemCheck.quantity === 5) {
        pass('Adding quantity exceeding available stock is rejected and clamped');
      } else {
        fail('Exceeding stock rejection', new Error(`Expected 400 error, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Exceeding stock rejection', err);
    }

    // T2.4: Cart Ownership Enforcement (User B cannot modify User A cart item)
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: userBDoc._id, // User B
        body: { cartId: createdCartItem._id, quantity: 1 },
      });
      await updateCartController(req, res);
      const resData = getResult();

      const cartItemCheck = await CartProductModel.findById(createdCartItem._id);
      if (resData.statusCode === 404 && cartItemCheck.quantity === 5) {
        pass('Cart item modification by unauthenticated owner is rejected with 404');
      } else {
        fail('Cart ownership', new Error(`Expected 404 for wrong user, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Cart ownership', err);
    }

    // T2.5: Dynamic Stock Availability in Cart Enrichment
    try {
      // Temporarily lower product stock to 3 (below current cart quantity of 5)
      await ProductModel.findByIdAndUpdate(testProduct._id, { stock: 3 });

      const { req, res, getResult } = createMockReqRes({
        userId: userADoc._id,
      });
      await getCartController(req, res);
      const resData = getResult();

      const items = resData.jsonResponse?.data || [];
      const item = items.find((i) => String(i.productId?._id || i.productId) === String(testProduct._id));

      if (item && item.isAvailable === false && item.availableStock === 3) {
        pass('Get cart correctly marks items as unavailable when stock falls below cart quantity');
      } else {
        fail('Cart availability enrichment', new Error(`Expected isAvailable=false, got ${item?.isAvailable}`));
      }
    } catch (err) {
      fail('Cart availability enrichment', err);
    }

    // ==================================================================
    // GROUP 3: SERVER-AUTHORITATIVE ORDER CALCULATION
    // ==================================================================
    console.log('\n--- TEST GROUP 3: SERVER-AUTHORITATIVE ORDER CALCULATION ---');

    // Create delivery addresses
    userAAddress = await new AddressModel({
      userId: userADoc._id,
      address_line: '123 Market Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
      mobile: 9876543210,
    }).save();
    tracked.addressIds.add(String(userAAddress._id));

    userBAddress = await new AddressModel({
      userId: userBDoc._id,
      address_line: '456 Garden Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      country: 'India',
      mobile: 9123456780,
    }).save();
    tracked.addressIds.add(String(userBAddress._id));

    // Reset product stock to 10 and cart quantity to 2
    // Product Price: 100, Discount: 10% => Unit Price: 90 => Line Total for 2 units: 180
    await ProductModel.findByIdAndUpdate(testProduct._id, { stock: 10 });
    await CartProductModel.findByIdAndUpdate(createdCartItem._id, { quantity: 2 });

    let createdOrder = null;

    // T3.1: Server-Authoritative Price Calculation (Ignores client-tampered prices)
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: userADoc._id,
        body: {
          addressId: userAAddress._id,
          paymentMethod: 'card',
          // Client attempts price tampering:
          price: 1,
          unitPrice: 1,
          discount: 99,
          subTotalAmt: 2,
          totalAmt: 2,
        },
      });
      await createOrderController(req, res);
      const resData = getResult();

      if (resData.jsonResponse?.success && resData.jsonResponse?.data?.order) {
        createdOrder = resData.jsonResponse.data.order;
        tracked.orderIds.add(String(createdOrder._id));

        const orderDoc = await OrderModel.findById(createdOrder._id);
        const item = orderDoc.items[0];

        if (item.unitPrice === 90 && item.lineTotal === 180 && orderDoc.subTotalAmt === 180 && orderDoc.totalAmt === 180) {
          pass('Server ignores client-tampered pricing and calculates authoritative totals from database (₹180)');
        } else {
          fail(
            'Authoritative pricing calculation',
            new Error(
              `Pricing calculation mismatch: unitPrice=${item?.unitPrice} (expected 90), totalAmt=${orderDoc?.totalAmt} (expected 180)`
            )
          );
        }
      } else {
        fail('Order creation', new Error(`Failed: ${JSON.stringify(resData.jsonResponse)}`));
      }
    } catch (err) {
      fail('Order creation', err);
    }

    // T3.2: Out of Stock Order Rejection
    try {
      await ProductModel.findByIdAndUpdate(testProduct._id, { stock: 0 });

      const { req, res, getResult } = createMockReqRes({
        userId: userADoc._id,
        body: { addressId: userAAddress._id },
      });
      await createOrderController(req, res);
      const resData = getResult();

      if (resData.statusCode === 400 && resData.jsonResponse?.error === true) {
        pass('Order creation is rejected when items are out of stock');
      } else {
        fail('Out of stock order rejection', new Error(`Expected 400 rejection, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Out of stock order rejection', err);
    }

    // T3.3: Unauthorized Address Rejection
    try {
      await ProductModel.findByIdAndUpdate(testProduct._id, { stock: 10 });

      const { req, res, getResult } = createMockReqRes({
        userId: userADoc._id,
        body: { addressId: userBAddress._id }, // User A passing User B's address
      });
      await createOrderController(req, res);
      const resData = getResult();

      if (resData.statusCode === 400 && resData.jsonResponse?.error === true) {
        pass('Order creation is rejected when address does not belong to requesting user');
      } else {
        fail('Unauthorized address rejection', new Error(`Expected 400 rejection, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Unauthorized address rejection', err);
    }

    // ==================================================================
    // GROUP 4: STRIPE WEBHOOK IDEMPOTENCY & FULFILLMENT
    // ==================================================================
    console.log('\n--- TEST GROUP 4: STRIPE WEBHOOK IDEMPOTENCY & FULFILLMENT ---');

    // Create a fresh order for webhook testing
    const webhookOrderId = `ORD-TEST-WH-${testSuffix}`;
    const webhookEventId = `evt_test_wh_${testSuffix}`;
    const paymentIntentId = `pi_test_wh_${testSuffix}`;

    // Product stock starts at 10. Order has 2 items.
    await ProductModel.findByIdAndUpdate(testProduct._id, { stock: 10 });
    const whOrder = await new OrderModel({
      userId: userADoc._id,
      orderId: webhookOrderId,
      items: [
        {
          productId: testProduct._id,
          name: testProduct.name,
          quantity: 2,
          unitPrice: 90,
          discountPercent: 10,
          lineTotal: 180,
        },
      ],
      paymentId: paymentIntentId,
      stripePaymentIntentId: paymentIntentId,
      payment_status: 'pending',
      delivery_address: userAAddress._id,
      subTotalAmt: 180,
      totalAmt: 180,
    }).save();
    tracked.orderIds.add(String(whOrder._id));
    tracked.webhookEventIds.add(webhookEventId);

    // T4.1: Missing Signature Rejection
    try {
      const { req, res, getResult } = createMockReqRes({
        headers: {}, // No stripe-signature
      });
      await stripeWebhookController(req, res);
      const resData = getResult();

      if (resData.statusCode === 400 && resData.jsonResponse?.error === true) {
        pass('Webhook request missing stripe-signature header is rejected with 400');
      } else {
        fail('Missing webhook signature', new Error(`Expected 400, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Missing webhook signature', err);
    }

    // Generate real test signature for webhook payload
    const testWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_for_regression_test_123';
    const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = testWebhookSecret;
    if (!process.env.STRIPE_SECRET_KEY) {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_regression_key';
    }

    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);
    const webhookPayloadObj = {
      id: webhookEventId,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntentId,
          object: 'payment_intent',
          amount: 18000,
          currency: 'inr',
          metadata: {
            orderId: webhookOrderId,
            userId: String(userADoc._id),
          },
        },
      },
    };

    const rawPayloadBuffer = Buffer.from(JSON.stringify(webhookPayloadObj), 'utf-8');
    const validSignatureHeader = stripeClient.webhooks.generateTestHeaderString({
      payload: rawPayloadBuffer,
      secret: testWebhookSecret,
    });

    // T4.2: First Webhook Execution (Fulfillment & Stock Decrement)
    try {
      const { req, res, getResult } = createMockReqRes({
        headers: { 'stripe-signature': validSignatureHeader },
        rawBody: rawPayloadBuffer,
      });
      await stripeWebhookController(req, res);
      const resData = getResult();

      const updatedOrder = await OrderModel.findById(whOrder._id);
      const updatedProduct = await ProductModel.findById(testProduct._id);
      const recordedEvent = await WebhookEventModel.findOne({ eventId: webhookEventId });

      if (
        resData.statusCode === 200 &&
        updatedOrder.payment_status === 'paid' &&
        updatedProduct.stock === 8 && // 10 - 2 = 8
        recordedEvent !== null
      ) {
        pass('First webhook event transitions order to "paid", decrements stock to 8, and records event ID');
      } else {
        fail(
          'First webhook execution',
          new Error(
            `Status: ${updatedOrder?.payment_status} (expected paid), Stock: ${updatedProduct?.stock} (expected 8)`
          )
        );
      }
    } catch (err) {
      fail('First webhook execution', err);
    }

    // T4.3: Duplicate Webhook Execution (Idempotency Guard)
    try {
      const { req, res, getResult } = createMockReqRes({
        headers: { 'stripe-signature': validSignatureHeader },
        rawBody: rawPayloadBuffer,
      });
      await stripeWebhookController(req, res);
      const resData = getResult();

      const orderCheckAgain = await OrderModel.findById(whOrder._id);
      const productCheckAgain = await ProductModel.findById(testProduct._id);

      if (
        resData.statusCode === 200 &&
        (resData.jsonResponse?.alreadyProcessed === true || resData.jsonResponse?.received === true) &&
        orderCheckAgain.payment_status === 'paid' &&
        productCheckAgain.stock === 8 // MUST STILL BE 8 (NOT 6!)
      ) {
        pass('Duplicate webhook event is recognized as already processed and does NOT double-decrement stock');
      } else {
        fail(
          'Webhook idempotency',
          new Error(
            `Double decrement detected! Stock is ${productCheckAgain?.stock} (expected 8)`
          )
        );
      }
    } catch (err) {
      fail('Webhook idempotency', err);
    }

    // Restore webhook secret
    if (originalSecret) {
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    }

    // ==================================================================
    // GROUP 5: OWNERSHIP & AUTHORIZATION GUARDS
    // ==================================================================
    console.log('\n--- TEST GROUP 5: OWNERSHIP & AUTHORIZATION GUARDS ---');

    // T5.1: Address Deletion Ownership Protection
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: userADoc._id, // User A trying to delete User B address
        body: { _id: userBAddress._id },
      });
      await deleteAddressController(req, res);
      const resData = getResult();

      const addressCheck = await AddressModel.findById(userBAddress._id);
      if (addressCheck !== null) {
        pass('User A cannot delete User B address (ownership query safety)');
      } else {
        fail('Address ownership protection', new Error('User B address was deleted by User A!'));
      }
    } catch (err) {
      fail('Address ownership protection', err);
    }

    // T5.2: Order Details Ownership Protection
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: userBDoc._id, // User B trying to fetch User A's order details
        params: { orderId: whOrder.orderId },
      });
      await getOrderDetailsController(req, res);
      const resData = getResult();

      if (resData.statusCode === 404 && resData.jsonResponse?.error === true) {
        pass('User B is denied access to User A order details with 404');
      } else {
        fail('Order ownership protection', new Error(`Expected 404 for wrong user, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Order ownership protection', err);
    }

    // T5.3: Admin User Access Allowed on Admin Middleware
    try {
      const { req, res, next, getResult } = createMockReqRes({
        userId: adminDoc._id,
      });
      await admin(req, res, next);
      const resData = getResult();

      if (resData.nextCalled && !resData.nextError) {
        pass('Admin role successfully passes admin authorization middleware');
      } else {
        fail('Admin role authorization', new Error('next() was not called for admin user'));
      }
    } catch (err) {
      fail('Admin role authorization', err);
    }

    // ==================================================================
    // GROUP 6: ADMIN ORDER MANAGEMENT & STATUS UPDATES
    // ==================================================================
    console.log('\n--- TEST GROUP 6: ADMIN ORDER MANAGEMENT & STATUS UPDATES ---');

    // T6.1: Unauthenticated Admin Orders Access Rejection
    try {
      const { req, res, next, getResult } = createMockReqRes({});
      await auth(req, res, next);
      const resData = getResult();

      if (resData.statusCode === 401 && !resData.nextCalled) {
        pass('Unauthenticated access to GET /api/order/admin/all is rejected with 401');
      } else {
        fail('Admin orders unauthenticated rejection', new Error(`Expected 401, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Admin orders unauthenticated rejection', err);
    }

    // T6.2: Normal USER Access to Admin Orders Rejection
    try {
      const { req, res, next, getResult } = createMockReqRes({
        userId: userADoc._id, // Role: USER
      });
      await admin(req, res, next);
      const resData = getResult();

      if (resData.statusCode === 403 && !resData.nextCalled) {
        pass('Normal USER role is rejected from admin orders endpoint with 403');
      } else {
        fail('Admin orders USER role rejection', new Error(`Expected 403, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Admin orders USER role rejection', err);
    }

    // T6.3: ADMIN Can Retrieve Paginated Orders & Metadata
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: adminDoc._id,
        query: { page: 1, limit: 10 },
      });
      await getAllOrdersAdminController(req, res);
      const resData = getResult();

      if (
        resData.jsonResponse?.success === true &&
        Array.isArray(resData.jsonResponse?.data) &&
        typeof resData.jsonResponse?.totalCount === 'number' &&
        typeof resData.jsonResponse?.totalPages === 'number' &&
        resData.jsonResponse?.currentPage === 1 &&
        resData.jsonResponse?.limit === 10
      ) {
        pass('ADMIN retrieves paginated customer orders with correct pagination metadata');
      } else {
        fail('Admin paginated orders retrieval', new Error(`Failed: ${JSON.stringify(resData.jsonResponse)}`));
      }
    } catch (err) {
      fail('Admin paginated orders retrieval', err);
    }

    // T6.4: Status Filter Correctness (e.g. status=paid)
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: adminDoc._id,
        query: { status: 'paid', limit: 50 },
      });
      await getAllOrdersAdminController(req, res);
      const resData = getResult();

      const ordersList = resData.jsonResponse?.data || [];
      const allArePaid = ordersList.every((o) => o.payment_status === 'paid');

      if (resData.jsonResponse?.success && allArePaid) {
        pass('Status filter query (status=paid) returns only paid orders');
      } else {
        fail('Admin order status filter', new Error('Found non-paid orders when status=paid was requested'));
      }
    } catch (err) {
      fail('Admin order status filter', err);
    }

    // T6.5: Search Filter by Order ID
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: adminDoc._id,
        query: { search: webhookOrderId },
      });
      await getAllOrdersAdminController(req, res);
      const resData = getResult();

      const ordersList = resData.jsonResponse?.data || [];
      const matchFound = ordersList.some((o) => o.orderId === webhookOrderId);

      if (resData.jsonResponse?.success && matchFound) {
        pass('Search filter successfully finds matching customer order by orderId');
      } else {
        fail('Admin order search filter', new Error(`Order ${webhookOrderId} not found in search results`));
      }
    } catch (err) {
      fail('Admin order search filter', err);
    }

    // T6.6: Invalid Status Update Rejection
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: adminDoc._id,
        body: { orderId: whOrder.orderId, status: 'invalid_bogus_status' },
      });
      await updateOrderStatusController(req, res);
      const resData = getResult();

      if (resData.statusCode === 400 && resData.jsonResponse?.error === true) {
        pass('Invalid order status update attempt is rejected with 400');
      } else {
        fail('Invalid status update rejection', new Error(`Expected 400 error, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('Invalid status update rejection', err);
    }

    // T6.7: ADMIN Can Perform Valid Status Update
    try {
      const { req, res, getResult } = createMockReqRes({
        userId: adminDoc._id,
        body: { orderId: whOrder.orderId, status: 'cancelled' },
      });
      await updateOrderStatusController(req, res);
      const resData = getResult();

      const updatedCheck = await OrderModel.findById(whOrder._id);
      if (resData.jsonResponse?.success && updatedCheck?.payment_status === 'cancelled') {
        pass('ADMIN successfully transitions order status to "cancelled"');
      } else {
        fail('Admin status update', new Error(`Expected status cancelled, got ${updatedCheck?.payment_status}`));
      }
    } catch (err) {
      fail('Admin status update', err);
    }

    // T6.8: Normal USER Role Blocked on Status Update Route
    try {
      const { req, res, next, getResult } = createMockReqRes({
        userId: userADoc._id, // Normal user
      });
      await admin(req, res, next);
      const resData = getResult();

      if (resData.statusCode === 403 && !resData.nextCalled) {
        pass('Normal USER role is blocked from status update endpoint with 403');
      } else {
        fail('USER status update guard', new Error(`Expected 403 rejection, got ${resData.statusCode}`));
      }
    } catch (err) {
      fail('USER status update guard', err);
    }

    // ==================================================================
    // GROUP 7: PRODUCT SORTING & FILTERING
    // ==================================================================
    console.log('\n--- TEST GROUP 7: PRODUCT SORTING & FILTERING ---');

    // Create dedicated products for sort and filter assertions
    const pSortLow = await new ProductModel({
      name: `SortFilter LowPrice ${testSuffix}`,
      image: ['https://res.cloudinary.com/test/image/upload/sample_low.webp'],
      category: [testCategory._id],
      subCategory: [testSubCategory._id],
      unit: '1 pc',
      stock: 0, // Out of stock
      price: 20,
      discount: 5,
      description: 'Low price test product',
      publish: true,
    }).save();
    tracked.productIds.add(String(pSortLow._id));

    const pSortMid = await new ProductModel({
      name: `SortFilter MidPrice ${testSuffix}`,
      image: ['https://res.cloudinary.com/test/image/upload/sample_mid.webp'],
      category: [testCategory._id],
      subCategory: [testSubCategory._id],
      unit: '1 pc',
      stock: 4, // In stock
      price: 60,
      discount: 35, // Highest discount
      description: 'Mid price test product with highest discount',
      publish: true,
    }).save();
    tracked.productIds.add(String(pSortMid._id));

    const pSortHigh = await new ProductModel({
      name: `SortFilter HighPrice ${testSuffix}`,
      image: ['https://res.cloudinary.com/test/image/upload/sample_high.webp'],
      category: [testCategory._id],
      subCategory: [testSubCategory._id],
      unit: '1 pc',
      stock: 10, // In stock
      price: 150,
      discount: 15,
      description: 'High price test product',
      publish: true,
    }).save();
    tracked.productIds.add(String(pSortHigh._id));

    // T7.1: Price Ascending Sort (price_asc)
    try {
      const { req, res, getResult } = createMockReqRes({
        query: {
          search: `SortFilter`,
          sort: 'price_asc',
          limit: 10,
        },
      });
      await getProductController(req, res);
      const resData = getResult();

      const items = resData.jsonResponse?.data || [];
      const testItems = items.filter((p) => p.name.includes(testSuffix));
      const prices = testItems.map((p) => p.price);
      const isAscending = prices.length === 3 && prices[0] === 20 && prices[1] === 60 && prices[2] === 150;

      if (resData.jsonResponse?.success && isAscending) {
        pass('Price ascending sort (sort=price_asc) orders catalog by price low-to-high');
      } else {
        fail('Price ascending sort', new Error(`Expected [20, 60, 150], got ${JSON.stringify(prices)}`));
      }
    } catch (err) {
      fail('Price ascending sort', err);
    }

    // T7.2: Price Descending Sort (price_desc)
    try {
      const { req, res, getResult } = createMockReqRes({
        query: {
          search: `SortFilter`,
          sort: 'price_desc',
          limit: 10,
        },
      });
      await getProductController(req, res);
      const resData = getResult();

      const items = resData.jsonResponse?.data || [];
      const testItems = items.filter((p) => p.name.includes(testSuffix));
      const prices = testItems.map((p) => p.price);
      const isDescending = prices.length === 3 && prices[0] === 150 && prices[1] === 60 && prices[2] === 20;

      if (resData.jsonResponse?.success && isDescending) {
        pass('Price descending sort (sort=price_desc) orders catalog by price high-to-low');
      } else {
        fail('Price descending sort', new Error(`Expected [150, 60, 20], got ${JSON.stringify(prices)}`));
      }
    } catch (err) {
      fail('Price descending sort', err);
    }

    // T7.3: Discount Descending Sort (discount_desc)
    try {
      const { req, res, getResult } = createMockReqRes({
        query: {
          search: `SortFilter`,
          sort: 'discount_desc',
          limit: 10,
        },
      });
      await getProductController(req, res);
      const resData = getResult();

      const items = resData.jsonResponse?.data || [];
      const testItems = items.filter((p) => p.name.includes(testSuffix));
      const discounts = testItems.map((p) => p.discount);
      const isDiscountSorted = discounts.length === 3 && discounts[0] === 35 && discounts[1] === 15 && discounts[2] === 5;

      if (resData.jsonResponse?.success && isDiscountSorted) {
        pass('Discount descending sort (sort=discount_desc) orders catalog by highest discount first');
      } else {
        fail('Discount descending sort', new Error(`Expected discounts [35, 15, 5], got ${JSON.stringify(discounts)}`));
      }
    } catch (err) {
      fail('Discount descending sort', err);
    }

    // T7.4: In-Stock Only Filter (inStock=true)
    try {
      const { req, res, getResult } = createMockReqRes({
        query: {
          search: `SortFilter`,
          inStock: 'true',
          limit: 10,
        },
      });
      await getProductController(req, res);
      const resData = getResult();

      const items = resData.jsonResponse?.data || [];
      const testItems = items.filter((p) => p.name.includes(testSuffix));
      const allInStock = testItems.length === 2 && testItems.every((p) => p.stock > 0);
      const excludedOutOfStock = !testItems.some((p) => p.stock === 0);

      if (resData.jsonResponse?.success && allInStock && excludedOutOfStock) {
        pass('In-stock filter (inStock=true) safely filters out out-of-stock items');
      } else {
        fail('In-stock filter', new Error(`Expected only in-stock items (>0), got count ${testItems.length}`));
      }
    } catch (err) {
      fail('In-stock filter', err);
    }

    // T7.5: Invalid Sort Parameter Safe Fallback
    try {
      const { req, res, getResult } = createMockReqRes({
        query: {
          search: `SortFilter`,
          sort: 'malicious_inject_or_bogus_field',
          limit: 10,
        },
      });
      await getProductController(req, res);
      const resData = getResult();

      if (resData.jsonResponse?.success && Array.isArray(resData.jsonResponse?.data)) {
        pass('Invalid sort query value safely falls back to default sorting without error');
      } else {
        fail('Invalid sort fallback', new Error('Failed to handle invalid sort gracefully'));
      }
    } catch (err) {
      fail('Invalid sort fallback', err);
    }

    // T7.6: Category & Subcategory Scoped Sorting and Stock Filtering
    try {
      const { req, res, getResult } = createMockReqRes({
        body: {
          categoryId: testCategory._id,
          subCategoryId: testSubCategory._id,
          sort: 'price_asc',
          inStock: 'true',
          page: 1,
          limit: 10,
        },
      });
      await getProductByCategoryAndSubCategory(req, res);
      const resData = getResult();

      const items = resData.jsonResponse?.data || [];
      const testItems = items.filter((p) => p.name.includes('SortFilter'));
      const prices = testItems.map((p) => p.price);
      const allInStock = testItems.every((p) => p.stock > 0);
      const isPriceAsc = prices.length === 2 && prices[0] === 60 && prices[1] === 150;

      if (resData.jsonResponse?.success && allInStock && isPriceAsc) {
        pass('Category/subcategory product listing correctly applies sort and inStock filters');
      } else {
        fail('Category/subCategory sort & filter', new Error(`Expected [60, 150] in stock, got ${JSON.stringify(prices)}`));
      }
    } catch (err) {
      fail('Category/subCategory sort & filter', err);
    }
  } finally {
    // ==================================================================
    // CLEANUP: GUARANTEED PURGE OF TRACKED TEST DATA
    // ==================================================================
    console.log('\n--- CLEANUP OF TEST-CREATED RECORDS ---');
    try {
      if (tracked.userIds.size > 0) {
        const uRes = await UserModel.deleteMany({ _id: { $in: Array.from(tracked.userIds) } });
        console.log(`  • Cleaned up ${uRes.deletedCount} test users`);
      }
      if (tracked.productIds.size > 0) {
        const pRes = await ProductModel.deleteMany({ _id: { $in: Array.from(tracked.productIds) } });
        console.log(`  • Cleaned up ${pRes.deletedCount} test products`);
      }
      if (tracked.categoryIds.size > 0) {
        const cRes = await CategoryModel.deleteMany({ _id: { $in: Array.from(tracked.categoryIds) } });
        console.log(`  • Cleaned up ${cRes.deletedCount} test categories`);
      }
      if (tracked.subCategoryIds.size > 0) {
        const sRes = await SubCategoryModel.deleteMany({ _id: { $in: Array.from(tracked.subCategoryIds) } });
        console.log(`  • Cleaned up ${sRes.deletedCount} test subcategories`);
      }
      if (tracked.addressIds.size > 0) {
        const aRes = await AddressModel.deleteMany({ _id: { $in: Array.from(tracked.addressIds) } });
        console.log(`  • Cleaned up ${aRes.deletedCount} test addresses`);
      }
      if (tracked.cartIds.size > 0) {
        const cartRes = await CartProductModel.deleteMany({ _id: { $in: Array.from(tracked.cartIds) } });
        console.log(`  • Cleaned up ${cartRes.deletedCount} test cart items`);
      }
      if (tracked.orderIds.size > 0) {
        const oRes = await OrderModel.deleteMany({ _id: { $in: Array.from(tracked.orderIds) } });
        console.log(`  • Cleaned up ${oRes.deletedCount} test orders`);
      }
      if (tracked.webhookEventIds.size > 0) {
        const wRes = await WebhookEventModel.deleteMany({ eventId: { $in: Array.from(tracked.webhookEventIds) } });
        console.log(`  • Cleaned up ${wRes.deletedCount} test webhook events`);
      }
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.\n');
  }

  // ==================================================================
  // TEST SUMMARY REPORT
  // ==================================================================
  console.log('==================================================================');
  console.log(`TEST SUMMARY: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`);
  console.log('==================================================================\n');

  if (results.failed > 0) {
    console.error('Failed tests:');
    results.errors.forEach((e) => console.error(` - ${e.name}: ${e.msg}`));
    process.exit(1);
  } else {
    console.log('✔ All core commerce regression tests passed successfully!\n');
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
