import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import './Shop.css';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ categories: [], brands: [] });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || '';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    api.get('/products/meta/filters').then(res => setMeta(res.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (category) params.set('category', category);
      if (brand) params.set('brand', brand);
      if (sort) params.set('sort', sort);
      params.set('page', page);
      params.set('limit', 12);

      const { data } = await api.get(`/products?${params.toString()}`);
      setProducts(data.products);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, category, brand, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', p);
    setSearchParams(next);
  };

  return (
    <div className="page-container">
      <div className="shop-header">
        <h1>Catalog</h1>
        <input
          className="input shop-search"
          placeholder="Search products, brands..."
          defaultValue={keyword}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateParam('keyword', e.target.value);
          }}
        />
      </div>

      <div className="shop-layout">
        <aside className="shop-filters card">
          <div className="filter-group">
            <div className="label">Category</div>
            <button
              className={`filter-option ${!category ? 'filter-option--active' : ''}`}
              onClick={() => updateParam('category', '')}
            >
              All categories
            </button>
            {meta.categories.map(c => (
              <button
                key={c}
                className={`filter-option ${category === c ? 'filter-option--active' : ''}`}
                onClick={() => updateParam('category', c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <div className="label">Brand</div>
            <select className="select" value={brand} onChange={(e) => updateParam('brand', e.target.value)}>
              <option value="">All brands</option>
              {meta.brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <div className="label">Sort by</div>
            <select className="select" value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
              <option value="">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </aside>

        <div className="shop-results">
          {loading ? (
            <div className="empty-state">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="empty-state">No products match your filters.</div>
          ) : (
            <>
              <div className="text-muted mono" style={{ marginBottom: 16, fontSize: 13 }}>
                {pagination.total} result{pagination.total !== 1 ? 's' : ''}
              </div>
              <div className="product-grid">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
              {pagination.pages > 1 && (
                <div className="pagination">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
