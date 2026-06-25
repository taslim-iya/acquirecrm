import { createContext, useContext, useState, ReactNode } from 'react';
import { Database } from '@/integrations/supabase/types';

export type AppMode = 'fundraising' | 'deal-sourcing' | 'research';
type ContactType = Database['public']['Enums']['contact_type'];

// Which contact types belong to each mode
export const MODE_CONTACT_TYPES: Record<AppMode, ContactType[]> = {
  fundraising: ['investor', 'advisor', 'other'],
  'deal-sourcing': ['owner', 'intermediary', 'advisor', 'river_guide', 'operator', 'other'],
  research: ['operator', 'advisor', 'river_guide', 'other'],
};

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  modeLabel: string;
  contactTypesForMode: ContactType[];
  isTypeInMode: (type: ContactType) => boolean;
}

const AppModeContext = createContext<AppModeContextType>({
  mode: 'fundraising',
  setMode: () => {},
  modeLabel: 'Fundraising',
  contactTypesForMode: MODE_CONTACT_TYPES.fundraising,
  isTypeInMode: () => true,
});

const MODE_LABELS: Record<AppMode, string> = {
  fundraising: 'Fundraising',
  'deal-sourcing': 'Deal Sourcing',
  research: 'Research',
};

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem('app-mode') as AppMode | null;
    if (saved === 'fundraising' || saved === 'deal-sourcing' || saved === 'research') return saved;
    return 'fundraising';
  });

  const handleSetMode = (newMode: AppMode) => {
    setMode(newMode);
    localStorage.setItem('app-mode', newMode);
  };

  const contactTypesForMode = MODE_CONTACT_TYPES[mode];
  const isTypeInMode = (type: ContactType) => contactTypesForMode.includes(type);

  return (
    <AppModeContext.Provider value={{ mode, setMode: handleSetMode, modeLabel: MODE_LABELS[mode], contactTypesForMode, isTypeInMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}
