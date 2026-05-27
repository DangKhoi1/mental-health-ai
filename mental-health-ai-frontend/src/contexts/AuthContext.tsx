'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/services/auth';
import { userService } from '@/services/user';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const savedUser = localStorage.getItem('user:v1');

                if (token && savedUser && savedUser !== 'undefined') {
                    try {
                        const parsedUser = JSON.parse(savedUser);
                        setUser(parsedUser);
                        setIsLoading(false);
                    } catch {
                        localStorage.removeItem('user:v1');
                        localStorage.removeItem('accessToken');
                        setIsLoading(false);
                    }
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Auth init error:', error);
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user:v1', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const freshUser = await userService.getProfile();
            setUser(freshUser);
            localStorage.setItem('user:v1', JSON.stringify(freshUser));
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
