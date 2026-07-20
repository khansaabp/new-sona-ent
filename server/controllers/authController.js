const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOTP } = require('../utils/otpService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password, phone, address });

    res.status(201).json({
      user: user.toSafeObject(),
      token: generateToken(user._id)
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact support.' });
    }

    res.json({
      user: user.toSafeObject(),
      token: generateToken(user._id)
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, address, password } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };
    if (password) user.password = password;

    const updated = await user.save();
    res.json(updated.toSafeObject());
  } catch (err) {
    next(err);
  }
};
// @desc    Login with phone number + password
// @route   POST /api/auth/login-phone
// @access  Public
const loginWithPhone = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }

    const user = await User.findOne({ phone });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact support.' });
    }

    res.json({
      user: user.toSafeObject(),
      token: generateToken(user._id)
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request OTP for phone-based login
// @route   POST /api/auth/request-otp
// @access  Public
const requestOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }

    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this phone number' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact support.' });
    }

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 minutes
    await user.save();

    await sendOTP(user.phone, otp);

    res.json({ message: 'OTP sent successfully', phone: user.phone });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify OTP and log in (passwordless)
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTPAndLogin = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const user = await User.findOne({ phone: phone.trim() }).select('+otpCode +otpExpiry');
    if (!user) {
      return res.status(404).json({ message: 'No account found with this phone number' });
    }

    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP was requested. Please request a new one.' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otpCode !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP' });
    }

    // Clear OTP after successful use
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
      user: user.toSafeObject(),
      token: generateToken(user._id)
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request OTP for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this phone number' });
    }

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTP(user.phone, otp);

    res.json({ message: 'Password reset OTP sent', phone: user.phone });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ message: 'Phone, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ phone: phone.trim() }).select('+otpCode +otpExpiry');
    if (!user) {
      return res.status(404).json({ message: 'No account found with this phone number' });
    }

    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP was requested. Please request a new one.' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otpCode !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP' });
    }

    user.password = newPassword; // will be hashed by pre-save hook
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    next(err);
  }
};
module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  loginWithPhone,
  requestOTP,
  verifyOTPAndLogin,
  forgotPassword,
  resetPassword
};