// D:\Project\workster\backend\models\jobApplication.js (แก้ไข)
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
      type: DataTypes.STRING(50), 
      allowNull: false
    },
    resume_filepath: {
      type: DataTypes.STRING, 
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
    tableName: 'job_applications',
    timestamps: false
  });

  // ลบโค้ดส่วนนี้ออก
  // JobApplication.associate = (models) => {
  //   JobApplication.belongsTo(models.JobPosting, {
  //     foreignKey: 'job_posting_id',
  //     onDelete: 'CASCADE'
  //   });
  // };

  return JobApplication;
};