import React from 'react';

export default function BatchStatusSelect({ options, onChange, disabled, className = '', ...props }) {
  const handleChange = (e) => {
    const value = e.target.value;
    if (value) {
      onChange(value);
      e.target.value = '';
    }
  };

  return (
    <select
      className={`form-select batch-status-select ${className}`}
      onChange={handleChange}
      disabled={disabled}
      defaultValue=""
      style={{
        height: '36px',
        padding: '0 12px',
        fontSize: '13px',
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        color: 'var(--text-0)',
        cursor: 'pointer',
        ...props.style
      }}
      {...props}
    >
      <option value="" disabled>Change status...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
