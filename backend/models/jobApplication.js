// models/jobApplication.js (ไฟล์ใหม่)
module.exports = (sequelize, DataTypes) => {
  const JobApplication = sequelize.define('JobApplication', {
    application_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    job_posting_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    applicant_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    applicant_email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    applicant_phone: {
      type: DataTypes.STRING(50), // กำหนดความยาวที่เหมาะสม
      allowNull: false
    },
    resume_filepath: {
      type: DataTypes.STRING, // เก็บ path ไฟล์
      allowNull: true
    },
    other_links_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    application_status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'rejected', 'hired'),
      defaultValue: 'pending',
      allowNull: false
    },
    applied_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'job_applications', // ชื่อตารางใน DB
    timestamps: false // ถ้าไม่ต้องการ createdAt/updatedAt fields อัตโนมัติ
  });

  // กำหนด Association (ความสัมพันธ์)
  JobApplication.associate = (models) => {
    JobApplication.belongsTo(models.JobPosting, {
      foreignKey: 'job_posting_id',
      onDelete: 'CASCADE'
    });
  };

  return JobApplication;
};