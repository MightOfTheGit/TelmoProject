'use client';
interface SaveSearchButtonProps {
  isSaved: boolean;
  onSave: () => void;
  onRemove: () => void;
}
export function SaveSearchButton({ isSaved, onSave, onRemove }: SaveSearchButtonProps) {
  return (
    <button
      onClick={isSaved ? onRemove : onSave}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        isSaved
          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isSaved ? 'Saved — Remove' : 'Save & Get Alerts'}
    </button>
  );
}
