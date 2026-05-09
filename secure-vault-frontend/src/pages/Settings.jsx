import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, LogOut, ChevronRight, Save } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { FormInput, FormTextarea, FormActions } from '../components/Form';
import { ErrorMessage } from '../components/ErrorBoundary';

/**
 * Settings page with multiple tabs
 */
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

        {error && <ErrorMessage error={error} onDismiss={() => setError(null)} />}

        {/* Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full text-left px-4 py-3 rounded-lg flex items-center gap-3
                      transition-colors duration-150
                      ${activeTab === tab.id
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`${tab.id}-panel`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <ProfileSettings
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setError={setError}
                showToast={showToast}
              />
            )}

            {activeTab === 'security' && (
              <SecuritySettings
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setError={setError}
                showToast={showToast}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationSettings
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setError={setError}
                showToast={showToast}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Profile settings section
 */
function ProfileSettings({ isLoading, setIsLoading, setError, showToast }) {
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    emailVerified: false,
    bio: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast('success', 'Profile updated successfully');
    } catch (err) {
      setError(err.message);
      showToast('error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Profile Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Display Name"
          name="displayName"
          value={profile.displayName}
          onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
          placeholder="John Doe"
        />

        <FormInput
          label="Email"
          name="email"
          type="email"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          placeholder="john@example.com"
          helpText={profile.emailVerified ? '✓ Verified' : 'Pending verification'}
        />

        <FormTextarea
          label="Bio"
          name="bio"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Tell us about yourself..."
          rows={3}
        />

        <FormActions
          submitLabel={isLoading ? 'Saving...' : 'Save Changes'}
          isSubmitting={isLoading}
          isValid={profile.displayName && profile.email}
        />
      </form>
    </div>
  );
}

/**
 * Security settings section
 */
function SecuritySettings({ isLoading, setIsLoading, setError, showToast }) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'Chrome on Windows', ip: '192.168.1.1', lastActive: '2 hours ago' },
    { id: 2, device: 'Safari on iPhone', ip: '192.168.1.2', lastActive: '1 day ago' },
  ]);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('success', 'Password changed successfully');
    } catch (err) {
      setError(err.message);
      showToast('error', 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Change Password
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <FormInput
            label="Current Password"
            name="currentPassword"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            required
          />

          <FormInput
            label="New Password"
            name="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            required
          />

          <FormInput
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
          />

          <FormActions
            submitLabel="Change Password"
            isSubmitting={isLoading}
            isValid={
              passwordForm.currentPassword &&
              passwordForm.newPassword &&
              passwordForm.confirmPassword
            }
          />
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Two-Factor Authentication
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              {twoFAEnabled ? 'Enabled' : 'Disabled'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add an extra layer of security
            </p>
          </div>
          <button
            onClick={() => setTwoFAEnabled(!twoFAEnabled)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              twoFAEnabled
                ? 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'
                : 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
            }`}
          >
            {twoFAEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Active Sessions
        </h3>

        <div className="space-y-3">
          {activeSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {session.device}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {session.ip} • {session.lastActive}
                </p>
              </div>
              <button className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 px-3 py-1 rounded">
                Logout
              </button>
            </div>
          ))}
        </div>

        <button className="mt-4 w-full px-4 py-2 bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 font-medium">
          <LogOut className="w-4 h-4 inline mr-2" />
          Logout All Devices
        </button>
      </div>
    </div>
  );
}

/**
 * Notification settings section
 */
function NotificationSettings({ isLoading, setIsLoading, setError, showToast }) {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    fileSharedNotifications: true,
    storageWarnings: true,
    weeklyDigest: false,
  });

  const handleToggle = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast('success', 'Notification settings updated');
    } catch (err) {
      showToast('error', 'Failed to update settings');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Notification Preferences
      </h2>

      <div className="space-y-4">
        {[
          {
            key: 'emailNotifications',
            label: 'Email Notifications',
            description: 'Receive important updates via email',
          },
          {
            key: 'fileSharedNotifications',
            label: 'File Shared Notifications',
            description: 'Get notified when files are shared with you',
          },
          {
            key: 'storageWarnings',
            label: 'Storage Warnings',
            description: 'Alerts when storage is running low',
          },
          {
            key: 'weeklyDigest',
            label: 'Weekly Digest',
            description: 'Summary of your activity each week',
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {item.label}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications[item.key]}
              onChange={() => handleToggle(item.key)}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600"
              aria-label={item.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SettingsPage;
