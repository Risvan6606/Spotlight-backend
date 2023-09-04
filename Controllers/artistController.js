const artistModel = require('../Models/artistModel')
const bcrypt = require('bcrypt')
const nodeMailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const sharp = require('sharp')
const artistMoreDetailsModel = require('../Models/artistDetailsModel')
const bannerModel = require('../Models/bannerModel')
const notificationModel = require('../Models/artistNotificationModel')
const userNotificationModel = require('../Models/userNotificationModel')
const bookingModel = require('../Models/bookingSchema')
const categoryModel = require('../Models/categoryModel')
const mongoose = require('mongoose');
const mediaModel = require('../Models/mediaModel')
const userModel = require('../Models/userModel')
const chatModel = require('../Models/chatModel')
const ratingModel = require('../Models/ratingModel')
const cloudinary = require('cloudinary').v2
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true,
});
// otp generation
const otpGenerate = () => {
    const otp = Math.floor(Math.random() * 9000) + 1000
    return otp
}
// mail sending function
const sendVerifyMail = async (name, email, otp) => {
    try {
        const subOtp = otp.toString()
        const trasporter = nodeMailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        })
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'For verifation mail',
            html: `<p>hi${name} this is your otp${otp}`
        }
        trasporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error.message)
            } else {
                console.log('email has send', info.response)
            }
        })
    } catch (error) {
        console.log(error.message)
    }
}
// pasword hashing
const sequirePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message)
    }
}
// sign Up
const signUp = async (req, res) => {
    try {
        const otpData = await artistModel.findOne({ otp: req.body.otp })
        if (otpData) {
            await artistModel.updateOne({ email: req.body.email }, { $set: { otp: 'isVerified' } })
            return res.status(200).send({ message: 'Registration success', success: 'isVerified' })
        }
        if (req.body.firstName.trim().length === 0) {
            return res.status(200).send({ message: 'Space not allowed', success: 'name_space' })
        } else if (req.body.lastName.trim().length === 0) {
            return res.status(200).send({ message: 'Space not allowed', success: 'last_name' })
        } else if (req.body.mobile.trim().length === 0 || req.body.mobile.length < 9 || req.body.mobile.length > 10) {
            return res.status(200).send({ message: 'please enter valid mobile number', success: 'number_valid' })
        } else if (req.body.password.trim().length === 0) {
            return res.status(200).send({ message: 'Space not allowed', success: 'password_space' })
        } else {
            const Exist = await artistModel.findOne({ email: req.body.email })
            if (Exist) {
                return res.status(200).send({ message: 'Email already Exist please check your email', success: 'Exist' })
            }
            const fullName = req.body.firstName.concat(' ', req.body.lastName)
            const otp = otpGenerate()
            sendVerifyMail(fullName, req.body.email, otp)
            const subOtp = otp.toString()
            const passwordHash = await sequirePassword(req.body.password)
            req.body.password = passwordHash
            const newArtist = new artistModel(req.body)
            await newArtist.save();
            await artistModel.updateOne({ email: req.body.email }, { $set: { otp: otp } })
            res.status(200).send({ message: 'Opt sended your mail', success: true, otp: subOtp })
        }
    } catch (error) {
        res.status(500).send({ message: 'Registration Failed', success: false })
    }
}
const login = async (req, res) => {
    try {
        const user = await artistModel.findOne({ email: req.body.email })
        if (!user) {
            return res.status(200).send({ message: 'User not exist please sign Up ', success: false })
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password)
        if (!isMatch) {
            return res.status(200).send({ message: 'Password incorrect please check', success: false })
        }
        if (user.otp === 'isVerified') {
            const token = jwt.sign({ id: user._id }, process.env.ARTIST_SECRET_KEY, {
                expiresIn: "1d"
            })
            res.status(200).send({ message: 'Login successfull', success: true, data: token })
        } else if (user.otp === 'Blocked') {
            return res.status(200).send({ message: 'You are in Blocked', success: false })
        }
        else {
            res.status(200).send({ message: 'please sign up ', success: false })
        }
    } catch (error) {
        res.status(500).send({ message: 'Error logged in ', success: false, error })
    }
}
const authorization = async (req, res) => {
    try {
        const artist = await artistModel.findOne({ _id: req.body.artistId })
        if (!artist) {
            return res
                .status(200).send({ message: 'Artist does not Exist', success: false })
        } else {
            res.status(200).send({
                success: true, data: {
                    name: artist.firstName,
                    email: artist.email,
                    id: artist._id
                }
            })
        }
    } catch (error) {
        res.status(500)
            .send({ message: 'Error getting user info', success: false, error })
    }
}
const forgotPassword = async (req, res) => {
    try {
        if (req.body.otp === false) {
            const artist = await artistModel.findOne({ email: req.body.email })
            if (!artist) {
                return res.status(200)
                    .send({ message: 'Invalid Email', success: false })
            }
            const otp = otpGenerate()
            const fullName = artist.firstName.concat(' ', artist.lastName)
            sendVerifyMail(fullName, req.body.email, otp)
            const otps = otp.toString()
            req.session.email = req.body.email
            res.status(200).send({ message: 'OTP has been sended .please chck your mail', success: true, otp: otps })
        }
    } catch (error) {
        res.status(500).send({ message: 'Forgot password fail', success: false, error })
    }
}
const setPassword = async (req, res) => {
    try {
        if (req.body.password === req.body.conPassword) {
            const passwordHash = await sequirePassword(req.body.password)
            await artistModel.updateOne({ email: req.session.email }, { $set: { password: passwordHash, otp: 'isVerified' } })
            return res.status(200).send({ message: 'Password Updated', success: true })
        }
        res.status(200).send({ message: 'There are different password please check', success: false })
    } catch (error) {
        res.status(500).send({ message: 'somthing went worng please check', error })
    }
}
const artistMoreDetails = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(200).send({ message: 'No image uploaded', success: 'image' })
        }
        const moreData = await artistMoreDetailsModel.findOne({ artist_id: req.body.artistId })
        if (moreData) {
            return res.status(200).send({ message: 'artist already exist', success: false })
        }
        else if (req.body.firstName.trim().length === 0) {
            return res.status(200).send({ message: 'Space not allowed', success: 'firstName' })
        } else if (req.body.lastName.trim().length === 0) {
            return res.status(200).send({ message: 'space not allowed', success: 'lastName' })
        } else if (req.body.mobile.trim().length === 0 || req.body.mobile.length < 10 || req.body.mobile.length > 10) {
            return res.status(200).send({ message: 'please enter valid mobile nomber', success: 'mobile' })
        } else if (req.body.minBudget.trim().length === 0) {
            return res.status(200).send({ message: 'space not allowed', success: 'min' })
        } else if (req.body.discription.trim().length === 0) {
            return res.status(200).send({ message: 'Space not allowed', success: 'dis' })
        }
        else {
            const image = req.file.filename;
            await sharp("./uploads/artistImages/" + image)
                .resize(500, 500)
                .toFile("./uploads/profilImage/" + image)
            const data = await cloudinary.uploader.upload(
                "./uploads/profilImage/" + image
            );
            const cdnUrl = data.secure_url;
            const categoryData = await categoryModel.findOne({ name: req.body.category })
            const artistMoreData = new artistMoreDetailsModel({
                artist_id: req.body.artistId,
                category_id: categoryData._id,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                mobile: req.body.mobile,
                category: req.body.category,
                midBudjet: req.body.minBudget,
                availble: req.body.availability,
                discription: req.body.discription,
                image: cdnUrl
            })
            await artistMoreData.save();
            res.status(200).send({ message: 'successfulll', success: true })
        }
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false, error })
    }
}

