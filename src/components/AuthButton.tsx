"use client";

import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

export const AuthButton = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Load local storage user
    const savedUser = localStorage.getItem('lhs_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    // Initialize Google Identity Services
    const handleCredentialResponse = async (response: any) => {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('lhs_user', JSON.stringify(data.user));
      }
    };

    const interval = setInterval(() => {
      if (window.google) {
        clearInterval(interval);
        window.google.accounts.id.initialize({
          client_id: "REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
          callback: handleCredentialResponse
        });
        
        if (!user) {
          window.google.accounts.id.renderButton(
            document.getElementById("google-btn-container"),
            { theme: "outline", size: "medium", shape: "pill", text: "signin_with" }
          );
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lhs_user');
  };

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-[#12171E] border border-[#222B38] p-1.5 pl-3 rounded-full">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-white font-bold leading-none">{user.name}</span>
          <button onClick={logout} className="text-[9px] text-[#64748B] hover:text-[#EAB308] transition-colors font-bold uppercase tracking-wider">Logout</button>
        </div>
        {user.picture ? (
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-[#222B38]" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#EAB308] flex items-center justify-center text-[#05070A]"><User className="w-4 h-4" /></div>
        )}
      </div>
    );
  }

  return <div id="google-btn-container" className="h-[36px]"></div>;
};
