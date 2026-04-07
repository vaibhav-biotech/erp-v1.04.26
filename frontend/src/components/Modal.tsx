'use client';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({
  isOpen,
  title,
  onClose,
  children,
  size = 'md',
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-50 rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[92vh] flex flex-col`}>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-lg flex-shrink-0">
          <h2 className="text-lg font-bold text-black">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
