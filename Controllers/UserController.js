const userModel = require("../Models/userModel");
const bcrypt = require('bcrypt');
const nodeMailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const bannerModel = require('../Models/bannerModel')
const artistDetailsModel = require('../Models/artistDetailsModel')
const bookingModel = require('../Models/bookingSchema')
const notificationModel = require('../Models/artistNotificationModel');
const artistModel = require("../Models/artistModel");
const categoryModel = require('../Models/categoryModel')
const sharp = require('sharp')
const userNotificationModel = require('../Models/userNotificationModel')
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const mediaModel = require('../Models/mediaModel');
const ratingModel = require('../Models/ratingModel')
const chatModel = require('../Models/chatModel')

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_kEY_SECRET
});

const cloudinary = require('cloudinary').v2
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true,
});




// date Converting
const dateFormate = (dates) => {
    const timestamp = dates;
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const formattedDate = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    return formattedDate
}
// otp generating

const otpGenerate = () => {
    const otp = Math.floor(Math.random() * 9000) + 1000
    return otp
}
// mail send
// var otps;  
const sendVerifyMail = async (name, email) => {
    try {
        const otp = otpGenerate()
        const subOtp = otp.toString()
        await userModel.updateOne({ email: email }, { $set: { otp: subOtp } })
        console.log(subOtp, 'sendle')
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
            html: `< p > Hi ${name} this is your otp${otp} `
        }
        // Object.freeze(mailOptions);
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
const signUp = async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.body.email })
        if (user) {
            return res.status(200)
                .send({ message: 'User already Exist ', success: false })
        }
        if (req.body.first_name.trim().length === 0 ||
            req.body.last_name.trim().length === 0 ||
            req.body.mobile.trim().length === 0 ||
            req.body.password.trim().length === 0) {
            return res.status(200).send({ message: 'space not allowed', success: false })
        } else if (req.body.mobile.length < 10 || req.body.mobile.length > 10) {
            return res.status(200).send({
                message: 'Please Enter valid mobile Nomber', success: false
            })
        } else {
            const password = req.body.password;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            req.body.password = hashedPassword;
            const newUser = new userModel(req.body);
            await newUser.save();
            const fullName = req.body.first_name.concat(' ', req.body.last_name)
            sendVerifyMail(fullName, req.body.email)
            res.status(200).send({
                message: 'Otp has send', success: true
            });
        }
    } catch (error) {
        res.status(500).send({ message: 'sothing went wrong', success: false })
    }
}
const otp = async (req, res) => {
    try {
        const userOtp = await userModel.findOne({ otp: req.body.otp })
        if (!userOtp) {
            return res.status(200).send({ message: 'Otp has inccrect please check', succss: false })
        }
        await userModel.updateOne({ otp: req.body.otp }, { $set: { otp: 'isVerified' } });
        res.status(200).send({ message: 'Registration successfull ', success: true })
    } catch (error) {
        res.status(500).send({ message: 'somthing went worng', success: false })
    }
}



// Login
const login = async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.body.email })
        if (!user) {
            return res
                .status(200).send({ message: 'User Does not exist', success: false })
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password)
        if (!isMatch) {
            return res
                .status(200).send({ message: "Password is incorrect", success: false })
        } else {
            if (user.otp === 'isVerified') {
                const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
                    expiresIn: "1d"
                })
                res.status(200).send({ message: "Login SuccessFull", success: true, data: token })
            } else {
                res.status(200).send({ message: 'you are in Blocked', success: false })
            }
        }
    } catch (error) {
        res.status(500).send({ message: "Error logged in", success: false, error })
    }
}
// forgot password
const forgot = async (req, res) => {
    try {
        const user = await userModel.findOne({ mobile: req.body.mobile })
        if (!user) {
            return res
                .status(200).send({ message: 'User Not exist', success: false })
        } else {
            req.session.mobile = req.body.mobile
            res
                .status(200).send({ message: 'User exist', success: true })

        }
    } catch (error) {
        res.status(500).send({ message: 'Error forgot', success: false, error })
    }
}
const sequirePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message)
    }
}
const setPassword = async (req, res) => {
    try {
        if (req.body.password === req.body.conPassword && req.body.password.trim().length !== 0) {
            console.log(req.session.mobile);
            const passwordHash = await sequirePassword(req.body.password)
            await userModel.updateOne({ mobile: req.session.mobile }, { $set: { password: passwordHash } })
            res.status(200).send({ message: 'Password has been updated', success: true })
        } else {
            res.status(200).send({ message: 'password updation faild please try again', success: false })
        }
    } catch (error) {
        res.status(500).send({ message: 'Password updation  faild', success: false, error })
    }
}

