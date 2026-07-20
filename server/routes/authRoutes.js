const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  loginWithPhone,
  requestOTP,
  verifyOTPAndLogin,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login-phone', loginWithPhone);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTPAndLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;