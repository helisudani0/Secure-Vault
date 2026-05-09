import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
  <div className={`p-6 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-all ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-bold text-white ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-slate-400 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`mt-6 pt-6 border-t border-white/10 flex gap-3 ${className}`} {...props}>
    {children}
  </div>
);

export const StatCard = ({ label, value, icon, trend, className = '' }) => (
  <div className={`p-6 bg-white/5 border border-white/10 rounded-lg ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-lg">
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-bold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-slate-400 text-sm font-medium">{label}</p>
    <p className="text-2xl font-bold mt-2">{value}</p>
  </div>
);

export default Card;
