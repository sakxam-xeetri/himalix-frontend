import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useCart } from './CartContext';
import { useAuth } from '../auth/AuthContext';
import StoreFooter from './Footer';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, authFetch } = useAuth();

  const [product, setProduct]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setTab]     = useState('description');
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty]           = useState(1);
  const [addedMsg, setAddedMsg] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);

  /* Review form */
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    const promises = [
      fetch(`/api/store/products/${id}`).then(r => {
        if (!r.ok) throw new Error('Product fetch failed');
        return r.json();
      }),
      fetch(`/api/store/reviews/${id}`).then(r => {
        if (!r.ok) throw new Error('Reviews fetch failed');
        return r.json();
      }),
    ];
    if (user) {
      promises.push(authFetch('/api/store/wishlist').then(r => {
        if (!r.ok) throw new Error('Wishlist fetch failed');
        return r.json();
      }).catch(() => null));
    }
    Promise.all(promises)
      .then(([prodData, reviewData, wishlistData]) => {
        if (!prodData.product) { navigate('/store'); return; }
        setProduct(prodData.product);
        setReviews(reviewData.reviews || []);
        if (wishlistData && wishlistData.wishlist) {
          setIsWishlisted(wishlistData.wishlist.some(w => w.product_id === prodData.product.id));
        }
      })
      .catch(() => navigate('/store'))
      .finally(() => setLoading(false));
  }, [id, navigate, user, authFetch]);



  const handleToggleWishlist = async () => {
    if (!user) { navigate('/signin'); return; }
    try {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const url = isWishlisted ? `/api/store/wishlist/${product.id}` : '/api/store/wishlist';
      const body = isWishlisted ? null : JSON.stringify({ product_id: product.id });
      
      const res = await authFetch(url, {
        method,
        body
      });
      if (res.ok) {
        setIsWishlisted(!isWishlisted);
      }
    } catch (e) {
      console.error('Failed to toggle wishlist:', e);
    }
  };

  const handleAddToCart = () => {
    if (!user) { navigate('/signin'); return; }
    addToCart(product, qty);
    setAddedMsg('Added to cart!');
    setTimeout(() => setAddedMsg(''), 2500);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/signin'); return; }
    setReviewLoading(true);
    setReviewError('');
    try {
      const res = await authFetch(`/api/store/reviews/${id}`, {
        method: 'POST',
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit review');
      setReviewSuccess(true);
      setReviews(prev => [data.review, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const formatPrice = (n) => `Rs. ${Number(n).toLocaleString('en-NP')}`;

  if (loading) {
    return (
      <div className="store-page">
        
        <div className="loading-page"><div className="spinner" /></div>
      </div>
    );
  }

  if (!product) return null;

  let images = [];
  if (product.image_urls) {
    try {
      let parsed = product.image_urls;
      while (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        images = parsed.map(url => ({ url }));
      }
    } catch (e) {
      console.error("Error parsing product.image_urls", e);
    }
  }
  if (images.length === 0) {
    images = [{ url: product.image_url || '/placeholder.svg' }];
  }

  let specsObj = {};
  if (product.technical_specs) {
    try {
      let parsed = product.technical_specs;
      while (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      specsObj = parsed || {};
    } catch(e) {
      console.error(e);
    }
  }
  product.specs = specsObj;

  const isOutOfStock = (product.stock_quantity || 0) <= 0;
  const hasDiscount  = product.original_price && product.original_price > product.price;
  const avgRating    = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image_url ? (product.image_url.startsWith('http') ? product.image_url : `${window.location.origin}${product.image_url}`) : '',
    "description": product.description || 'Buy dynamic tech kits and electronic products at Himalix Labs.',
    "sku": product.sku || `PROD-${product.id}`,
    "category": product.category || 'Electronics',
    "brand": {
      "@type": "Brand",
      "name": "Himalix Labs"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "NPR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "priceValidUntil": "2030-12-31",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "100",
          "currency": "NPR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "NP"
        }
      }
    },
    ...(reviews && reviews.length > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": avgRating || 5,
        "reviewCount": reviews.length
      },
      "review": reviews.map(r => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": r.author_name || 'Himalix Customer'
        },
        "datePublished": r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        "reviewBody": r.comment || '',
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": r.rating
        }
      }))
    } : {})
  };

  return (
    <div className="store-page">
      <SEO 
        title={`${product.name} | Buy Electronics Nepal`}
        description={`${product.name} in Nepal. ${product.description ? product.description.substring(0, 110) : ''} Shop at Himalix Labs with fast shipping.`}
        keywords={`${product.name}, buy ${product.name} nepal, ${product.category}, himalix electronics`}
        schema={productSchema}
        ogImage={product.image_url}
        ogType="product"
      />

      <div className="product-detail">
        <Breadcrumbs items={[
          { label: 'Store', path: '/store' },
          { label: product.category || 'Components', path: `/store` },
          { label: product.name }
        ]} />

        {/* Main grid */}
        <div className="product-detail__grid">
          {/* Gallery */}
          <div className="product-detail__gallery">
            <div className="product-detail__main-img">
              <img
                src={images[activeImg]?.url || '/placeholder.svg'}
                alt={product.name}
                onError={e => { e.target.src = '/placeholder.svg'; }}
              />
            </div>
            {images.length > 1 && (
              <div className="product-detail__thumbs">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`product-detail__thumb${i === activeImg ? ' product-detail__thumb--active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setActiveImg(i)}
                    aria-label={`Image ${i + 1}`}
                  >
                    <img src={img.url} alt={`${product.name} ${i + 1}`} onError={e => { e.target.src = '/placeholder.svg'; }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-detail__info">
            {product.category && (
              <div className="product-detail__category">{product.category}</div>
            )}
            <h1 className="product-detail__name">{product.name}</h1>

            {avgRating && (
              <div className="product-detail__rating">
                <div className="product-detail__stars" aria-label={`${avgRating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i key={i}
                      className={`fa-${i < Math.round(parseFloat(avgRating)) ? 'solid' : 'light'} fa-sharp fa-star`}
                    />
                  ))}
                </div>
                <span className="product-detail__rating-count">
                  {avgRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="product-detail__price-wrap">
              <span className="product-detail__price">{formatPrice(product.price)}</span>
              {hasDiscount && (
                <span className="product-detail__price-original">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className={`product-detail__stock stock--${isOutOfStock ? 'out' : product.stock_quantity <= 5 ? 'low' : 'in'}`}>
              <i className={`fa-light fa-sharp fa-circle${isOutOfStock ? '-xmark' : product.stock_quantity <= 5 ? '-exclamation' : '-check'}`} />
              {isOutOfStock ? 'Out of stock' : product.stock_quantity <= 5 ? `Only ${product.stock_quantity} left` : 'In stock'}
            </div>

            {/* Qty + Add to cart */}
            {!isOutOfStock && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="product-detail__qty">
                  <span className="product-detail__qty-label">Quantity</span>
                  <div className="qty-control">
                    <button
                      className="qty-control__btn"
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      title="Decrease quantity by 1"
                    >
                      <i className="fa-light fa-sharp fa-minus" />
                    </button>
                    <input
                      type="number"
                      className="qty-control__val"
                      value={qty}
                      min={1}
                      max={product.stock_quantity}
                      onChange={e => setQty(Math.min(product.stock_quantity, Math.max(1, Number(e.target.value))))}
                      aria-label="Quantity"
                    />
                    <button
                      className="qty-control__btn"
                      onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}
                      aria-label="Increase quantity"
                      title="Increase quantity by 1"
                    >
                      <i className="fa-light fa-sharp fa-plus" />
                    </button>
                  </div>
                </div>

                <div className="product-detail__actions" style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="btn product-detail__cta-massive"
                    onClick={handleAddToCart}
                    style={{ flex: 1 }}
                    title="Add this product to your shopping cart"
                  >
                    <i className="fa-light fa-sharp fa-bag-shopping" style={{ marginRight: '8px' }} />
                    {addedMsg || 'Add to Cart'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleToggleWishlist}
                    style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: isWishlisted ? 'var(--accent)' : 'var(--border)' }}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    title={isWishlisted ? "Remove this product from your wishlist" : "Add this product to your wishlist"}
                  >
                    <i className={`${isWishlisted ? 'fa-solid' : 'fa-light'} fa-sharp fa-heart`} style={{ color: isWishlisted ? 'var(--accent)' : 'inherit', fontSize: '1.2rem' }} />
                  </button>
                </div>
              </div>
            )}

            {/* Quick specs */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="product-detail__spec-list">
                {Object.entries(product.specs).slice(0, 5).map(([k, v]) => (
                  <div key={k} className="product-detail__spec-item">
                    <span className="product-detail__spec-key">{k}</span>
                    <span className="product-detail__spec-value">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="product-detail__tabs">
          <div className="product-detail__tabs-header" role="tablist">
            {['description', 'specs', 'reviews'].map(tab => (
              <button
                key={tab}
                className={`product-detail__tab-btn${activeTab === tab ? ' product-detail__tab-btn--active' : ''}`}
                onClick={() => setTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                id={`tab-${tab}`}
                aria-controls={`panel-${tab}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'reviews' && reviews.length > 0 && (
                  <span style={{ marginLeft: 6, opacity: 0.6 }}>({reviews.length})</span>
                )}
              </button>
            ))}
          </div>

          <div className="product-detail__tab-content" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'description' && (
              <div style={{ color: 'var(--text-1)', lineHeight: 1.8, fontSize: 'var(--text-sm)' }}>
                {product.description || 'No description available.'}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="product-detail__spec-list">
                {product.specs && Object.keys(product.specs).length > 0
                  ? Object.entries(product.specs).map(([k, v]) => (
                      <div key={k} className="product-detail__spec-item">
                        <span className="product-detail__spec-key">{k}</span>
                        <span className="product-detail__spec-value">{String(v)}</span>
                      </div>
                    ))
                  : <p style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>No specifications listed.</p>
                }
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviews.length > 0 ? (
                  <div className="review-list">
                    {reviews.map((r, i) => (
                      <div key={r.id || i} className="review-item">
                        <div className="review-item__header">
                          <div className="review-item__author">
                            <div>
                              <div className="review-item__name">{r.user_name || 'Anonymous'}</div>
                              <div className="review-item__date">
                                {new Date(r.created_at).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                          <div className="review-item__stars" aria-label={`${r.rating} stars`}>
                            {Array.from({ length: 5 }).map((_, si) => (
                              <i key={si} className={`fa-${si < r.rating ? 'solid' : 'light'} fa-sharp fa-star`} />
                            ))}
                          </div>
                        </div>
                        <p className="review-item__text">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                    <div className="empty-state-icon"><i className="fa-light fa-sharp fa-star" /></div>
                    <p>No reviews yet. Be the first!</p>
                  </div>
                )}

                {/* Review form */}
                {user && !reviewSuccess && (
                  <form className="review-form" onSubmit={handleReviewSubmit}>
                    <div className="review-form__title">
                      <i className="fa-light fa-sharp fa-pen" /> Write a Review
                    </div>

                    {reviewError && (
                      <div className="alert alert-danger">
                        <i className="fa-light fa-sharp fa-circle-exclamation" /> {reviewError}
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Rating</label>
                      <div className="star-picker" role="group" aria-label="Rating">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            className={`star-picker__btn${reviewForm.rating >= star ? ' star-picker__btn--active' : ''}`}
                            onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                          >
                            <i className="fa-light fa-sharp fa-star" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="review-comment" className="form-label">Your Review</label>
                      <textarea
                        id="review-comment"
                        className="form-textarea"
                        placeholder="Share your experience…"
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                        required
                        disabled={reviewLoading}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={reviewLoading}>
                      {reviewLoading
                        ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Submitting…</>
                        : <><i className="fa-light fa-sharp fa-paper-plane" /> Submit Review</>
                      }
                    </button>
                  </form>
                )}

                {reviewSuccess && (
                  <div className="alert alert-success" style={{ marginTop: 'var(--space-4)' }}>
                    <i className="fa-light fa-sharp fa-circle-check" /> Review submitted — thank you!
                  </div>
                )}

                {!user && (
                  <div style={{ padding: 'var(--space-5)', borderTop: '1px solid var(--border)', fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>
                    <Link to="/signin" style={{ color: 'var(--accent)' }}>Sign in</Link> to write a review.
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
    <StoreFooter />
  </div>
);
}
