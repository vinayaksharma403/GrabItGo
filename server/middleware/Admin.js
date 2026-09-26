import UserModel from "../models/user.model.js"

export const admin = async (request, response, next) => {
    try {
        const userId = request.userId

        if (!userId) {
            return response.status(401).json({
                message: "Authentication required",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findById(userId)

        if (!user || user.role !== 'ADMIN') {
            return response.status(403).json({
                message: "Permission denied. Admin access required.",
                error: true,
                success: false
            })
        }

        next()
    } catch (error) {
        return response.status(500).json({
            message: "Failed to authorize user",
            error: true,
            success: false
        })
    }
}