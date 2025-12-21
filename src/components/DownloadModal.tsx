import { useState, useEffect } from 'react';
import { X, Download, Monitor, Shield, Zap } from 'lucide-react';

export default function DownloadModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
    };
    window.addEventListener('openDownloadModal', handleOpenModal);

    return () => {
      window.removeEventListener('openDownloadModal', handleOpenModal);
    };
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const downloadUrl = "https://github.com/estanisalpre/otserver-monorepo/releases/download/v0.0.1/MystoviaLauncher.exe";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      onClick={() => setIsOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(to bottom, rgb(17 24 39), rgb(0 0 0))',
          boxShadow: '0 0 60px rgba(234, 179, 8, 0.2), inset 0 1px 0 rgba(234, 179, 8, 0.1)'
        }}
      >
        {/* Diamond pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23d4af37' fill-opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}
        />

        {/* Top golden line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/70 to-transparent" />

        {/* Border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-yellow-500/30 pointer-events-none" />

        {/* Corner ornaments */}
        <div className="absolute top-3 left-3 w-6 h-6 opacity-40 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
            <path d="M0 0 L50 0 L50 10 L10 10 L10 50 L0 50 Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="absolute top-3 right-3 w-6 h-6 opacity-40 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
            <path d="M0 0 L50 0 L50 10 L10 10 L10 50 L0 50 Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="absolute bottom-3 left-3 w-6 h-6 opacity-40 pointer-events-none" style={{ transform: 'scaleY(-1)' }}>
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
            <path d="M0 0 L50 0 L50 10 L10 10 L10 50 L0 50 Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="absolute bottom-3 right-3 w-6 h-6 opacity-40 pointer-events-none" style={{ transform: 'scale(-1)' }}>
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
            <path d="M0 0 L50 0 L50 10 L10 10 L10 50 L0 50 Z" fill="currentColor"/>
          </svg>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-500/50" />
              <svg className="w-4 h-4 text-yellow-500/70" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 0L20 10L10 20L0 10z"/>
              </svg>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-500/50" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-yellow-500 mb-2" style={{ fontFamily: '"Cinzel", serif' }}>
              Descargar Mystovia
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Descarga el cliente oficial para comenzar tu aventura
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 rounded-lg border border-yellow-600/20"
                 style={{ background: 'linear-gradient(to bottom, rgb(31 41 55 / 0.5), rgb(17 24 39 / 0.7))' }}>
              <Monitor className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <span className="text-xs text-gray-400">Windows</span>
            </div>
            <div className="text-center p-3 rounded-lg border border-yellow-600/20"
                 style={{ background: 'linear-gradient(to bottom, rgb(31 41 55 / 0.5), rgb(17 24 39 / 0.7))' }}>
              <Shield className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <span className="text-xs text-gray-400">Seguro</span>
            </div>
            <div className="text-center p-3 rounded-lg border border-yellow-600/20"
                 style={{ background: 'linear-gradient(to bottom, rgb(31 41 55 / 0.5), rgb(17 24 39 / 0.7))' }}>
              <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <span className="text-xs text-gray-400">Rapido</span>
            </div>
          </div>

          {/* Download button */}
          <a
            href={downloadUrl}
            download="MystoviaLauncher.exe"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl font-bold text-black transition-all transform hover:scale-[1.02] border border-yellow-400/50"
            style={{
              background: 'linear-gradient(to bottom, rgb(234 179 8), rgb(202 138 4))',
              boxShadow: '0 4px 20px rgba(234, 179, 8, 0.3)',
              fontFamily: '"Cinzel", serif'
            }}
            onClick={() => setIsOpen(false)}
          >
            <Download className="w-5 h-5" />
            <span>Descargar Cliente</span>
          </a>

          {/* Version info */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Version 1.0 - MystoviaLauncher.exe
          </p>
        </div>
      </div>
    </div>
  );
}

// Export function to open modal from anywhere
export function openDownloadModal() {
  window.dispatchEvent(new CustomEvent('openDownloadModal'));
}
