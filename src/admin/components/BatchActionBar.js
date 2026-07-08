import React from 'react';

export default function BatchActionBar({
  selectionCount,
  actions = [],
  onExportCsv,
  onClearSelection,
  loading = false
}) {
  if (selectionCount === 0) return null;

  return (
    <div className="batch-action-bar active">
      <div className="batch-action-bar__content">
        <div className="batch-action-bar__info">
          <span className="batch-action-bar__count">{selectionCount}</span>
          <span className="batch-action-bar__text">selected</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm batch-action-bar__clear"
            onClick={onClearSelection}
            disabled={loading}
            style={{ marginLeft: '12px', padding: '2px 8px', fontSize: '12px' }}
          >
            Clear
          </button>
        </div>

        <div className="batch-action-bar__actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {actions.map((act, index) => {
            if (act.render) {
              return <React.Fragment key={index}>{act.render()}</React.Fragment>;
            }
            return (
              <button
                key={index}
                type="button"
                className={`btn btn-${act.variant || 'outline'} btn-sm`}
                disabled={loading || act.disabled}
                onClick={() => {
                  if (act.confirm && !window.confirm(act.confirm)) return;
                  act.onClick();
                }}
              >
                {act.icon && <i className={`fa-light fa-${act.icon}`} style={{ marginRight: '6px' }} />}
                {act.label}
              </button>
            );
          })}

          {onExportCsv && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={loading}
              onClick={onExportCsv}
            >
              <i className="fa-light fa-file-csv" style={{ marginRight: '6px' }} />
              Export CSV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
