import { useLocalStorage } from '../hooks';

const [theme, setTheme] = useLocalStorage('theme', 'light');
// Automatically syncs with localStorage