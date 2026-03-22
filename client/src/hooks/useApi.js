import { useState, useEffect } from 'react';

/**
 * useApi — Fetches data from the MEDITRACK API.
 * @param {Function} fetchFn — An API function from src/api/api.js
 * @param {Array} deps — Dependency array (like useEffect)
 * @returns {{ data, loading, error, refetch }}
 */
export function useApi(fetchFn, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchFn();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, loading, error, refetch: fetchData };
}
