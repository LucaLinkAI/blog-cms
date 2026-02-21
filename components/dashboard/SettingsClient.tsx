"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify } from "@/lib/utils/slug";
import type { Author, Category, Tag, UserRole } from "@/lib/data/types";

interface SettingsClientProps {
  currentUser: Author;
  initialCategories: Category[];
  initialTags: Tag[];
  isEditorOrAdmin: boolean;
  isAdmin: boolean;
  initialAuthors: Author[];
}

export function SettingsClient({
  currentUser,
  initialCategories,
  initialTags,
  isEditorOrAdmin,
  isAdmin,
  initialAuthors,
}: SettingsClientProps) {
  // ── Profile ───────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`/api/authors/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName || undefined,
          bio: bio || undefined,
          avatarUrl: avatarUrl || undefined,
        }),
      });
      if (res.ok) {
        setProfileMsg({ type: "success", text: "Profile saved." });
      } else {
        const err = await res.json();
        setProfileMsg({ type: "error", text: err.error ?? "Failed to save." });
      }
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Categories ────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3B82F6");
  const [catMsg, setCatMsg] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");

  function handleCatNameBlur() {
    if (!newCatSlug) setNewCatSlug(slugify(newCatName));
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setCatMsg(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCatName,
        slug: newCatSlug,
        color: newCatColor,
      }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories((prev) => [...prev, cat]);
      setNewCatName("");
      setNewCatSlug("");
      setNewCatColor("#3B82F6");
    } else {
      const err = await res.json();
      setCatMsg(err.error ?? "Failed to create category.");
    }
  }

  async function saveCategory(id: string) {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editCatName }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      setEditingCat(null);
    } else {
      const err = await res.json();
      setCatMsg(err.error ?? "Failed to update category.");
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Posts will be uncategorized.")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  }

  // ── Users (admin only) ────────────────────────────────────────────────────
  const [authors, setAuthors] = useState<Author[]>(initialAuthors);
  const [userMsg, setUserMsg] = useState<string | null>(null);

  async function changeRole(id: string, role: UserRole) {
    setUserMsg(null);
    const res = await fetch(`/api/authors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAuthors((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } else {
      const err = await res.json();
      setUserMsg(err.error ?? "Failed to update role.");
    }
  }

  // ── Tags ──────────────────────────────────────────────────────────────────
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [newTagName, setNewTagName] = useState("");
  const [newTagSlug, setNewTagSlug] = useState("");
  const [tagMsg, setTagMsg] = useState<string | null>(null);

  function handleTagNameBlur() {
    if (!newTagSlug) setNewTagSlug(slugify(newTagName));
  }

  async function createTag(e: React.FormEvent) {
    e.preventDefault();
    setTagMsg(null);
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTagName, slug: newTagSlug }),
    });
    if (res.ok) {
      const tag = await res.json();
      setTags((prev) => [...prev, tag]);
      setNewTagName("");
      setNewTagSlug("");
    } else {
      const err = await res.json();
      setTagMsg(err.error ?? "Failed to create tag.");
    }
  }

  async function deleteTag(id: string) {
    if (!confirm("Delete this tag? It will be removed from all posts.")) return;
    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setTags((prev) => prev.filter((t) => t.id !== id));
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Profile Section (all roles) ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Tell readers about yourself…"
              />
              <p className="text-xs text-muted-foreground">{bio.length}/500</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            {profileMsg && (
              <p
                className={`text-sm ${
                  profileMsg.type === "success"
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                {profileMsg.text}
              </p>
            )}
            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? "Saving…" : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Categories (editor/admin only) ─────────────────────────────── */}
      {isEditorOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {catMsg && (
              <p className="text-sm text-destructive">{catMsg}</p>
            )}

            {/* Existing categories */}
            {categories.length > 0 && (
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-center gap-2 py-1 border-b last:border-0"
                  >
                    {editingCat === cat.id ? (
                      <>
                        <Input
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="h-7 text-sm flex-1"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => saveCategory(cat.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCat(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: cat.color ?? "#888" }}
                        />
                        <span className="flex-1 text-sm">{cat.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {cat.slug}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCat(cat.id);
                            setEditCatName(cat.name);
                            setCatMsg(null);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteCategory(cat.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Inline create form */}
            <form onSubmit={createCategory} className="flex flex-wrap gap-2 pt-2">
              <Input
                placeholder="Name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onBlur={handleCatNameBlur}
                required
                className="flex-1 min-w-[140px]"
              />
              <Input
                placeholder="slug"
                value={newCatSlug}
                onChange={(e) => setNewCatSlug(e.target.value)}
                required
                className="flex-1 min-w-[120px]"
              />
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="h-9 w-9 rounded border cursor-pointer"
                title="Category color"
              />
              <Button type="submit">Add Category</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Tags (editor/admin only) ───────────────────────────────────── */}
      {isEditorOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tagMsg && (
              <p className="text-sm text-destructive">{tagMsg}</p>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Delete ${tag.name}`}
                      onClick={() => deleteTag(tag.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={createTag} className="flex gap-2 flex-wrap">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onBlur={handleTagNameBlur}
                required
                className="flex-1 min-w-[140px]"
              />
              <Input
                placeholder="slug"
                value={newTagSlug}
                onChange={(e) => setNewTagSlug(e.target.value)}
                required
                className="flex-1 min-w-[120px]"
              />
              <Button type="submit">Add Tag</Button>
            </form>
          </CardContent>
        </Card>
      )}
      {/* ── Users (admin only) ─────────────────────────────────────────── */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userMsg && (
              <p className="text-sm text-destructive">{userMsg}</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Slug</th>
                    <th className="pb-2 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {authors.map((author) => (
                    <tr key={author.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{author.displayName}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {author.slug}
                      </td>
                      <td className="py-2">
                        <Select
                          value={author.role}
                          onValueChange={(value) =>
                            changeRole(author.id, value as UserRole)
                          }
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">admin</SelectItem>
                            <SelectItem value="editor">editor</SelectItem>
                            <SelectItem value="author">author</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
