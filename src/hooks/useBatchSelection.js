import { useState, useCallback } from 'react';

export default function useBatchSelection() {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((filteredItems) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = filteredItems.length > 0 && filteredItems.every(item => next.has(item.id));
      
      if (allSelected) {
        filteredItems.forEach(item => next.delete(item.id));
      } else {
        filteredItems.forEach(item => next.add(item.id));
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const isSelectedAll = useCallback((filteredItems) => {
    if (!filteredItems || filteredItems.length === 0) return false;
    return filteredItems.every(item => selectedIds.has(item.id));
  }, [selectedIds]);

  const isIndeterminate = useCallback((filteredItems) => {
    if (!filteredItems || filteredItems.length === 0) return false;
    const count = filteredItems.filter(item => selectedIds.has(item.id)).length;
    return count > 0 && count < filteredItems.length;
  }, [selectedIds]);

  return {
    selectedIds: Array.from(selectedIds),
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isSelectedAll,
    isIndeterminate,
    selectionCount: selectedIds.size
  };
}
