import AddressModel from "../models/address.model.js";

export async function addAddressController(request, response) {
    try {
        const userId = request.userId; // from auth middleware
        const { address_line, city, state, pincode, country, mobile } = request.body;

        if (!address_line || !city || !state || !pincode || !country || !mobile) {
            return response.status(400).json({
                message: "Provide address_line, city, state, pincode, country, mobile",
                error: true,
                success: false
            });
        }

        const createAddress = new AddressModel({
            userId: userId,
            address_line,
            city,
            state,
            pincode,
            country,
            mobile
        });

        const saveAddress = await createAddress.save();

        return response.json({
            message: "Address created successfully",
            error: false,
            success: true,
            data: saveAddress
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function getAddressController(request, response) {
    try {
        const userId = request.userId; // from auth middleware

        const data = await AddressModel.find({ userId: userId }).sort({ createdAt: -1 });

        return response.json({
            message: "Address list fetched successfully",
            error: false,
            success: true,
            data: data
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function updateAddressController(request, response) {
    try {
        const userId = request.userId; // from auth middleware
        const { _id, address_line, city, state, pincode, country, mobile } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "Provide address _id",
                error: true,
                success: false
            });
        }

        const updateAddress = await AddressModel.updateOne({ _id: _id, userId: userId }, {
            ...(address_line && { address_line }),
            ...(city && { city }),
            ...(state && { state }),
            ...(pincode && { pincode }),
            ...(country && { country }),
            ...(mobile && { mobile })
        });

        return response.json({
            message: "Address updated successfully",
            error: false,
            success: true,
            data: updateAddress
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function deleteAddressController(request, response) {
    try {
        const userId = request.userId; // from auth middleware
        const { _id } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "Provide address _id",
                error: true,
                success: false
            });
        }

        const deleteAddress = await AddressModel.deleteOne({ _id: _id, userId: userId });

        return response.json({
            message: "Address deleted successfully",
            error: false,
            success: true,
            data: deleteAddress
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}
