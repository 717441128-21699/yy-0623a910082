const STORAGE_KEYS = {
  NURSING_AUDITS: 'dental_clinic_nursing_audits',
  HANDOVER_ITEMS: 'dental_clinic_handover_items',
};

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }
  return defaultValue;
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

export { STORAGE_KEYS };
