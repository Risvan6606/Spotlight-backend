const multer = require('multer')
const path = require('path')
const fs = require("fs")


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/artistImages'))

    },
    filename: function (req, file, cb) {

        const name = Date.now() + '-' + file.originalname
        cb(null, name)

    }
})
const imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFilter })

const mediaStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync('public')) {
            fs.mkdirSync('public');
        }
        if (!fs.existsSync('public/videos')) {
            fs.mkdirSync('public/videos');
        }
        cb(null, 'public/videos');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname);
    }
});

const mediaUpload = multer({
    storage: mediaStorage,
    fileFilter: function (req, file, cb) {
        var ext = path.extname(file.originalname);
        if (ext !== '.mkv' && ext !== '.mp4') {
            return cb(new Error('only videos are allowed'));
        }
        cb(null, true);
    }
});



module.exports = {
    upload,
    mediaUpload

}