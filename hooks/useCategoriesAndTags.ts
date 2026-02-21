"use client";

import { useEffect, useState } from "react";
import type { Category, Tag } from "@/lib/data/types";

interface Result {
  categories: Category[];
  tags: Tag[];
  loading: boolean;
}

export function useCategoriesAndTags(): Result {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
    ])
      .then(([cats, tagsData]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);
      })
      .catch(() => {
        setCategories([]);
        setTags([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { categories, tags, loading };
}
