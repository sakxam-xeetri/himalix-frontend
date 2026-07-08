import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../auth/AuthContext';
import Pagination from '../components/Pagination';

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, sale, rent
  const [status, setStatus] = useState('all'); // all, available, sold out, rented
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { user } = useAuth();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [customForm, setCustomForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    project_name: '',
    project_type: 'software',
    description: '',
    long_description: ''
  });

  useEffect(() => {
    if (user) {
      setCustomForm(p => ({
        ...p,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/project/custom-request', {
        method: 'POST',
        headers,
        body: JSON.stringify(customForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitStatus('success');
        setCustomForm({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          project_name: '',
          project_type: 'software',
          description: '',
          long_description: ''
        });
        setTimeout(() => {
          setShowCustomModal(false);
          setSubmitStatus('idle');
        }, 3000);
      } else {
        setSubmitError(data.message || data.error || 'Failed to submit request');
      }
    } catch(err) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearch(q);
  }, [searchParams]);
  const [sort, setSort] = useState('newest');

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        let url = `/api/project?type=${filter}&status=${status}&sort=${sort}`;
        if (debouncedSearch) {
          url += `&search=${encodeURIComponent(debouncedSearch)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };
    fetchProjects();
  }, [filter, status, debouncedSearch, sort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, status, debouncedSearch, sort]);

  const clearAllFilters = () => {
    setSearch('');
    setSearchParams({});
    setFilter('all');
    setStatus('all');
    setSort('newest');
  };

  const hasActiveFilters = search || filter !== 'all' || status !== 'all' || sort !== 'newest';

  if (initialLoading) return <LoadingScreen onDone={() => setInitialLoading(false)} />;

  return (
    <div className="store-page">
      
      {/* Main Hero & Filters */}
      <section className="store-hero">
        <div className="store-hero__inner">
          <div className="store-hero__content">
            <div className="store-hero__eyebrow">
              <i className="fa-light fa-sharp fa-folder-open" /> Himalix Projects
            </div>
            <h1 className="store-hero__title">Prebuilt Tech Projects & Kits</h1>
            <p className="store-hero__subtitle">Explore our collection of engineering prototypes, DIY kits, and custom source codes.</p>
            <button 
              className="btn btn-primary" 
              style={{ marginTop: 'var(--space-4)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
              onClick={() => setShowCustomModal(true)}
              title="Submit a request for a custom engineering design, prototype or code"
            >
              <i className="fa-light fa-sharp fa-square-plus" />
              Request Custom Project
            </button>
          </div>

          {/* Search */}
          <div className="store-hero__search" role="search">
            <span className="store-hero__search-icon" aria-hidden="true">
              <i className="fa-light fa-sharp fa-magnifying-glass" />
            </span>
            <input
              className="store-hero__search-input"
              type="search"
              placeholder={`Search projects...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search projects"
            />
            {search && (
              <button
                className="store-hero__search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <i className="fa-light fa-sharp fa-xmark" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="store-hero__categories" role="group" aria-label="Type quick filters">
            <button
              className={`store-hero__cat-chip${filter === 'all' ? ' store-hero__cat-chip--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <i className="fa-light fa-sharp fa-grid-2" />
              <span>All Types</span>
            </button>
            <button
              className={`store-hero__cat-chip${filter === 'sale' ? ' store-hero__cat-chip--active' : ''}`}
              onClick={() => setFilter('sale')}
            >
              <i className="fa-light fa-sharp fa-tags" />
              <span>For Sale</span>
            </button>
            <button
              className={`store-hero__cat-chip${filter === 'rent' ? ' store-hero__cat-chip--active' : ''}`}
              onClick={() => setFilter('rent')}
            >
              <i className="fa-light fa-sharp fa-calendar-days" />
              <span>For Rent</span>
            </button>
          </div>
        </div>
      </section>

      {/* Select Filter Dropdowns */}
      <div style={{ maxWidth: 'var(--max-width)', margin: 'var(--space-6) auto 0', width: '100%', padding: '0 var(--space-6)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value)}
          className="form-select"
          style={{ width: 'auto', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)', padding: '8px 16px', outline: 'none', fontSize: 'var(--text-xs)', letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          <option value="all">All Statuses</option>
          <option value="available">Available Only</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="rented">Rented</option>
        </select>

        <select 
          value={sort} 
          onChange={e => setSort(e.target.value)}
          className="form-select"
          style={{ width: 'auto', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)', padding: '8px 16px', outline: 'none', fontSize: 'var(--text-xs)', letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="store-active-filters" style={{ marginTop: 'var(--space-4)' }}>
          <div className="store-active-filters__inner">
            <div className="store-active-filters__tags">
              {search && (
                <span className="store-active-filters__tag">
                  Search: "{search}"
                  <button onClick={() => setSearch('')} aria-label="Remove search filter">
                    <i className="fa-light fa-xmark" />
                  </button>
                </span>
              )}
              {filter !== 'all' && (
                <span className="store-active-filters__tag">
                  Type: {filter === 'sale' ? 'For Sale' : 'For Rent'}
                  <button onClick={() => setFilter('all')} aria-label="Remove type filter">
                    <i className="fa-light fa-xmark" />
                  </button>
                </span>
              )}
              {status !== 'available' && (
                <span className="store-active-filters__tag">
                  Status: {status === 'out_of_stock' ? 'OUT OF STOCK' : status.toUpperCase()}
                  <button onClick={() => setStatus('all')} aria-label="Remove status filter">
                    <i className="fa-light fa-xmark" />
                  </button>
                </span>
              )}
              {sort !== 'newest' && (
                <span className="store-active-filters__tag">
                  Sort: {sort.toUpperCase()}
                  <button onClick={() => setSort('newest')} aria-label="Remove sort filter">
                    <i className="fa-light fa-xmark" />
                  </button>
                </span>
              )}
            </div>
            <button className="store-active-filters__clear" onClick={clearAllFilters}>
              <i className="fa-light fa-xmark" /> Clear all
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="store-content" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease-in-out' }}>
        {projects.length === 0 ? (
          <div className="store-empty">
            <div className="store-empty__icon">
              <i className="fa-light fa-sharp fa-box-open" />
            </div>
            <h3 className="store-empty__title">No projects found</h3>
            <p className="store-empty__text">
              {search
                ? `No projects match "${search}"`
                : 'No projects match your current filters'}
            </p>
            <button className="btn btn-primary" onClick={clearAllFilters}>
              <i className="fa-light fa-xmark" /> Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {projects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(project => {
                const isAvailable = project.status === 'available';
                const badgeClass = project.type === 'sale' ? 'new' : 'sale';
                return (
                  <article
                    key={project.id}
                    className="product-card"
                    onClick={() => navigate(`/projects/${project.slug || project.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/projects/${project.slug || project.id}`)}
                    aria-label={`View ${project.name}`}
                  >
                    {/* Badges */}
                    <div className="product-card__badges">
                      <span className={`product-card__badge product-card__badge--${badgeClass}`}>
                        {project.type === 'sale' ? 'For Sale' : 'For Rent'}
                      </span>
                    </div>

                    {/* Image */}
                    <div className="product-card__image-wrap">
                      <img
                        className="product-card__image"
                        src={project.image_url || '/placeholder.svg'}
                        alt={project.name}
                        loading="lazy"
                        onError={e => { e.target.src = '/placeholder.svg'; }}
                      />
                      <div className="product-card__image-overlay">
                        <span className="product-card__view-btn">
                          <i className="fa-light fa-sharp fa-arrow-right" />
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="product-card__body">
                      <span className="product-card__category">{project.type.toUpperCase()}</span>
                      <h3 className="product-card__name">{project.name}</h3>

                      {/* Stock / Status */}
                      <div className={`product-card__stock product-card__stock--${isAvailable ? 'in' : 'out'}`}>
                        <i className={`fa-light fa-sharp fa-${isAvailable ? 'check-circle' : 'xmark-circle'}`} />
                        {project.status.toUpperCase()}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="product-card__footer">
                      <div className="product-card__price-group">
                        <span className="product-card__price">
                          Rs. {Number(project.price).toLocaleString()}{project.type === 'rent' ? ' / week' : ''}
                        </span>
                      </div>

                      <button
                        className="product-card__add-btn"
                        onClick={() => navigate(`/projects/${project.slug || project.id}`)}
                      >
                        <i className="fa-light fa-sharp fa-arrow-right" />
                        <span>Explore</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <Pagination 
              currentPage={currentPage}
              totalPages={Math.ceil(projects.length / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>

      <Footer />

      {showCustomModal && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCustomModal(false); }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div className="admin-modal" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', width: '90%', maxWidth: '600px', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-xl)', position: 'relative' }} role="dialog" aria-modal="true" aria-labelledby="custom-proj-modal-title">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => setShowCustomModal(false)} 
              style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px' }}
              title="Close dialog"
            >
              <i className="fa-light fa-sharp fa-xmark" />
            </button>
            
            <h2 id="custom-proj-modal-title" style={{ marginTop: 0, marginBottom: 'var(--space-2)', fontSize: 'var(--text-lg)', color: 'var(--text-0)', fontWeight: 'bold' }}>
              Request a Custom Project
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
              Submit details for your custom embedded, hardware, or software project. Our engineering team will review it and contact you.
            </p>

            {submitStatus === 'success' ? (
              <div className="alert alert-success" style={{ margin: 'var(--space-4) 0' }}>
                <i className="fa-light fa-sharp fa-circle-check" style={{ marginRight: '8px' }} />
                Your request has been placed successfully! Our admins will contact you soon.
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit}>
                {submitError && (
                  <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
                    <i className="fa-light fa-sharp fa-circle-exclamation" style={{ marginRight: '8px' }} />
                    {submitError}
                  </div>
                )}
                
                <div className="checkout-address__row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="custom-client-name">Your Name *</label>
                    <input 
                      id="custom-client-name"
                      className="form-control" 
                      type="text" 
                      required 
                      value={customForm.name} 
                      onChange={e => setCustomForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Zenith Kandel" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="custom-client-email">Email Address *</label>
                    <input 
                      id="custom-client-email"
                      className="form-control" 
                      type="email" 
                      required 
                      value={customForm.email} 
                      onChange={e => setCustomForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="e.g. yourname@domain.com" 
                    />
                  </div>
                </div>

                <div className="checkout-address__row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="custom-client-phone">Phone Number (Optional)</label>
                    <input 
                      id="custom-client-phone"
                      className="form-control" 
                      type="tel" 
                      value={customForm.phone} 
                      onChange={e => setCustomForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="98XXXXXXXX" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="custom-proj-type">Project Type *</label>
                    <select 
                      id="custom-proj-type"
                      className="form-select" 
                      required 
                      value={customForm.project_type} 
                      onChange={e => setCustomForm(p => ({ ...p, project_type: e.target.value }))}
                    >
                      <option value="software">Software (Web, App, API)</option>
                      <option value="hardware">Hardware (PCB Design, Enclosure)</option>
                      <option value="embedded">Embedded Systems (Arduino, IoT, Robotics)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="form-label" htmlFor="custom-proj-name">Project Name / Title *</label>
                  <input 
                    id="custom-proj-name"
                    className="form-control" 
                    type="text" 
                    required 
                    value={customForm.project_name} 
                    onChange={e => setCustomForm(p => ({ ...p, project_name: e.target.value }))}
                    placeholder="e.g. Smart Irrigation System using ESP32" 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="form-label" htmlFor="custom-proj-desc">Brief Objective / Short Description *</label>
                  <input 
                    id="custom-proj-desc"
                    className="form-control" 
                    type="text" 
                    required 
                    value={customForm.description} 
                    onChange={e => setCustomForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Provide a quick 1-sentence summary of the main goal" 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label" htmlFor="custom-proj-long-desc">Detailed Requirements / Scope (Optional)</label>
                  <textarea 
                    id="custom-proj-long-desc"
                    className="form-control" 
                    rows="4" 
                    value={customForm.long_description} 
                    onChange={e => setCustomForm(p => ({ ...p, long_description: e.target.value }))}
                    placeholder="Describe components needed, expected inputs/outputs, programming environments, budget constraints, or timeline..." 
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCustomModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
