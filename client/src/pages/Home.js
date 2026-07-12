import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const categories = [
  { name: 'Refrigerators', glyph: '▣' },
  { name: 'AC', glyph: '▭' },
  { name: 'washing machine', glyph: '◐' },
  { name: 'Audio', glyph: '◍' },
  { name: 'TVs & Displays', glyph: '▤' },
  { name: 'Inverter', glyph: '◈' }
];

const slides = [
  {
    url:'https://res.cloudinary.com/axufv7xe/image/upload/v1783878263/2023-10-27.1_wu8ck9.jpg',
    label:'Smartphones'
  },
   {
    url:'https://res.cloudinary.com/axufv7xe/image/upload/v1783877969/1.2_fmpufx.jpg',
    label:'Smartphones'
  },
  {
    url: 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6524/6524315cv22d.jpg?w=800&q=80',
    label: 'Latest Laptops'
  },
  {
    url: 'https://assets.gadgets360cdn.com/pricee/assets/category/202005/bluestar-ac-og-image-1200x628_1590075894.jpg',
    label: 'Smartphones'
  },
  {
    url: 'https://mahajanelectronics.com/cdn/shop/files/61YJyo7FGdL._SL1500.jpg?v=1726301308&width=1200?w=800&q=80',
    label: 'Premium Audio'
  },
  
];

const Carousel = () => {
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent(c => (c + 1) % slides.length);

  return (
    <div className="carousel">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`carousel__slide ${i === current ? 'carousel__slide--active' : ''}`}
        >
          <img src={slide.url} alt={slide.label} />
        </div>
      ))}
      <button className="carousel__btn carousel__btn--prev" onClick={prev}>‹</button>
      <button className="carousel__btn carousel__btn--next" onClick={next}>›</button>
      <div className="carousel__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`carousel__dot ${i === current ? 'carousel__dot--active' : ''}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  );
};
const Home = () => {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get('/products?sort=rating&limit=4').then(res => setFeatured(res.data.products)).catch(() => {});
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__copy">
            <span className="tag tag-cyan">Now billing in cash &amp; credit</span>
            <h1 className="hero__title">
              Power up with the latest tech.<br />
              <span className="hero__title-accent">In-store and online.</span>
            </h1>
            <p className="hero__subtitle text-secondary">
              Browse Tv, Fridges, washing machines and more. Checkout with cash, card, UPI,
              or open a credit account for trusted customers — every order generates a proper invoice.
            </p>
            <div className="hero__actions">
              <Link to="/shop" className="btn btn-primary">Browse catalog</Link>
              <Link to="/login" className="btn btn-ghost">Staff / Admin sign in</Link>
            </div>
          </div>
    <Carousel />
        </div>
      </section>

      <section className="page-container">
        <h2 className="section-title">Shop by category</h2>
        <div className="category-grid">
          {categories.map(cat => (
            <Link to={`/shop?category=${encodeURIComponent(cat.name)}`} key={cat.name} className="category-tile">
              <span className="category-tile__glyph">{cat.glyph}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="page-container">
          <div className="section-header">
            <h2 className="section-title">Top rated</h2>
            <Link to="/shop" className="text-muted">View all &rarr;</Link>
          </div>
          <div className="product-grid">
            {featured.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
