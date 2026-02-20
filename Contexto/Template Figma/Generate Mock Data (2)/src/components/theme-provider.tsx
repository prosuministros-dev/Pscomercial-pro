import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  gradients: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleGradients: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [gradients, setGradients] = useState(true);

  useEffect(() => {
    // Cargar preferencias guardadas
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedGradients = localStorage.getItem('gradients');
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    if (savedGradients !== null) {
      setGradients(savedGradients === 'true');
    }
  }, []);

  useEffect(() => {
    // Aplicar tema al documento
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Guardar preferencia de gradientes
    localStorage.setItem('gradients', String(gradients));
  }, [gradients]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleGradients = () => {
    setGradients(prev => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        gradients,
        setTheme,
        toggleTheme,
        toggleGradients,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
