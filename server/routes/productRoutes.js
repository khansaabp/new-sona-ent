const express = require('express');
const upload = require('../middleware/upload');
const {
  getProducts,
  getProductById,
  getFilterMeta,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStock
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProducts);
router.get('/meta/filters', getFilterMeta);
router.get('/meta/low-stock', protect, authorize('admin', 'staff'), getLowStock);
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
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
    res.json({ imageUrl });
  }
);
router.get('/:id', getProductById);

router.post('/', protect, authorize('admin', 'staff'), createProduct);
router.put('/:id', protect, authorize('admin', 'staff'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
