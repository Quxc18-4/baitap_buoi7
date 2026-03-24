var express = require("express");
var router = express.Router();
const mongoose = require('mongoose');
let { checkLogin } = require('../utils/authHandler');
let reservationModel = require('../schemas/reservations');
let inventoryModel = require('../schemas/inventories');
let cartModel = require('../schemas/carts');
let productModel = require('../schemas/products');

router.get('/', checkLogin, async function (req, res) {
    try {
        let result = await reservationModel.find({ user: req.userId });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.get('/:id', checkLogin, async function (req, res) {
    try {
        let result = await reservationModel.findOne({ 
            _id: req.params.id, 
            user: req.userId 
        });
        if (!result) return res.status(404).send({ message: "Không tìm thấy đơn đặt chỗ" });
        res.send(result);
    } catch (error) {
        res.status(400).send({ message: "ID không hợp lệ hoặc lỗi truy vấn" });
    }
});

router.post('/reserveACart', checkLogin, async function (req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let currentCart = await cartModel.findOne({ user: req.userId }).populate('cartItems.product');
        if (!currentCart || currentCart.cartItems.length === 0) {
            throw new Error("Giỏ hàng trống");
        }

        let reservationItems = [];
        let totalAmount = 0;

        for (let item of currentCart.cartItems) {
            let inv = await inventoryModel.findOne({ product: item.product._id }).session(session);
            if (!inv || inv.stock < item.quantity) {
                throw new Error(`Sản phẩm ${item.product.title} không đủ hàng trong kho`);
            }

            inv.stock -= item.quantity;
            inv.reserved += item.quantity;
            await inv.save({ session });

            let subtotal = item.product.price * item.quantity;
            reservationItems.push({
                product: item.product._id,
                quantity: item.quantity,
                title: item.product.title,
                price: item.product.price,
                subtotal: subtotal
            });
            totalAmount += subtotal;
        }

        let newReservation = new reservationModel({
            user: req.userId,
            items: reservationItems,
            amount: totalAmount,
            expiredIn: new Date(Date.now() + 30 * 60 * 1000) // Hết hạn sau 30p
        });

        await newReservation.save({ session });

        currentCart.cartItems = [];
        await currentCart.save({ session });

        await session.commitTransaction();
        res.send(newReservation);
    } catch (error) {
        await session.abortTransaction();
        res.status(400).send({ message: error.message });
    } finally {
        session.endSession();
    }
});

router.post('/reserveItems', checkLogin, async function (req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let { items } = req.body;
        let reservationItems = [];
        let totalAmount = 0;

        for (let i of items) {
            let prod = await productModel.findById(i.product);
            let inv = await inventoryModel.findOne({ product: i.product }).session(session);

            if (!inv || inv.stock < i.quantity) {
                throw new Error(`Sản phẩm ${prod ? prod.title : i.product} không đủ hàng`);
            }

            inv.stock -= i.quantity;
            inv.reserved += i.quantity;
            await inv.save({ session });

            let subtotal = prod.price * i.quantity;
            reservationItems.push({
                product: i.product,
                quantity: i.quantity,
                title: prod.title,
                price: prod.price,
                subtotal: subtotal
            });
            totalAmount += subtotal;
        }

        let newReservation = new reservationModel({
            user: req.userId,
            items: reservationItems,
            amount: totalAmount,
            expiredIn: new Date(Date.now() + 30 * 60 * 1000)
        });

        await newReservation.save({ session });
        await session.commitTransaction();
        res.send(newReservation);
    } catch (error) {
        await session.abortTransaction();
        res.status(400).send({ message: error.message });
    } finally {
        session.endSession();
    }
});

router.post('/cancelReserve/:id', checkLogin, async function (req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let reservation = await reservationModel.findOne({ 
            _id: req.params.id, 
            user: req.userId 
        }).session(session);

        if (!reservation) throw new Error("Không tìm thấy đơn đặt chỗ");
        if (reservation.status !== "actived") throw new Error("Đơn này không thể hủy");

        // Hoàn trả lại stock từ reserved
        for (let item of reservation.items) {
            await inventoryModel.findOneAndUpdate(
                { product: item.product },
                { 
                    $inc: { 
                        stock: item.quantity, 
                        reserved: -item.quantity 
                    } 
                },
                { session }
            );
        }

        reservation.status = "cancelled";
        await reservation.save({ session });

        await session.commitTransaction();
        res.send({ message: "Đã hủy đơn thành công", reservation });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).send({ message: error.message });
    } finally {
        session.endSession();
    }
});

module.exports = router;