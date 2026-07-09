import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import ProductCard from './ProductCard';
import StoreFooter from './Footer';
import Pagination from '../components/Pagination';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name_asc', label: 'Name A-Z' },
];

const CATEGORY_ICONS = {
  'Microcontrollers': 'fa-microchip',
  'Sensors': 'fa-satellite-dish',
  'Motors': 'fa-gear',
  'Raspberry Pi': 'fa-desktop',
  'Displays': 'fa-tv',
  'Power': 'fa-bolt',
  'Tools': 'fa-screwdriver-wrench',
  'default': 'fa-cube',
};

const STOCK_OPTIONS = [
  { value: 'all', label: 'All Stock' },
  { value: 'in', label: 'In Stock' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
];

const PRICE_RANGES = [
  { value: 'all', label: 'Any Price' },
  { value: '0-500', label: 'Under Rs. 500' },
  { value: '500-1000', label: 'Rs. 500 - 1,000' },
  { value: '1000-5000', label: 'Rs. 1,000 - 5,000' },
  { value: '5000+', label: 'Over Rs. 5,000' },
];

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    document.title = 'Himalix Store | Nepal\'s Electronics Hub';
    const updateMeta = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (meta) meta.setAttribute('content', content);
    };
    const updateMetaName = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (meta) meta.setAttribute('content', content);
    };
    updateMeta('og:title', 'Himalix Store | Nepal\'s Electronics Hub');
    updateMeta('og:description', 'Explore development boards, sensors, motors, tools, and accessories delivered across Nepal.');
    updateMeta('og:url', window.location.href);
    updateMetaName('twitter:title', 'Himalix Store | Nepal\'s Electronics Hub');
    updateMetaName('twitter:description', 'Explore development boards, sensors, motors, tools, and accessories delivered across Nepal.');
  }, []);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearch(q);
  }, [searchParams]);
  const [activeCategory, setCategory] = useState('all');
  const [sort, setSort] = useState('default');
  const [stockFilter, setStockFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [categorySearch, setCategorySearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, search, sort, stockFilter, priceRange]);

  useEffect(() => {
    fetch('/api/store/products')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load products');
        return r.json();
      })
      .then(data => {
        const prods = data.products || [];
        setProducts(prods);
      })
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return cats.sort();
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter(cat => cat.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const featuredProducts = useMemo(() => {
    return products
      .filter(p => p.stock_quantity > 0)
      .sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0))
      .slice(0, 10);
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];

    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    if (stockFilter !== 'all') {
      list = list.filter(p => {
        const qty = p.stock_quantity || 0;
        switch (stockFilter) {
          case 'in': return qty > 5;
          case 'low': return qty > 0 && qty <= 5;
          case 'out': return qty <= 0;
          default: return true;
        }
      });
    }

    if (priceRange !== 'all') {
      list = list.filter(p => {
        const price = p.price || 0;
        switch (priceRange) {
          case '0-500': return price < 500;
          case '500-1000': return price >= 500 && price <= 1000;
          case '1000-5000': return price > 1000 && price <= 5000;
          case '5000+': return price > 5000;
          default: return true;
        }
      });
    }

    switch (sort) {
      case 'price_asc': list.sort((a, b) => a.price - b.price); break;
      case 'price_desc': list.sort((a, b) => b.price - a.price); break;
      case 'newest': list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case 'name_asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }

    return list;
  }, [products, activeCategory, search, sort, stockFilter, priceRange]);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setSearchParams({});
    setCategory('all');
    setSort('default');
    setStockFilter('all');
    setPriceRange('all');
  }, []);

  const hasActiveFilters = search || activeCategory !== 'all' || sort !== 'default' || stockFilter !== 'all' || priceRange !== 'all';

  return (
    <div className="store-page">
      <SEO 
        title="Buy Electronics, Arduino & Robotics Parts Nepal"
        description="Nepal's premium electronics and robotics components online store. Buy Arduino, microcontrollers, Raspberry Pi, sensors, and development tools with fast delivery."
        keywords="electronics store nepal, buy arduino kathmandu, buy raspberry pi nepal, electronics components online, robotic sensors shop"
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Himalix Electronics & Components Store",
          "description": "Nepal's premium online electronics store. Explore robotics parts, microcontrollers, Arduino components, sensors, and development tools.",
          "url": "https://himalixlabs.tech/store",
          "isPartOf": {
            "@type": "WebSite",
            "url": "https://himalixlabs.tech"
          }
        }}
      />
      
      <div style={{ maxWidth: 'var(--max-width-lg)', margin: 'var(--space-4) auto 0 auto', padding: '0 var(--space-4)' }}>
        <Breadcrumbs items={[{ label: 'Store', path: '/store' }]} />
      </div>

      {/* Promotional Projects Banner */}
      <div className="store-promo-banner" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-0)', padding: 'var(--space-2) var(--space-4)', textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
        Build something amazing! Check out our prebuilt Tech Projects and Kits.
        <Link to="/project" style={{ color: 'var(--bg-0)', textDecoration: 'underline', marginLeft: 'var(--space-2)' }}>
          Explore Projects <i className="fa-light fa-arrow-right"></i>
        </Link>
      </div>

      <div className="store-layout-container">
        <div className="store-layout-wrapper">
          
          {/* Left Column: Filter Sidebar */}
          <aside className="store-sidebar">
            <div className="sidebar-header">
              <span className="sidebar-title">Filters</span>
              {hasActiveFilters && (
                <button className="sidebar-clear-btn" onClick={clearAllFilters}>
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Section: Category/Item Group */}
            <div className="filter-section">
              <span className="filter-section-title">Item Group</span>
              
              {/* Category Search box */}
              <div className="sidebar-search-box">
                <i className="fa-light fa-sharp fa-magnifying-glass search-icon" />
                <input
                  type="text"
                  placeholder="Search Item Groups..."
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  className="sidebar-search-input"
                />
                {categorySearch && (
                  <button onClick={() => setCategorySearch('')} className="search-clear-btn">
                    <i className="fa-light fa-sharp fa-xmark" />
                  </button>
                )}
              </div>

              {/* Category checklist */}
              <div className="filter-list filter-list--scrollable">
                <label className={`filter-row${activeCategory === 'all' ? ' filter-row--active' : ''}`}>
                  <input
                    type="radio"
                    name="category-filter"
                    checked={activeCategory === 'all'}
                    onChange={() => setCategory('all')}
                    className="filter-checkbox-input"
                  />
                  <span className="filter-checkbox-indicator" />
                  <span className="filter-label">All Categories</span>
                  <span className="filter-count">{products.length}</span>
                </label>

                {filteredCategories.map(cat => (
                  <label key={cat} className={`filter-row${activeCategory === cat ? ' filter-row--active' : ''}`}>
                    <input
                      type="radio"
                      name="category-filter"
                      checked={activeCategory === cat}
                      onChange={() => setCategory(cat)}
                      className="filter-checkbox-input"
                    />
                    <span className="filter-checkbox-indicator" />
                    <span className="filter-label">{cat}</span>
                    <span className="filter-count">{categoryCounts[cat] || 0}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Section: Stock Status */}
            <div className="filter-section">
              <span className="filter-section-title">Stock Status</span>
              <div className="filter-list">
                {STOCK_OPTIONS.map(opt => (
                  <label key={opt.value} className={`filter-row${stockFilter === opt.value ? ' filter-row--active' : ''}`}>
                    <input
                      type="radio"
                      name="stock-filter"
                      checked={stockFilter === opt.value}
                      onChange={() => setStockFilter(opt.value)}
                      className="filter-checkbox-input"
                    />
                    <span className="filter-checkbox-indicator" />
                    <span className="filter-label">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Section: Price Range */}
            <div className="filter-section">
              <span className="filter-section-title">Price Range</span>
              <div className="filter-list">
                {PRICE_RANGES.map(opt => (
                  <label key={opt.value} className={`filter-row${priceRange === opt.value ? ' filter-row--active' : ''}`}>
                    <input
                      type="radio"
                      name="price-filter"
                      checked={priceRange === opt.value}
                      onChange={() => setPriceRange(opt.value)}
                      className="filter-checkbox-input"
                    />
                    <span className="filter-checkbox-indicator" />
                    <span className="filter-label">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Column: Main Content Catalog */}
          <main className="store-main">
            
            {/* Title & Search bar row */}
            <div className="store-main-header">
              <h1 className="store-main-title">All Products</h1>
              
              <div className="store-catalog-search">
                <i className="fa-light fa-sharp fa-magnifying-glass search-icon" />
                <input
                  type="search"
                  placeholder={`Search ${products.length > 0 ? products.length + '+' : ''} products...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="store-catalog-search-input"
                  aria-label="Search products"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="search-clear-btn" aria-label="Clear search">
                    <i className="fa-light fa-sharp fa-xmark" />
                  </button>
                )}
              </div>
            </div>

            {/* Featured Products */}
            {!loading && featuredProducts.length > 0 && !hasActiveFilters && (
              <section className="store-featured" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
                <div className="store-featured__header" style={{ marginBottom: 'var(--space-4)' }}>
                  <h2 className="store-featured__title" style={{ fontSize: 'var(--text-xl)' }}>Featured Products</h2>
                  <span className="store-featured__subtitle">Handpicked for you</span>
                </div>
                <div className="store-featured__scroll">
                  {featuredProducts.map(product => (
                    <div key={product.id} className="store-featured__item">
                      <ProductCard product={product} featured />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Toolbar showing Sort selection and result count */}
            <div className="store-catalog-toolbar">
              <span className="store-catalog-count">
                Showing <strong>{filtered.length}</strong> products
              </span>
              
              <div className="store-catalog-sort">
                <span className="sort-label">Sort By:</span>
                <select
                  className="store-catalog-select"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters tags */}
            {hasActiveFilters && (
              <div className="store-active-tags-container">
                <div className="store-active-tags-list">
                  {search && (
                    <span className="active-tag-item">
                      Search: "{search}"
                      <button onClick={() => setSearch('')} aria-label="Remove search filter">
                        <i className="fa-light fa-xmark" />
                      </button>
                    </span>
                  )}
                  {activeCategory !== 'all' && (
                    <span className="active-tag-item">
                      {activeCategory}
                      <button onClick={() => setCategory('all')} aria-label="Remove category filter">
                        <i className="fa-light fa-xmark" />
                      </button>
                    </span>
                  )}
                  {stockFilter !== 'all' && (
                    <span className="active-tag-item">
                      {STOCK_OPTIONS.find(o => o.value === stockFilter)?.label}
                      <button onClick={() => setStockFilter('all')} aria-label="Remove stock filter">
                        <i className="fa-light fa-xmark" />
                      </button>
                    </span>
                  )}
                  {priceRange !== 'all' && (
                    <span className="active-tag-item">
                      {PRICE_RANGES.find(o => o.value === priceRange)?.label}
                      <button onClick={() => setPriceRange('all')} aria-label="Remove price filter">
                        <i className="fa-light fa-xmark" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Product display */}
            <div className="store-catalog-body">
              {loading && (
                <div className="product-grid" aria-label="Loading products">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton-card__img" />
                      <div className="skeleton-card__body">
                        <div className="skeleton-card__line skeleton-card__line--short" />
                        <div className="skeleton-card__line skeleton-card__line--medium" />
                        <div className="skeleton-card__line skeleton-card__line--long" />
                        <div className="skeleton-card__footer">
                          <div className="skeleton-card__line skeleton-card__line--price" />
                          <div className="skeleton-card__line skeleton-card__line--btn" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="store-error">
                  <div className="store-error__icon">
                    <i className="fa-light fa-sharp fa-circle-exclamation" />
                  </div>
                  <p className="store-error__text">{error}</p>
                  <button className="btn btn-outline" onClick={() => window.location.reload()}>
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="store-empty">
                  <div className="store-empty__icon">
                    <i className="fa-light fa-sharp fa-box-open" />
                  </div>
                  <h3 className="store-empty__title">No products found</h3>
                  <p className="store-empty__text">
                    {search
                      ? `No products match "${search}"`
                      : 'No products match your current filters'}
                  </p>
                  <button className="btn btn-primary" onClick={clearAllFilters}>
                    <i className="fa-light fa-xmark" /> Clear Filters
                  </button>
                </div>
              )}

              {!loading && !error && filtered.length > 0 && (
                <>
                  <div className="product-grid">
                    {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={Math.ceil(filtered.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      <StoreFooter />
    </div>
  );
}
