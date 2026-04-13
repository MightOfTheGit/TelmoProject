'use client';
interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}
export function Toast({ message, visible, onClose }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg bg-gray-900 px-5 py-3 text-white shadow-lg transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white text-lg leading-none">&times;</button>
    </div>
  );
}