const authorization = async (req, res) => {
    try {

        const user = await userModel.findOne({ _id: req.body.userId })
        if (!user) {
            return res
                .status(200).send({ message: 'user does not Exist', success: false })
        } else {
            res.status(200).send({
                success: true, data: {
                    name: user.first_name,
                    email: user.email,
                    profile: user.profile,
                    id: user._id
                }
            })
        }
    } catch (error) {

        res.status(500)
            .send({ message: 'Error getting user info', success: false, error })
    }
}
// Profile
const profile = async (req, res) => {
    try {
        const userData = await userModel.findById(req.body.userId)
        if (!userData) {
            return res.status(200).send({ message: 'somthing went wrong', success: false })
        }
        res.status(200).send({ message: 'user datas get', success: true, data: userData, image: userData.profile })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
// edit profile
const editProfile = async (req, res) => {
    try {
        console.log('CLOUD_NAME:', process.env.CLOUD_NAME);
        console.log('API_KEY:', process.env.API_KEY);
        console.log('API_SECRET:', process.env.API_SECRET);
        if (req.file) {
            console.log('file', req.file)
            const image = req.file.filename;
            await sharp("./uploads/userImages/" + image)
                .resize(500, 500)
                .toFile("./uploads/userProfileImages/" + image)
            console.log('image', image)
            const data = await cloudinary.uploader.upload(
                "./uploads/userProfileImages/" + image
            );
            console.log('data', data)
            const cdnUrl = data.secure_url;
            await userModel.findByIdAndUpdate(req.body.userId,
                {
                    $set:
                    {
                        first_name: req.body.first_name, last_name: req.body.last_name, mobile: req.body.mobile, profile: cdnUrl
                    }
                })
            const userData = await userModel.findOne({ _id: req.body.userId })

            return res.status(200).send({ message: 'Profile Updated', success: true, data: userData })
        } else {
            console.log('no file')
            await userModel.findByIdAndUpdate(req.body.userId,
                {
                    $set:
                    {
                        first_name: req.body.first_name, last_name: req.body.last_name, mobile: req.body.mobile
                    }
                })
            const userData = await userModel.findOne({ _id: req.body.userId })
            res.status(200).send({ message: 'Profile updated', success: true, data: userData })
        }
    } catch (error) {
        console.log('error edit', error)
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
// banner
const getBannerData = async (req, res) => {
    try {
        const bannerData = await bannerModel.find({ status: true })
        if (!bannerData) {
            return res.status(200).send({ message: 'not get Banner data', success: false })
        }
        res.status(200).send({ message: 'Banner data getting successfull', success: true, data: bannerData })
    } catch (error) {
        res.status(200).send({ message: 'Somthing went wrong', success: false, error })
    }
}
// artist more Details       
const getArtstMoreData = async (req, res) => {
    try {
        const categoryData = await categoryModel.find()
        const artistMore = await artistDetailsModel.find()
        if (!artistMore) {
            return res.status(200).send({ message: 'Artist data getting fail', success: false })
        }
        res.status(200).send({ message: 'Artist data get', success: true, data: artistMore, category: categoryData })
    } catch (error) {
        res.status(500).send({ message: 'artist detail getting fail', success: false })
    }
}

const aritsView = async (req, res) => {
    try {
        const artistMoreData = await artistDetailsModel.findById(req.body.artistId)
        const ratingData = await ratingModel.findOne({ artist_id: artistMoreData.artist_id })
        if (!artistMoreData) {
            return res.status(200).send({ message: 'Not get artist data', success: false })
        }
        res.status(200).send({ message: 'get artist data', success: true, data: artistMoreData, rating: ratingData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}

// book artist

const aritistBooking = async (req, res) => {
    try {
        const user = await userModel.findById(req.body.userId)
        const isMatch = await bcrypt.compare(req.body.password, user.password)
        if (!isMatch) {
            return res.status(200).send({ message: 'password is incorrect please tray again', success: false })
        }
        const userbooking = await bookingModel.findOne({ artist_id: req.body.artist_id })
        const dateValidation = userbooking?.orders.filter((values) => {
            const dateObject = new Date(values.date);
            const year = dateObject.getUTCFullYear();
            const month = String(dateObject.getUTCMonth() + 1).padStart(2, '0');
            const day = String(dateObject.getUTCDate()).padStart(2, '0');
            const formatedDate = `${year}-${month}-${day}`
            return formatedDate === req.body.date
        })
        if (dateValidation?.length > 0) {
            return res.status(200).send({ message: 'This date artist not available', success: false })
        }
        const artistMoreData = await artistDetailsModel.findOne({ artist_id: req.body.artist_id })
        if (userbooking) {
            await bookingModel.updateOne({ artist_id: req.body.artist_id },
                {
                    $push:
                    {
                        orders:
                        {
                            firstName: req.body.firstName,
                            amount: req.body.amount,
                            email: req.body.email,
                            artist: req.body.artist,
                            state: req.body.state,
                            district: req.body.district,
                            pincode: req.body.pincode,
                            address: req.body.address,
                            date: req.body.date,
                            user_id: req.body.userId,
                            category: artistMoreData.category,
                            image: artistMoreData.image,
                            fullAmount: artistMoreData.midBudjet
                        }
                    }
                })
            const findIndex = await bookingModel.findOne({ artist_id: req.body.artist_id })
            const bookingSingleData = findIndex.orders[findIndex.orders.length - 1]
            await notificationModel.updateOne({ artist_id: req.body.artist_id, },
                {
                    $push:
                    {
                        notifications:
                        {
                            name: `${user.first_name} ${user.last_name} have a booking `,
                            booking_id: bookingSingleData._id,
                            timestamp: new Date(),
                        }
                    }

                }
            )

        } else {
            const bookingData = new bookingModel({
                artist_id: req.body.artist_id,
                user_id: req.body.userId,
                orders: [
                    {
                        firstName: req.body.firstName,
                        amount: req.body.amount,
                        email: req.body.email,
                        artist: req.body.artist,
                        state: req.body.state,
                        district: req.body.district,
                        pincode: req.body.pincode,
                        address: req.body.address,
                        date: req.body.date,
                        user_id: req.body.userId,
                        category: artistMoreData.category,
                        image: artistMoreData.image,
                        fullAmount: artistMoreData.midBudjet
                    }
                ]
            })
            const booking = await bookingData.save()
            // notification sesson
            const bookingNotification = new notificationModel({
                artist_id: req.body.artist_id,
                notifications: [
                    {
                        name: `${user.first_name} ${user.last_name} have a booking`,
                        booking_id: booking.orders[0]._id,
                        timestamp: new Date(),
                    }
                ]
            })
            await bookingNotification.save()
        }
        const room = req.body.artist_id.concat(req.body.userId)
        const allNotificaions = await notificationModel.findOne({ artist_id: req.body.artist_id })
        const notificationData = allNotificaions.notifications.filter(notiy => notiy.status === true)
        res.status(200).send({ message: 'Booking success full', success: true, count: notificationData.length, room: room, sender: req.body.userId })
    }
    catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false, error })
    }
}
// user notification
const userNotification = async (req, res) => {
    try {
        const userNoticafionData = await userNotificationModel.findOne({ user_id: req.body.userId })
        if (!userNoticafionData) {
            return res.status(200).send({ message: 'Notificaion empty', success: false })
        }
        res.status(200).send({ message: 'get notifications', success: true, data: userNoticafionData.notifications })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
// cofirm booking
const confirmBookingData = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.body.userId);
        const bookingData = await bookingModel.aggregate([
            { $unwind: "$orders" },
        ]);
        const filterdData = bookingData.filter((element) => {
            return element.orders._id.toString() === req.body.booking_id
        })
        const categoryData = await artistDetailsModel.findOne({ artist_id: filterdData[0].artist_id })
        if (!filterdData) {
            return res.status(200).send({ message: 'Not get any data', success: true })
        }
        res.status(200).send({ message: 'booking data getting success full', success: true, data: filterdData, category: categoryData.category })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
// advance payment

const advancePayment = async (req, res) => {
    try {
        var options = {
            amount: req.body.advance * 100,
            currency: "INR",
            receipt: "" + req.body.booking_id,
        };
        instance.orders.create(options, function (err, order) {
            res.status(200).send({ message: 'pay advance', success: true, data: order })
        });
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
// payment verificaion
const verifyPayment = async (req, res) => {
    try {
        const details = (req.body)
        const crypto = require("crypto");
        let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_kEY_SECRET)
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)
        hmac = hmac.digest('hex')
        const advance = details.order.amount / 100
        if (hmac == details.payment.razorpay_signature) {
            await bookingModel.findOneAndUpdate({
                'orders._id': details.order.receipt
            },
                { $set: { "orders.$.payment_id": details.payment.razorpay_payment_id } })

            await bookingModel.findOneAndUpdate({ 'orders._id': details.order.receipt }, {
                $set: {
                    "orders.$.status": "Booked",
                    "orders.$.amount": advance,
                    "orders.$.timestamp": new Date()
                }
            })
            await userNotificationModel.findOneAndUpdate({ 'notifications.booking_id': details.order.receipt }, {
                $set: {
                    'notifications.$.Actions': 'Booked',
                    'notifications.$.status': false
                }

            })
            return res.status(200).send({ message: 'payment success full', success: true })
        } else {
            res.status(200).send({ message: 'payment fail', success: false })
        }
    } catch (error) {
        res.status(500).send({ message: 'payment verification fail', success: false })
    }
}

// booking datas
const bookingData = async (req, res) => {
    try {
        const bookedData = await bookingModel.aggregate([
            { $unwind: '$orders' }, { $match: { 'orders.user_id': req.body.userId } }
        ])
        if (!bookedData) {
            return res.status(200).send({ message: 'Booking data no available', success: false })
        }
        res.status(200).send({ message: 'Booking data gettting succfull', success: true, data: bookedData })
    } catch (error) {
        res.status(500).send({ message: 'data getting fail', success: false })
    }
}


// cancel booking
const cancelBooking = async (req, res) => {
    try {
        const bookData = await bookingModel.aggregate([
            { $match: { user_id: req.body.userId } }, { $unwind: '$orders' }, {
                $match: {
                    'orders._id': new mongoose.Types.ObjectId(req.body.booking_id)
                }
            }
        ])
        const convertDate = dateFormate(bookData[0].orders.date)
        const dateObj = new Date(convertDate);
        dateObj.setDate(dateObj.getDate() - 5);
        if (dateObj > new Date) {
            await bookingModel.findOneAndUpdate({ 'orders._id': req.body.booking_id }, {
                $set: {
                    "orders.$.status": "Cancel",
                    "orders.$.amount": 0
                }
            })
            await notificationModel.updateOne({ artist_id: bookData[0].artist_id },
                {
                    $push:
                    {
                        notifications:
                        {
                            name: 'Booking Cancelled',
                            booking_id: req.body.booking_id,
                            Actions: 'Cancell',
                            timestamp: new Date(),
                        }
                    }
                }
            )
            const live = await notificationModel.findOne({ artist_id: bookData[0].artist_id })
            const lives = live.notifications.filter((items) => {
                return items.status === true
            })
            return res.status(200).send({ message: 'Booking Cancellation Success Full', success: true, msg: 'amount returnd in your account with in two days', count: lives.length, room: bookData[0].artist_id })
        } else {
            await notificationModel.updateOne({ artist_id: bookData[0].artist_id },
                {
                    $push:
                    {
                        notifications:
                        {
                            name: 'Booking Cancelled',
                            booking_id: req.body.booking_id,
                            Actions: 'Cancell',
                            timestamp: new Date(),
                        }
                    }
                }
            )
            await bookingModel.findOneAndUpdate({ 'orders._id': req.body.booking_id }, {
                $set: {
                    "orders.$.status": "Cancel"
                }
            })
            const live = await notificationModel.findOne({ artist_id: bookData[0].artist_id })
            const lives = live.notifications.filter((items) => {
                return items.status === true
            })
            return res.status(200).send({ message: 'Booking Cancellation Success Full', success: true, msg: 'No refund', count: lives.length, room: bookData[0].artist_id })
        }
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}

// cancellation swal
const cancelSwal = async (req, res) => {
    try {
        const bookingData = await bookingModel.aggregate([{
            $unwind: '$orders'
        },
        {
            $match:
            {
                'orders._id': new mongoose.Types.ObjectId(req.body.booking_id)
            }
        }
        ])
        if (!bookingData) {
            return res.status(200).send({ message: 'cancellation datas not get', success: false })
        }
        res.status(200).send({ message: 'Your advance return within two days', success: true, data: bookingData })

    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}

// media
const allMedia = async (req, res) => {
    try {
        const mediaData = await mediaModel.findOne({ artistId: req.body.artist_id })
        res.status(200).send({
            message: 'mediaData getting successfull ', success: true, data: mediaData
        })
    } catch (error) {
        res.status(500).json(error)
    }
}

// all post 
const allPost = async (req, res) => {
    try {
        const allPost = await mediaModel.aggregate([{ $unwind: "$videos" }])
        if (!allPost) {
            return res.status(200).send({ message: 'no posts', succss: false })
        }
        res.status(200).send({ message: 'All posts geted', success: true, data: allPost })
    } catch (error) {
        res.status(500).send({ messasge: 'somthing went wrong', success: false })
    }
}

// comon notifcation

const getNotifications = async (req, res) => {
    try {
        const notificaionData = await userNotificationModel.findOne({ user_id: req.body.userId })
        if (!notificaionData) {
            return res.status(200).send({ message: 'not get notificaion datas', success: false })
        }

        const filterdNotificaions = notificaionData.notifications.filter((items) => {
            return items.status === true
        })

        res.status(200).send({ message: 'get notification datas', success: true, data: filterdNotificaions.length })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}

// full payment notificaion create
const notificationCreate = async (req, res) => {
    try {
        const bookingData = await bookingModel.aggregate([{
            $unwind: '$orders'
        }, { $match: { 'orders.user_id': req.body.userId } }
        ])
        const bookedData = bookingData.filter((itmes) => {
            return itmes.orders.status === 'Booked' && itmes.orders.date < new Date()
        })
        if (bookedData.length > 0) {
            bookedData.forEach(async (items) => {
                await userNotificationModel.updateOne({ user_id: req.body.userId },
                    {
                        $push:
                        {
                            notifications:
                            {
                                name: `Hi,${items.orders.firstName}.Pay the Balance amount`,
                                booking_id: items.orders._id,
                                Actions: 'fullPayment',
                                timestamp: new Date(),
                            }
                        }
                    }
                )
            })
            await bookingModel.updateMany(
                {
                    'orders._id': bookedData[0].orders._id
                },
                {
                    $set: {
                        'orders.$[].status': 'waiting fullPayment'
                    }
                }
            );
        }
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
var notification_id;
const fullPayment = async (req, res) => {
    try {
        const bookData = await bookingModel.findOne({ 'orders._id': req.body.id }, {
            'orders.$': 1
        })
        if (!bookData) {
            return res.status(200).send({ message: 'booking data is empty', success: false })
        }
        notification_id = req.body.notification_id
        res.status(200).send({ message: 'full payment data geted', success: true, data: bookData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}

const fullpaymentDone = async (req, res) => {
    try {
        var options = {
            amount: req.body.balaceAmount * 100,
            currency: "INR",
            receipt: "" + req.body.id,
        };
        instance.orders.create(options, function (err, order) {
            res.status(200).send({ message: 'pay balance', success: true, data: order })
        });
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong ', success: false })
    }
}
const verifyFullPayment = async (req, res) => {
    try {
        const details = (req.body)
        const crypto = require("crypto");
        let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_kEY_SECRET)
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)
        hmac = hmac.digest('hex')
        const booked = await bookingModel.findOne({ 'orders._id': details.order.receipt }, {
            'orders.$': 1
        })
        const artistidData = await bookingModel.findOne({ _id: booked._id })
        if (hmac == details.payment.razorpay_signature) {
            await bookingModel.findOneAndUpdate({
                'orders._id': details.order.receipt
            },
                { $set: { "orders.$.payment_id": details.payment.razorpay_payment_id } })

            await bookingModel.findOneAndUpdate({ 'orders._id': details.order.receipt }, {
                $set: {
                    "orders.$.status": "Complete",
                    "orders.$.amount": booked.orders[0].fullAmount,
                    "orders.$.timestamp": new Date()
                }
            })
            await notificationModel.updateOne(
                {
                    artist_id: artistidData.artist_id
                },
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    name: `${booked.orders[0].firstName}.Paid Balance amount`,
                                    booking_id: booked.orders[0]._id,
                                    Actions: 'fullPayment',
                                    timestamp: new Date()
                                }
                            ]
                        }
                    }
                }
            );
            await userNotificationModel.updateOne(
                { 'notifications._id': notification_id },
                { $set: { 'notifications.$.status': false } }
            );
            return res.status(200).send({ message: 'payment success full', success: true })
        } else {
            res.status(200).send({ message: 'payment fail', success: false })
        }
    } catch (error) {
        res.status(500).send({ message: 'somthin went wrong', success: false })
    }
}
const reviewNotification = async (req, res) => {
    try {
        const bookingData = await bookingModel.aggregate([{ $unwind: "$orders" },
        { $match: { 'orders.status': 'Complete', 'orders.user_id': req.body.userId } }])
        if (bookingData.length > 0) {
            for (const items of bookingData) {
                const data = await userNotificationModel.find({
                    user_id: req.body.userId,
                    'notifications.booking_id': items.orders._id,
                    'notifications.Actions': 'review'
                });
                if (data.length >= 0) {
                    await userNotificationModel.updateOne(
                        { user_id: req.body.userId },
                        {
                            $push: {
                                notifications: {
                                    name: `Hi ${items.orders.firstName}. Write a review about this artist.`,
                                    booking_id: items.orders._id,
                                    Actions: 'review',
                                    timestamp: new Date()
                                }
                            }
                        }
                    );
                    await bookingModel.updateOne({ 'orders._id': items.orders._id }, {
                        $set: {
                            'orders.$.status': 'Completed'
                        }
                    })

                }
            }
        }
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}
const averageRating = async (artist_id) => {
    const averages = await ratingModel.aggregate([
        { $match: { artist_id: artist_id } },
        { $unwind: '$reviews' },
        {
            $group: {
                _id: null,
                average: { $avg: '$reviews.starRating' }
            }
        }
    ]);
    const { average } = averages[0];
    const avaregeString = average.toFixed(2);
    const averageFloat = parseFloat(avaregeString);
    await ratingModel.updateOne({ artist_id: artist_id }, { $set: { average: averageFloat } })
    await artistDetailsModel.updateOne({ artist_id: artist_id }, { $set: { averageRating: averageFloat } })
}
const writeReview = async (req, res) => {
    try {
        const booking_id = new mongoose.Types.ObjectId(req.body.booking_id);
        const userData = await userModel.findOne({ _id: req.body.userId })
        const bookingData = await bookingModel.aggregate([{ $unwind: "$orders" }, { $match: { 'orders._id': booking_id } }])
        const ratingData = await ratingModel.findOne({ artist_id: bookingData[0].artist_id })
        if (bookingData) {
            if (!ratingData) {
                const ratings = new ratingModel({
                    artist_id: bookingData[0].artist_id,
                    reviews: [
                        {
                            userName: bookingData[0].orders.firstName,
                            userEmail: bookingData[0].orders.email,
                            title: req.body.title,
                            starRating: req.body.rating,
                            review: req.body.comant,
                            userImage: userData.profile,
                            timestamp: new Date(),
                        }
                    ]

                })
                await ratings.save()
            } else {
                await ratingModel.updateOne({ artist_id: bookingData[0].artist_id },
                    {
                        $push:
                        {
                            reviews:
                            {
                                userName: bookingData[0].orders.firstName,
                                userEmail: bookingData[0].orders.email,
                                title: req.body.title,
                                starRating: req.body.rating,
                                review: req.body.comant,
                                userImage: userData.profile,
                                timestamp: new Date(),
                            }
                        }

                    }
                )
            }
            await averageRating(bookingData[0].artist_id)
            // 
            await notificationModel.updateOne({ artist_id: bookingData[0].artist_id },
                {
                    $push:
                    {
                        notifications:
                        {
                            name: `${bookingData[0].orders.firstName} Writed review `,
                            booking_id: bookingData[0].orders._id,
                            Actions: 'hide',
                            timestamp: new Date(),
                        }
                    }
                }
            )

            const notificationData = await userNotificationModel.aggregate([{ $unwind: '$notifications' }, { $match: { 'notifications.Actions': 'review', 'notifications.booking_id': bookingData[0].orders._id.toString() } }])
            await userNotificationModel.updateOne(
                {
                    'notifications._id': notificationData[0].notifications._id
                },
                {
                    $set: { 'notifications.$.status': false }
                }
            );
            return res.status(200).send({ message: 'success full', success: true })
        }
        res.status(200).send({
            message: 'fail please try again', success: false
        })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong ', success: false })
    }
}


// chat  partner profile

const partnerProfileData = async (req, res) => {
    try {
        const bookingData = await bookingModel.aggregate([{ $unwind: '$orders' }, { $match: { 'orders.payment_id': req.body.id } }])
        if (!bookingData) {
            return res.status(200).send({ message: 'Booking Data is Empty', success: false })
        }
        res.status(200).send({ message: 'profile Datas', success: true, data: bookingData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong ', success: false })
    }
}

const chatHistory = async (room, text, sender) => {
    try {
        const userData = await userModel.findById(sender)
        if (userData) {
            var Name = userData.first_name + ' ' + userData.last_name
        } else {
            const artistData = await artistModel.findById(sender)
            Name = artistData.firstName + ' ' + artistData.lastName
        }
        const roomExist = await chatModel.findOne({ room_id: room })
        if (roomExist) {
            await chatModel.updateOne({
                room_id: room
            },
                {
                    $push: {
                        history: {
                            userName: Name,
                            sender_id: sender,
                            chat: text,
                            time: new Date()
                        }
                    }
                })
        } else {
            const chatHistory = new chatModel({
                room_id: room,
                history: [
                    {
                        userName: Name,
                        sender_id: sender,
                        chat: text,
                        time: new Date()
                    }
                ]
            })
            await chatHistory.save()
        }
    } catch (error) {
    }
}

// chat history

const getChatHistory = async (req, res) => {
    try {
        const chatData = await chatModel.aggregate([{ $unwind: '$history' }, { $match: { room_id: req.body.id } }])
        if (!chatData) {
            return res.status(200).send({ message: 'No chat history', success: false })
        }
        res.status(200).send({ message: 'success full', success: true, chatData: chatData, userId: req.body.userId })
    } catch (error) {
        res.status(500).send({ messasge: 'somthing went wrong', success: false })
    }

}

const chathistorys = async (req, res) => {
    try {
        const bookingData = await bookingModel.aggregate([{ $unwind: '$orders' },
        { $match: { 'orders.status': 'Booked', 'orders.user_id': req.body.userId } },
        { $project: { _id: 0, artist_id: 1, 'orders.payment_id': 1 } }])

        if (!bookingData || bookingData.length < 1) {
            return res.status(200).send({ message: 'Artist Booked Users only the chat option', success: false })
        }

        res.status(200).send({ message: 'Chat history', success: true, chat: bookingData })
    } catch (error) {
        res.status(500).send({ message: 'somthing went wrong', success: false })
    }
}


const contact = async (req, res) => {
    try {
        var artistsData = []
        for (let i = 0; i < req.body.length; i++) {
            const artistData = await artistDetailsModel.findOne({
                artist_id: req.body[i].artist_id
            })
            artistsData.push({
                ...artistData.toObject(),
                payment_id: req.body[i].orders.payment_id
            });
        }
        if (artistsData.length < 0) {
            return res.status(200).send({ message: 'somthing went wrong', success: false })
        }
        res.status(200).send({ message: 'contact get', success: true, data: artistsData })
    } catch (error) {
        res.status(500).send({ messag: 'somting went wrong', success: false })
    }
}


module.exports = {
    signUp,
    login,
    authorization,
    profile,
    editProfile,
    forgot,
    setPassword,
    otp,
    getBannerData,
    getArtstMoreData,
    aritsView,
    aritistBooking,
    userNotification,
    confirmBookingData,
    advancePayment,
    verifyPayment,
    bookingData,
    cancelBooking,
    cancelSwal,
    allMedia,
    allPost,
    getNotifications,
    notificationCreate,
    fullPayment,
    fullpaymentDone,
    verifyFullPayment,
    reviewNotification,
    writeReview,
    partnerProfileData,
    chatHistory,
    getChatHistory,
    chathistorys,
    contact,
};


