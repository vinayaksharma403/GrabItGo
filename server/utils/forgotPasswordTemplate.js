const forgotPasswordTemplate = ({name,otp})=>{
    return `
<div>
    <p>Dear , ${name}</p>
    <p>You're requested a password reset. Please use following OTP code to resset your password.</p>
    <div style="background:yellow;font-size:20px;padding:20px;text-align:center;font-weight:800;">
        ${otp}
    </div>
    <p>This OTP is valid for 1 Hour only . Enter this OTP in the GrabItGo website to proceed with resetting your password.</p>
    <br/>
    </br>
    <p>Thanks</p>
    <p>GrabItGo</p>

</div>


    
    `
}

export default forgotPasswordTemplate