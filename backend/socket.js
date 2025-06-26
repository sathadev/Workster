// backend/socket.js
const { Server } = require("socket.io");

let io;

function initSocket(httpServer) {
    io = new Server(httpServer, {
        // ตั้งค่า CORS เพื่ออนุญาตให้ Frontend ของคุณเชื่อมต่อเข้ามาได้
        cors: {
            origin: "http://localhost:5173", // URL ของ Frontend
            methods: ["GET", "POST"]
        }
    });

    // ส่วนนี้จะทำงานเมื่อมี Client เชื่อมต่อเข้ามา
    io.on('connection', (socket) => {
        console.log('✅ A user connected with socket ID:', socket.id);
        
        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.id);
        });
    });
    
    return io;
}

// ฟังก์ชันสำหรับส่งต่อ instance ของ io ไปใช้ที่อื่น
function getIO() {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
}

module.exports = { initSocket, getIO };
