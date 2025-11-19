import { Router } from 'express'
import auth from '../middleware/auth.js'
import { addAddressController, getAddressController, updateAddressController, deleteAddressController } from '../controllers/address.controller.js'

const addressRouter = Router()

addressRouter.post('/add', auth, addAddressController)
addressRouter.get('/get', auth, getAddressController)
addressRouter.put('/update', auth, updateAddressController)
addressRouter.delete('/delete', auth, deleteAddressController)

export default addressRouter
