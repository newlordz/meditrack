import { useState, useCallback } from 'react';
import { ROLES, ROLE_ROUTES, AuthContext } from './authConstants';



export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('meditrack_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [selectedRole, setSelectedRole] = useState(ROLES.DOCTOR);

    const login = useCallback((userData) => {
        const fullUser = { ...userData, role: selectedRole };
        setUser(fullUser);
        localStorage.setItem('meditrack_user', JSON.stringify(fullUser));
    }, [selectedRole]);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('meditrack_user');
    }, []);

    const getDefaultRoute = useCallback(() => {
        if (!user) return '/login';
        return ROLE_ROUTES[user.role] || '/login';
    }, [user]);

    return (
        <AuthContext.Provider value={{
            user,
            selectedRole,
            setSelectedRole,
            login,
            logout,
            getDefaultRoute,
            isAuthenticated: !!user,
            ROLES,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
