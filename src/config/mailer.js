const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS   // Must be a Google App Password, NOT your Gmail login password.
                                       // Generate one at: Google Account → Security → 2-Step Verification → App Passwords
    }
});

// Verify SMTP connection on startup so credential errors surface immediately
transporter.verify((error) => {
    if (error) {
        console.error('[Mailer] SMTP connection failed:', error.message);
        console.error('[Mailer] Make sure EMAIL_PASS is a Google App Password, not your Gmail login password.');
    } else {
        console.log('[Mailer] SMTP connection ready');
    }
});

const sendFeedbackNotification = async (emails, feedbackTitle, batch) => {
    const mailOptions = {
        from: `"College Feedback Portal" <${process.env.EMAIL_USER}>`,
        to: emails.join(', '),
        subject: `New Feedback Form: ${feedbackTitle}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1A3E3B;">
                <h2 style="color: #0E9F8E;">Hello Students!</h2>
                <p>A new feedback form <strong>"${feedbackTitle}"</strong> has been created for your batch <strong>${batch}</strong>.</p>
                <p>Please log in to the portal to submit your feedback before the deadline.</p>
                <br>
                <p>Best regards,<br>College Administration</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Mailer] Notification sent to ${emails.length} student(s)`);
    } catch (error) {
        console.error('[Mailer] Error sending emails:', error.message);
    }
};

module.exports = { sendFeedbackNotification };

