const adminModel = require('../Models/adminModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const nodeMailer = require('nodemailer')
const userModel = require('../Models/userModel')
const aritstModel = require('../Models/artistModel')
const artistModel = require('../Models/artistModel')
const categoryModel = require('../Models/categoryModel')
const bannerModel = require('../Models/bannerModel')
const artistDetailModel = require('../Models/artistDetailsModel')
const bookingModel = require('../Models/bookingSchema')
const sharp = require('sharp')
const cloudinary = require('cloudinary').v2
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
    secure: true,
});
const opts = {
    overwrite: true,
    invalidate: true,
    resource_type: "auto",
};

// password hashng
const sequirePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message)
    }
}
// otp generation

const otpGenerate = () => {
    const otp = Math.floor(Math.random() * 9000) + 1000
    return otp
}
// mail sending function

const sendVerifyMail = async (name, email, otp) => {
    try {
        // const subOtp = otp.toString()
        const trasporter = nodeMailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.email,
                pass: process.env.password
            }
        })
        const mailOptions = {
            from: process.env.email,
            to: email,
            subject: 'For verifation mail',
            html: `<p>hi${name} this is your otp${otp}`
        }
        trasporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error.message + '1')
            } else {
                console.log('email has send', info.response)
            }
        })
    } catch (error) {
        console.log(error.message)
    }
}

// login
const login = async (req, res) => {
    try {
        const admin = await adminModel.findOne({ email: req.body.email })
        if (!admin) {
            return res.status(200).send({ message: 'User Does not exist', success: false })
        }
        const isMatch = await bcrypt.compare(req.body.password, admin.password)
        if (!isMatch) {
            return res.status(200)
                .send({ message: 'password inccorect please check', success: false })
        }
        const token = jwt.sign({ id: admin._id }, process.env.ADMIN_SECRET_KEY, {
            expiresIn: "1d"
        })
        res.status(200).send({ message: 'Login successfull', success: true, data: token })
    } catch (error) {
        res.status(500).send({ message: 'Error logged in', success: false, error })
    }
}
// authorization
const authorization = async (req, res) => {
    try {
        const admin = await adminModel.findOne({ _id: req.body.adminId })
        if (!admin) {
            return res.status(200)
                .send({ message: 'admin does not Exist', success: false })
        } else {
            res.status(200)
                .send({
                    success: true, data: {
                        name: admin.name,
                        email: admin.email
                    }
                })
        }
    } catch (error) {
        res.status(500)
            .send({ message: 'Error getting user info', success: false, error })
    }
}
// forgot password
const forgotPassword = async (req, res) => {
    try {
        if (req.body.otp === false) {
            const admin = await adminModel.findOne({ email: req.body.email })
            if (!admin) {
                return res.status(200)
                    .send({ message: 'Invalid Email', success: false })
            }
            const otp = otpGenerate()
            sendVerifyMail(admin.name, req.body.email, otp)
            const otps = otp.toString()
            req.session.email = req.body.email
            res.status(200).send({ message: 'OTP has been sended .please chck your mail', success: true, otp: otps })
        }
    } catch (error) {
        res.status(500).send({ message: 'Forgot password fail', success: false, error })
    }
}
// set password
const setPassword = async (req, res) => {
    try {
        if (req.body.password === req.body.conPassword) {
            const passwordHash = await sequirePassword(req.body.password)
            await adminModel.updateOne({ email: req.session.email }, { $set: { password: passwordHash } })
            return res.status(200).send({ message: 'Password Updated', success: true })
        }
        res.status(200).send({ message: 'There are different password please check', success: false })
    } catch (error) {
        res.status(500).send({ message: 'somthing went worng please check', error })
    }
}

