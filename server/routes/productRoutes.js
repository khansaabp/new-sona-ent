const express = require('express');
const upload = require('../middleware/upload');
const {
  getProducts,
  getProductById,
  getFilterMeta,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStock,
  getPendingApproval,
  approveProduct,
  rejectProduct
} = require('../controllers/productController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getProducts);
router.get('/meta/filters', getFilterMeta);
router.get('/meta/low-stock', protect, authorize('admin', 'staff'), getLowStock);
router.get('/meta/pending-approval', protect, authorize('admin'), getPendingApproval);
router.get('/:id', optionalAuth, getProductById);
// Image upload route
router.post(
  '/upload-image',
  protect,
  authorize('admin', 'staff'),
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Cloudinary returns the URL directly in req.file.path
    const imageUrl = req.file.path;
    res.json({ imageUrl });
  }
);
// router.get('/:id', getProductById);

router.post('/', protect, authorize('admin', 'staff'), createProduct);
router.put('/:id', protect, authorize('admin', 'staff'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.put('/:id/approve', protect, authorize('admin'), approveProduct);
router.put('/:id/reject', protect, authorize('admin'), rejectProduct);

module.exports = router;
