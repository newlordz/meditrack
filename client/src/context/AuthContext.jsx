import { useState, useCallback } from 'react';
import { ROLES, ROLE_ROUTES, AuthContext } from './authConstants';



export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('meditrack_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [selectedRole, setSelectedRole] = useState(ROLES.DOCTOR);

    const login = useCallback((userData) => {
        const fullUser = { ...userData, role: userData.role || selectedRole };
        setUser(fullUser);
        localStorage.setItem('meditrack_user', JSON.stringify(fullUser));
    }, [selectedRole]);

    const updateUser = useCallback((updates) => {
        setUser(prev => {
            if (!prev) return null;
            const updatedUser = { ...prev, ...updates };
            localStorage.setItem('meditrack_user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }, []);

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
            updateUser,
            getDefaultRoute,
            isAuthenticated: !!user,
            ROLES,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
