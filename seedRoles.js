// File: seedRoles.js
const mongoose = require('mongoose');
const Role = require('./schemas/roles'); // Điều chỉnh lại đường dẫn cho đúng với cấu trúc thư mục của bạn

const seedRoles = async () => {
    try {
        // Kết nối vào database giống như trong file app.js của bạn
        await mongoose.connect('mongodb://localhost:27017/NNPTUD-S2');
        console.log("Đã kết nối Database để tạo Role...");

        // Xóa các role cũ (nếu có) để tránh trùng lặp khi chạy lại file
        await Role.deleteMany({});
        
        const roles = [
            { name: 'user', description: 'Người dùng bình thường' },
            { name: 'mod', description: 'Người kiểm duyệt nội dung' },
            { name: 'admin', description: 'Quản trị viên hệ thống' }
        ];

        // Chèn vào database
        await Role.insertMany(roles);
        console.log("Đã tạo thành công 3 roles: user, mod, admin!");

        // Ngắt kết nối sau khi xong
        mongoose.connection.close();
    } catch (error) {
        console.error("Lỗi khi tạo roles:", error);
        mongoose.connection.close();
    }
};

seedRoles();