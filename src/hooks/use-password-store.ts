'use client';

import { useState, useEffect, useCallback } from 'react';

export type PasswordRecord = {
  id: string;
  username: string;
  password: string;
  date: string;
};

export type ArchivedPasswordRecord = PasswordRecord & {
  deletionDate: string;
};

type PasswordStore = {
  passwords: PasswordRecord[];
  archivedPasswords: ArchivedPasswordRecord[];
  addPassword: (record: PasswordRecord) => void;
  archivePassword: (id: string) => void;
};

const PASSWORD_STORAGE_KEY = 'passgenius-passwords';
const ARCHIVE_STORAGE_KEY = 'passgenius-archive';

// We use a listener pattern to sync state across multiple components using the hook.
let memoryState: {
  passwords: PasswordRecord[];
  archivedPasswords: ArchivedPasswordRecord[];
} = {
  passwords: [],
  archivedPasswords: [],
};

const listeners: Set<() => void> = new Set();

const broadcast = () => {
  listeners.forEach((listener) => listener());
};

const loadInitialState = () => {
  if (typeof window !== 'undefined') {
    try {
      const storedPasswords = localStorage.getItem(PASSWORD_STORAGE_KEY);
      const storedArchive = localStorage.getItem(ARCHIVE_STORAGE_KEY);
      
      if (storedPasswords) {
        memoryState.passwords = JSON.parse(storedPasswords);
      }
      if (storedArchive) {
        memoryState.archivedPasswords = JSON.parse(storedArchive);
      }
      broadcast();
    } catch (error) {
      console.error('Failed to load state from localStorage', error);
    }
  }
};

// Load initial state once on module load in the browser.
if (typeof window !== 'undefined') {
    loadInitialState();
}

export const usePasswordStore = (): PasswordStore => {
  const [passwords, setPasswords] = useState<PasswordRecord[]>(memoryState.passwords);
  const [archivedPasswords, setArchivedPasswords] = useState<ArchivedPasswordRecord[]>(memoryState.archivedPasswords);

  useEffect(() => {
    const listener = () => {
      setPasswords(memoryState.passwords);
      setArchivedPasswords(memoryState.archivedPasswords);
    };
    listeners.add(listener);
    // Initial sync
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateAndPersist = (newState: typeof memoryState) => {
    memoryState = newState;
    try {
      localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(newState.passwords));
      localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(newState.archivedPasswords));
    } catch (error) {
      console.error('Failed to save state to localStorage', error);
    }
    broadcast();
  };

  const addPassword = useCallback((record: PasswordRecord) => {
    const newPasswords = [record, ...memoryState.passwords];
    updateAndPersist({ ...memoryState, passwords: newPasswords });
  }, []);

  const archivePassword = useCallback((id: string) => {
    const passwordToArchive = memoryState.passwords.find((p) => p.id === id);
    if (!passwordToArchive) return;

    const newArchivedRecord: ArchivedPasswordRecord = {
      ...passwordToArchive,
      deletionDate: new Date().toISOString(),
    };

    const newPasswords = memoryState.passwords.filter((p) => p.id !== id);
    const newArchivedPasswords = [newArchivedRecord, ...memoryState.archivedPasswords];

    updateAndPersist({ passwords: newPasswords, archivedPasswords: newArchivedPasswords });
  }, []);

  return { passwords, archivedPasswords, addPassword, archivePassword };
};