// User manege
const userList = async (req, res) => {
    try {
        const userData = await userModel.find()
        if (!userData) {
            return res.status(200)
                .send({ message: 'Not availble user', success: false })
        }
        res.status(200).send({ message: 'Users', success: true, data: userData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went worng', error })
    }
}

const blockAndUnblock = async (req, res) => {
    try {
        if (req.body.email) {
            const unBlocked = await userModel.findByIdAndUpdate(req.body.id, { otp: 'isVerified' })
            if (unBlocked) {
                const userData = await userModel.find()
                return res.status(200).send({ message: 'user are Unblocked', success: true, data: userData })
            }
        } else {
            const statusUpdated = await userModel.findByIdAndUpdate(req.body.id, { otp: 'Blocked' })
            if (statusUpdated) {
                const userData = await userModel.find()
                res.status(200).send({ message: 'User are Blocked', success: true, data: userData })
            }
        }
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrongs', error })
    }
}

// arist manage

const artistList = async (req, res) => {
    try {
        const artistData = await aritstModel.find()
        if (!artistData) {
            return res.status(200).send({ message: 'Artists not exist', success: false })
        }
        res.status(200).send({ message: 'get artist data', success: true, data: artistData })
    } catch (error) {
        return res.status(500).send({ message: 'somthing went wrong', success: false, error })
    }
}
const artist_Block_And_Unblock = async (req, res) => {
    try {
        if (req.body.email) {
            const unBlocked = await aritstModel.findByIdAndUpdate(req.body.id, { otp: 'isVerified' })
            if (unBlocked) {
                const artistData = await artistModel.find()
                return res.status(200).send({ message: 'user are Unblocked', success: true, data: artistData })
            }
        } else {
            const statusUpdated = await artistModel.findByIdAndUpdate(req.body.id, { otp: 'Blocked' })
            if (statusUpdated) {
                const artistData = await artistModel.find()
                res.status(200).send({ message: 'User are Blocked', success: true, data: artistData })
            }
        }
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrongs', error })
    }
}
const getArtistMoreData = async (req, res) => {
    try {
        const artistMore = await artistDetailModel.findOne({ artist_id: req.body.artist_id })
        if (!artistMore) {
            return res.status(200).send({ message: 'not get artist datas', success: false })
        }
        res.status(200).send({ message: 'artist data get', success: true, data: artistMore })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
// category manage
const addcategory = async (req, res) => {
    try {
        const categoryData = await categoryModel.findOne({ name: req.body.name })
        if (categoryData) {
            return res.status(200).send({ message: 'Category already exist please enter another one', success: false })
        }
        const newCategory = new categoryModel(req.body)
        await newCategory.save()
        res.status(200).send({ message: 'Category added successfully', success: true })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false, error })
    }
}
const getCategoryData = async (req, res) => {
    try {
        const categoryData = await categoryModel.find()
        if (!categoryData) {
            return res.status.send({ messgae: 'somthing went wronog', success: false })
        }
        res.status(200).send({ message: 'data get', success: true, data: categoryData })
    } catch (error) {
        res.status(200).send({ message: 'somthing went wrong', success: false, error })
    }
}

const listAndUnlistCategory = async (req, res) => {
    try {
        if (req.body.unlist === false) {
            await categoryModel.findByIdAndUpdate(req.body.id, { status: true })
            return res.status(200).send({ message: 'Category are listed', success: true })
        } else {
            await categoryModel.findByIdAndUpdate(req.body.id, { status: false })
            res.status(200).send({ message: 'Category are Unlisted', success: true })
        }
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', error })
    }
}

// Banner Manegement

const addbanner = async (req, res) => {
    try {

        const image = req.file.filename;
        await sharp("./uploads/artistImages/" + image)
            .resize(1000, 500)
            .toFile("./uploads/bannerImages/" + image)
        const data = await cloudinary.uploader.upload(
            './uploads/bannerImages/' + image
        )
        const cdnUrl = data.secure_url;
        const bannerData = new bannerModel({
            title: req.body.title,
            discription: req.body.discription,
            image: cdnUrl
        })
        const datas = await bannerData.save()
        res.status(200).send({ message: 'banner data added success full', success: true })

    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', error })
    }
}
const getBannerData = async (req, res) => {
    try {
        const bannerData = await bannerModel.find()
        if (!bannerData) {
            return res.status(200).send({ message: 'Banners Not available', success: false })
        }
        res.status(200).send({ message: 'get banner data', success: true, data: bannerData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', error })
    }
}
const bannerListAndUnlist = async (req, res) => {
    try {
        if (req.body.unlist === false) {
            await bannerModel.findByIdAndUpdate(req.body.id, { status: true })
            return res.status(200).send({ message: 'banner are listed', success: true })
        } else {
            await bannerModel.findByIdAndUpdate(req.body.id, { status: false })
            res.status(200).send({ message: 'banner are Unlisted', success: true })
        }
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
const bookingDatas = async (req, res) => {
    try {
        const bookingData = await bookingModel.aggregate([{ $unwind: '$orders' }])
        if (!bookingData) {
            return res.status(200).send({ message: 'Booking datas Empty', success: false })
        }
        res.status(200).send({ message: 'Booking Data geted', success: true, data: bookingData })
    } catch (error) {
        res.status(500).send({ messsage: 'somthing went wrong ', success: false })
    }
}
const dashBoardData = async (req, res) => {
    try {
        const userData = await userModel.find()
        const artistData = await aritstModel.find()
        const bookingData = await bookingModel.aggregate([{ $unwind: '$orders' }])
        if (!bookingData) {
            return res.status(200).send({ messsage: 'Booking datas is Empty', success: false })
        }
        res.status(200).send({ messge: 'Datas get', success: true, data: bookingData, userData: userData, artistData: artistData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
module.exports = {
    login,
    authorization,
    forgotPassword,
    setPassword,
    userList,
    blockAndUnblock,
    artistList,
    artist_Block_And_Unblock,
    getArtistMoreData,
    addcategory,
    getCategoryData,
    listAndUnlistCategory,
    addbanner,
    getBannerData,
    bannerListAndUnlist,
    bookingDatas,
    dashBoardData
}