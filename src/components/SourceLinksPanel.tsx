import type { DeepLink } from '@/types/ticket';

interface SourceLinksPanelProps {
  deepLinks: DeepLink[];
}
export function SourceLinksPanel({ deepLinks }: SourceLinksPanelProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">Also search on</h2>
      <div className="flex flex-wrap gap-3">
        {deepLinks.map(link => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <img src={link.logoUrl} alt={link.name} className="h-4 w-4" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            {link.name} &rarr;
          </a>
        ))}
      </div>
    </div>
  );
}
