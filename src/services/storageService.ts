import { Purchase } from '../types';

const STORAGE_KEY = '@beebuy:purchases';

export const storageService = {
  getPurchases: (): Purchase[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as Purchase[];
    } catch {
      return [];
    }
  },

  addPurchase: (purchase: Purchase): void => {
    const purchases = storageService.getPurchases();
    // Prepend to show newest first
    purchases.unshift(purchase);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
  },

  updatePurchase: (updatedPurchase: Purchase): void => {
    const purchases = storageService.getPurchases();
    const index = purchases.findIndex((p) => p.id === updatedPurchase.id);
    if (index !== -1) {
      purchases[index] = updatedPurchase;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
    }
  },

  removePurchase: (id: string): void => {
    const purchases = storageService.getPurchases();
    const filtered = purchases.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },
  
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
