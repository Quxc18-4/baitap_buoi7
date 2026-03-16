let moongose = require('mongoose')
const cartItem = require('./cartItem')
let cartSchema = moongose.Schema({
    user: {
        type: moongose.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    cartItems: {
        type: [moongose.Types.ObjectId],
        ref: 'cartItem',
        default: []
    }
}, {timestamps: true})
module.exports = new moongose.model('cart', cartSchema)