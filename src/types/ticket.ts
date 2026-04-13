export interface Ticket {
  price: number;
  currency: string;
  section: string;
  row?: string;
  source: string;
  sourceLogoUrl: string;
  url: string;
  isOfficial: boolean;
}

export interface DeepLink {
  name: string;
  url: string;
  logoUrl: string;
}

export interface SearchResult {
  tickets: Ticket[];
  deepLinks: DeepLink[];
  query: string;
  fetchedAt: string;
}

export interface SavedSearch {
  id: string;
  query: string;
  savedAt: string;
  lastCheckedAt: string;
  lastCheapestPrice: number | null;
  lastCheapestSource: string | null;
  lastResult: SearchResult | null;
}
