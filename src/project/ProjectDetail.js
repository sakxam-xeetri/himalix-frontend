import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../store/CartContext';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import RentalCalendar from '../components/RentalCalendar';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [successAdded, setSuccessAdded] = useState(false);

  // Rental & Related states
  const [availability, setAvailability] = useState([]);
  const [selectedRange, setSelectedRange] = useState(null);
  const [relatedProjects, setRelatedProjects] = useState([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/project/${id}`);
        if (!res.ok) throw new Error('Project not found');
        const data = await res.json();
        
        if (data.project) {
          if (typeof data.project.features === 'string') {
            try { data.project.features = JSON.parse(data.project.features); } catch(e){}
          }
          if (typeof data.project.technologies === 'string') {
            try { data.project.technologies = JSON.parse(data.project.technologies); } catch(e){}
          }
        }
        setProject(data.project);

        // Fetch availability dates
        const availRes = await fetch(`/api/project/${data.project.id || id}/availability`);
        if (availRes.ok) {
          const availData = await availRes.json();
          if (availData.success) {
            setAvailability(availData.availability);
          }
        }

        // Fetch related projects
        const relRes = await fetch('/api/project');
        if (relRes.ok) {
          const relData = await relRes.json();
          if (relData.projects) {
            setRelatedProjects(relData.projects.filter(p => p.id !== Number(id) && p.slug !== id).slice(0, 3));
          }
        }
      } catch (err) {
        console.error(err);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);



  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/project');
    }
  };

  const basePrice = Number(project?.price || 0);
  const rentalPrice = selectedRange ? (basePrice / 7) * selectedRange.days : 0;
  const deposit = basePrice * 1.5; // 1.5x weekly price security deposit
  const grandTotal = rentalPrice + deposit;

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      const isRent = project.type === 'rent';
      const custom_responses = isRent ? { 
        rental_meta: { 
          duration: selectedRange.days, 
          startDate: selectedRange.startDate, 
          endDate: selectedRange.endDate, 
          deposit, 
          rentalPrice 
        },
        price: grandTotal,
        rental_start_date: selectedRange.startDate,
        rental_end_date: selectedRange.endDate
      } : null;

      await addToCart({
        id: project.id,
        name: project.name + (isRent ? ` (Rental — ${selectedRange.days} Days: ${selectedRange.startDate} to ${selectedRange.endDate})` : ''),
        price: isRent ? grandTotal : project.price,
        image_url: project.image_url,
        is_project: true,
        custom_responses
      });
      setSuccessAdded(true);
      setTimeout(() => setSuccessAdded(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const renderCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthName = today.toLocaleString('en-US', { month: 'long' });
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const bookedDays = [5, 6, 7, 18, 19, 20];
    
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} style={{ padding: '4px' }}></div>);
    }
    for (let d = 1; d <= totalDays; d++) {
      const isBooked = bookedDays.includes(d);
      cells.push(
        <div 
          key={d} 
          style={{ 
            padding: '4px', 
            textAlign: 'center', 
            fontSize: '10px', 
            borderRadius: '2px',
            backgroundColor: isBooked ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-3)',
            color: isBooked ? 'var(--danger)' : 'var(--text-1)',
            border: isBooked ? '1px solid var(--danger)' : '1px solid transparent',
            textDecoration: isBooked ? 'line-through' : 'none'
          }}
          title={isBooked ? 'Reserved/Booked' : 'Available'}
        >
          {d}
        </div>
      );
    }
    
    return (
      <div style={{ marginTop: 'var(--space-2)', border: '1px solid var(--border)', padding: '8px', background: 'var(--bg-1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-0)' }}>
          <span>{monthName} {year}</span>
          <span style={{ fontSize: '9px', color: 'var(--danger)' }}>■ Booked</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontWeight: 'bold', fontSize: '9px', color: 'var(--text-3)', marginBottom: '2px' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => <span key={idx}>{day}</span>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {cells}
        </div>
      </div>
    );
  };

  if (loading) return <LoadingScreen onDone={() => setLoading(false)} />;

  if (!project) {
    return (
      <div className="project-page">
        
        <div style={{ padding: 'var(--space-20) var(--space-6)', textAlign: 'center', flex: 1 }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project Not Found</h1>
          <Link to="/project" className="btn btn-outline" style={{ marginTop: 'var(--space-6)' }}>Back to Projects</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const projectSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "name": project.name,
    "image": project.image_url ? (project.image_url.startsWith('http') ? project.image_url : `${window.location.origin}${project.image_url}`) : '',
    "description": project.description || 'Explore this engineering project on Himalix Labs.',
    "programmingLanguage": "Embedded C, Python, JavaScript",
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "NPR",
      "price": project.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": project.status === 'available' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "priceValidUntil": "2030-12-31"
    }
  };

  return (
    <div className="project-page" style={{ paddingTop: '100px' }}>
      <SEO 
        title={`${project.name} | Tech Projects & Kits`}
        description={`${project.name} in Nepal. Explore tech features, rented components, source code, and hardware kits at Himalix Labs.`}
        keywords={`${project.name}, tech projects nepal, engineering prototypes nepal, robotics projects`}
        schema={projectSchema}
        ogImage={project.image_url}
      />
      
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', width: '100%', padding: '0 var(--space-6)' }}>
        <Breadcrumbs items={[
          { label: 'Projects', path: '/project' },
          { label: project.name }
        ]} />
        <button onClick={handleBack} className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)', border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--surface)', marginTop: 'var(--space-2)' }} title="Go back to the projects list catalog page">
          <i className="fa-light fa-sharp fa-arrow-left"></i> Back to Projects
        </button>
      </div>
      
      <div className="project-detail-layout" style={{ flex: 1, paddingTop: 'var(--space-4)' }}>
        <div className="project-detail-main">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
            <img src={project.image_url || '/placeholder.svg'} alt={project.name} style={{ display: 'block', margin: 0 }} />
          </div>
          
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--accent)' }}>About this project</h3>
            <p style={{ lineHeight: 1.7, color: 'var(--text-1)', fontSize: 'var(--text-sm)' }}>{project.description || 'No description provided.'}</p>
          </div>

          {(project.features && Array.isArray(project.features) && project.features.length > 0) && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--accent)' }}>Key Features</h3>
              <ul style={{ paddingLeft: 'var(--space-5)', color: 'var(--text-1)', fontSize: 'var(--text-sm)', lineHeight: 1.8 }}>
                {project.features.map((feat, i) => (
                  <li key={i} style={{ marginBottom: 'var(--space-2)' }}>{feat}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Projects Section */}
          {relatedProjects.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--accent)' }}>Related Projects</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                {relatedProjects.map(p => (
                  <Link key={p.id} to={`/project/${p.slug || p.id}`} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-1)' }} title={`View details for related project ${p.name}`}>
                    <img src={p.image_url || '/placeholder.svg'} alt={p.name} style={{ width: '100%', height: '110px', objectFit: 'cover' }} onError={e => { e.target.src = '/placeholder.svg'; }} />
                    <strong style={{ fontSize: '12px', height: '32px', overflow: 'hidden', color: 'var(--text-0)' }}>{p.name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>Rs. {Number(p.price).toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="project-detail-sidebar">
          <div className="project-detail-info" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 'var(--space-8)', position: 'sticky', top: '100px' }}>
            <div style={{ color: 'var(--accent)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 'var(--space-2)' }}>
              {project.type === 'sale' ? 'For Sale' : 'For Rent'}
            </div>
            <h1 style={{ fontWeight: 800 }}>{project.name}</h1>
            
            {project.type === 'sale' ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 600, margin: 'var(--space-6) 0', color: 'var(--text-0)' }}>
                Rs. {Number(project.price).toLocaleString()}
              </div>
            ) : (
              <div style={{ margin: 'var(--space-4) 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 600, margin: 'var(--space-2) 0', color: 'var(--text-0)' }}>
                  Rs. {Number(project.price).toLocaleString()} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', fontWeight: 400 }}>/ week</span>
                </div>
                {selectedRange ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px dashed var(--border)', paddingBottom: '8px', fontSize: 'var(--text-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Rental Duration:</span>
                        <strong style={{ color: 'var(--text-0)' }}>{selectedRange.days} Days</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-2)', fontSize: '12px' }}>
                        <span>Selected Span:</span>
                        <span className="font-mono" style={{ fontWeight: 600 }}>{selectedRange.startDate} to {selectedRange.endDate}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
                      <span>Rental Rate:</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>Rs. {Number(rentalPrice).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: 'var(--text-sm)', borderBottom: '1px dashed var(--border)', paddingBottom: '8px' }}>
                      <span>Security Deposit (1.5x):</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>Rs. {Number(deposit).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: 'var(--text-lg)', color: 'var(--accent)', fontWeight: 'bold', paddingTop: '4px' }}>
                      <span>Total Payable:</span>
                      <span className="font-mono">Rs. {Number(grandTotal).toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <div className="alert alert-warning" style={{ marginBottom: 'var(--space-3)' }}>
                    Please select rental dates from the calendar below to see pricing and enable add to cart.
                  </div>
                )}

                <div style={{ marginTop: '15px' }}>
                  <RentalCalendar availability={availability} onRangeChange={setSelectedRange} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 'var(--space-8)' }}>
              <button 
                className="btn btn-primary btn-full btn-lg" 
                onClick={handleAddToCart} 
                disabled={adding || project.status === 'out_of_stock' || project.status === 'sold out' || project.stock_quantity === 0 || (project.type === 'rent' && !selectedRange)}
                title={project.status === 'out_of_stock' || project.status === 'sold out' || project.stock_quantity === 0 ? 'This project is out of stock' : (project.type === 'sale' ? "Purchase and add this project parts/code to your cart" : "Rent this project and add it to your cart")}
              >
                <i className="fa-light fa-sharp fa-cart-shopping" style={{ marginRight: 8 }}></i>
                {adding ? 'Adding...' : successAdded ? 'Added!' : (project.status === 'out_of_stock' || project.status === 'sold out' || project.stock_quantity === 0) ? 'Out of Stock' : project.type === 'sale' ? 'Add to Cart' : 'Rent Project'}
              </button>
              {successAdded && (
                <Link to="/store/cart" className="btn btn-outline btn-full btn-lg" style={{ marginTop: 'var(--space-2)' }} title="Go to the checkout shopping cart page">
                  <i className="fa-light fa-sharp fa-arrow-right" style={{ marginRight: 8 }}></i> View Cart / Checkout
                </Link>
              )}
            </div>

            {(project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0) && (
              <div style={{ marginBottom: 'var(--space-8)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-6)' }}>
                <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-2)' }}>Technologies Used</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {project.technologies.map((tech, i) => (
                    <span key={i} className="project-tag" style={{ margin: 0 }}>{tech}</span>
                  ))}
                </div>
              </div>
            )}

            {(project.components && project.components.length > 0) && (
              <div className="project-components-list">
                <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)' }}>
                  <i className="fa-light fa-sharp fa-microchip" style={{ marginRight: 8 }}></i>
                  Required Store Parts
                </h4>
                <p style={{ fontSize: 'var(--text-xxs)', color: 'var(--text-3)', marginBottom: 'var(--space-4)' }}>
                  Want to DIY? Link directly to original components in our Store:
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                  {project.components.map(comp => (
                    <div key={comp.id} className="project-component-item" style={{ margin: 0, padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                        <img src={comp.image_url || '/placeholder.svg'} alt={comp.name} style={{ width: 48, height: 48, borderRadius: 2 }} />
                        <div className="project-component-details" style={{ flex: 1 }}>
                          <div className="project-component-name" style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                            {comp.name} {comp.required_quantity > 1 && <span style={{ color: 'var(--accent)' }}>(Qty: {comp.required_quantity})</span>}
                          </div>
                          <div className="project-component-price" style={{ fontSize: 'var(--text-xxs)', marginTop: 2 }}>Rs. {Number(comp.price).toLocaleString()}</div>
                        </div>
                        <Link to={`/store/product/${comp.id}`} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '10px' }}>
                          Buy Part
                        </Link>
                      </div>
                      {comp.purpose && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', background: 'var(--bg-3)', padding: '6px 10px', borderLeft: '2px solid var(--accent)', fontStyle: 'italic' }}>
                          <strong>Role:</strong> {comp.purpose}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
