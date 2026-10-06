// lib/search/recent-searches.ts
// Client-side recent search history and personalized suggestion ranking.
// Uses localStorage safely with a strict 8-item cap and sensitive-pattern filtering.

import { normalizeSearchText, analyzeSearchQuery } from "./catalog-search";

export const RECENT_SEARCHES_STORAGE_KEY = "soft_showcase_recent_searches_v1";
export const MAX_RECENT_SEARCHES = 8;

export interface RecentSearchItem {
  query: string;
  normalized: string;
  count: number;
  updatedAt: number;
}

let memoryFallbackStore: RecentSearchItem[] = [];

function readStore(): RecentSearchItem[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return memoryFallbackStore;
    }
  }
  return memoryFallbackStore;
}

function writeStore(items: RecentSearchItem[]): void {
  memoryFallbackStore = items;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (items.length === 0) {
        window.localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
      } else {
        window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(items));
      }
    } catch {
      // Ignore storage quota errors
    }
  }
}

/**
 * Prevents storing sensitive data (emails, phone numbers, URLs, tokens) in search history.
 */
export function isSafeSearchQueryToStore(raw: string): boolean {
  const trimmed = (raw || "").trim();
  if (trimmed.length < 2 || trimmed.length > 70) return false;
  // Reject email addresses
  if (/\S+@\S+\.\S+/.test(trimmed)) return false;
  // Reject phone / long digit sequences (8+ digits)
  if (/\d{8,}/.test(trimmed.replace(/[\s\-+()]/g, ""))) return false;
  // Reject URLs
  if (/https?:\/\//i.test(trimmed)) return false;
  return true;
}

export function getRecentSearches(): RecentSearchItem[] {
  return readStore()
    .filter(
      (item): item is RecentSearchItem =>
        Boolean(
          item &&
            typeof item.query === "string" &&
            item.query.trim().length > 0 &&
            typeof item.normalized === "string"
        )
    )
    .slice(0, MAX_RECENT_SEARCHES);
}

export function saveRecentSearch(rawQuery: string): RecentSearchItem[] {
  const trimmed = (rawQuery || "").trim().replace(/\s+/g, " ");
  if (!isSafeSearchQueryToStore(trimmed)) {
    return getRecentSearches();
  }

  const normalized = normalizeSearchText(trimmed);
  if (!normalized) return getRecentSearches();

  const current = getRecentSearches();
  const existingIdx = current.findIndex(
    (item) => item.normalized === normalized || item.query.toLowerCase() === trimmed.toLowerCase()
  );

  const now = Date.now();
  let updated: RecentSearchItem[];

  if (existingIdx !== -1) {
    const existing = current[existingIdx];
    const promoted: RecentSearchItem = {
      query: trimmed,
      normalized,
      count: (existing.count || 1) + 1,
      updatedAt: now,
    };
    updated = [promoted, ...current.filter((_, idx) => idx !== existingIdx)];
  } else {
    const nextItem: RecentSearchItem = {
      query: trimmed,
      normalized,
      count: 1,
      updatedAt: now,
    };
    updated = [nextItem, ...current];
  }

  const capped = updated.slice(0, MAX_RECENT_SEARCHES);
  writeStore(capped);
  return capped;
}

export function removeRecentSearch(queryToRemove: string): RecentSearchItem[] {
  const norm = normalizeSearchText(queryToRemove);
  const lower = (queryToRemove || "").trim().toLowerCase();
  const current = getRecentSearches();
  const filtered = current.filter(
    (item) => item.normalized !== norm && item.query.toLowerCase() !== lower
  );
  writeStore(filtered);
  return filtered;
}

export function clearRecentSearches(): RecentSearchItem[] {
  writeStore([]);
  return [];
}

/**
 * Reorders suggestions using the user's previous search history for subtle personalization.
 * Never removes any catalog suggestions — only boosts relevant items in ordering.
 */
export function personalizeSuggestions(
  suggestions: string[],
  recentSearches: RecentSearchItem[],
  currentInput: string
): string[] {
  if (!recentSearches || recentSearches.length === 0) return suggestions;

  const normInput = normalizeSearchText(currentInput);

  // Build a set of concept group IDs and terms the user has frequently searched
  const historyGroupCounts = new Map<string, number>();
  const historyTokens = new Set<string>();

  for (const item of recentSearches) {
    const analysis = analyzeSearchQuery(item.query);
    for (const group of analysis.matchedGroups) {
      historyGroupCounts.set(group.id, (historyGroupCounts.get(group.id) || 0) + (item.count || 1));
    }
    for (const tk of analysis.tokens) {
      historyTokens.add(tk);
    }
  }

  // Also include matching recent searches near the top if they match currentInput prefix
  const matchingRecentQueries = recentSearches
    .filter((r) => {
      if (!normInput) return false;
      return (
        r.normalized.startsWith(normInput) ||
        r.query.toLowerCase().startsWith(currentInput.trim().toLowerCase()) ||
        r.normalized.includes(normInput)
      );
    })
    .map((r) => r.query);

  const combined = [...matchingRecentQueries];
  for (const s of suggestions) {
    if (!combined.some((c) => c.toLowerCase() === s.toLowerCase())) {
      combined.push(s);
    }
  }

  return combined
    .map((text, index) => {
      let boost = 0;
      const lower = text.toLowerCase();
      const norm = normalizeSearchText(text);

      // Direct match in recent searches
      const recentMatch = recentSearches.find(
        (r) => r.query.toLowerCase() === lower || r.normalized === norm
      );
      if (recentMatch) {
        boost += 30 + Math.min(15, (recentMatch.count || 1) * 5);
      }

      // Concept overlap with user's frequent search domains
      const suggestionAnalysis = analyzeSearchQuery(text);
      for (const grp of suggestionAnalysis.matchedGroups) {
        const freq = historyGroupCounts.get(grp.id) || 0;
        if (freq > 0) {
          boost += Math.min(12, freq * 4);
        }
      }

      // Token overlap with user's search history
      for (const tk of suggestionAnalysis.tokens) {
        if (historyTokens.has(tk)) {
          boost += 5;
        }
      }

      return { text, index, boost };
    })
    .sort((a, b) => {
      if (b.boost !== a.boost) return b.boost - a.boost;
      return a.index - b.index;
    })
    .map((item) => item.text);
}
