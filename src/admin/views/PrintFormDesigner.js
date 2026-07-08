import React from 'react';

export default function PrintFormDesigner({ formDesign, filamentInfo, onFormDesignChange, onSave }) {
  const updateField = (fIdx, updates) => {
    const nf = [...(formDesign.fields || [])];
    nf[fIdx] = { ...nf[fIdx], ...updates };
    onFormDesignChange({ ...formDesign, fields: nf });
  };

  const updateFieldOption = (fIdx, oIdx, updates) => {
    const nf = [...(formDesign.fields || [])];
    const no = [...(nf[fIdx].options || [])];
    no[oIdx] = { ...no[oIdx], ...updates };
    nf[fIdx] = { ...nf[fIdx], options: no };
    onFormDesignChange({ ...formDesign, fields: nf });
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-6)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', margin: 0, fontWeight: 700 }}>
          <i className="fa-light fa-sharp fa-sliders" style={{ color: 'var(--accent)', marginRight: '8px' }} />
          3D Print Form Designer
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '4px 0 0 0' }}>
          Configure fields, options, pricing rates, and setup fees for the 3D printing request form.
        </p>
      </div>

      {/* Global pricing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: 'var(--bg-tertiary)', padding: '16px', border: '1px solid var(--border)' }}>
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600 }}>Setup Fee (Rs.)</label>
          <input type="number" value={formDesign.setupFee !== undefined ? formDesign.setupFee : 50}
            onChange={e => onFormDesignChange({ ...formDesign, setupFee: parseFloat(e.target.value) || 0 })} className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600 }}>Min Order Price (Rs.)</label>
          <input type="number" value={formDesign.minOrderPrice !== undefined ? formDesign.minOrderPrice : 100}
            onChange={e => onFormDesignChange({ ...formDesign, minOrderPrice: parseFloat(e.target.value) || 0 })} className="form-input" />
        </div>
      </div>

      {/* Add field button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => {
          const nf = [...(formDesign.fields || [])];
          nf.push({ id: "custom_" + Date.now(), label: "New Custom Field", type: "text", required: false });
          onFormDesignChange({ ...formDesign, fields: nf });
        }}>
          <i className="fa-light fa-sharp fa-plus" style={{ marginRight: '6px' }} /> Add Custom Field
        </button>
      </div>

      {/* Fields list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {formDesign.fields && formDesign.fields.map((field, fIdx) => {
          const isSystemField = ['file', 'material', 'color', 'layerHeight', 'qty', 'infill', 'notes'].includes(field.id);
          return (
            <div key={field.id} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)' }}>
                  Field #{fIdx + 1}: {field.label || field.id}
                </span>
                {!isSystemField && (
                  <button type="button" className="btn btn-danger btn-xs" onClick={() => {
                    onFormDesignChange({ ...formDesign, fields: formDesign.fields.filter(f => f.id !== field.id) });
                  }} style={{ padding: '2px 8px', fontSize: '11px' }}>Delete</button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }} className="grid-mobile-1">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>Field ID</label>
                  <input type="text" value={field.id} onChange={e => updateField(fIdx, { id: e.target.value })}
                    className="form-input" style={{ height: '34px', fontSize: '13px' }} disabled={isSystemField} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>Label</label>
                  <input type="text" value={field.label} onChange={e => updateField(fIdx, { label: e.target.value })}
                    className="form-input" style={{ height: '34px', fontSize: '13px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>Type</label>
                  <select value={field.type} onChange={e => {
                    const updates = { type: e.target.value };
                    if (e.target.value === 'select' && !field.options) updates.options = [{ name: 'Default', rate: 0 }];
                    updateField(fIdx, updates);
                  }} className="form-select" style={{ height: '34px', fontSize: '13px', padding: '0 12px' }}
                    disabled={['file', 'qty', 'infill', 'notes'].includes(field.id)}>
                    <option value="text">Text</option><option value="number">Number</option>
                    <option value="select">Dropdown</option><option value="range">Slider</option>
                    <option value="file">File Upload</option><option value="textarea">Textarea</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input type="checkbox" id={`req-${field.id}`} checked={!!field.required}
                  onChange={e => updateField(fIdx, { required: e.target.checked })} />
                <label htmlFor={`req-${field.id}`} style={{ fontSize: '12px', cursor: 'pointer' }}>Required</label>
              </div>

              {/* Dropdown options */}
              {field.type === 'select' && (
                <div style={{ border: '1px solid var(--border)', padding: '12px', background: 'var(--bg-tertiary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Options & Rates</span>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => {
                      const nf = [...formDesign.fields];
                      nf[fIdx].options = [...(nf[fIdx].options || []), { name: 'New', rate: 0 }];
                      onFormDesignChange({ ...formDesign, fields: nf });
                    }}>+ Add</button>
                  </div>
                  {field.options && field.options.map((opt, oIdx) => (
                    <div key={oIdx} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '6px' }}>
                      <input type="text" value={opt.name} onChange={e => updateFieldOption(fIdx, oIdx, { name: e.target.value })}
                        className="form-input" style={{ height: '30px', fontSize: '12px', flex: 2 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Rs.</span>
                        <input type="number" value={opt.rate || 0} onChange={e => updateFieldOption(fIdx, oIdx, { rate: parseFloat(e.target.value) || 0 })}
                          className="form-input" style={{ height: '30px', fontSize: '12px' }} />
                        {field.id === 'material' && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>/g</span>}
                      </div>
                      <button type="button" className="btn btn-ghost btn-xs text-danger" onClick={() => {
                        const nf = [...formDesign.fields];
                        nf[fIdx].options = nf[fIdx].options.filter((_, idx) => idx !== oIdx);
                        onFormDesignChange({ ...formDesign, fields: nf });
                      }} style={{ color: '#f87171' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div style={{ marginTop: '24px' }}>
        <button type="button" className="btn btn-primary" onClick={onSave} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-light fa-sharp fa-floppy-disk" /> Save Form Parameters
        </button>
      </div>
    </div>
  );
}
