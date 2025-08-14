// controllers/jobApplicationController.js
const db = require('../models'); // <<< This path should be correct if 'models' is a direct sibling to 'controllers'
const JobApplication = db.JobApplication; 
const path = require('path'); // Add path module for filename operations


exports.createJobApplication = async (req, res) => {
    try {
        const { jobPostingId } = req.params;
        const { applicant_name, applicant_email, applicant_phone, other_links_text } = req.body;
        
        let resume_filepath = null;
        if (req.file) {
            // req.file.filename contains the name assigned by multer storage
            resume_filepath = req.file.filename; 
        }

        const newApplication = await JobApplication.create({
            job_posting_id: jobPostingId,
            applicant_name,
            applicant_email,
            applicant_phone,
            resume_filepath,
            other_links_text,
            // application_status will be 'pending' by default
        });

        res.status(201).json({ message: 'Job application submitted successfully!', application: newApplication });

    } catch (error) {
        console.error('Error submitting job application:', error);
        res.status(500).json({ message: 'Internal server error during job application submission.' });
    }
};