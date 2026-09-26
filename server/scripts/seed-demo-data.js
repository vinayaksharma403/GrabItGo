import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

// Resolve server directory & environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_DIR = path.resolve(__dirname, '../');
dotenv.config({ path: path.resolve(SERVER_DIR, '.env') });

// Import Models
import UserModel from '../models/user.model.js';
import AddressModel from '../models/address.model.js';
import ProductModel from '../models/product.model.js';
import CategoryModel from '../models/category.model.js';
import SubCategoryModel from '../models/subCategory.model.js';

// Isolated Demo Domain Identifier
const DEMO_DOMAIN = '@grabitgo.demo';
const DEMO_ADMIN_EMAIL = `demo.admin${DEMO_DOMAIN}`;
const DEMO_CUSTOMER_EMAIL = `demo.customer${DEMO_DOMAIN}`;

const DEMO_CREDENTIALS = {
  admin: {
    name: 'Demo Administrator [DEMO]',
    email: DEMO_ADMIN_EMAIL,
    password: 'DemoAdmin@123',
    role: 'ADMIN',
    mobile: '9876543210',
  },
  customer: {
    name: 'Demo Customer [DEMO]',
    email: DEMO_CUSTOMER_EMAIL,
    password: 'DemoUser@123',
    role: 'USER',
    mobile: '9876543211',
  },
};

async function seedDemoData() {
  const isCleanMode = process.argv.includes('--clean');
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in server/.env');
    process.exit(1);
  }

  console.log('==================================================================');
  console.log('         GRABITGO — DEMO DATA FOUNDATION UTILITY (PHASE 13A)      ');
  console.log('==================================================================\n');

  try {
    await mongoose.connect(mongoUri);
    console.log('✔ Connected to MongoDB successfully.\n');

    // ----------------------------------------------------------------
    // CLEAN MODE: Remove ONLY synthetic demo records
    // ----------------------------------------------------------------
    if (isCleanMode) {
      console.log('🧹 CLEAN MODE ACTIVATED: Purging only isolated demo accounts...');
      
      const demoUsers = await UserModel.find({ email: { $regex: `${DEMO_DOMAIN}$`, $options: 'i' } });
      const demoUserIds = demoUsers.map((u) => u._id);

      if (demoUserIds.length > 0) {
        const addrRes = await AddressModel.deleteMany({ userId: { $in: demoUserIds } });
        const userRes = await UserModel.deleteMany({ _id: { $in: demoUserIds } });
        console.log(`  • Removed ${userRes.deletedCount} demo user account(s)`);
        console.log(`  • Removed ${addrRes.deletedCount} demo address record(s)`);
      } else {
        console.log('  • No demo records found to clean.');
      }

      console.log('\n✔ Demo data cleanup complete.\n');
      return;
    }

    // ----------------------------------------------------------------
    // SEED MODE: Safe, Idempotent Creation of Demo Records
    // ----------------------------------------------------------------
    console.log('🌱 SEED MODE: Ensuring isolated demo accounts exist...\n');

    // 1. Demo Administrator
    let adminUser = await UserModel.findOne({ email: DEMO_ADMIN_EMAIL });
    if (!adminUser) {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(DEMO_CREDENTIALS.admin.password, salt);

      adminUser = await new UserModel({
        name: DEMO_CREDENTIALS.admin.name,
        email: DEMO_CREDENTIALS.admin.email,
        password: hashedPassword,
        role: DEMO_CREDENTIALS.admin.role,
        mobile: DEMO_CREDENTIALS.admin.mobile,
        verify_email: true,
        status: 'Active',
      }).save();

      console.log(`  ✔ Created Demo Admin: ${DEMO_ADMIN_EMAIL}`);
    } else {
      console.log(`  ℹ Demo Admin already exists: ${DEMO_ADMIN_EMAIL} (skipped)`);
    }

    // 2. Demo Customer
    let customerUser = await UserModel.findOne({ email: DEMO_CUSTOMER_EMAIL });
    if (!customerUser) {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(DEMO_CREDENTIALS.customer.password, salt);

      customerUser = await new UserModel({
        name: DEMO_CREDENTIALS.customer.name,
        email: DEMO_CREDENTIALS.customer.email,
        password: hashedPassword,
        role: DEMO_CREDENTIALS.customer.role,
        mobile: DEMO_CREDENTIALS.customer.mobile,
        verify_email: true,
        status: 'Active',
      }).save();

      console.log(`  ✔ Created Demo Customer: ${DEMO_CUSTOMER_EMAIL}`);
    } else {
      console.log(`  ℹ Demo Customer already exists: ${DEMO_CUSTOMER_EMAIL} (skipped)`);
    }

    // 3. Demo Delivery Address for Customer
    const existingAddress = await AddressModel.findOne({ userId: customerUser._id });
    if (!existingAddress) {
      const demoAddress = await new AddressModel({
        address_line: 'Flat 402, Greenfield Apartments, Sector 14',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122001',
        country: 'India',
        mobile: '9876543211',
        status: true,
        userId: customerUser._id,
      }).save();

      await UserModel.findByIdAndUpdate(customerUser._id, {
        $addToSet: { address_details: demoAddress._id },
      });

      console.log('  ✔ Created Demo Customer Delivery Address');
    } else {
      console.log('  ℹ Demo Customer Address already exists (skipped)');
    }

    // 4. Catalog Baseline Verification (Strictly READ-ONLY)
    const [productCount, categoryCount, subCategoryCount] = await Promise.all([
      ProductModel.countDocuments(),
      CategoryModel.countDocuments(),
      SubCategoryModel.countDocuments(),
    ]);

    console.log('\n--- CATALOG BASELINE (READ-ONLY) ---');
    console.log(`  • Categories:    ${categoryCount}`);
    console.log(`  • Subcategories: ${subCategoryCount}`);
    console.log(`  • Products:      ${productCount}`);
    console.log('  • Production catalog unmodified: 100% intact.\n');

    // ----------------------------------------------------------------
    // DEMO CREDENTIALS REPORT
    // ----------------------------------------------------------------
    console.log('==================================================================');
    console.log('                     DEMO CREDENTIALS REPORT                      ');
    console.log('==================================================================');
    console.log('ADMINISTRATOR (Full catalog & order management access):');
    console.log(`  Email:    ${DEMO_CREDENTIALS.admin.email}`);
    console.log(`  Password: ${DEMO_CREDENTIALS.admin.password}`);
    console.log(`  Role:     ${DEMO_CREDENTIALS.admin.role}`);
    console.log('------------------------------------------------------------------');
    console.log('CUSTOMER (Standard shopping, cart, and order history access):');
    console.log(`  Email:    ${DEMO_CREDENTIALS.customer.email}`);
    console.log(`  Password: ${DEMO_CREDENTIALS.customer.password}`);
    console.log(`  Role:     ${DEMO_CREDENTIALS.customer.role}`);
    console.log('==================================================================');
    console.log('NOTE: These are synthetic credentials intended exclusively for');
    console.log('local evaluation, manual testing, and portfolio demonstrations.');
    console.log('To remove demo records at any time, run:');
    console.log('  node server/scripts/seed-demo-data.js --clean\n');
  } catch (error) {
    console.error('❌ Error during demo seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedDemoData();
