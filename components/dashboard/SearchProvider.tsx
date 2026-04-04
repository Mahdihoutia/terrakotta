"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import SearchModal from "./SearchModal";

interface SearchContextValue {
  openSearch: () => void;
}

const SearchContext = createContext<SearchContextValue>({
  openSearch: () => {},
});

export function useSearch() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  // Cmd+K global shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      <SearchModal open={open} onClose={closeSearch} />
    </SearchContext.Provider>
  );
}
