import React, { useEffect, useRef } from 'react';

export default function BatchCheckbox({ checked, onChange, indeterminate, disabled, className = '', ...props }) {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={checkboxRef}
      checked={!!checked}
      onChange={onChange}
      disabled={disabled}
      className={`batch-checkbox ${className}`}
      {...props}
    />
  );
}
