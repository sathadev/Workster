// frontend/src/socket.js
import { io } from "socket.io-client";

// URL ของ Backend ของคุณ
const URL = "http://localhost:5000";

const socket = io(URL, {
    autoConnect: false // เราจะสั่งให้มันเชื่อมต่อเองเมื่อต้องการ
});

export default socket;
