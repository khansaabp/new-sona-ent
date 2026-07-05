import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/format';
import './DashboardProducts.css';

const categories = [
  'Refrigerators', 'AC', 'washing machines', 'Audio', 'Wearables',
  'TVs & Displays', 'Inverter', 'cooking', 'Accessories', 'Home Appliances'
];

const emptyForm = {
  name: '', sku: '', description: '', category: 'Accessories', brand: '',
  price: '', mrp: '', taxRate: 18, stock: '', lowStockThreshold: 5, warranty: '1 Year',
  images: []
};

const DashboardProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
const [filterLowStock, setFilterLowStock] = useState(false);
const [imageFile, setImageFile] = useState(null);
const [imagePreview, setImagePreview] = useState('');
const [uploadingImage, setUploadingImage] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (filterLowStock) {
        const { data } = await api.get('/products/meta/low-stock');
        setProducts(data);
      } else {
        const { data } = await api.get('/products?limit=100');
        setProducts(data.products);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLowStock]);

const openCreate = () => {
  setForm(emptyForm);
  setEditingId(null);
  setShowForm(true);
  setError('');
  setImageFile(null);
  setImagePreview('');
};

  const openEdit = (product) => {
  setForm({
    name: product.name, sku: product.sku, description: product.description || '',
    category: product.category, brand: product.brand, price: product.price, mrp: product.mrp,
    taxRate: product.taxRate, stock: product.stock, lowStockThreshold: product.lowStockThreshold,
    warranty: product.warranty, images: product.images || []
  });
  setEditingId(product._id);
  setShowForm(true);
  setError('');
  setImagePreview(product.images?.[0] || '');
  setImageFile(null);
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setImageFile(file);
  setImagePreview(URL.createObjectURL(file));
};

const handleImageUpload = async () => {
  if (!imageFile) return;
  setUploadingImage(true);
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    const { data } = await api.post('/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setForm(f => ({ ...f, images: [data.imageUrl] }));
    alert('Image uploaded successfully!');
  } catch (err) {
    setError('Image upload failed: ' + (err.response?.data?.message || err.message));
  } finally {
    setUploadingImage(false);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp),
        taxRate: Number(form.taxRate),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold)
      };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product from the catalog?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>Inventory</h1>
          <p className="text-muted">{products.length} products {filterLowStock ? '(low stock)' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${filterLowStock ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterLowStock(v => !v)}>
            Low stock only
          </button>
          <button className="btn btn-primary" onClick={openCreate}>+ Add product</button>
        </div>
      </div>

      {showForm && (
        <div className="card product-form">
          <h2>{editingId ? 'Edit product' : 'Add new product'}</h2>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field-grid">
              <div className="field">
                <label className="label">Name</label>
                <input className="input" name="name" required value={form.name} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="label">SKU</label>
                <input className="input" name="sku" required value={form.sku} onChange={handleChange} disabled={!!editingId} />
              </div>
              <div className="field">
                <label className="label">Brand</label>
                <input className="input" name="brand" required value={form.brand} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="label">Category</label>
                <select className="select" name="category" value={form.category} onChange={handleChange}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Price (₹)</label>
                <input className="input" type="number" name="price" min="0" required value={form.price} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="label">MRP (₹)</label>
                <input className="input" type="number" name="mrp" min="0" required value={form.mrp} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="label">GST Rate (%)</label>
                <input className="input" type="number" name="taxRate" min="0" max="100" value={form.taxRate} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="label">Stock quantity</label>
                <input className="input" type="number" name="stock" min="0" required value={form.stock} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="label">Low stock threshold</label>
                <input className="input" type="number" name="lowStockThreshold" min="0" value={form.lowStockThreshold} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="label">Warranty</label>
                <input className="input" name="warranty" value={form.warranty} onChange={handleChange} />
              </div>
            </div>
            <div className="field">
  <label className="label">Product image</label>
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>

    {/* Preview box */}
    <div style={{
      width: 120, height: 120, borderRadius: 8,
      border: '1px solid var(--border-strong)',
      background: 'var(--bg-panel-raised)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', overflow: 'hidden', flexShrink: 0
    }}>
      {imagePreview
        ? <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ color: 'var(--text-muted)', fontSize: 32 }}>◆</span>
      }
    </div>

    {/* Controls */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageChange}
        style={{ fontSize: 13, color: 'var(--text-secondary)' }}
      />
      {imageFile && (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleImageUpload}
          disabled={uploadingImage}
        >
          {uploadingImage ? 'Uploading...' : 'Upload image'}
        </button>
      )}
      {form.images?.[0] && !imageFile && (
        <span className="tag tag-green">✓ Image saved</span>
      )}
      <span className="text-muted" style={{ fontSize: 12 }}>
        JPG, PNG or WEBP · Max 5MB
      </span>
    </div>
  </div>
</div>

<div className="field">
  <label className="label">Description</label>
  <textarea className="textarea" name="description" rows={3} value={form.description} onChange={handleChange}></textarea>
</div>
            <div className="field">
              <label className="label">Description</label>
              <textarea className="textarea" name="description" rows={3} value={form.description} onChange={handleChange}></textarea>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" type="submit">{editingId ? 'Save changes' : 'Create product'}</button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="empty-state">Loading inventory...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">No products found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td className="mono text-muted">{p.sku}</td>
                  <td><span className="tag tag-muted">{p.category}</span></td>
                  <td className="mono">{formatCurrency(p.price)}</td>
                  <td>
                    <span className={`tag ${p.stock === 0 ? 'tag-red' : p.stock <= p.lowStockThreshold ? 'tag-amber' : 'tag-green'}`}>
                      {p.stock} units
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DashboardProducts;
