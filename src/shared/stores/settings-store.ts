import { useState, useEffect } from 'react';
import {
  PublicSiteSettings,
  DEFAULT_PUBLIC_SITE_SETTINGS,
} from '@/entities/settings/types';
import { settingsRepository } from '@/entities/settings/api/settings-repository';

interface SettingsState {
  settings: PublicSiteSettings;
  isLoading: boolean;
  error: string | null;
}

let currentState: SettingsState = {
  settings: DEFAULT_PUBLIC_SITE_SETTINGS,
  isLoading: false,
  error: null,
};

let hasFetched = false;
type Listener = (state: SettingsState) => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener({ ...currentState }));
}

export const siteSettingsStore = {
  getState(): SettingsState {
    return { ...currentState };
  },

  getSettings(): PublicSiteSettings {
    return currentState.settings;
  },

  async fetchSettings(force = false): Promise<PublicSiteSettings> {
    if (hasFetched && !force) {
      return currentState.settings;
    }

    currentState = { ...currentState, isLoading: true, error: null };
    notify();

    try {
      const data = await settingsRepository.getPublicSiteSettings();
      currentState = {
        settings: data,
        isLoading: false,
        error: null,
      };
      hasFetched = true;
      notify();
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Site ayarları yüklenemedi.';
      currentState = {
        ...currentState,
        isLoading: false,
        error: msg,
      };
      notify();
      throw err;
    }
  },

  setSettings(newSettings: PublicSiteSettings) {
    currentState = {
      settings: newSettings,
      isLoading: false,
      error: null,
    };
    hasFetched = true;
    notify();
  },

  subscribe(listener: (settings: PublicSiteSettings) => void): () => void {
    const fn: Listener = (state) => listener(state.settings);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  reset() {
    currentState = {
      settings: DEFAULT_PUBLIC_SITE_SETTINGS,
      isLoading: false,
      error: null,
    };
    hasFetched = false;
    notify();
  },
};

export function useSiteSettings() {
  const [state, setState] = useState<SettingsState>(siteSettingsStore.getState());

  useEffect(() => {
    const unsubscribe = (listenerState: SettingsState) => {
      setState(listenerState);
    };
    listeners.add(unsubscribe);

    // Initial fetch if not fetched
    if (!hasFetched && !state.isLoading) {
      siteSettingsStore.fetchSettings().catch(() => {});
    }

    return () => {
      listeners.delete(unsubscribe);
    };
  }, [state.isLoading]);

  return {
    ...state,
    refetch: () => siteSettingsStore.fetchSettings(true),
  };
}
