import { useAsync } from '../hooks';

const { execute, status, data, error, isLoading } = useAsync(
  () => api.get('/patients'),
  true // execute immediately
);

if (isLoading) return <Spinner />;
if (error) return <Error message={error} />;
return <PatientList data={data} />;