import { useState, useEffect, useCallback } from 'react';
import { Purchase } from '../types';
import { storageService } from '../services/storageService';

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPurchases = useCallback(() => {
    setLoading(true);
    try {
      const data = storageService.getPurchases();
      setPurchases(data);
    } catch (error) {
      console.error('Failed to load purchases', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const addPurchase = useCallback((purchase: Purchase) => {
    storageService.addPurchase(purchase);
    // Optimistic update
    setPurchases((prev) => [purchase, ...prev]);
  }, []);

  const updatePurchase = useCallback((purchase: Purchase) => {
    storageService.updatePurchase(purchase);
    setPurchases((prev) => 
      prev.map(p => p.id === purchase.id ? purchase : p)
    );
  }, []);

  const removePurchase = useCallback((id: string) => {
    storageService.removePurchase(id);
    setPurchases((prev) => prev.filter(p => p.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    storageService.clearAll();
    setPurchases([]);
  }, []);

  return {
    purchases,
    loading,
    addPurchase,
    updatePurchase,
    removePurchase,
    clearAll,
    refresh: loadPurchases,
  };
}
