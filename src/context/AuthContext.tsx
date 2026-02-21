import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../api';

interface User {
    user_id: number;
    full_name: string;
    email: string;
    phone?: string;
    role: 'RIDER' | 'PUBLISHER' | 'ADMIN' | 'USER';
    profile_photo?: string;
    email_verified: boolean;
    license_status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
    created_at?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = sessionStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'));

    // Verify token validity on mount (optional but recommended)
    useEffect(() => {
        if (token) {
            refreshUser();
        }
    }, [token]);

    const login = useCallback((newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(newUser));
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.get('/users/me');
            const updatedUser = response.data;
            setUser(updatedUser);
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    }, []);

    const isAuthenticated = !!token && !!user;
    const isAdmin = user?.role === 'ADMIN';

    return (
        <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isAuthenticated, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
