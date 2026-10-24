import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { THEME_STORAGE_KEY, resolveTheme, getISTDate, getISTHour } from '../utils/theme';
import api from '../utils/api';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Stored preference: 'auto' | 'light' | 'dark'
  const [themePreference, setThemePreference] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || 'auto';
    } catch (e) {
      return 'auto';
    }
  });

  // Effective theme currently active: 'light' | 'dark'
  const [activeTheme, setActiveTheme] = useState(() => resolveTheme(themePreference));

  // Apply classes to documentElement
  const applyThemeToDOM = useCallback((theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, []);

  // Recalculate and apply effective theme
  const updateEffectiveTheme = useCallback(() => {
    const effective = resolveTheme(themePreference);
    setActiveTheme(effective);
    applyThemeToDOM(effective);
  }, [themePreference, applyThemeToDOM]);

  // Update DOM when themePreference or activeTheme changes
  useEffect(() => {
    updateEffectiveTheme();
  }, [updateEffectiveTheme]);

  // Periodic interval (every 60s) to update theme if time crosses 05:00 or 12:00 IST in 'auto' mode
  useEffect(() => {
    if (themePreference !== 'auto') return;

    const interval = setInterval(() => {
      const currentResolved = resolveTheme('auto');
      if (currentResolved !== activeTheme) {
        setActiveTheme(currentResolved);
        applyThemeToDOM(currentResolved);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [themePreference, activeTheme, applyThemeToDOM]);

  // Function to set theme preference (and optionally sync with backend)
  const setPreference = useCallback(async (newPref, syncWithBackend = true) => {
    if (!['auto', 'light', 'dark'].includes(newPref)) return;

    setThemePreference(newPref);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newPref);
    } catch (e) {
      console.warn('Unable to persist theme to localStorage:', e);
    }

    const resolved = resolveTheme(newPref);
    setActiveTheme(resolved);
    applyThemeToDOM(resolved);

    // If user has a token, sync preference with backend
    if (syncWithBackend && localStorage.getItem('meetflow_token')) {
      try {
        await api.patch('/auth/theme', { themePreference: newPref });
      } catch (err) {
        console.warn('Failed to sync theme preference to server:', err.message);
      }
    }
  }, [applyThemeToDOM]);

  // Helper to toggle between light and dark quickly
  const toggleTheme = useCallback(() => {
    const next = activeTheme === 'dark' ? 'light' : 'dark';
    setPreference(next, true);
  }, [activeTheme, setPreference]);

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        themePreference,
        setPreference,
        toggleTheme,
        isAuto: themePreference === 'auto',
        istHour: getISTHour(),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
