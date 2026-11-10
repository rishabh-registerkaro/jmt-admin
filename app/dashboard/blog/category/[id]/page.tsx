"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCategoryById, updateCategory } from "@/lib/apiCallingCategory";
import { toast } from "sonner";

const CATEGORY_PALETTE = [
  "#1e40af","#6d28d9","#0f766e","#b45309",
  "#be123c","#15803d","#c2410c","#7c3aed",
];

function generateCategoryColor(name: string): string {
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

interface CategoryFormData {
  name: string;
  slug: string;
  color: string;
  parentCategory: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: string | null | {
    _id: string;
    name: string;
    slug: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function UpdateCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    color: "",
    parentCategory: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Check if ID is provided, redirect if not
  useEffect(() => {
    if (!categoryId) {
      router.push("/dashboard/blog/category");
    }
  }, [categoryId, router]);

  // Fetch category data on mount
  useEffect(() => {
    if (categoryId) {
      fetchCategoryData();
      fetchAllCategories();
    }
  }, [categoryId]);

  const fetchCategoryData = async () => {
    if (!categoryId) return;

    try {
      setFetching(true);
      const response = await getCategoryById(categoryId);

      if (response.success && response.category) {
        const category = response.category;
        
        // Handle parentCategory - it can be an object or string or null
        let parentCategoryId = "";
        if (category.parentCategory) {
          if (typeof category.parentCategory === "object" && category.parentCategory._id) {
            parentCategoryId = category.parentCategory._id;
          } else if (typeof category.parentCategory === "string") {
            parentCategoryId = category.parentCategory;
          }
        }

        setFormData({
          name: category.name || "",
          slug: category.slug || "",
          color: category.color || "",
          parentCategory: parentCategoryId,
        });
      } else {
        toast.error("Failed to fetch category data");
        router.push("/dashboard/blog/category");
      }
    } catch (error: any) {
      console.error("Error fetching category:", error);
      toast.error(error.message || "Failed to fetch category data");
      router.push("/dashboard/blog/category");
    } finally {
      setFetching(false);
    }
  };

  const fetchAllCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await fetch("/api/post/category/get-all-categories", {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        // Filter out the current category from parent options to prevent self-parenting
        const filteredCategories = (data.categories || []).filter(
          (cat: Category) => cat._id !== categoryId
        );
        setCategories(filteredCategories);
      } else {
        console.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "name" && autoGenerateSlug) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!categoryId) {
      toast.error("Category ID is missing");
      return;
    }

    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }

    setLoading(true);
    const loadingToastId = toast.loading("Updating category...", {
      closeButton: true,
      className: "!bg-transparent !text-white",
    });

    try {
      const payload = {
        id: categoryId,
        name: formData.name.trim(),
        slug: formData.slug.toLowerCase().trim(),
        color: formData.color.trim() || undefined,
        parentCategory: formData.parentCategory || null,
      };

      const data = await updateCategory(payload);

      toast.dismiss(loadingToastId);

      if (data.success) {
        toast.success("Category updated successfully!", {
          closeButton: true,
          className: "!bg-transparent !text-white",
        });
        setTimeout(() => {
          router.push("/dashboard/blog/category");
        }, 1000);
      } else {
        toast.error(data.message || "Failed to update category", {
          closeButton: true,
          className: "!bg-transparent !text-white",
        });
      }
    } catch (error: any) {
      console.error(error);
      toast.dismiss(loadingToastId);
      
      const errorMessage = error.message || error.errors?.join(", ") || "Something went wrong. Please try again.";
      toast.error(errorMessage, {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading category data...</div>
      </div>
    );
  }

  if (!categoryId) {
    return null; // Will redirect
  }

  // Get top-level categories (for parent dropdown) - exclude current category
  const topLevelCategories = categories.filter((cat) => !cat.parentCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Update Category</h1>
            <p className="text-slate-400">Edit the details of your category</p>
          </div>
          <Button
            className="bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
            onClick={() => router.push("/dashboard/blog/category")}
          >
            Back to Categories
          </Button>
        </div>

        <form className="space-y-6" onSubmit={handleUpdate}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-200">
                Name <span className="text-red-400">*</span>
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Category name"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white"
              />
              <p className="text-xs text-slate-400">
                The name is how it appears on your site.
              </p>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="slug" className="block text-sm font-medium text-slate-200">
                  Slug <span className="text-red-400">*</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={autoGenerateSlug}
                    onChange={(e) => setAutoGenerateSlug(e.target.checked)}
                    className="rounded"
                  />
                  Auto-generate from name
                </label>
              </div>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="category-slug"
                required
                disabled={autoGenerateSlug}
                className={cn(
                  "w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white",
                  autoGenerateSlug && "opacity-60 cursor-not-allowed"
                )}
              />
              <p className="text-xs text-slate-400">
                The "slug" is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens.
              </p>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Badge Color
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 shrink-0 rounded-full border-2 border-white/20"
                  style={{ background: formData.color.trim() || generateCategoryColor(formData.name || "") }}
                />
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORY_PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      title={hex}
                      onClick={() => setFormData((prev) => ({ ...prev, color: hex }))}
                      className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        background: hex,
                        borderColor: formData.color === hex ? "white" : "transparent",
                      }}
                    />
                  ))}
                </div>
                <Input
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="Custom hex e.g. #1e40af"
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-900/60 text-white font-mono text-xs"
                />
              </div>
              <p className="text-xs text-slate-400">
                Auto-assigned from name if blank. Click a swatch or enter a custom hex to override.
              </p>
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <label htmlFor="parentCategory" className="block text-sm font-medium text-slate-200">
                Parent Category
              </label>
              {categoriesLoading ? (
                <div className="text-sm text-slate-400">Loading categories...</div>
              ) : (
                <select
                  id="parentCategory"
                  name="parentCategory"
                  value={formData.parentCategory}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 selection:bg-indigo-500 selection:text-white"
                >
                  <option value="">None</option>
                  {topLevelCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-slate-400">
                Categories, unlike tags, can have a hierarchy. You might have a Jazz category, and under that have children categories for Bebop and Big Band. Totally optional.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/blog/category")}
              className="bg-slate-800/60 text-white border-slate-600 hover:bg-slate-700"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.slug}
              className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Category"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}