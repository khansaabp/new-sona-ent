import React from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/format";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";
import StarRating from './StarRating';
import ShareButton from './ShareButton';

const categoryGlyphs = {
  Refrigerators: "▣",
  AC: "▭",
  "washing machine": "▥",
  Audio: "◐",
  Wearables: "◍",
  "TVs & Displays": "▤",
  Inverter: "◉",
  cooking: "◈",
  Accessories: "◆",
  "Home Appliances": "▦",
};

const ProductCard = ({ product }) => {
  const { addItem } = useCart();

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product, 1);
  };

  return (
    <Link to={`/product/${product._id}`} className="product-card">
      <div className="product-card__image">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span className="product-card__glyph">
            {categoryGlyphs[product.category] || "◆"}
          </span>
        )}
        {product.discountPercent > 0 && (
          <span className="product-card__discount">
            -{product.discountPercent}%
          </span>
        )}
        {product.stock === 0 && (
          <span className="product-card__oos">Out of stock</span>
        )}
        {product.stock > 0 && product.stock <= product.lowStockThreshold && (
          <span className="product-card__low">Only {product.stock} left</span>
        )}
      </div>
      <div className="product-card__body">
        <div className="product-card__category mono">{product.category}</div>
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__brand text-muted">{product.brand}</div>
        {product.numReviews > 0 && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
    <StarRating rating={product.rating} size={12} />
    <span className="text-muted" style={{ fontSize: 11 }}>({product.numReviews})</span>
  </div>
)}
        <div className="product-card__pricing">
          <span className="product-card__price mono">
            {formatCurrency(product.price)}
          </span>
          {product.mrp > product.price && (
            <span className="product-card__mrp mono">
              {formatCurrency(product.mrp)}
            </span>
          )}
        </div>
    <div style={{ display: 'flex', gap: 6 }}>
  <button
    className="btn btn-primary btn-sm product-card__add"
    onClick={handleAdd}
    disabled={product.stock === 0}
    style={{ flex: 1 }}
  >
    {product.stock === 0 ? 'Unavailable' : 'Add to cart'}
  </button>
  <div onClick={e => e.preventDefault()}>
    <ShareButton
      title={product.name}
      text={`Check out ${product.name}`}
      url={`/product/${product._id}`}
    />
  </div>
</div>
      </div>
    </Link>
  );
};

export default ProductCard;
