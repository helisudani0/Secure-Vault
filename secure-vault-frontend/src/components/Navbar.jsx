import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-800/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"></path>
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm5-4a1 1 0 00-1 1v3H6a1 1 0 000 2h1v3a1 1 0 102 0v-3h1a1 1 0 100-2h-1v-3a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Secure Vault</h1>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-6">
            {/* Search bar */}
            <div className="hidden lg:flex max-w-xs">
              <div className="relative w-full">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-slate-300 hover:bg-white/10 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-white/10 rounded-lg shadow-xl p-4 animate-fade-in">
                  <h3 className="font-bold mb-4">Notifications</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <div className="p-3 bg-white/5 border border-blue-500/30 rounded-lg text-sm">
                      <p className="font-medium text-blue-400">File shared with you</p>
                      <p className="text-slate-400 text-xs mt-1">john_doe shared document.pdf with you</p>
                    </div>
                    <div className="p-3 bg-white/5 border border-blue-500/30 rounded-lg text-sm">
                      <p className="font-medium text-blue-400">Upload complete</p>
                      <p className="text-slate-400 text-xs mt-1">Your file has been encrypted and stored</p>
                    </div>
                  </div>
                  <button className="w-full mt-4 p-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    View all notifications
                  </button>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-slate-400">Premium</p>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* User menu dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden animate-fade-in z-50">
                  <div className="p-4 border-b border-white/10">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-slate-400 mt-1">Premium Subscriber</p>
                  </div>

                  <div className="p-2 space-y-1">
                    {[
                      { label: '👤 Profile', onClick: () => navigate('/profile') },
                      { label: '⚙️ Settings', onClick: () => navigate('/settings') },
                      { label: '💾 Storage', onClick: () => null },
                      { label: '🔐 Security', onClick: () => null },
                      { label: '📊 Usage', onClick: () => null },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.onClick();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition-all rounded-lg"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-2 border-t border-white/10">
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-all rounded-lg font-medium"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
