import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';
import './ProductDetail.css';

const categoryGlyphs = {
  Smartphones: '▣', Laptops: '▭', Tablets: '▥', Audio: '◐', Wearables: '◍',
  'TVs & Displays': '▤', Cameras: '◉', Gaming: '◈', Accessories: '◆', 'Home Appliances': '▦'
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    api.get(`/products/${id}`).then(res => setProduct(res.data)).catch(() => setProduct(null));
  }, [id]);

  if (!product) {
    return <div className="page-container empty-state">Loading product...</div>;
  }

  const handleAdd = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="page-container">
      <Link to="/shop" className="text-muted" style={{ fontSize: 13 }}>&larr; Back to catalog</Link>

      <div className="product-detail">
        <div className="product-detail__image card">
  {product.images?.[0]
    ? <img
        src={product.images[0]}
        alt={product.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
      />
    : <span className="product-detail__glyph">{categoryGlyphs[product.category] || '◆'}</span>
  }
  {product.discountPercent > 0 && (
    <span className="product-card__discount" style={{ position: 'absolute', top: 16, left: 16 }}>
      -{product.discountPercent}%
    </span>
  )}
</div>

        <div className="product-detail__info">
          <span className="tag tag-cyan mono">{product.category}</span>
          <h1 className="product-detail__title">{product.name}</h1>
          <div className="text-secondary">{product.brand} &middot; SKU: {product.sku}</div>

          <div className="product-detail__price">
            <span className="mono product-detail__price-current">{formatCurrency(product.price)}</span>
            {product.mrp > product.price && (
              <>
                <span className="mono product-detail__price-mrp">{formatCurrency(product.mrp)}</span>
                <span className="tag tag-green">{product.discountPercent}% off</span>
              </>
            )}
          </div>
          <div className="text-muted mono" style={{ fontSize: 13 }}>
            Inclusive of {product.taxRate}% GST &middot; Warranty: {product.warranty}
          </div>

          <p className="product-detail__description">{product.description}</p>

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="spec-table card">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div className="spec-row" key={key}>
                  <span className="text-muted">{key}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="product-detail__stock">
            {product.stock === 0 ? (
              <span className="tag tag-red">Out of stock</span>
            ) : product.stock <= product.lowStockThreshold ? (
              <span className="tag tag-amber">Only {product.stock} units left</span>
            ) : (
              <span className="tag tag-green">In stock</span>
            )}
          </div>

          {product.stock > 0 && (
            <div className="product-detail__actions">
              <div className="qty-stepper">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                <span className="mono">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} aria-label="Increase quantity">+</button>
              </div>
              <button className="btn btn-primary" onClick={handleAdd}>
                {added ? 'Added to cart ✓' : 'Add to cart'}
              </button>
              <Link to="/cart" className="btn btn-ghost">Go to cart</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
