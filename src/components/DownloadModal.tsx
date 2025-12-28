import { useEffect, useRef } from 'react';
import { X, Download, Monitor, Shield, Zap, Diamond } from 'lucide-react';
import { DiamondPattern, GoldenLine, CornerOrnaments } from './ui';

export default function DownloadModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenModal = () => {
      dialogRef.current?.showModal();
    };
    window.addEventListener('openDownloadModal', handleOpenModal);

    return () => {
      window.removeEventListener('openDownloadModal', handleOpenModal);
    };
  }, []);

  const closeModal = () => {
    dialogRef.current?.close();
  };

  const downloadUrl =
    import.meta.env.PUBLIC_DOWNLOAD_URL ||
    "https://github.com/estanisalpre/mystovia-web/releases/download/v.0.0.2/MystoviaLauncher.exe";

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[1000] w-full max-w-lg p-0 m-auto rounded-2xl overflow-hidden backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      style={{
        background: 'linear-gradient(to bottom, rgb(17 24 39), rgb(0 0 0))',
        boxShadow: '0 0 60px rgba(234, 179, 8, 0.2), inset 0 1px 0 rgba(234, 179, 8, 0.1)'
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) closeModal();
      }}
      aria-labelledby="download-modal-title"
    >
      {/* Diamond pattern overlay */}
      <DiamondPattern opacity={0.03} rounded />

      {/* Top golden line */}
      <GoldenLine position="top" thickness="thick" opacity={0.7} />

      {/* Border */}
      <span className="absolute inset-0 rounded-2xl border-2 border-yellow-500/30 pointer-events-none" aria-hidden="true" />

      {/* Corner ornaments */}
      <CornerOrnaments variant="bracket" size="lg" opacity={0.4} offset={3} />

      {/* Close button */}
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 z-200 p-2 cursor-pointer rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Cerrar"
        type="button"
      >
        <X size={20} aria-hidden="true" />
      </button>

      {/* Content */}
      <article className="relative z-10 p-6 sm:p-8">
        {/* Header */}
        <header className="text-center mb-6">
          <figure className="flex items-center justify-center gap-3 mb-3" aria-hidden="true">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-500/50" />
            <Diamond className="w-4 h-4 text-yellow-500/70" fill="currentColor" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-500/50" />
          </figure>
          <h2 id="download-modal-title" className="text-2xl sm:text-3xl font-bold text-yellow-500 mb-2" style={{ fontFamily: '"Cinzel", serif' }}>
            Descargar Mystovia
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Descarga el cliente oficial para comenzar tu aventura
          </p>
        </header>

        {/* Features */}
        <ul className="grid grid-cols-3 gap-3 mb-6 list-none p-0">
          <li className="text-center p-3 rounded-lg border border-yellow-600/20"
              style={{ background: 'linear-gradient(to bottom, rgb(31 41 55 / 0.5), rgb(17 24 39 / 0.7))' }}>
            <Monitor className="w-5 h-5 text-yellow-500 mx-auto mb-1" aria-hidden="true" />
            <span className="text-xs text-gray-400">Windows</span>
          </li>
          <li className="text-center p-3 rounded-lg border border-yellow-600/20"
              style={{ background: 'linear-gradient(to bottom, rgb(31 41 55 / 0.5), rgb(17 24 39 / 0.7))' }}>
            <Shield className="w-5 h-5 text-yellow-500 mx-auto mb-1" aria-hidden="true" />
            <span className="text-xs text-gray-400">Seguro</span>
          </li>
          <li className="text-center p-3 rounded-lg border border-yellow-600/20"
              style={{ background: 'linear-gradient(to bottom, rgb(31 41 55 / 0.5), rgb(17 24 39 / 0.7))' }}>
            <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" aria-hidden="true" />
            <span className="text-xs text-gray-400">Rapido</span>
          </li>
        </ul>

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
          onClick={closeModal}
        >
          <Download className="w-5 h-5" aria-hidden="true" />
          <span>Descargar Cliente</span>
        </a>

        {/* Version info */}
        <footer className="text-center text-xs text-gray-500 mt-4">
          <p>Version 1.0 - MystoviaLauncher.exe</p>
        </footer>
      </article>
    </dialog>
  );
}

// Export function to open modal from anywhere
export function openDownloadModal() {
  window.dispatchEvent(new CustomEvent('openDownloadModal'));
}
