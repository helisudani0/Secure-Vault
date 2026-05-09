import React from 'react';

export const Skeleton = ({ width = 'w-full', height = 'h-4', rounded = 'rounded-lg', className = '' }) => (
  <div className={`bg-white/10 animate-pulse ${width} ${height} ${rounded} ${className}`} />
);

export const FileSkeleton = () => (
  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
    <div className="flex items-start justify-between mb-3">
      <Skeleton width="w-10" height="h-10" rounded="rounded-lg" />
      <Skeleton width="w-8" height="h-8" rounded="rounded" />
    </div>
    <Skeleton width="w-3/4" height="h-4" className="mb-2" />
    <Skeleton width="w-1/2" height="h-3" />
  </div>
);

export const FileListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <FileSkeleton key={i} />
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
    <Skeleton width="w-20" height="h-20" rounded="rounded-lg" className="mb-4" />
    <Skeleton width="w-2/3" height="h-5" className="mb-3" />
    <Skeleton width="w-full" height="h-4" className="mb-2" />
    <Skeleton width="w-3/4" height="h-3" />
  </div>
);

export const GridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export default Skeleton;
