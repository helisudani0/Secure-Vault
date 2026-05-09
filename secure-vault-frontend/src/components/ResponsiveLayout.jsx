// src/components/ResponsiveLayout.jsx
import React from 'react';

/**
 * Responsive layout wrapper for consistent spacing across breakpoints
 */
export function ResponsiveContainer({ children, className = '' }) {
  return (
    <div className={`container-responsive ${className}`}>
      {children}
    </div>
  );
}

/**
 * Mobile-first responsive grid
 * Default: 1 column
 * md (768px): 2 columns
 * lg (1024px): 3 columns
 * xl (1280px): 4 columns
 */
export function ResponsiveGrid({ children, columns = 'auto', gap = 'md', className = '' }) {
  const gapClass = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }[gap] || 'gap-4';

  const gridClass = {
    auto: 'grid-responsive',
    2: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2',
    3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[columns] || 'grid-responsive';

  return (
    <div className={`${gridClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Responsive flex layout
 */
export function ResponsiveFlex({
  children,
  direction = 'row',
  justify = 'start',
  items = 'center',
  gap = 'md',
  className = '',
  responsive = true
}) {
  let directionClass = '';
  if (responsive) {
    directionClass = direction === 'col' ? 'flex-col md:flex-row' : 'flex-row';
  } else {
    directionClass = direction === 'col' ? 'flex-col' : 'flex-row';
  }

  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }[justify] || 'justify-start';

  const itemsClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  }[items] || 'items-center';

  const gapClass = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }[gap] || 'gap-4';

  return (
    <div className={`flex ${directionClass} ${justifyClass} ${itemsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Responsive navbar/header wrapper
 */
export function ResponsiveHeader({ children, className = '' }) {
  return (
    <header
      className={`
        w-full bg-white shadow-sm sticky top-0 z-40
        px-4 md:px-6 lg:px-8
        py-3 md:py-4
        ${className}
      `}
    >
      <div className="container-responsive">
        {children}
      </div>
    </header>
  );
}

/**
 * Responsive sidebar layout
 */
export function ResponsiveSidebarLayout({ sidebar, children, sidebarWidth = 'w-64' }) {
  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-screen">
      {/* Sidebar - hidden on mobile, shown on lg */}
      <aside className={`hidden lg:block ${sidebarWidth} bg-gray-50 border-r border-gray-200 overflow-y-auto`}>
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

/**
 * Responsive page section with consistent padding
 */
export function ResponsiveSection({ title, subtitle, children, className = '' }) {
  return (
    <section className={`p-responsive ${className}`}>
      {title && <h1 className="text-heading-2 mb-2 md:mb-4">{title}</h1>}
      {subtitle && <p className="text-gray-600 mb-4 md:mb-6">{subtitle}</p>}
      {children}
    </section>
  );
}

/**
 * Responsive two-column section
 * Stacks on mobile, side-by-side on md+
 */
export function ResponsiveTwoColumn({ left, right, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 ${className}`}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

/**
 * Responsive card with consistent styling
 */
export function ResponsiveCard({ children, className = '', hover = true }) {
  return (
    <div className={`
      card
      p-4 md:p-6 lg:p-8
      ${hover ? 'hover:shadow-lg transition-all duration-250' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}
