import { useDebounce } from '../hooks';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

// API call only happens 500ms after user stops typing
useEffect(() => {
  fetchResults(debouncedSearch);
}, [debouncedSearch]);