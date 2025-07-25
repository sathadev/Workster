const About = require('../models/aboutModel');

// [GET] /api/v1/settings - ดึงข้อมูลการตั้งค่าระบบ
exports.getSettings = async (req, res) => {
    try {
        // ใช้ company_id จาก user ที่ login อยู่ (ผ่าน middleware 'protect')
        let settings = await About.getAbout(req.user.company_id);

        if (!settings) {
            // ถ้าไม่มีข้อมูล ให้สร้างค่าเริ่มต้น
            settings = {
                startwork: '08:00',
                endwork: '17:00',
                about_late: 0,
                late_allowed_count: 0,
                late_deduction_amount: 0.00,
                about_sickleave: 0,
                about_personalleave: 0,
                about_annualleave: 0,
                about_maternityleave: 0,
                about_childcareleave: 0,
                about_paternityleave: 0,
                about_militaryleave: 0,
                about_ordinationleave: 0,
                about_sterilizationleave: 0,
                about_trainingleave: 0,
                about_funeralleave: 0,
                work_days: 'Mon,Tue,Wed,Thu,Fri',
                company_id: req.user.company_id
            };
        }

        // แปลง work_days จาก string เป็น array เพื่อให้ Frontend ใช้งานง่าย
        if (settings.work_days && typeof settings.work_days === 'string') {
            settings.work_days = settings.work_days.split(',').filter(day => day);
        }

        res.status(200).json(settings);

    } catch (err) {
        console.error("API Error [getSettings]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลการตั้งค่า' });
    }
};

// [PUT] /api/v1/settings - อัปเดตข้อมูลการตั้งค่าระบบ
exports.updateSettings = async (req, res) => {
    try {
        const body = req.body;
        
        // สร้าง object ข้อมูลที่จะอัปเดต โดยดึงค่าจาก body และแปลงเป็นชนิดข้อมูลที่ถูกต้อง
        const updateData = {
            startwork: body.startwork,
            endwork: body.endwork,
            about_late: parseInt(body.about_late, 10) || 0,
            late_allowed_count: parseInt(body.late_allowed_count, 10) || 0,
            late_deduction_amount: parseFloat(body.late_deduction_amount) || 0.00,
            about_sickleave: parseInt(body.about_sickleave, 10) || 0,
            about_personalleave: parseInt(body.about_personalleave, 10) || 0,
            about_annualleave: parseInt(body.about_annualleave, 10) || 0,
            about_maternityleave: parseInt(body.about_maternityleave, 10) || 0,
            about_childcareleave: parseInt(body.about_childcareleave, 10) || 0,
            about_paternityleave: parseInt(body.about_paternityleave, 10) || 0,
            about_militaryleave: parseInt(body.about_militaryleave, 10) || 0,
            about_ordinationleave: parseInt(body.about_ordinationleave, 10) || 0,
            about_sterilizationleave: parseInt(body.about_sterilizationleave, 10) || 0,
            about_trainingleave: parseInt(body.about_trainingleave, 10) || 0,
            about_funeralleave: parseInt(body.about_funeralleave, 10) || 0,
            work_days: Array.isArray(body.work_days) ? body.work_days.join(',') : body.work_days,
        };

        // ส่งข้อมูลและ company_id ไปยัง Model เพื่อทำการอัปเดต
        const updatedSettings = await About.updateAbout(updateData, req.user.company_id);

        res.status(200).json(updatedSettings);

    } catch (err) {
        console.error("API Error [updateSettings]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลการตั้งค่า' });
    }
};
