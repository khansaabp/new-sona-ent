const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
   email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true, unique: true, sparse: true },
    role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer' },
address: {
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' }
},
isActive: { type: Boolean, default: true },
adminNotes: { type: String, default: '' },
otpCode: { type: String, select: false },
otpExpiry: { type: Date, select: false }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
