import sendEmail from '../config/sendEmail.js'
import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js'
import generatedAccessToken from '../utils/generatedAccessToken.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';
import uploadImageCloudinary from '../utils/uploadimageCloudinary.js';
import generateOtp from '../utils/generateOtp.js';
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js';
import jwt from 'jsonwebtoken'

export const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
});


export async function registerUserController(request, response) {
    try {
        const { name, email, password } = request.body;

        if (!name || !email || !password) {
            return response.status(400).json({
                message: "Provide name, email, and password",
                error: true,
                success: false
            });
        }

        // check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return response.json({
                message: "Already register email",
                error: true,
                success: false
            });
        }

        // hash password
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        const payload = {
            name,
            email,
            password: hashPassword
        };

        // create new user
        const newUser = new UserModel(payload);
        const savedUser = await newUser.save();

        // optional: send verification email
        const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${savedUser?._id}`;

        await sendEmail({

            sendTo: email,
            subject: "Verify email from GrabItGo",
            html: verifyEmailTemplate({
                name,
                url: verifyEmailUrl
            })
        });

        // Return sanitized user details only
        return response.status(201).json({
            message: "User registered successfully",
            error: false,
            success: true,
            data: {
                _id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                verify_email: savedUser.verify_email
            }
        });

    } catch (error) {
        console.error(error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}


export async function verifyEmailController(request,response){
    try {
        const {code} = request.body
        const user = await UserModel.findOne({_id : code})

        if (!user){
            return response.status(400).json({
                message : "Invalid code",
                error : true,
                success : false
            })

        }

        const updateUser = await UserModel.updateOne({_id:code},{
            verify_email : true

        })


        return response.json({
            message : "Verification email done",
            success : true,
            error : false

        }) 

    }catch(error){
        return response.status(500).json({
            message : error.messsage || error,
            error : true,
            success : false
        })
    }
}


// login controller

export async function loginController(request,response){
    try {
        const {email,password} = request.body

        if(!email || !password){
            return response.status(400).json({
                message:"provide email,password",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({email})

        if(!user){
            return response.status(400).json({
                message : "User not registered",
                error : true,
                success : false
            })
        }

        if(user.status !== "Active"){
            return response.status(400).json({
                message : "Contact to Admin",
                error : true,
                success : false
            })
        }

        const checkPassword = await bcryptjs.compare(password,user.password)

        if (!checkPassword){
            return response.status(400).json({
                message : "Check your Password",
                error : true,
                success : false
            })
        }

        const accessToken = await generatedAccessToken(user._id)
        const refreshToken = await generatedRefreshToken(user._id)

        const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            last_login_date : new Date()
        })

        const cookiesOption = getCookieOptions()

        response.cookie('accessToken',accessToken,cookiesOption)
        response.cookie('refreshToken',refreshToken,cookiesOption)

        return response.json({
            message : "Login Successfully",
            error : false,
            success : true,
            data : {
                accessToken,
                refreshToken

            }
        })


        

    }catch (error){
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

// logout controller

export async function logoutController(request,response){
    try {
        const userid = request.userId //middleware
        const cookiesOption = getCookieOptions()
        response.clearCookie("accessToken",cookiesOption)
        response.clearCookie("refreshToken",cookiesOption)

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userid,{
            refresh_token : ""
        })

        return response.json({
            message : "Logout successfully",
            error : false,
            success : true
        })

    }catch (error){
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}


// upload user avatar 


export async function uploadAvatar(request,response){
    try{const userId = request.userId // auth middleware
        const image = request.file // multer middleware
        

        const upload = await uploadImageCloudinary(image)

        const updataUser = await UserModel.findByIdAndUpdate(userId,{
            avatar : upload.url
        })

        return response.json({
            message : "upload profile",
            success : true,
            error : false,
            data : {
                _id : userId,
                avatar : upload.url
            }
        })

    }catch(error){
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false 
        })
    }
}


// updata user details 

export async function updateUserDetails(request,response){
    try {
        const userId = request.userId // auth middleware
        const {name,email,mobile,password} = request.body

        let hashPassword = ""

        if(password){
            const salt = await bcryptjs.genSalt(10);
            hashPassword = await bcryptjs.hash(password, salt);
        }

        const updateUser = await UserModel.updateOne({ _id : userId},{
            ...(name && {name : name}),
            ...(email && {email:email}),
            ...(mobile && {mobile:mobile}),
            ...(password && {password:hashPassword})
            


        })

        return response.json({
            message : "Updated Successfully",
            error : false,
            success : true,
            data : updateUser

        })
        
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
        
    }
}

// forgot password not login

export async function forgotPasswordController(request,response){
    try {
        const {email} = request.body
        const user = await UserModel.findOne({email})

        if(!user){
            return response.status(400).json({
                message : "Email not available",
                error : true,
                success : false
            })
        }

        const otp = generateOtp()
        const expireTime = new Date(Date.now() + 60 * 60 * 1000)

        const update = await UserModel.findByIdAndUpdate(user._id,{
            forgot_password_otp : otp,
            forgot_password_expiry : expireTime
        })

        await sendEmail({
            sendTo: email,
            subject: "Forgot Password from GrabItGo ",
            html: forgotPasswordTemplate({
                name: user.name,
                otp: otp,
            }),
        });

        return response.json({
            message: "Check your Email",
            error: false,
            success: true,
        });


        


        
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
        
    }

}

// verify password otp
export async function verifyForgotPasswordOtp(request, response) {
    try {
        const { email, otp } = request.body;

        if (!email || !otp) {
            return response.status(400).json({
                message: "Provide required field email and otp.",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                message: "Email not available",
                error: true,
                success: false
            });
        }

        const currentTime = new Date();
        if (!user.forgot_password_expiry || new Date(user.forgot_password_expiry) < currentTime) {
            return response.status(400).json({
                message: "OTP is expired",
                error: true,
                success: false
            });
        }

        if (String(otp).trim() !== String(user.forgot_password_otp).trim()) {
            return response.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false
            });
        }

        // Generate a 15-minute reset token to authorize the password reset step
        const resetToken = jwt.sign(
            { id: user._id, email: user.email, type: "password_reset" },
            process.env.SECRET_KEY_ACCESS_TOKEN || process.env.SECRET_KEY_REFRESH_TOKEN,
            { expiresIn: '15m' }
        );

        // Invalidate OTP to prevent replay attacks
        await UserModel.findByIdAndUpdate(user._id, {
            forgot_password_otp: "",
            forgot_password_expiry: null
        });

        return response.json({
            message: "Verify otp successful",
            error: false,
            success: true,
            data: {
                resetToken,
                email: user.email
            }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// reset the password 
export async function resetPassword(request, response) {
    try {
        const { email, newPassword, confirmPassword, resetToken, otp } = request.body;

        if (!email || !newPassword || !confirmPassword || (!resetToken && !otp)) {
            return response.status(400).json({
                message: "Provide required fields email, newPassword, confirmPassword, and resetToken.",
                error: true,
                success: false,
            });
        }

        if (newPassword !== confirmPassword) {
            return response.status(400).json({
                message: "newPassword and confirmPassword must be same.",
                error: true,
                success: false,
            });
        }

        let targetUser = null;

        if (resetToken) {
            try {
                const decoded = jwt.verify(
                    resetToken,
                    process.env.SECRET_KEY_ACCESS_TOKEN || process.env.SECRET_KEY_REFRESH_TOKEN
                );

                if (!decoded || decoded.type !== "password_reset") {
                    return response.status(400).json({
                        message: "Invalid reset token.",
                        error: true,
                        success: false,
                    });
                }

                if (decoded.email && decoded.email.toLowerCase() !== email.toLowerCase()) {
                    return response.status(400).json({
                        message: "Reset token does not match email.",
                        error: true,
                        success: false,
                    });
                }

                targetUser = await UserModel.findById(decoded.id);
            } catch (jwtError) {
                return response.status(400).json({
                    message: "Reset authorization expired or invalid. Please request a new OTP.",
                    error: true,
                    success: false,
                });
            }
        } else if (otp) {
            // Backward compatibility fallback for direct OTP submit
            const user = await UserModel.findOne({ email });
            if (!user || !user.forgot_password_otp || !user.forgot_password_expiry) {
                return response.status(400).json({
                    message: "OTP not requested or expired.",
                    error: true,
                    success: false,
                });
            }
            if (new Date(user.forgot_password_expiry) < new Date() || String(otp) !== String(user.forgot_password_otp)) {
                return response.status(400).json({
                    message: "Invalid or expired OTP.",
                    error: true,
                    success: false,
                });
            }
            targetUser = user;
        }

        if (!targetUser) {
            return response.status(400).json({
                message: "User not found.",
                error: true,
                success: false,
            });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(newPassword, salt);

        await UserModel.findByIdAndUpdate(targetUser._id, {
            password: hashPassword,
            forgot_password_otp: "",
            forgot_password_expiry: null,
        });

        return response.json({
            message: "Password updated successfully.",
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

// refresh token controller
export async function refreshToken(request, response) {
    try {
        const refreshToken = request.cookies.refreshToken || request?.headers?.authorization?.split(" ")[1];
        if (!refreshToken) {
            return response.status(401).json({
                message: "Invalid Token",
                error: true,
                success: false
            });
        }

        let verifyToken;
        try {
            verifyToken = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
        } catch (tokenErr) {
            return response.status(401).json({
                message: "Token is expired or invalid",
                error: true,
                success: false
            });
        }

        if (!verifyToken) {
            return response.status(401).json({
                message: "Token is expired",
                error: true,
                success: false
            });
        }

        // Support both id and _id in token payload
        const userId = verifyToken?.id || verifyToken?._id;

        if (!userId) {
            return response.status(401).json({
                message: "Invalid token payload",
                error: true,
                success: false
            });
        }

        const newAccessToken = await generatedAccessToken(userId);

        const cookiesOption = getCookieOptions();

        response.cookie('accessToken', newAccessToken, cookiesOption);

        return response.json({
            message: "New Access token Generated",
            error: false,
            success: true,
            data: {
                accessToken: newAccessToken
            }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function userDetails(request,response){
    try {
        const userId = request.userId

        const user = await UserModel.findById(userId).select('-password -refresh_token')

        return response.json({
            message : "user details",
            data : user,
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : "something is wrong",
            error : true,
            success : false
        })
        
    }
}
