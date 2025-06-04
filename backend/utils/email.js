// utils/email.js
// Development email utility: logs actions instead of sending real emails

const sendVerificationEmail = async (email, token) => {
  console.log(`[DEV] Would send verification email to ${email} with token: ${token}`);
  // In production, use nodemailer or another service to send real emails
};

const sendPasswordResetEmail = async (email, token) => {
  console.log(`[DEV] Would send password reset email to ${email} with token: ${token}`);
  // In production, use nodemailer or another service to send real emails
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
}; 