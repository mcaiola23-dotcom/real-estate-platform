import { useCallback, useEffect, useState } from 'react';

export type CrmTheme = 'light' | 'dark';

function getStorageKey(tenantId: string): string {
  return `crm.theme.${tenantId}`;
}

function readStoredTheme(tenantId: string): CrmTheme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(getStorageKey(tenantId));
  return stored === 'dark' ? 'dark' : 'light';
}

export function useCrmTheme(tenantId: string) {
  const [theme, setThemeState] = useState<CrmTheme>(() => readStoredTheme(tenantId));

  // Sync data-theme attribute to DOM whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback(
    (next: CrmTheme) => {
      setThemeState(next);
      localStorage.setItem(getStorageKey(tenantId), next);
    },
    [tenantId]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
