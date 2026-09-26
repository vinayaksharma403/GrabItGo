import { Router } from 'express';
import { AddSubCategoryController, deleteSubCategoryController, getSubCategoryController, updateSubCategoryController } from '../controllers/subCategory.controller.js';
import auth from '../middleware/auth.js';
import { admin } from '../middleware/Admin.js';

const subCategoryRouter = Router()

subCategoryRouter.post('/create', auth, admin, AddSubCategoryController)
subCategoryRouter.get('/get', getSubCategoryController)
subCategoryRouter.put('/update', auth, admin, updateSubCategoryController)
subCategoryRouter.delete('/delete', auth, admin, deleteSubCategoryController)

export default subCategoryRouter