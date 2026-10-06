// components/projects/ProjectSearch.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  X,
  RotateCcw,
  Cpu,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  personalizeSuggestions,
  type RecentSearchItem,
} from "@/lib/search/recent-searches";
import type { CatalogSuggestionResponse } from "@/lib/search/catalog-search";

interface NavigableItem {
  id: string;
  type: "recent" | "suggestion" | "technology" | "category";
  label: string;
  value: string;
  slug?: string;
}

export function ProjectSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") ?? searchParams.get("search") ?? "";
  const [query, setQuery] = React.useState(urlQuery);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [recentSearches, setRecentSearches] = React.useState<RecentSearchItem[]>([]);
  const [remoteData, setRemoteData] = React.useState<CatalogSuggestionResponse | null>(null);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listboxId = "catalog-search-suggestions-listbox";

  // Keep input synced when URL query changes externally (e.g. Reset filters, back/forward, related search click)
  React.useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  // Load recent searches on mount and save initial URL query if present
  React.useEffect(() => {
    const loaded = getRecentSearches();
    if (urlQuery.trim()) {
      setRecentSearches(saveRecentSearch(urlQuery.trim()));
    } else {
      setRecentSearches(loaded);
    }
  }, [urlQuery]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced fetch for catalog suggestions (280ms)
  React.useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/projects/suggestions?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data: CatalogSuggestionResponse = await res.json();
          setRemoteData(data);
        }
      } catch {
        // Ignore aborted or offline suggestion fetches
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOpen]);

  const executeSearch = React.useCallback(
    (rawSearchValue: string, options?: { categorySlug?: string; techSlug?: string }) => {
      const clean = rawSearchValue.trim();
      const params = new URLSearchParams(searchParams.toString());
      params.delete("search");

      if (options?.categorySlug) {
        params.set("category", options.categorySlug);
      }
      if (options?.techSlug) {
        params.set("tech", options.techSlug);
      }

      if (clean) {
        params.set("q", clean);
        params.set("page", "1");
        setRecentSearches(saveRecentSearch(clean));
      } else {
        params.delete("q");
        params.delete("page");
      }

      setQuery(clean);
      setIsOpen(false);
      setActiveIndex(-1);

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && navigableItems[activeIndex]) {
      handleSelectItem(navigableItems[activeIndex]);
      return;
    }
    executeSearch(query);
  };

  // Clear button handler: resets input, URL state, and suggestion highlight cleanly
  const clearSearch = () => {
    setQuery("");
    setActiveIndex(-1);

    const params = new URLSearchParams(searchParams.toString());
    const hadUrlQuery = params.has("q") || params.has("search");
    params.delete("q");
    params.delete("search");
    params.delete("page");

    if (hadUrlQuery) {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }

    inputRef.current?.focus();
  };

  const handleRemoveRecent = (e: React.MouseEvent, itemQuery: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = removeRecentSearch(itemQuery);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRecentSearches(clearRecentSearches());
  };

  // Filter recent searches matching current input
  const visibleRecentSearches = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return recentSearches.slice(0, 5);
    return recentSearches
      .filter((r) => r.query.toLowerCase().includes(trimmed))
      .slice(0, 4);
  }, [query, recentSearches]);

  // Personalize suggestion ordering based on search history
  const personalizedSuggestions = React.useMemo(() => {
    const base = remoteData?.suggestions || [];
    const ranked = personalizeSuggestions(base, recentSearches, query);
    const recentLowerSet = new Set(visibleRecentSearches.map((r) => r.query.toLowerCase()));
    return ranked.filter((s) => !recentLowerSet.has(s.toLowerCase())).slice(0, 5);
  }, [remoteData?.suggestions, recentSearches, query, visibleRecentSearches]);

  const visibleTechnologies = React.useMemo(
    () => (remoteData?.technologies || []).slice(0, 4),
    [remoteData?.technologies]
  );

  const visibleCategories = React.useMemo(
    () => (remoteData?.categories || []).slice(0, 4),
    [remoteData?.categories]
  );

  // Flat list of keyboard-navigable items
  const navigableItems = React.useMemo<NavigableItem[]>(() => {
    const items: NavigableItem[] = [];
    for (const r of visibleRecentSearches) {
      items.push({
        id: `recent-${r.normalized}`,
        type: "recent",
        label: r.query,
        value: r.query,
      });
    }
    for (const s of personalizedSuggestions) {
      items.push({
        id: `sug-${s}`,
        type: "suggestion",
        label: s,
        value: s,
      });
    }
    for (const t of visibleTechnologies) {
      items.push({
        id: `tech-${t.slug}`,
        type: "technology",
        label: t.name,
        value: t.name,
        slug: t.slug,
      });
    }
    for (const c of visibleCategories) {
      items.push({
        id: `cat-${c.slug}`,
        type: "category",
        label: c.name,
        value: c.name,
        slug: c.slug,
      });
    }
    return items;
  }, [visibleRecentSearches, personalizedSuggestions, visibleTechnologies, visibleCategories]);

  const handleSelectItem = (item: NavigableItem) => {
    executeSearch(item.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
        return;
      }
      if (navigableItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % navigableItems.length);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (navigableItems.length > 0) {
        setActiveIndex((prev) =>
          prev <= 0 ? navigableItems.length - 1 : prev - 1
        );
      }
    }
  };

  const hasDropdownContent = navigableItems.length > 0;
  const hasQueryText = query.length > 0;

  return (
    <div ref={containerRef} className="relative w-full md:w-96 lg:w-[420px] max-w-full">
      <form
        onSubmit={handleFormSubmit}
        role="search"
        aria-label="Search software catalog"
        className="relative w-full"
      >
        {/* Single Left Search Icon */}
        <Search
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#526267] pointer-events-none"
        />

        {/* Single Search Input (type="text" + inputMode="search" guarantees no duplicate browser X button) */}
        <Input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          role="combobox"
          aria-expanded={isOpen && hasDropdownContent}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && navigableItems[activeIndex]
              ? navigableItems[activeIndex].id
              : undefined
          }
          aria-label="Search projects by keyword, feature, or technology"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search projects, AI ML, Python, React..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-10 w-full bg-white rounded-xl shadow-xs border-[#D9E2E4] focus-visible:ring-[#155761] focus-visible:border-[#155761] text-[#102124] placeholder:text-[#526267]/60 text-sm"
        />

        {/* Strictly ONE Clear/X Button rendered only when query has text */}
        {hasQueryText && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            title="Clear search"
            data-testid="catalog-search-clear"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#526267] hover:text-[#102124] hover:bg-[#F3F7F7] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Autocomplete & Suggestions Dropdown */}
      {isOpen && hasDropdownContent && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 bg-white rounded-2xl border border-[#D9E2E4] shadow-lg overflow-hidden max-h-[75vh] overflow-y-auto divide-y divide-[#F3F7F7]"
        >
          {/* 1. Recent Searches */}
          {visibleRecentSearches.length > 0 && (
            <div className="p-2.5">
              <div className="flex items-center justify-between px-2.5 py-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267]">
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={handleClearAllRecent}
                  className="text-[11px] font-medium text-[#155761] hover:text-[#2F7D78] cursor-pointer"
                >
                  Clear all
                </button>
              </div>
              <div className="mt-1 space-y-0.5">
                {visibleRecentSearches.map((item) => {
                  const navIdx = navigableItems.findIndex(
                    (n) => n.id === `recent-${item.normalized}`
                  );
                  const isActive = navIdx === activeIndex;
                  return (
                    <div
                      key={item.normalized}
                      id={`recent-${item.normalized}`}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(navIdx)}
                      onClick={() =>
                        handleSelectItem({
                          id: `recent-${item.normalized}`,
                          type: "recent",
                          label: item.query,
                          value: item.query,
                        })
                      }
                      className={`group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[#F3F7F7] text-[#155761] font-semibold"
                          : "text-[#102124] hover:bg-[#F8FAFA]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <RotateCcw className="w-3.5 h-3.5 text-[#526267] shrink-0" />
                        <span className="truncate">{item.query}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecent(e, item.query)}
                        aria-label={`Remove ${item.query} from recent searches`}
                        title="Remove from history"
                        className="p-1 text-[#526267]/60 hover:text-[#102124] rounded-md hover:bg-[#E5ECEE]/60 transition-colors shrink-0 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Smart Suggestions */}
          {personalizedSuggestions.length > 0 && (
            <div className="p-2.5">
              <div className="px-2.5 py-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267]">
                  Suggestions
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {personalizedSuggestions.map((sug) => {
                  const navIdx = navigableItems.findIndex(
                    (n) => n.id === `sug-${sug}`
                  );
                  const isActive = navIdx === activeIndex;
                  return (
                    <button
                      key={sug}
                      id={`sug-${sug}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(navIdx)}
                      onClick={() =>
                        handleSelectItem({
                          id: `sug-${sug}`,
                          type: "suggestion",
                          label: sug,
                          value: sug,
                        })
                      }
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left text-xs cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[#F3F7F7] text-[#155761] font-semibold"
                          : "text-[#102124] hover:bg-[#F8FAFA]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Search className="w-3.5 h-3.5 text-[#155761] shrink-0" />
                        <span className="truncate">{sug}</span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#526267]/50 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Technologies */}
          {visibleTechnologies.length > 0 && (
            <div className="p-2.5">
              <div className="px-2.5 py-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267]">
                  Technologies
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5 px-2 py-1">
                {visibleTechnologies.map((tech) => {
                  const navIdx = navigableItems.findIndex(
                    (n) => n.id === `tech-${tech.slug}`
                  );
                  const isActive = navIdx === activeIndex;
                  return (
                    <button
                      key={tech.slug}
                      id={`tech-${tech.slug}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(navIdx)}
                      onClick={() =>
                        handleSelectItem({
                          id: `tech-${tech.slug}`,
                          type: "technology",
                          label: tech.name,
                          value: tech.name,
                          slug: tech.slug,
                        })
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#DDF4EC] text-[#155761] border-[#2F7D78]/40 font-semibold"
                          : "bg-[#F8FAFA] text-[#102124] border-[#D9E2E4] hover:bg-[#F3F7F7] hover:border-[#155761]/40"
                      }`}
                    >
                      <Cpu className="w-3 h-3 text-[#155761] shrink-0" />
                      <span>{tech.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Categories */}
          {visibleCategories.length > 0 && (
            <div className="p-2.5">
              <div className="px-2.5 py-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267]">
                  Categories
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {visibleCategories.map((cat) => {
                  const navIdx = navigableItems.findIndex(
                    (n) => n.id === `cat-${cat.slug}`
                  );
                  const isActive = navIdx === activeIndex;
                  return (
                    <button
                      key={cat.slug}
                      id={`cat-${cat.slug}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(navIdx)}
                      onClick={() =>
                        handleSelectItem({
                          id: `cat-${cat.slug}`,
                          type: "category",
                          label: cat.name,
                          value: cat.name,
                          slug: cat.slug,
                        })
                      }
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[#F3F7F7] text-[#155761] font-semibold"
                          : "text-[#102124] hover:bg-[#F8FAFA]"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-[#2F7D78] shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
