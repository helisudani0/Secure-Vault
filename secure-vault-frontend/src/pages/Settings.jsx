import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/FormInputs';

export default function Settings() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'general', label: '⚙️ General', icon: 'Settings' },
    { id: 'security', label: '🔐 Security', icon: 'Lock' },
    { id: 'privacy', label: '👁️ Privacy', icon: 'Eye' },
    { id: 'storage', label: '💾 Storage', icon: 'HardDrive' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="mb-4 p-2 hover:bg-white/10 rounded-lg transition-all inline-flex"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-slate-400 mt-2">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-6 max-w-6xl mx-auto px-8 py-8">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-2 sticky top-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Profile Information</h2>
                <div className="space-y-4">
                  <Input label="Username" value={user?.username} disabled />
                  <Input label="Email" type="email" placeholder="your@email.com" />
                  <Input label="Display Name" placeholder="Your Name" />
                  <div className="pt-4">
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </div>

              {/* Theme Settings */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Appearance</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3">Theme</label>
                    <div className="flex gap-3">
                      {['Light', 'Dark', 'System'].map((theme) => (
                        <button
                          key={theme}
                          className="px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all"
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Notifications</h2>
                <div className="space-y-4">
                  {[
                    { label: 'File uploads', checked: true },
                    { label: 'File downloads', checked: true },
                    { label: 'Share notifications', checked: false },
                    { label: 'Account alerts', checked: true },
                  ].map((item) => (
                    <label key={item.label} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={item.checked}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-300">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Change Password</h2>
                <div className="space-y-4 max-w-md">
                  <Input label="Current Password" type="password" />
                  <Input label="New Password" type="password" />
                  <Input label="Confirm Password" type="password" />
                  <Button variant="primary">Update Password</Button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
                    <p className="text-slate-400 text-sm mt-1">Add an extra layer of security</p>
                  </div>
                  <Button variant="secondary">Enable 2FA</Button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Active Sessions</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-xs text-slate-400">Chrome on Windows • Last active now</p>
                    </div>
                    <span className="text-xs font-bold text-green-400">Active</span>
                  </div>
                </div>
                <Button variant="danger" className="mt-4">Logout All Sessions</Button>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              {/* Privacy Controls */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Privacy Controls</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Allow others to search for my profile', hint: 'Let people find you using your username' },
                    { label: 'Make my file list public', hint: 'Allow others to see what files I have shared' },
                    { label: 'Enable activity tracking', hint: 'Help us improve your experience with analytics' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-all">
                      <div>
                        <p className="font-medium text-slate-300">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-1">{item.hint}</p>
                      </div>
                      <input type="checkbox" className="w-4 h-4 rounded border-white/20" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Data & Privacy */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Data & Privacy</h2>
                <div className="space-y-3">
                  <Button variant="secondary" className="w-full justify-center">
                    📥 Download Your Data
                  </Button>
                  <Button variant="secondary" className="w-full justify-center">
                    🗑️ Delete All Data
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Storage Settings */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              {/* Storage Overview */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Storage Overview</h2>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Used Storage</span>
                    <span className="text-sm font-bold text-blue-400">2.4 GB / 15 GB</span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-1/6 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                  </div>
                </div>

                {/* Storage breakdown */}
                <div className="space-y-3">
                  {[
                    { name: 'Documents', size: '1.2 GB', color: 'bg-blue-500' },
                    { name: 'Images', size: '800 MB', color: 'bg-green-500' },
                    { name: 'Videos', size: '400 MB', color: 'bg-purple-500' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade Plan */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">Upgrade Your Plan</h3>
                <p className="text-slate-400 text-sm mb-4">Need more storage? Upgrade to premium for unlimited storage.</p>
                <Button>Upgrade Now</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <h2 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h2>
          <p className="text-slate-400 text-sm mb-4">Irreversible and destructive actions</p>
          <Button variant="danger">Delete My Account</Button>
        </div>
      </div>
    </div>
  );
}
