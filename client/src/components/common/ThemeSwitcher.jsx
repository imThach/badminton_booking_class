import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === 'dark';
  return <button aria-label={isDark ? t('theme.useLight') : t('theme.useDark')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface" onClick={toggleTheme} title={isDark ? t('theme.useLight') : t('theme.useDark')} type="button">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
