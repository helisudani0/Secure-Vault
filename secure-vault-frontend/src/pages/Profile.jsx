import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/FormInputs';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    displayName: 'John Doe',
    bio: 'Secure Vault enthusiast',
    location: 'San Francisco, CA',
    website: 'https://example.com',
  });

  const handleSave = async () => {
    setEditing(false);
    // API call would go here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 p-2 hover:bg-white/10 rounded-lg transition-all inline-flex"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        {/* Profile Header */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-4xl font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{profile.displayName}</h2>
                <p className="text-slate-400 mb-3">@{user?.username}</p>
                <p className="text-slate-300">{profile.bio}</p>
              </div>
            </div>
            <Button
              variant={editing ? 'primary' : 'secondary'}
              onClick={() => {
                if (editing) handleSave();
                setEditing(!editing);
              }}
            >
              {editing ? 'Save Profile' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h3 className="text-xl font-bold mb-6">Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Display Name"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              disabled={!editing}
            />
            <Input
              label="Username"
              value={user?.username}
              disabled
            />
            <Input
              label="Email"
              type="email"
              value={user?.email || 'Not set'}
              disabled={!editing}
            />
            <Input
              label="Location"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              disabled={!editing}
            />
            <Input
              label="Website"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              disabled={!editing}
              className="md:col-span-2"
            />
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              disabled={!editing}
              rows="4"
              className={`md:col-span-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 ${!editing ? 'opacity-50 cursor-not-allowed' : 'focus:outline-none focus:border-blue-500'}`}
              placeholder="Your bio..."
            />
          </div>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Files Uploaded', value: '24', icon: '📁' },
            { label: 'Storage Used', value: '2.4 GB', icon: '💾' },
            { label: 'Shared Files', value: '8', icon: '👥' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Activity Timeline */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'Uploaded', target: 'document.pdf', time: '2 hours ago' },
              { action: 'Shared', target: 'presentation.pptx with john_dev', time: '5 hours ago' },
              { action: 'Downloaded', target: 'vacation_photos.zip', time: '1 day ago' },
              { action: 'Created', target: 'New secure vault', time: '3 days ago' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-lg transition-all">
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-slate-300">
                    <span className="font-medium">{item.action}</span> {item.target}
                  </p>
                  <p className="text-xs text-slate-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Devices */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h3 className="text-xl font-bold mb-6">Connected Devices</h3>
          <div className="space-y-3">
            {[
              { name: 'MacBook Pro', browser: 'Safari', lastSeen: 'Active now' },
              { name: 'iPhone 13', browser: 'Safari Mobile', lastSeen: '2 hours ago' },
              { name: 'Windows PC', browser: 'Chrome', lastSeen: '1 day ago' },
            ].map((device) => (
              <div key={device.name} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-xs text-slate-400">{device.browser} • {device.lastSeen}</p>
                </div>
                <button className="text-slate-400 hover:text-red-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h3 className="text-xl font-bold mb-6">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Settings', icon: '⚙️', onClick: () => navigate('/settings') },
              { label: 'Dashboard', icon: '📊', onClick: () => navigate('/dashboard') },
              { label: 'Storage', icon: '💾', onClick: () => navigate('/settings#storage') },
              { label: 'Security', icon: '🔐', onClick: () => navigate('/settings#security') },
            ].map((link) => (
              <button
                key={link.label}
                onClick={link.onClick}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-center"
              >
                <div className="text-2xl mb-2">{link.icon}</div>
                <p className="text-xs font-medium">{link.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
