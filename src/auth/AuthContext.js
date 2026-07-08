import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef
} from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [token, setToken]         = useState(null);
  const [systemConfig, setConfig] = useState(null);
  const refreshPromiseRef         = useRef(null);

  /* Fetch settings config and verify token on mount */
  useEffect(() => {
    // 1. Fetch public settings
    fetch('/api/auth/config', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setConfig(data))
      .catch(err => console.error('Failed to load system config:', err));

    // 2. Verify token via HttpOnly Cookie
    const isLoggedIn = localStorage.getItem('himalix-logged-in') === 'true';
    if (!isLoggedIn) { setLoading(false); return; }
    
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setUser(data.user);
        setToken(data.token || 'session');
      })
      .catch(() => { 
        localStorage.removeItem('himalix-logged-in'); 
        setToken(null); 
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('himalix-logged-in', 'true');
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Notify backend to revoke refresh token and blacklist access token
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('himalix-logged-in');
    setToken(null);
    setUser(null);
  }, []);

  const loginWithGoogle = useCallback(async (googleToken) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: googleToken }),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Google sign-in failed');
    login(data.token, data.user);
    return data;
  }, [login]);

  /* Helper: auto-refreshing authenticated fetch */
  const authFetch = useCallback(async (url, options = {}) => {
    let currentToken = token;
    
    const getHeaders = (t) => {
      const headers = {
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      };
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      return headers;
    };

    let res = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: getHeaders(currentToken),
    });

    // Check if access token expired (401 Unauthorized)
    if (res.status === 401) {
      if (url.includes('/api/auth/refresh') || url.includes('/api/auth/me') || url.includes('/api/auth/login')) {
        return res;
      }

      try {
        // Deduplicate simultaneous token refresh calls
        if (!refreshPromiseRef.current) {
          refreshPromiseRef.current = fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          }).then(async r => {
            if (!r.ok) throw new Error('Failed to refresh token');
            return r.json();
          });
        }

        const data = await refreshPromiseRef.current;
        refreshPromiseRef.current = null;

        const newToken = data.token;
        localStorage.setItem('himalix-logged-in', 'true');
        setToken(newToken);

        // Retry the request with the new access token
        res = await fetch(url, {
          credentials: 'include',
          ...options,
          headers: getHeaders(newToken),
        });
      } catch (err) {
        refreshPromiseRef.current = null;
        // Session invalid or refresh token expired — logout user
        localStorage.removeItem('himalix-logged-in');
        setToken(null);
        setUser(null);
      }
    }

    return res;
  }, [token]);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, setUser, loading, token, login, logout, authFetch, isAdmin, systemConfig, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
