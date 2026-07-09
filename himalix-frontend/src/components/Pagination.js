import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="hx-pagination">
      <button
        className="btn btn-outline btn-sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        title="Go to previous page"
      >
        <i className="fa-light fa-sharp fa-chevron-left" style={{ marginRight: '4px' }} /> Previous
      </button>

      {start > 1 && (
        <>
          <button 
            className="btn btn-sm btn-outline" 
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {start > 2 && <span style={{ color: 'var(--text-3)', padding: '0 4px' }}>...</span>}
        </>
      )}

      {pages.map(page => (
        <button
          key={page}
          className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: 'var(--text-3)', padding: '0 4px' }}>...</span>}
          <button 
            className="btn btn-sm btn-outline" 
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className="btn btn-outline btn-sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        title="Go to next page"
      >
        Next <i className="fa-light fa-sharp fa-chevron-right" style={{ marginLeft: '4px' }} />
      </button>
    </div>
  );
}
