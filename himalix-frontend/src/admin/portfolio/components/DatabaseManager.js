import React, { useState, useEffect } from 'react';

export default function DatabaseManager({ authFetch }) {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal actions
  const [activeRecord, setActiveRecord] = useState(null); // row being edited or empty object for add
  const [modalMode, setModalMode] = useState(''); // 'add' | 'edit' | ''
  const [formFields, setFormFields] = useState({});

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    } else {
      setColumns([]);
      setRows([]);
    }
  }, [selectedTable]);

  const loadTables = async () => {
    setError('');
    try {
      const res = await authFetch('/api/admin/db/tables');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load tables');
      setTables(data.tables || []);
      if (data.tables && data.tables.length > 0) {
        setSelectedTable(data.tables.includes('users') ? 'users' : data.tables[0]);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadTableData = async (tableName) => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/admin/db/table/${tableName}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load table details');
      setColumns(data.columns || []);
      setRows(data.rows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = async (row) => {
    const pkCol = columns.find(c => c.Key === 'PRI')?.Field || 'id';
    const recordId = row[pkCol];
    if (!recordId) {
      alert('Unable to identify primary key for deletion');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this row (PK: ${recordId}) from ${selectedTable}?`)) {
      return;
    }

    setError('');
    try {
      const res = await authFetch(`/api/admin/db/table/${selectedTable}/${recordId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete row');
      alert('Row deleted successfully');
      loadTableData(selectedTable);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenAdd = () => {
    const fields = {};
    columns.forEach(col => {
      if (col.Extra !== 'auto_increment') {
        fields[col.Field] = col.Default !== null ? col.Default : '';
      }
    });
    setFormFields(fields);
    setModalMode('add');
    setActiveRecord({});
  };

  const handleOpenEdit = (row) => {
    const fields = {};
    columns.forEach(col => {
      if (col.Extra !== 'auto_increment') {
        let val = row[col.Field];
        // Format datetime strings to fit datetime-local inputs
        if (val && (col.Type.includes('datetime') || col.Type.includes('timestamp'))) {
          try {
            val = new Date(val).toISOString().slice(0, 16);
          } catch (e) {}
        }
        // Handle nulls
        fields[col.Field] = val !== null ? val : '';
      }
    });
    setFormFields(fields);
    setModalMode('edit');
    setActiveRecord(row);
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setError('');

    // Construct request payload
    const payload = {};
    columns.forEach(col => {
      if (col.Extra !== 'auto_increment') {
        const val = formFields[col.Field];
        // Send null if empty or unchecked and nullable
        if (val === '' && col.Null === 'YES') {
          payload[col.Field] = null;
        } else {
          payload[col.Field] = val;
        }
      }
    });

    try {
      let res;
      if (modalMode === 'add') {
        res = await authFetch(`/api/admin/db/table/${selectedTable}`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else {
        const pkCol = columns.find(c => c.Key === 'PRI')?.Field || 'id';
        const recordId = activeRecord[pkCol];
        res = await authFetch(`/api/admin/db/table/${selectedTable}/${recordId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      alert(modalMode === 'add' ? 'Row inserted successfully!' : 'Row updated successfully!');
      setModalMode('');
      setActiveRecord(null);
      loadTableData(selectedTable);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatCellValue = (val) => {
    if (val === null) return <em style={{ color: 'var(--text-3)' }}>NULL</em>;
    if (typeof val === 'object') return JSON.stringify(val);
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    const str = String(val);
    if (str.length > 60) return str.substring(0, 57) + '...';
    return str;
  };

  const pkColumn = columns.find(c => c.Key === 'PRI')?.Field || '';

  return (
    <div className="admin-db-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h2 className="admin-view-title" style={{ margin: 0 }}>Direct Database CRUD Manager</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', margin: '4px 0 0 0' }}>
            Browse schema layout, view indexes, and manipulate tables in real-time.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="form-group mb-0" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label className="form-label" style={{ margin: 0, flexShrink: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Table:</label>
            <select 
              className="form-select" 
              value={selectedTable} 
              onChange={e => setSelectedTable(e.target.value)}
              style={{ width: '220px', padding: '6px 12px' }}
            >
              {tables.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleOpenAdd}
            disabled={!selectedTable}
          >
            <i className="fa-light fa-sharp fa-plus" /> Add Row
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--space-6)' }}>
          <i className="fa-light fa-sharp fa-triangle-exclamation" /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-20)' }}><div className="spinner" /></div>
      ) : selectedTable ? (
        <div className="admin-table-wrap" style={{ border: '1px solid var(--border-strong)', borderRadius: '4px', overflowX: 'auto', maxHeight: '65vh' }}>
          <table className="admin-table" style={{ fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-3)', borderBottom: '1px solid var(--border-strong)' }}>
                {columns.map(col => (
                  <th key={col.Field} style={{ padding: '12px 8px', textAlign: 'left', minWidth: '110px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-0)' }}>{col.Field}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', marginTop: '2px' }}>
                      {col.Type} {col.Key === 'PRI' ? '🔑' : ''}
                    </div>
                  </th>
                ))}
                <th style={{ minWidth: '130px', textAlign: 'center', padding: '12px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-3)' }}>
                    No rows inside this database table.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const pkVal = pkColumn ? row[pkColumn] : idx;
                  return (
                    <tr key={pkVal} style={{ borderBottom: '1px solid var(--border)' }}>
                      {columns.map(col => (
                        <td key={col.Field} style={{ padding: '8px', fontFamily: col.Key === 'PRI' || col.Type.includes('int') ? 'var(--font-mono)' : 'inherit' }}>
                          {formatCellValue(row[col.Field])}
                        </td>
                      ))}
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button 
                            type="button" 
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleOpenEdit(row)}
                          >
                            <i className="fa-light fa-sharp fa-pen" /> Edit
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-ghost btn-sm text-danger"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleDeleteRow(row)}
                          >
                            <i className="fa-light fa-sharp fa-trash" /> Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Insert / Edit Dynamic Modal */}
      {modalMode && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalMode(''); }}>
          <div className="admin-modal" style={{ maxWidth: '650px' }}>
            <div className="admin-modal__content">
              <div className="admin-modal__header">
                <h2 className="page-title">{modalMode === 'add' ? `Add New Entry to ${selectedTable.toUpperCase()}` : `Edit Row Entry #${activeRecord[pkColumn]}`}</h2>
                <button type="button" className="btn btn-ghost" onClick={() => setModalMode('')} aria-label="Close dialog">
                  <i className="fa-light fa-sharp fa-xmark" />
                </button>
              </div>

              <form onSubmit={handleSaveRecord}>
                <div className="admin-modal__body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {columns.map(col => {
                      if (col.Extra === 'auto_increment') {
                        if (modalMode === 'edit') {
                          return (
                            <div className="form-group" key={col.Field}>
                              <label className="form-label">{col.Field} (Primary Key)</label>
                              <input 
                                className="form-input" 
                                value={activeRecord[col.Field] || ''} 
                                disabled 
                              />
                            </div>
                          );
                        }
                        return null;
                      }

                      const inputType = (() => {
                        const type = col.Type.toLowerCase();
                        if (type.includes('int') || type.includes('decimal') || type.includes('double') || type.includes('float')) {
                          return 'number';
                        }
                        if (type.includes('datetime') || type.includes('timestamp')) {
                          return 'datetime-local';
                        }
                        if (type.includes('date')) {
                          return 'date';
                        }
                        return 'text';
                      })();

                      return (
                        <div className="form-group" key={col.Field}>
                          <label className="form-label" htmlFor={`field-${col.Field}`}>
                            {col.Field}{' '}
                            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 400 }}>
                              ({col.Type}, {col.Null === 'YES' ? 'Nullable' : 'Required'})
                            </span>
                          </label>
                          {col.Type.includes('text') || col.Type.includes('json') ? (
                            <textarea 
                              id={`field-${col.Field}`}
                              className="form-input font-mono"
                              rows={4}
                              value={formFields[col.Field]}
                              onChange={e => setFormFields({ ...formFields, [col.Field]: e.target.value })}
                              required={col.Null === 'NO' && col.Default === null}
                              placeholder={col.Type.includes('json') ? '{"key": "value"}' : `Provide ${col.Field}`}
                              style={{ fontSize: '12px' }}
                            />
                          ) : (
                            <input 
                              id={`field-${col.Field}`}
                              type={inputType}
                              step={col.Type.includes('decimal') || col.Type.includes('double') ? '0.01' : '1'}
                              className="form-input"
                              value={formFields[col.Field]}
                              onChange={e => setFormFields({ ...formFields, [col.Field]: e.target.value })}
                              required={col.Null === 'NO' && col.Default === null}
                              placeholder={`Provide ${col.Field}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="admin-modal__footer mt-6 flex justify-end gap-2">
                  <button type="button" className="btn btn-outline" onClick={() => setModalMode('')}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fa-light fa-sharp fa-floppy-disk" /> Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
