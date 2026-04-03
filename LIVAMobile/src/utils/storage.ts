// @ts-ignore
const MMKV = require('react-native-mmkv').default || require('react-native-mmkv');

const storage = new MMKV({ id: 'liva-game-storage' });

export const getStorageItem = (key: string): string | null => {
  return storage.getString(key) ?? null;
};

export const setStorageItem = (key: string, value: string): void => {
  storage.set(key, value);
};

export const removeStorageItem = (key: string): void => {
  storage.delete(key);
};

export const getStorageObject = <T>(key: string): T | null => {
  const value = getStorageItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const setStorageObject = <T>(key: string, value: T): void => {
  setStorageItem(key, JSON.stringify(value));
};

export const clearStorage = (): void => {
  storage.clearAll();
};