const profileData = async (req, res) => {
    try {
        const artistMore = await artistMoreDetailsModel.findOne({ artist_id: req.body.artistId })
        const mediaData = await mediaModel.aggregate([{ $unwind: '$videos' }, {
            $match: { artistId: req.body.artistId }
        }])
        const reviewData = await ratingModel.findOne({ artist_id: req.body.artistId })
        const personal = await artistModel.findById(req.body.artistId)
        if (!artistMore) {
            return res.status(200).send({ message: 'No datas', success: false, personal: personal })
        }
        res.status(200).send({ message: 'artist datas get', success: true, data: artistMore, personal: personal, mediaData: mediaData, reviewData: reviewData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}

// edit profile
const editProfile = async (req, res) => {
    try {
        if (req.file) {
            const image = req.file.filename;
            await sharp("./uploads/artistImages/" + image)
                .resize(500, 500)
                .toFile("./uploads/profilImage/" + image)
            const data = await cloudinary.uploader.upload(
                "./uploads/profilImage/" + image
            )
            const cdnUrl = data.secure_url;
            await artistMoreDetailsModel.updateOne({ artist_id: req.body.artistId },
                {
                    $set:
                    {
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        mobild: req.body.mobile,
                        category: req.body.category,
                        midBudjet: req.body.midbudjet,
                        availble: req.body.availble,
                        discription: req.body.discription,
                        image: cdnUrl
                    }
                }
            )
            await artistModel.findByIdAndUpdate(req.body.artistId,
                {
                    $set:
                    {
                        firstName: req.body.firstName, lastName: req.body.lastName, mobile: req.body.mobile
                    }
                }
            )

        } else {
            await artistMoreDetailsModel.updateOne({ artist_id: req.body.artistId },
                {
                    $set:
                    {
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        mobild: req.body.mobile,
                        category: req.body.category,
                        midBudjet: req.body.midbudjet,
                        availble: req.body.availble,
                        discription: req.body.discription,
                    }
                }
            )
            await artistModel.findByIdAndUpdate(req.body.artistId,
                {
                    $set:
                    {
                        firstName: req.body.firstName, lastName: req.body.lastName, mobile: req.body.mobile
                    }
                }
            )
        }
        res.status(200).send({ message: 'Profile updated', success: true })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}

const getBannerData = async (req, res) => {
    try {
        const bannerData = await bannerModel.find({ status: true })

        if (!bannerData) {
            return res.status(200).send({ message: 'not get Banner data', success: false })
        }
        const notificationData = await notificationModel.findOne({ artist_id: req.body.artistId })
        res.status(200).send({
            message: 'Banner data getting successfull', success: true, data: bannerData, notification: notificationData,
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: 'Somthing went wrong', success: false, error })
    }
}
// notifications
// catefory
const categoryData = async (req, res) => {
    try {
        const categoryData = await categoryModel.find()
        if (!categoryData) {
            return res.status(200).send({ message: 'categoroy data getting fail', success: false })
        }
        res.status(200).send({ message: 'categry data get', success: true, data: categoryData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}

const notificationData = async (req, res) => {
    try {
        const moreData = await artistMoreDetailsModel.findOne({ artist_id: req.body.artistId })
        const notificationData = await notificationModel.findOne({ artist_id: req.body.artistId })
        if (!notificationData) {
            return res.status(200).send({ message: 'notificatications are Empty', success: false, profile: moreData })
        }
        const showDatas = notificationData.notifications.filter(trues => trues.status === true)
        res.status(200).send({ message: 'notification Data get', success: true, data: showDatas, profile: moreData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}

// booking Data
const bookingDatas = async (req, res) => {
    try {
        const bookingData = await bookingModel.findOne({ artist_id: req.body.artistId })
        const singleDatas = bookingData.orders.filter(datas => datas._id.toString() === req.body.booking_id)
        if (!bookingData) {
            return res.status(200).send({ message: 'Booking data getting fail', success: false })
        } else {
            res.status(200).send({ message: 'Booking data get success full', success: true, data: singleDatas })
        }
    } catch (error) {
        console.log(error, 'comes')
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
// booking accept and reject 
const acceptAndReject = async (req, res) => {
    try {
        if (req.body.id && req.body.email) {
            await bookingModel.updateOne({ artist_id: req.body.artistId, "orders._id": req.body.id }, { $set: { "orders.$.status": "Rejected" } })
            await notificationModel.updateOne({ artist_id: req.body.artistId, "notifications.booking_id": req.body.id }, { $set: { "notifications.$.status": false } })

            const datas = await bookingModel.findOne({ artist_id: req.body.artistId })
            const users = datas.orders.filter((items) => items._id.toString() === req.body.id)
            const booking_id = users[0]._id
            const userNotificationData = await userNotificationModel.findOne({ user_id: req.body.user_id })
            if (userNotificationData) {
                await userNotificationModel.updateOne({ user_id: req.body.user_id },
                    {
                        $push:
                        {
                            notifications:
                            {
                                name: "your booking has been Rejected",
                                booking_id: booking_id,
                                Actions: 'Rejected',
                                timestamp: new Date(),
                            }
                        }
                    })
            } else {
                const notificationData = new userNotificationModel({
                    user_id: req.body.user_id,
                    notifications: [
                        {
                            name: "your booking has been Rejected",
                            booking_id: booking_id,
                            Actions: 'Rejected',
                            timestamp: new Date(),
                        }
                    ]
                })
                await notificationData.save()
            }

            const userNotification = await userNotificationModel.findOne({ user_id: req.body.user_id })
            const notificationData = userNotification.notifications.filter(notiy => notiy.status === true)
            res.status(200).send({ message: 'Booking has been rejected', success: true, userNotification: notificationData.length })
        } else {
            await bookingModel.updateOne({ artist_id: req.body.artistId, "orders._id": req.body.id }, { $set: { "orders.$.status": "Accepted" } })
            await notificationModel.updateOne({ artist_id: req.body.artistId, "notifications.booking_id": req.body.id }, { $set: { "notifications.$.status": false } })

            const datas = await bookingModel.findOne({ artist_id: req.body.artistId })
            const users = datas.orders.filter((items) => items._id.toString() === req.body.id)
            const booking_id = users[0]._id

            const userNotificationData = await userNotificationModel.findOne({ user_id: req.body.user_id })
            if (userNotificationData) {
                await userNotificationModel.updateOne({ user_id: req.body.user_id },
                    {
                        $push:
                        {
                            notifications:
                            {
                                name: "your booking has been accepted",
                                booking_id: booking_id,
                                Actions: 'Accepted',
                                timestamp: new Date(),
                            }
                        }
                    })
            } else {

                const notificationData = new userNotificationModel({
                    user_id: req.body.user_id,
                    notifications: [
                        {
                            name: "your booking has been accepted",
                            booking_id: booking_id,
                            Actions: 'Accepted',
                            timestamp: new Date(),
                        }
                    ]
                })
                await notificationData.save()
            }
            const userNotification = await userNotificationModel.findOne({ user_id: req.body.user_id })
            const notificationData = userNotification.notifications.filter(notiy => notiy.status === true)
            res.status(200).send({ message: 'Booking has been rejected', success: true, userNotification: notificationData.length })
        }
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false, })
    }
}
// accepted bookings

const allBookings = async (req, res) => {
    try {
        const bookingData = await bookingModel.aggregate([{ $unwind: "$orders" }, { $match: { artist_id: req.body.artistId } }])
        if (!bookingData) {
            return res.status(200).send({ message: 'No bookings', success: false })
        }
        res.status(200).send({ message: 'Bookings get', success: true, data: bookingData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}

// Cancel booking
const cancelBooking = async (req, res) => {
    try {
        await bookingModel.findOneAndUpdate({ 'orders._id': req.body.booking_id }, {
            $set: {
                "orders.$.status": "Cancel",
            }
        })
        const bookingData = await bookingModel.aggregate([

            {
                $unwind: '$orders'
            }, {
                $match: {
                    'orders._id': new mongoose.Types.ObjectId(req.body.booking_id)
                }
            }
        ]);
        const artistMore = await artistMoreDetailsModel.findOne({ artist_id: req.body.artistId })
        await userNotificationModel.updateOne({
            user_id: bookingData[0].orders.user_id
        },
            {
                $push:
                {
                    notifications:
                    {
                        name: `${artistMore.firstName} ${artistMore.lastName} cancelled your Booking`,
                        booking_id: req.body.booking_id,
                        Actions: 'Cancel',
                        timestamp: new Date(),
                    }
                }
            }
        )
        const notifcation = await userNotificationModel.findOne({ user_id: bookingData[0].orders.user_id })
        const notificationData = notifcation.notifications.filter(notiy => notiy.status === true)
        res.status(200).send({ message: 'Cancellation succuss full', success: true, count: notificationData.length, room: bookingData[0].orders.user_id })
    } catch (error) {
        res.status(500).send({ message: '' })
    }
}



// posting videos
const createMedia = async (req, res) => {
    const { name, artistId } = req.body;

    let videosData = req.files.videos.map(video => ({
        video: '/' + video.path,
        name: name,
        createdAt: new Date(),
    }));

    try {
        const mediaData = await mediaModel.findOne({ artistId: artistId });
        if (!mediaData) {
            const createMediaResult = await mediaModel.create({
                artistId,
                videos: videosData
            });
            res.status(200).send({ message: 'Media created successfully', success: true, createMediaResult });
        } else {
            await mediaModel.findOneAndUpdate(
                { artistId: artistId },
                {
                    $push: {
                        videos: { $each: videosData },
                    },
                }
            );
            res.status(200).send({ message: 'Media updated successfully', success: true });
        }
    } catch (error) {

        res.status(500).json(error);
    }
};

// partner- data

const partnerData = async (req, res) => {
    try {
        const bookingData = await bookingModel.aggregate([{ $unwind: '$orders' }, { $match: { 'orders.payment_id': req.body.id } }])
        const userData = await userModel.findOne({ _id: bookingData[0].orders.user_id })
        if (!userData) {
            return res.status(200).send({ message: 'user Datas are empty', success: false })
        }
        res.status(200).send({ message: 'User data get', success: true, data: userData, bookingData: bookingData })
    } catch (error) {
        res.status(500).send({ message: 'somthin went wrong ', success: false })
    }
}

// chat histry

const getChatHistory = async (req, res) => {
    try {
        const chatData = await chatModel.aggregate([{ $unwind: '$history' }, { $match: { room_id: req.body.id } }])
        if (!chatData) {
            return res.status(200).send({ message: 'No chat history', success: false })
        }
        res.status(200).send({ message: 'success full', success: true, chatData: chatData, userId: req.body.artistId })
    } catch (error) {
        res.status(500).send({ messasge: 'somthing went wrong', success: false })
    }

}

const dashbordData = async (req, res) => {
    try {
        const bookingData = await bookingModel.aggregate([{ $unwind: '$orders' }, { $match: { artist_id: req.body.artistId } }])
        const filteredData = bookingData.filter(item => item.orders.status === 'Booked' || item.orders.status === 'Completed' || item.orders.status === 'Complete' || item.orders.status === 'waiting fullPayment');
        const uniqueUserIds = [];
        bookingData.filter(item => {
            if (!uniqueUserIds.includes(item.orders.user_id)) {
                uniqueUserIds.push(item.orders.user_id);
                return true;
            }
            return false;
        });
        if (!filteredData || filteredData.length < 1) {
            return res.status(200).send({ message: 'Booking Datas Empty', success: false })
        }
        res.status(200).send({ message: 'get all booking datas ', success: true, data: filteredData, userData: uniqueUserIds })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong ', success: false })
    }
}

const chathistorys = async (req, res) => {
    try {
        const bookingData = await bookingModel.aggregate([{ $unwind: '$orders' },
        { $match: { 'orders.status': 'Booked', artist_id: req.body.artistId } },
        { $project: { _id: 0, 'orders.user_id': 1, 'orders.payment_id': 1 } }])
        if (!bookingData || bookingData.length < 1) {
            return res.status(200).send({ message: 'No chat history', success: false })
        }
        res.status(200).send({ message: 'Chat history', success: true, chat: bookingData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
const contact = async (req, res) => {
    try {
        var usersData = []
        for (let i = 0; i < req.body.length; i++) {
            const userData = await userModel.findOne({ _id: req.body[i].orders.user_id })
            usersData.push({
                ...userData.toObject(),
                payment_id: req.body[i].orders.payment_id
            });

        }
        if (usersData.length < 0) {
            return res.status(200).send({ message: 'somthing went wrong', success: false })
        }
        res.status(200).send({ message: 'contact get', success: true, data: usersData })

    } catch (error) {
        res.status(500).send({ messag: 'somting went wrong', success: false })
    }
}

module.exports = {
    signUp,
    login,
    authorization,
    forgotPassword,
    setPassword,
    artistMoreDetails,
    profileData,
    editProfile,
    categoryData,
    getBannerData,
    notificationData,
    bookingDatas,
    acceptAndReject,
    allBookings,
    cancelBooking,
    createMedia,
    partnerData,
    getChatHistory,
    dashbordData,
    chathistorys,
    contact
}