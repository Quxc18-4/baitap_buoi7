// File: seedUsers.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./schemas/users'); // Điều chỉnh lại đường dẫn
const Role = require('./schemas/roles'); // Điều chỉnh lại đường dẫn

const seedUsers = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/NNPTUD-S2');
        console.log("Đã kết nối Database để tạo User...");

        // Xóa các user cũ để tránh lỗi unique username/email
        await User.deleteMany({});

        // Tìm các role đã tạo
        const adminRole = await Role.findOne({ name: 'admin' });
        const modRole = await Role.findOne({ name: 'mod' });
        const userRole = await Role.findOne({ name: 'user' });

        if (!adminRole || !modRole || !userRole) {
            console.log("Lỗi: Bạn cần chạy file seedRoles.js trước!");
            process.exit(1);
        }

        // Mã hóa mật khẩu chung cho dễ nhớ: "Password@123"
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync("Password@123", salt);

        const users = [
            {
                username: 'admin_user',
                email: 'admin@hutech.edu.vn',
                password: hashedPassword,
                role: adminRole._id
            },
            {
                username: 'mod_user',
                email: 'mod@hutech.edu.vn',
                password: hashedPassword,
                role: modRole._id
            },
            {
                username: 'normal_user',
                email: 'user@hutech.edu.vn',
                password: hashedPassword,
                role: userRole._id
            }
        ];

        // Lưu từng user vào DB
        for (let u of users) {
            const newUser = new User(u);
            await newUser.save();
        }

        console.log("Đã tạo thành công 3 users tương ứng với 3 roles!");
        console.log("Tài khoản: admin_user / mod_user / normal_user | Mật khẩu chung: Password@123");

        mongoose.connection.close();
    } catch (error) {
        console.error("Lỗi khi tạo users:", error);
        mongoose.connection.close();
    }
};

seedUsers();