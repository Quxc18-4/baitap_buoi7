const mongoose = require("mongoose");
const Role = require("./schemas/roles"); // Đảm bảo đường dẫn đúng
const User = require("./schemas/users"); // Đảm bảo đường dẫn đúng

const seedDatabase = async () => {
  try {
    // Kết nối vào Replica Set rs0 của bạn
    await mongoose.connect(
      "mongodb://localhost:27017,localhost:27018,localhost:27019/NNPTUD-S2?replicaSet=rs0"
    );
    console.log("🚀 Đã kết nối Database thành công!");

    // ==========================================
    // 1. TẠO ROLES (Dùng upsert để nếu có rồi thì bỏ qua/cập nhật)
    // ==========================================
    const adminRole = await Role.findOneAndUpdate(
      { name: "admin" },
      { name: "admin", description: "Quản trị viên hệ thống" },
      { upsert: true, new: true }
    );

    const userRole = await Role.findOneAndUpdate(
      { name: "user" },
      { name: "user", description: "Người dùng tiêu chuẩn" },
      { upsert: true, new: true }
    );
    console.log("✅ Đã kiểm tra và khởi tạo Roles.");

    // ==========================================
    // 2. TẠO USERS
    // ==========================================
    
    // Kiểm tra và tạo Admin User
    const adminExists = await User.findOne({ username: "admin_super" });
    if (!adminExists) {
      await User.create({
        username: "admin_super",
        password: "AdminPassword123!", // Sẽ tự động bị băm bởi pre('save')
        email: "admin@example.com",
        fullName: "System Admin",
        role: adminRole._id, // Tham chiếu ObjectId từ role admin vừa tạo
        status: true
      });
      console.log("✅ Đã tạo tài khoản Admin.");
    }

    // Kiểm tra và tạo Normal User
    const userExists = await User.findOne({ username: "nguyenvana" });
    if (!userExists) {
      await User.create({
        username: "nguyenvana",
        password: "UserPassword123!", // Sẽ tự động bị băm bởi pre('save')
        email: "vana@example.com",
        fullName: "Nguyễn Văn A",
        role: userRole._id, // Tham chiếu ObjectId từ role user vừa tạo
        status: true
      });
      console.log("✅ Đã tạo tài khoản User.");
    }

    console.log("🎉 Seeding dữ liệu hoàn tất!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi trong quá trình seeding:", error);
    process.exit(1);
  }
};

seedDatabase();