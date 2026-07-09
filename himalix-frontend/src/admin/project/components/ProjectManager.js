import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import LoadingScreen from '../../../components/LoadingScreen';
import FileUploadZone from '../../../components/FileUploadZone';
import useBatchSelection from '../../../hooks/useBatchSelection';
import BatchCheckbox from '../../components/BatchCheckbox';
import BatchActionBar from '../../components/BatchActionBar';
import BatchToast from '../../components/BatchToast';
import { exportToCsv } from '../../utils/csvExport';
import RentalCalendar from '../../../components/RentalCalendar';

export default function ProjectManager() {
  const { authFetch, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [step, setStep] = useState(1);
  const [validationError, setValidationError] = useState('');
  const [calendarModalProject, setCalendarModalProject] = useState(null);
  const [projectAvailability, setProjectAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [blockedRanges, setBlockedRanges] = useState([]);
  const [newBlockNote, setNewBlockNote] = useState('');
  const [newBlockStart, setNewBlockStart] = useState('');
  const [newBlockEnd, setNewBlockEnd] = useState('');
  
  // Store products cache for linking
  const [storeProducts, setStoreProducts] = useState([]);

  const openCalendarModal = async (project) => {
    setCalendarModalProject(project);
    setLoadingAvailability(true);
    setProjectAvailability([]);
    setBlockedRanges([]);
    setNewBlockStart('');
    setNewBlockEnd('');
    setNewBlockNote('');
    try {
      const res = await authFetch(`/api/project/${project.id}/availability`);
      const data = await res.json();
      if (data.success) {
        setProjectAvailability(data.availability || []);
      }

      const resBlocked = await authFetch(`/api/admin/project/${project.id}/blocked`);
      const dataBlocked = await resBlocked.json();
      if (dataBlocked.success) {
        setBlockedRanges(dataBlocked.blocked || []);
      }
    } catch (e) {
      console.error("Failed to load availability:", e);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleBlockDates = async (e) => {
    e.preventDefault();
    if (!newBlockStart || !newBlockEnd) {
      alert("Start and End dates are required");
      return;
    }
    try {
      setLoadingAvailability(true);
      const res = await authFetch(`/api/admin/project/${calendarModalProject.id}/blocked`, {
        method: 'POST',
        body: JSON.stringify({
          start_date: newBlockStart,
          end_date: newBlockEnd,
          note: newBlockNote
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewBlockStart('');
        setNewBlockEnd('');
        setNewBlockNote('');
        const resAvail = await authFetch(`/api/project/${calendarModalProject.id}/availability`);
        const dataAvail = await resAvail.json();
        if (dataAvail.success) {
          setProjectAvailability(dataAvail.availability || []);
        }
        const resBlocked = await authFetch(`/api/admin/project/${calendarModalProject.id}/blocked`);
        const dataBlocked = await resBlocked.json();
        if (dataBlocked.success) {
          setBlockedRanges(dataBlocked.blocked || []);
        }
      } else {
        alert(data.error || "Failed to block dates");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to block dates");
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleDeleteBlockRange = async (blockedId) => {
    if (!window.confirm("Are you sure you want to clear this blocked date range?")) return;
    try {
      setLoadingAvailability(true);
      const res = await authFetch(`/api/admin/project/${calendarModalProject.id}/blocked/${blockedId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const resAvail = await authFetch(`/api/project/${calendarModalProject.id}/availability`);
        const dataAvail = await resAvail.json();
        if (dataAvail.success) {
          setProjectAvailability(dataAvail.availability || []);
        }
        const resBlocked = await authFetch(`/api/admin/project/${calendarModalProject.id}/blocked`);
        const dataBlocked = await resBlocked.json();
        if (dataBlocked.success) {
          setBlockedRanges(dataBlocked.blocked || []);
        }
      } else {
        alert(data.error || "Failed to clear dates");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to clear dates");
    } finally {
      setLoadingAvailability(false);
    }
  };

  const {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isSelectedAll,
    isIndeterminate,
    selectionCount
  } = useBatchSelection();

  const [batchLoading, setBatchLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleBatchToggleActive = async (isActive) => {
    setBatchLoading(true);
    try {
      const res = await authFetch('/api/admin/project/batch-toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'projects', ids: selectedIds, is_active: isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch update failed');
      clearSelection();
      fetchProjects();
      setToast({ message: `Successfully updated active state for ${selectedIds.length} projects`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      const res = await authFetch('/api/admin/project/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'projects', ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch delete failed');
      clearSelection();
      fetchProjects();
      setToast({ message: `Successfully deleted ${selectedIds.length} projects`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExportCsv = () => {
    const exportData = projects.filter(p => selectedIds.includes(p.id));
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Description', key: 'description' },
      { header: 'Type', key: 'type' },
      { header: 'Price', key: 'price' },
      { header: 'Stock Quantity', key: 'stock_quantity' },
      { header: 'Status', key: 'status' },
      { header: 'Is Active', key: (p) => p.is_active ? 'Yes' : 'No' }
    ];
    exportToCsv(exportData, columns, 'projects_export');
  };
  
  useEffect(() => {
    fetchProjects();
    fetchStoreProducts();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/project');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreProducts = async () => {
    try {
      const res = await authFetch('/api/store/admin/products');
      const data = await res.json();
      setStoreProducts(data.products || []);
    } catch (e) {}
  };

  const fetchProjectComponents = async (projectId) => {
    try {
      const res = await authFetch(`/api/admin/project/${projectId}/components`);
      const data = await res.json();
      return data.components || [];
    } catch (e) {
      return [];
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await authFetch(`/api/admin/project/${id}`, { method: 'DELETE' });
      setProjects(projects.filter(p => p.id !== id));
    } catch (e) {}
  };

  const openEditModal = async (project = null) => {
    setStep(1);
    setValidationError('');
    if (project) {
      const components = await fetchProjectComponents(project.id);
      let features = project.features;
      let technologies = project.technologies;
      
      if (typeof features === 'string') try { features = JSON.parse(features); } catch(e){}
      if (typeof technologies === 'string') try { technologies = JSON.parse(technologies); } catch(e){}
      
      setEditModal({ 
        ...project, 
        features: Array.isArray(features) ? features.join(', ') : '',
        technologies: Array.isArray(technologies) ? technologies.join(', ') : '',
        components 
      });
    } else {
      setEditModal({
        name: '', description: '', features: '', technologies: '',
        type: 'sale', price: 0, status: 'available', image_url: '', stock_quantity: 1, components: []
      });
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setValidationError('');

    if (!editModal.name || !editModal.name.trim()) {
      setValidationError('Project Name is required.');
      setStep(1);
      setSaving(false);
      return;
    }
    if (editModal.price === '' || isNaN(Number(editModal.price)) || Number(editModal.price) < 0) {
      setValidationError('Price must be a valid positive number.');
      setStep(2);
      setSaving(false);
      return;
    }
    if (editModal.stock_quantity === '' || isNaN(Number(editModal.stock_quantity)) || Number(editModal.stock_quantity) < 0) {
      setValidationError('Stock quantity must be a valid positive integer.');
      setStep(2);
      setSaving(false);
      return;
    }

    const payload = {
      ...editModal,
      features: editModal.features ? editModal.features.split(',').map(s => s.trim()).filter(Boolean) : [],
      technologies: editModal.technologies ? editModal.technologies.split(',').map(s => s.trim()).filter(Boolean) : []
    };
    
    try {
      if (payload.id) {
        const res = await authFetch(`/api/admin/project/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setEditModal(null);
          fetchProjects();
        } else {
          setValidationError('Failed to update project settings.');
        }
      } else {
        const res = await authFetch('/api/admin/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setEditModal(null);
          fetchProjects();
        } else {
          setValidationError('Failed to create new project.');
        }
      }
    } catch (e) {
      setValidationError('Connection failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const linkComponent = async (e) => {
    e.preventDefault();
    const form = e.target;
    const product_id = form.product_id.value;
    const quantity = form.quantity.value;
    const purpose = form.purpose.value;
    
    if (!product_id || !editModal.id) return;
    
    try {
      await authFetch(`/api/admin/project/${editModal.id}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id, quantity, purpose })
      });
      const updatedComponents = await fetchProjectComponents(editModal.id);
      setEditModal({ ...editModal, components: updatedComponents });
      form.reset();
    } catch (e) {}
  };

  const unlinkComponent = async (linkId) => {
    try {
      await authFetch(`/api/admin/project/${editModal.id}/components/${linkId}`, { method: 'DELETE' });
      const updatedComponents = await fetchProjectComponents(editModal.id);
      setEditModal({ ...editModal, components: updatedComponents });
    } catch (e) {}
  };

  const stepsConfig = [
    { label: 'Basic Info' },
    { label: 'Pricing & Status' },
    { label: 'Project Media' },
    { label: 'Specs & Features' },
    { label: 'Linked Components' },
    { label: 'Verify & Save' }
  ];

  const handleNext = () => {
    setValidationError('');
    if (step === 1) {
      if (!editModal.name.trim()) {
        setValidationError('Project Name is required.');
        return;
      }
    }
    if (step === 2) {
      if (editModal.price === '' || isNaN(Number(editModal.price)) || Number(editModal.price) < 0) {
        setValidationError('Price must be a valid positive number.');
        return;
      }
      if (editModal.stock_quantity === '' || isNaN(Number(editModal.stock_quantity)) || Number(editModal.stock_quantity) < 0) {
        setValidationError('Stock quantity must be a valid positive integer.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = (stepIdx) => {
    setValidationError('');
    // Allow jumping back and forth to visited steps or any step if editing
    if (editModal.id || stepIdx <= step) {
      setStep(stepIdx);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="admin-section fade-in">
      <div className="admin-table-header">
        <div>
          <h2 className="admin-table-header__title">Projects Catalog</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: '4px' }}>
            Manage tech projects listed for sale or rent.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openEditModal()}>
          <i className="fa-light fa-plus mr-2"></i> New Project
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <BatchCheckbox
                  checked={isSelectedAll(projects)}
                  indeterminate={isIndeterminate(projects)}
                  onChange={() => toggleSelectAll(projects)}
                />
              </th>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Type</th>
              <th>Price</th>
              <th>Status</th>
              <th>Rental Status</th>
              <th>Nearest Rental</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => {
              const selected = isSelected(p.id);
              return (
                <tr key={p.id} className={selected ? 'row-selected' : ''}>
                  <td>
                    <BatchCheckbox
                      checked={selected}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>
                  <td>#{p.id}</td>
                  <td>
                    <img src={p.image_url || '/placeholder.svg'} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                  </td>
                  <td><strong>{p.name}</strong></td>
                  <td><span className={`badge badge--neutral`}>{p.type}</span></td>
                  <td>Rs. {Number(p.price).toLocaleString()}</td>
                  <td>{p.status}</td>
                  <td>
                    {p.type === 'rent' ? (
                      p.is_currently_rented ? (
                        <span className="badge badge--danger" style={{ textTransform: 'uppercase', fontSize: '10px' }}>Rented</span>
                      ) : (
                        <span className="badge badge--success" style={{ textTransform: 'uppercase', fontSize: '10px' }}>Available</span>
                      )
                    ) : (
                      <span style={{ color: 'var(--text-3)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {p.type === 'rent' && p.nearest_rental_start ? (
                      <span className="font-mono" style={{ fontSize: '11.5px', color: 'var(--text-1)' }}>
                        {p.nearest_rental_start.substring(0, 10)} to {p.nearest_rental_end.substring(0, 10)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-3)' }}>—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="admin-table__actions">
                      {p.type === 'rent' && (
                        <button className="admin-table__action-btn" onClick={() => openCalendarModal(p)} title="View Rental Calendar">
                          <i className="fa-light fa-calendar-days"></i>
                        </button>
                      )}
                      <button className="admin-table__action-btn" onClick={() => openEditModal(p)} title="Edit">
                        <i className="fa-light fa-pen"></i>
                      </button>
                      <button className="admin-table__action-btn admin-table__action-btn--danger" onClick={() => handleDelete(p.id)} title="Delete">
                        <i className="fa-light fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {projects.length === 0 && (
              <tr><td colSpan="10" className="text-center py-8">No projects found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modern Step-by-Step Editor Modal */}
      {editModal && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditModal(null); }}>
          <div className="admin-modal" style={{ maxWidth: '750px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="admin-modal__content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Modal Header */}
              <div className="admin-modal__header">
                <span className="admin-modal__title">{editModal.id ? `Edit Project: ${editModal.name}` : 'New Project Setup Wizard'}</span>
                <button className="admin-modal__close" onClick={() => setEditModal(null)}>
                  <i className="fa-light fa-xmark"></i>
                </button>
              </div>

              {/* Wizard Stepper Progress Bar */}
              <div className="wizard-stepper" style={{ overflowX: 'auto' }}>
                {stepsConfig.map((sConfig, idx) => {
                  const stepIdx = idx + 1;
                  const isActive = step === stepIdx;
                  const isCompleted = step > stepIdx;
                  const isClickable = !!editModal.id || stepIdx <= step || isCompleted;

                  return (
                    <React.Fragment key={idx}>
                      <div 
                        className={`stepper-step ${isActive ? 'stepper-step--active' : ''} ${isCompleted ? 'stepper-step--completed' : ''} ${!isClickable ? 'stepper-step--disabled' : ''}`}
                        onClick={() => isClickable && handleStepClick(stepIdx)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isClickable ? 'pointer' : 'not-allowed', opacity: isClickable ? 1 : 0.5 }}
                      >
                        <div className="step-number" style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          border: isActive ? '2px solid var(--accent)' : isCompleted ? '2px solid var(--success)' : '1px solid var(--border-strong)',
                          background: isActive ? 'var(--accent)' : isCompleted ? 'var(--success)' : 'transparent',
                          color: isActive || isCompleted ? '#ffffff' : 'var(--text-2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600
                        }}>
                          {isCompleted ? <i className="fa-light fa-check" /> : stepIdx}
                        </div>
                        <span className="step-label" style={{ fontSize: '12px', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--accent)' : isCompleted ? 'var(--success)' : 'var(--text-2)' }}>
                          {sConfig.label}
                        </span>
                      </div>
                      {idx < stepsConfig.length - 1 && (
                        <div className="stepper-line" style={{ flex: 1, height: '2px', background: step > stepIdx ? 'var(--success)' : 'var(--border)', minWidth: '15px' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Wizard Form Panels */}
              <div className="admin-modal__body" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {validationError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-light fa-sharp fa-circle-exclamation" /> {validationError}
                  </div>
                )}

                {/* STEP 1: Basic Info */}
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Project Title / Name</label>
                      <input type="text" className="form-input" required
                        placeholder="Enter project name..."
                        value={editModal.name} onChange={e => setEditModal({...editModal, name: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Detailed Project Description</label>
                      <textarea className="form-input" rows={6} style={{ resize: 'vertical', minHeight: '120px' }}
                        placeholder="Write background information, description of the tech solution, deliverables, etc..."
                        value={editModal.description} onChange={e => setEditModal({...editModal, description: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: Pricing & status */}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Fulfillment Class / Listing Type</label>
                      <select className="form-select" value={editModal.type} onChange={e => setEditModal({...editModal, type: e.target.value})}>
                        <option value="sale">Outright Sale</option>
                        <option value="rent">Project Rental / Lease</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        {editModal.type === 'rent' ? 'Weekly Rental Rate (Rs. / week)' : 'Price (Rs.)'}
                      </label>
                      <input type="number" className="form-input" required min="0"
                        placeholder="0.00"
                        value={editModal.price} onChange={e => setEditModal({...editModal, price: e.target.value})}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginTop: '4px' }}>
                        {editModal.type === 'rent' 
                          ? 'Specify the rate charged per week (e.g. 500 will show as 500/week)' 
                          : 'Specify the outright purchase price for buying'}
                      </span>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Stock Quantity Available</label>
                      <input type="number" className="form-input" required min="0"
                        placeholder="0"
                        value={editModal.stock_quantity !== undefined ? editModal.stock_quantity : ''} 
                        onChange={e => setEditModal({...editModal, stock_quantity: Number(e.target.value)})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Availability Status</label>
                      <select className="form-select" value={editModal.status} onChange={e => setEditModal({...editModal, status: e.target.value})}>
                        <option value="available">Available (Active catalog)</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="rented">Currently Rented</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* STEP 3: Media Upload */}
                {step === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Upload Project Showcase Image</label>
                    <FileUploadZone
                      value={editModal.image_url}
                      onChange={val => setEditModal(prev => ({ ...prev, image_url: val }))}
                      token={token}
                      apiUrl="/api/admin/upload/projects"
                      label="Cover Showcase Image"
                    />
                    {editModal.image_url && (
                      <div style={{ marginTop: 'var(--space-4)', border: '1px solid var(--border)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-1)', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginBottom: '8px' }}>Cover Image Preview</span>
                        <img 
                          src={editModal.image_url} 
                          alt="" 
                          style={{ maxHeight: '180px', objectFit: 'contain', margin: '0 auto', border: '1px solid var(--border)', borderRadius: '4px' }} 
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: Technical details */}
                {step === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Features (comma separated)</label>
                      <input type="text" className="form-input" 
                        placeholder="e.g. Real-time tracking, Solar-powered, Arduino-integrated"
                        value={editModal.features} onChange={e => setEditModal({...editModal, features: e.target.value})}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Technologies (comma separated)</label>
                      <input type="text" className="form-input" 
                        placeholder="e.g. C++, React Native, LoRa, ESP32"
                        value={editModal.technologies} onChange={e => setEditModal({...editModal, technologies: e.target.value})}
                      />
                    </div>
                    
                    <div style={{ padding: 'var(--space-4)', background: 'var(--bg-1)', borderLeft: '3px solid var(--accent)', fontSize: '12px', color: 'var(--text-2)' }}>
                      <i className="fa-light fa-sharp fa-info-circle" style={{ marginRight: 8, color: 'var(--accent)' }}></i>
                      Features and technologies list will be parsed into bullet items and graphical color badges respectively in the storefront listing.
                    </div>
                  </div>
                )}

                {/* STEP 5: Component Links */}
                {step === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-0)', margin: 0 }}>Linked Store Products</h3>
                    
                    {editModal.id ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }} className="grid-mobile-1">
                        
                        {/* Linker Form */}
                        <div style={{ background: 'var(--bg-1)', padding: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '12px' }}>Link New Component</span>
                          
                          <form onSubmit={linkComponent} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '11px' }}>Store Product</label>
                              <select name="product_id" className="form-select" required style={{ background: 'var(--bg-2)' }}>
                                <option value="">Select Product...</option>
                                {storeProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Rs. {Number(p.price).toLocaleString()})</option>)}
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '11px' }}>Component Purpose / Description</label>
                              <input type="text" name="purpose" className="form-input" placeholder="e.g. for primary control board" style={{ background: 'var(--bg-2)' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              <div style={{ width: '80px' }}>
                                <label className="form-label" style={{ fontSize: '11px' }}>Quantity</label>
                                <input type="number" name="quantity" className="form-input" placeholder="Qty" defaultValue={1} min="1" required style={{ background: 'var(--bg-2)' }} />
                              </div>
                              <button type="submit" className="btn btn-outline" style={{ flex: 1, marginTop: '20px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <i className="fa-light fa-link" /> Link Component
                              </button>
                            </div>
                          </form>
                        </div>

                        {/* List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>Active Linked Components ({editModal.components?.length || 0})</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '250px', overflowY: 'auto' }}>
                            {editModal.components && editModal.components.map(c => (
                              <div key={c.link_id} style={{ padding: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-2)' }}>
                                <div>
                                  <span style={{ fontWeight: 600, fontSize: '12px', display: 'block' }}>{c.quantity}x {c.name}</span>
                                  {c.purpose && <span style={{ color: 'var(--text-3)', fontSize: '11px', fontStyle: 'italic' }}>({c.purpose})</span>}
                                </div>
                                <button type="button" onClick={() => unlinkComponent(c.link_id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
                                  <i className="fa-light fa-trash-can"></i>
                                </button>
                              </div>
                            ))}
                            {(!editModal.components || editModal.components.length === 0) && (
                              <div style={{ textAlign: 'center', padding: 'var(--space-5)', color: 'var(--text-3)', fontStyle: 'italic', fontSize: '12px' }}>
                                No products linked as components yet.
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div style={{ padding: 'var(--space-8)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-3)' }}>
                        <i className="fa-light fa-sharp fa-link-slash" style={{ fontSize: '32px', color: 'var(--text-3)', marginBottom: '12px', display: 'block' }} />
                        <p style={{ fontSize: '13px', margin: 0 }}>Components can be linked once the project is created in the database.</p>
                        <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Click Next step to review and create this project first.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 6: Verification */}
                {step === 6 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                    <div style={{ padding: 'var(--space-4)', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid var(--success)', fontSize: '13px', color: 'var(--success)' }}>
                      <i className="fa-light fa-sharp fa-check-circle" style={{ marginRight: 8 }}></i>
                      Almost ready! Verify the project details below before finalizing.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }} className="grid-mobile-1">
                      {/* Left recap */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block' }}>Project Title</span>
                          <strong style={{ fontSize: '16px', color: 'var(--text-0)' }}>{editModal.name}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block' }}>Listing Status</span>
                          <span className="badge badge--neutral" style={{ fontSize: '11px' }}>
                            {editModal.type.toUpperCase()} • {editModal.status.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block' }}>Selling/Rental Price</span>
                          <strong style={{ color: 'var(--accent)', fontSize: '16px', fontFamily: 'monospace' }}>Rs. {Number(editModal.price).toLocaleString()}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block' }}>Description Summary</span>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-1)', margin: '4px 0 0 0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                            {editModal.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>

                      {/* Right recap */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {editModal.image_url && (
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Project Cover</span>
                            <img src={editModal.image_url} alt="" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', border: '1px solid var(--border)', borderRadius: '4px' }} />
                          </div>
                        )}
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Features Bullet Count</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-0)', fontWeight: 600 }}>
                            {editModal.features ? editModal.features.split(',').filter(Boolean).length : 0} items
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Technologies Badges</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {editModal.technologies ? editModal.technologies.split(',').map((t, i) => (
                              <span key={i} style={{ background: 'var(--bg-3)', color: 'var(--text-0)', fontSize: '10px', padding: '2px 6px', borderRadius: '3px' }}>
                                {t.trim()}
                              </span>
                            )) : <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>None specified.</span>}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Linked Components Count</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-0)', fontWeight: 600 }}>
                            {editModal.components?.length || 0} linked products
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Modal Footer */}
              <div className="admin-modal__footer" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', background: 'var(--bg-1)', padding: 'var(--space-4) var(--space-6)', zIndex: 10 }}>
                {step === 1 ? (
                  <button className="btn btn-outline" onClick={() => setEditModal(null)}>Cancel</button>
                ) : (
                  <button className="btn btn-outline" onClick={handleBack}>
                    <i className="fa-light fa-arrow-left" style={{ marginRight: '8px' }} /> Back
                  </button>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  {editModal.id && (
                    <button type="button" className="btn btn-outline" onClick={handleSave} disabled={saving} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  )}

                  {step < 6 ? (
                    <button className="btn btn-primary" onClick={handleNext}>
                      Next Step <i className="fa-light fa-arrow-right" style={{ marginLeft: '8px' }} />
                    </button>
                  ) : (
                    <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                      {saving ? (
                        <><i className="fa-light fa-spinner-third fa-spin" style={{ marginRight: '8px' }} /> Saving...</>
                      ) : (
                        <><i className="fa-light fa-floppy-disk" style={{ marginRight: '8px' }} /> Save Project Changes</>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Admin Calendar View Modal */}
      {calendarModalProject && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCalendarModalProject(null); }}>
          <div className="admin-modal" style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column' }}>
            <div className="admin-modal__content" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="admin-modal__header">
                <span className="admin-modal__title">Rental Calendar: {calendarModalProject.name}</span>
                <button className="admin-modal__close" onClick={() => setCalendarModalProject(null)}>
                  <i className="fa-light fa-xmark"></i>
                </button>
              </div>
              <div className="admin-modal__body" style={{ padding: 'var(--space-6)', overflowY: 'auto', maxHeight: '75vh' }}>
                {loadingAvailability ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <i className="fa-light fa-spinner-third fa-spin" style={{ fontSize: '24px', color: 'var(--accent)', display: 'block', margin: '0 auto var(--space-2) auto' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>Loading availability schedule...</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
                      Select a date range on the calendar to populate the form, or input dates below to block them.
                    </p>
                    
                    <RentalCalendar 
                      availability={projectAvailability} 
                      onRangeChange={(range) => {
                        if (range) {
                          setNewBlockStart(range.startDate);
                          setNewBlockEnd(range.endDate);
                        } else {
                          setNewBlockStart('');
                          setNewBlockEnd('');
                        }
                      }}
                      readOnly={false}
                    />

                    {/* Block Date Range Form */}
                    <form onSubmit={handleBlockDates} style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>Block Date Range</h4>
                      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Start Date</label>
                          <input 
                            type="date" 
                            className="form-input" 
                            value={newBlockStart} 
                            onChange={e => setNewBlockStart(e.target.value)} 
                            required 
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>End Date</label>
                          <input 
                            type="date" 
                            className="form-input" 
                            value={newBlockEnd} 
                            onChange={e => setNewBlockEnd(e.target.value)} 
                            required 
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: 'var(--space-4)' }}>
                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Reason / Note</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Scheduled Maintenance, Client Demo" 
                          value={newBlockNote} 
                          onChange={e => setNewBlockNote(e.target.value)} 
                        />
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                        Block Selected Range
                      </button>
                    </form>

                    {/* Manually Blocked Ranges List */}
                    <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>Manually Blocked Ranges</h4>
                      {blockedRanges.length === 0 ? (
                        <p style={{ fontSize: '12.5px', color: 'var(--text-3)' }}>No manually blocked dates.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                          {blockedRanges.map(b => (
                            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-3)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12.5px' }}>
                              <div>
                                <strong>{new Date(b.start_date).toLocaleDateString('en-US')}</strong> to <strong>{new Date(b.end_date).toLocaleDateString('en-US')}</strong>
                                {b.note && <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{b.note}</div>}
                              </div>
                              <button 
                                type="button" 
                                className="btn btn-ghost btn-sm" 
                                style={{ color: 'var(--danger)', padding: '4px 8px' }}
                                onClick={() => handleDeleteBlockRange(b.id)}
                              >
                                Clear
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="admin-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--space-4) var(--space-6)', background: 'var(--bg-1)', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-outline" onClick={() => setCalendarModalProject(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BatchActionBar
        selectionCount={selectionCount}
        onClearSelection={clearSelection}
        onExportCsv={handleExportCsv}
        loading={batchLoading}
        actions={[
          {
            label: 'Activate Selected',
            icon: 'check',
            onClick: () => handleBatchToggleActive(true)
          },
          {
            label: 'Deactivate Selected',
            icon: 'ban',
            onClick: () => handleBatchToggleActive(false)
          },
          {
            label: 'Delete Selected',
            icon: 'trash',
            variant: 'danger',
            confirm: `Are you sure you want to delete ${selectionCount} projects permanently?`,
            onClick: handleBatchDelete
          }
        ]}
      />
      {toast && <BatchToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
