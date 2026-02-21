"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
}

export function SearchBar({
  defaultValue = "",
  placeholder = "Search posts…",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function updateSearch(search: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`/blog?${params.toString()}`);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateSearch(v), 300);
  }

  function handleClear() {
    setValue("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    updateSearch("");
  }

  return (
    <div className="relative flex items-center">
      <Input
        type="search"
        aria-label="Search posts"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pr-8"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
          className="absolute right-2 text-muted-foreground hover:text-foreground text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
