import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 text-center px-6">
        {/* 404 Text */}
        <div className="mb-8">
          <div className="text-9xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
            404
          </div>
          <h1 className="text-4xl font-bold mb-3">Page Not Found</h1>
          <p className="text-xl text-slate-400">Oops! The page you're looking for doesn't exist.</p>
        </div>

        {/* Illustration */}
        <div className="max-w-md mx-auto mb-12">
          <svg
            viewBox="0 0 200 200"
            className="w-full animate-float"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <g className="text-slate-600">
              <path d="M50 100c0-27.614 22.386-50 50-50s50 22.386 50 50-22.386 50-50 50-50-22.386-50-50z" />
              <path d="M75 85h50M90 115h20" />
            </g>
          </svg>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
          >
            ← Go Back
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="primary"
          >
            Go to Dashboard
          </Button>
        </div>

        {/* Suggestions */}
        <div className="mt-16 p-8 bg-white/5 border border-white/10 rounded-lg max-w-md mx-auto">
          <h3 className="font-bold mb-4">You might be looking for:</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Settings', path: '/settings' },
              { label: 'Profile', path: '/profile' },
              { label: 'Home', path: '/login' },
            ].map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className="hover:text-blue-400 transition-colors"
                >
                  → {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
