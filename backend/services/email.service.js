import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email service configuration error:', error);
    } else {
        console.log('✅ Email service ready');
    }
});

/**
 * Send grant invitation email to student
 * @param {Object} params - Email parameters
 * @param {string} params.studentEmail - Student's email
 * @param {string} params.facultyName - Faculty's name
 * @param {number} params.grantAmount - Grant amount
 * @param {string} params.invitationLink - Magic link for acceptance
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export async function sendGrantInvitation({ studentEmail, facultyName, grantAmount, invitationLink }) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: studentEmail,
            subject: `🎓 You've been awarded a grant of ₹${grantAmount.toLocaleString()}!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Grant Awarded!</h1>
                        </div>
                        <div class="content">
                            <p>Dear Student,</p>
                            <p><strong>${facultyName}</strong> has awarded you a grant for your academic expenses.</p>
                            <div class="amount">₹${grantAmount.toLocaleString()}</div>
                            <p>You can use this grant to submit bills for reimbursement. Simply upload your bills and they will be reviewed for approval.</p>
                            <p style="text-align: center;">
                                <a href="${invitationLink}" class="button">Accept Grant & Get Started</a>
                            </p>
                            <p><strong>Important:</strong></p>
                            <ul>
                                <li>This invitation link expires in 7 days</li>
                                <li>Upload clear, valid bills for faster approval</li>
                                <li>Your grant is valid for 90 days from acceptance</li>
                            </ul>
                        </div>
                        <div class="footer">
                            <p>This is an automated email. Please do not reply.</p>
                            <p>If you did not expect this grant, please contact your faculty.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // If transporter.verify failed but we attempt sendMail anyway:
        try {
            await transporter.sendMail(mailOptions);
            return { success: true, error: null };
        } catch (sendError) {
            console.warn('⚠️ SMTP send error, falling back to console log:');
            console.log('--- FALLBACK EMAIL ---');
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Body excerpt: ${mailOptions.html.substring(0, 500).replace(/<[^>]*>/g, '')}...`);
            console.log('--- END FALLBACK ---');
            return { success: true, error: null, fallback: true };
        }
    } catch (error) {
        console.error('Send invitation email error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send bill approval notification to student
 * @param {Object} params - Email parameters
 * @param {string} params.studentEmail - Student's email
 * @param {number} params.billAmount - Bill amount
 * @param {number} params.remainingBalance - Remaining grant balance
 * @param {string} params.facultyName - Faculty's name
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export async function sendBillApprovalEmail({ studentEmail, billAmount, remainingBalance, facultyName }) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: studentEmail,
            subject: `✅ Your bill for ₹${billAmount.toLocaleString()} has been approved!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .amount { font-size: 28px; font-weight: bold; color: #10b981; }
                        .balance { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ Bill Approved!</h1>
                        </div>
                        <div class="content">
                            <p>Great news!</p>
                            <p><strong>${facultyName}</strong> has approved your bill.</p>
                            <div class="amount">₹${billAmount.toLocaleString()}</div>
                            <div class="balance">
                                <p><strong>Remaining Grant Balance:</strong></p>
                                <p style="font-size: 24px; color: #667eea; margin: 0;">₹${remainingBalance.toLocaleString()}</p>
                            </div>
                            <p>The approved amount has been deducted from your grant balance.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        return { success: true, error: null };
    } catch (error) {
        console.error('Send approval email error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send bill rejection notification to student
 * @param {Object} params - Email parameters
 * @param {string} params.studentEmail - Student's email
 * @param {number} params.billAmount - Bill amount
 * @param {string} params.rejectionReason - Reason for rejection
 * @param {string} params.facultyName - Faculty's name
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export async function sendBillRejectionEmail({ studentEmail, billAmount, rejectionReason, facultyName }) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: studentEmail,
            subject: `⚠️ Your bill needs revision`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .reason { background: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>⚠️ Bill Not Approved</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p><strong>${facultyName}</strong> has reviewed your bill for ₹${billAmount.toLocaleString()} and it was not approved.</p>
                            <div class="reason">
                                <p><strong>Reason:</strong></p>
                                <p>${rejectionReason}</p>
                            </div>
                            <p>Please review the feedback and upload a corrected bill if needed.</p>
                            <p><strong>Tips for approval:</strong></p>
                            <ul>
                                <li>Ensure the bill is clear and readable</li>
                                <li>Verify all amounts are correct</li>
                                <li>Include valid GST number if applicable</li>
                                <li>Make sure the bill is relevant to your grant purpose</li>
                            </ul>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        return { success: true, error: null };
    } catch (error) {
        console.error('Send rejection email error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send role request status update to user
 * @param {Object} params - Email parameters
 * @param {string} params.userEmail - User's email
 * @param {string} params.status - NEW status (APPROVED/REJECTED)
 * @param {string} params.role - The role requested
 * @param {string} params.notes - Admin notes or rejection reason
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export async function sendRoleRequestStatusEmail({ userEmail, status, role, notes }) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: userEmail,
            subject: `📋 Role Request ${status}: ${role}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Role Request ${status}</h2>
                    <p>Your request for the <strong>${role}</strong> role has been <strong>${status.toLowerCase()}</strong>.</p>
                    ${notes ? `<p><strong>Note:</strong> ${notes}</p>` : ''}
                    <p>Log in to see your updated permissions.</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            return { success: true, error: null };
        } catch (sendError) {
            console.warn('⚠️ SMTP send error, falling back to console log:');
            console.log('--- FALLBACK EMAIL ---');
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Body excerpt: ${mailOptions.html.substring(0, 500).replace(/<[^>]*>/g, '')}...`);
            console.log('--- END FALLBACK ---');
            return { success: true, error: null, fallback: true };
        }
    } catch (error) {
        console.error('Send role status email error:', error);
        return { success: false, error: error.message };
    }
}

export default {
    sendGrantInvitation,
    sendBillApprovalEmail,
    sendBillRejectionEmail,
    sendRoleRequestStatusEmail
};
