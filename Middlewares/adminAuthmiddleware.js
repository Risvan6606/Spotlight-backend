const jwt = require('jsonwebtoken')
module.exports = async (req, res, next) => {
    try {
        const token = req.headers['authorization'].split(' ')[1]
        jwt.verify(token, process.env.ADMIN_SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(401)
                    .send({
                        message: 'Auth fail',
                        success: false
                    })
            } else {
                req.body.adminId = decoded.id
                next()
            }
        })
    } catch (error) {
        return res.status(401).send({
            message: 'Auth failed',
            success: false
        })
    }
}