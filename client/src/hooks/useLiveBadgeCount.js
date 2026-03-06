import { useState, useEffect } from 'react';

export function useLiveBadgeCount(storageKey, filterFn, initialCount) {
    const [count, setCount] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return filterFn(data);
            }
        } catch {
            // Ignore
        }
        return initialCount;
    });

    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const data = JSON.parse(saved);
                    setCount(filterFn(data));
                } else {
                    setCount(initialCount);
                }
            } catch {
                // Ignore
            }
        };

        window.addEventListener('localStorageUpdated', handleStorageChange);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('localStorageUpdated', handleStorageChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [storageKey, filterFn, initialCount]);

    return count;
}
