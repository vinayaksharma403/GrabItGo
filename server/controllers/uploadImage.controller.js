import uploadImageCloudinary from "../utils/uploadimageCloudinary.js"

const uploadImageController = async(request,response)=>{
    try {
        const file = request.file

        if (!file) {
            return response.status(400).json({
                message: "No image file provided",
                error: true,
                success: false
            });
        }

        const uploadImage = await uploadImageCloudinary(file)

        return response.json({
            message : "Upload Done",
            data : uploadImage,
            success : true,
            error : false
        })
    } catch (error) {
       return response.status(500).json({
        message : error.message || error,
        error : true,
        success : false
       }) 
    }
}

export default uploadImageController