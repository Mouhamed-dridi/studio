'use client';

import { useState, useEffect, useCallback } from 'react';

export type PasswordRecord = {
  id: string;
  username: string;
  password: string;
  date: string;
};

type PasswordStore = {
  passwords: PasswordRecord[];
  addPassword: (record: PasswordRecord) => void;
  removePassword: (id: string) => void;
};

const PASSWORD_STORAGE_KEY = 'passgenius-passwords';

// We use a listener pattern to sync state across multiple components using the hook.
let memoryState: PasswordRecord[] = [];
const listeners: Set<() => void> = new Set();

const broadcast = () => {
  listeners.forEach((listener) => listener());
};

const loadInitialState = () => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(PASSWORD_STORAGE_KEY);
      if (stored) {
        memoryState = JSON.parse(stored);
        broadcast();
      }
    } catch (error) {
      console.error('Failed to load passwords from localStorage', error);
    }
  }
};

// Load initial state once on module load in the browser.
if (typeof window !== 'undefined') {
    loadInitialState();
}


export const usePasswordStore = (): PasswordStore => {
  const [passwords, setPasswords] = useState<PasswordRecord[]>(memoryState);

  useEffect(() => {
    const listener = () => {
      setPasswords(memoryState);
    };
    listeners.add(listener);
    // Initial sync
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateAndPersist = (newPasswords: PasswordRecord[]) => {
    memoryState = newPasswords;
    try {
      localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(newPasswords));
    } catch (error) {
      console.error('Failed to save passwords to localStorage', error);
    }
    broadcast();
  };

  const addPassword = useCallback((record: PasswordRecord) => {
    const newPasswords = [record, ...memoryState];
    updateAndPersist(newPasswords);
  }, []);

  const removePassword = useCallback((id: string) => {
    const newPasswords = memoryState.filter((p) => p.id !== id);
    updateAndPersist(newPasswords);
  }, []);

  return { passwords, addPassword, removePassword };
};
