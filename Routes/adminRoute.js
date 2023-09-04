const express = require('express')
const adminRoute = express()
const session = require('express-session')
const sessionConfig = require('../Config/sessionConfig')
const upload = require('../Config/multer')

adminRoute.use(session({
    secret: sessionConfig.adminsessionSecrect,
    saveUninitialized: true,
    resave: false
}))
const adminController = require('../Controllers/adminController')
const adminAuthmiddileware = require('../Middlewares/adminAuthmiddleware')
// post request
adminRoute.post('/login', adminController.login)
adminRoute.post('/forgotpassword', adminController.forgotPassword)
adminRoute.post('/setpassword', adminController.setPassword)
adminRoute.post('/get-admin-info-by-id', adminAuthmiddileware, adminController.authorization)
adminRoute.post('/get-artist-more-data', adminAuthmiddileware, adminController.getArtistMoreData)
adminRoute.post('/addcategory', adminAuthmiddileware, adminController.addcategory)
adminRoute.post('/addbanner', upload.upload.single('image'), adminAuthmiddileware, adminController.addbanner)
// get request
adminRoute.get('/get-user-data', adminAuthmiddileware, adminController.userList)
adminRoute.get('/get-artist-data', adminAuthmiddileware, adminController.artistList)
adminRoute.get('/get-category-data', adminAuthmiddileware, adminController.getCategoryData)
adminRoute.get('/get-banner-data', adminAuthmiddileware, adminController.getBannerData)
adminRoute.get('/get-booking-data', adminAuthmiddileware, adminController.bookingDatas)
adminRoute.get('/dash-bord-data', adminAuthmiddileware, adminController.dashBoardData)
// update Request
adminRoute.patch('/block-and-unblock', adminAuthmiddileware, adminController.blockAndUnblock)
adminRoute.patch('/block-and-unblock-artist', adminAuthmiddileware, adminController.artist_Block_And_Unblock)
adminRoute.patch('/category-list-unlist', adminAuthmiddileware, adminController.listAndUnlistCategory)
adminRoute.patch('/banner-list-unlist', adminAuthmiddileware, adminController.bannerListAndUnlist)

module.exports = adminRoute         