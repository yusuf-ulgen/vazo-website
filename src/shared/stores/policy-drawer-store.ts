import { useState, useEffect } from 'react';

export type PolicyTab = 'privacy' | 'terms' | 'shipping';

interface PolicyDrawerState {
  isOpen: boolean;
  activeTab: PolicyTab;
}

type PolicyListener = (state: PolicyDrawerState) => void;
const listeners = new Set<PolicyListener>();

let currentState: PolicyDrawerState = {
  isOpen: false,
  activeTab: 'privacy',
};

function notifyListeners() {
  listeners.forEach((listener) => listener(currentState));
}

export const policyDrawerStore = {
  getState(): PolicyDrawerState {
    return currentState;
  },

  open(tab: PolicyTab = 'privacy'): void {
    currentState = {
      isOpen: true,
      activeTab: tab,
    };
    notifyListeners();
  },

  close(): void {
    currentState = {
      ...currentState,
      isOpen: false,
    };
    notifyListeners();
  },

  setTab(tab: PolicyTab): void {
    currentState = {
      ...currentState,
      activeTab: tab,
    };
    notifyListeners();
  },

  subscribe(listener: PolicyListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function usePolicyDrawer() {
  const [state, setState] = useState<PolicyDrawerState>(currentState);

  useEffect(() => {
    return policyDrawerStore.subscribe((updated) => {
      setState(updated);
    });
  }, []);

  return {
    isOpen: state.isOpen,
    activeTab: state.activeTab,
    open: policyDrawerStore.open,
    close: policyDrawerStore.close,
    setTab: policyDrawerStore.setTab,
  };
}
