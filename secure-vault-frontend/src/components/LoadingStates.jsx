// src/components/LoadingStates.jsx
import React from 'react';

/**
 * Spinner component for general loading indication
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size] || 'w-8 h-8 border-3';

  return (
    <div className={`spinner ${sizeClass} ${className}`} />
  );
}

/**
 * Loading skeleton component for placeholder animations
 */
export function Skeleton({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <div className={`skeleton ${width} ${height} rounded ${className}`} />
  );
}

/**
 * Skeleton loader for file list items
 */
export function FileListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg flex items-center gap-4">
          <Skeleton width="w-12" height="h-12" className="rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton width="w-3/4" height="h-4" />
            <Skeleton width="w-1/2" height="h-3" />
          </div>
          <Skeleton width="w-20" height="h-4" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for table rows
 */
export function TableRowSkeleton({ columns = 5, rows = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="p-4">
              <Skeleton width="w-full" height="h-4" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/**
 * Skeleton loader for profile/card section
 */
export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg space-y-4">
      <Skeleton width="w-1/3" height="h-6" />
      <div className="space-y-3">
        <Skeleton width="w-full" height="h-4" />
        <Skeleton width="w-5/6" height="h-4" />
        <Skeleton width="w-4/5" height="h-4" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for form
 */
export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton width="w-1/4" height="h-4" className="mb-2" />
        <Skeleton width="w-full" height="h-10" />
      </div>
      <div>
        <Skeleton width="w-1/4" height="h-4" className="mb-2" />
        <Skeleton width="w-full" height="h-10" />
      </div>
      <Skeleton width="w-1/3" height="h-10" />
    </div>
  );
}

/**
 * Loading screen with spinner and message
 */
export function LoadingScreen({ message = 'Loading...', size = 'md' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Spinner size={size} />
      <p className="text-gray-600 text-center">{message}</p>
    </div>
  );
}

/**
 * Loading overlay (for async operations on page)
 */
export function LoadingOverlay({ isLoading, message = 'Loading...' }) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
}

/**
 * Progress bar component
 */
export function ProgressBar({ progress = 0, animated = true, className = '' }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className={`h-full bg-indigo-600 transition-all duration-300 ${animated ? 'animate-pulse' : ''}`}
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}

/**
 * File upload progress component
 */
export function UploadProgress({ fileName, progress = 0, total = 100 }) {
  const percentage = Math.round((progress / total) * 100);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{fileName}</span>
        <span className="text-sm text-gray-500">{percentage}%</span>
      </div>
      <ProgressBar progress={percentage} />
    </div>
  );
}
