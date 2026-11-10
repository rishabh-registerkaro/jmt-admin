
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner"
import { createCategory, deleteCategory } from "@/lib/apiCallingCategory";

const toastConfig = {
  closeButton: true,
  className: "!bg-transparent !text-white",
}

// Matches the palette in the Category model
const CATEGORY_PALETTE = [
  "#1e40af","#6d28d9","#0f766e","#b45309",
  "#be123c","#15803d","#c2410c","#7c3aed",
];

function generateCategoryColor(name: string): string {
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  color: string;
  parentCategory?: string | null;
  createdAt: string;
  updatedAt: string;
  postCount?: number;
}

export default function CategoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    color: "",
    parentCategory: "",
    description: "",
  });
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  // Full list only for the parent-category dropdown (small payload: names/ids)
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // Fetch the paginated table chunk whenever the page changes
  useEffect(() => {
    fetchCategories(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Fetch the full list once for the parent dropdown
  useEffect(() => {
    fetchAllCategories();
  }, []);

  const fetchCategories = async (page: number = 1) => {
    try {
      setCategoriesLoading(true);
      const res = await fetch(
        `/api/post/category/get-all-categories?page=${page}&limit=${itemsPerPage}`,
        { credentials: "include" }
      );

      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setServerTotalPages(data.pagination?.totalPages ?? 1);
        setTotalCount(data.pagination?.totalCount ?? (data.categories?.length || 0));
      } else {
        console.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const res = await fetch("/api/post/category/get-all-categories", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAllCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching all categories:", error);
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

  // Derived: preview color — user override takes priority, else auto-generate from name
  const previewColor = formData.color.trim() || (formData.name ? generateCategoryColor(formData.name) : CATEGORY_PALETTE[0]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "name" && autoGenerateSlug) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required", toastConfig);
      return;
    }

    setLoading(true);
    const loadingToastId = toast.loading("Creating category...", toastConfig);

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.toLowerCase().trim(),
        color: formData.color.trim() || undefined,
        parentCategory: formData.parentCategory || null,
      };

      const data = await createCategory(payload);

      toast.dismiss(loadingToastId);

      if (data.success) {
        toast.success("Category created successfully!", toastConfig);
        setFormData({ name: "", slug: "", color: "", parentCategory: "", description: "" });
        // New categories sort first — jump back to page 1 and refresh the dropdown
        setCurrentPage(1);
        fetchCategories(1);
        fetchAllCategories();
      } else {
        toast.error(data.message || "Failed to create category", toastConfig);
      }
    } catch (error: any) {
      console.error(error);
      toast.dismiss(loadingToastId);
      toast.error(
        error.message || "Something went wrong. Please try again.",
        toastConfig
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    toast.warning("Are you sure you want to delete this category?", {
      duration: 6000,
      closeButton: true,
      action: {
        label: "Delete",
        onClick: async () => {
          // Start loading toast
          const loadingToastId = toast.loading("Deleting category...", toastConfig);

          try {
            const data = await deleteCategory(id);

            // Stop loading
            toast.dismiss(loadingToastId);

            if (data.success) {
              toast.success("Category deleted successfully!", toastConfig);
              fetchCategories(currentPage); // Refresh current chunk
              fetchAllCategories();
            } else {
              toast.error(data.message || "Failed to delete category", toastConfig);
            }
          } catch (error: any) {
            console.error("Error deleting category:", error);

            // Stop loading
            toast.dismiss(loadingToastId);

            const message = error?.message || "Something went wrong. Please try again.";

            // Special handling when category has child categories
            if (message.includes("child categories")) {
              toast.warning(
                "This category has child categories. Please delete or reassign its child categories before deleting this parent category.",
                { closeButton: true }
              );
            } else {
              toast.error(message, toastConfig);
            }
          }
        },
      },
    });
  };

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCategories(paginatedCategories.map((cat) => cat._id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  // Get top-level categories (for parent dropdown) — from the full list
  const topLevelCategories = allCategories.filter((cat) => !cat.parentCategory);

  // Search filters within the current server page
  const paginatedCategories = searchTerm
    ? categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : categories;

  const totalPages = serverTotalPages;

  // Parent name comes from the API row; fall back to the full list
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "None";
    const category = allCategories.find((cat) => cat._id === categoryId);
    return category?.name || "Unknown";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Categories</h1>
          <p className="text-slate-400">Manage your post categories</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Add Category Form */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Add Category</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-1">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Category name"
                    required
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    The name is how it appears on your site.
                  </p>
                </div>

                {/* Slug */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="slug" className="block text-sm font-medium text-slate-200 mb-1">
                      Slug
                    </label>
                    <div className="mb-1">
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
                      "w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white",
                      autoGenerateSlug && "opacity-60 cursor-not-allowed"
                    )}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    The "slug" is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens.
                  </p>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Badge Color
                  </label>
                  <div className="flex items-center gap-3">
                    {/* Live preview swatch */}
                    <div
                      className="h-8 w-8 shrink-0 rounded-full border-2 border-white/20"
                      style={{ background: previewColor }}
                    />
                    {/* Palette quick-pick */}
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
                    {/* Manual hex input */}
                    <Input
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      placeholder="Custom hex e.g. #1e40af"
                      className="flex-1 rounded-lg border border-slate-600 bg-slate-900/60 text-white font-mono text-xs"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Auto-assigned from name if left blank. Click a swatch or enter a custom hex to override.
                  </p>
                </div>

                {/* Parent Category */}
                <div>
                  <label htmlFor="parentCategory" className="block text-sm font-medium text-slate-200 mb-1">
                    Parent Category
                  </label>
                  <select
                    id="parentCategory"
                    name="parentCategory"
                    value={formData.parentCategory}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white"
                  >
                    <option value="">None</option>
                    {topLevelCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    Categories, unlike tags, can have a hierarchy. You might have a Jazz category, and under that have children categories for Bebop and Big Band. Totally optional.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  {loading ? "Adding..." : "Add Category"}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Panel - Category List */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6">
              {/* Search and Bulk Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 flex gap-2">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search categories..."
                    className="flex-1 bg-slate-900/60 text-white border-slate-600"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-slate-700 text-white border-slate-600"
                  >
                    Search Categories
                  </Button>
                </div>
              </div>

              {/* Category Table */}
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedCategories.length === paginatedCategories.length && paginatedCategories.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Color</TableHead>
                    <TableHead className="text-slate-300">Slug</TableHead>
                    <TableHead className="text-slate-300">Parent</TableHead>
                    <TableHead className="text-slate-300 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriesLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow
                        key={`skeleton-${index}`}
                        className="border-slate-700 hover:bg-transparent"
                      >
                        <TableCell>
                          <div className="h-4 w-4 bg-slate-700 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-5 bg-slate-700 rounded animate-pulse w-3/4"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-6 bg-slate-700 rounded-full animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-slate-700 rounded animate-pulse w-1/2"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-slate-700 rounded animate-pulse w-1/3"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-center">
                            <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : paginatedCategories.length > 0 ? (
                    paginatedCategories.map((cat) => (
                      <TableRow
                        key={cat._id}
                        className="border-slate-700 hover:bg-slate-800/30 transition-colors"
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat._id)}
                            onChange={() => handleSelectCategory(cat._id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="text-slate-200 font-medium">
                          <div className="cursor-pointer" onClick={() => router.push(`/dashboard/blog/category/${cat._id}`)}>
                            {cat.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-5 w-5 rounded-full border border-white/20 shrink-0"
                              style={{ background: cat.color || generateCategoryColor(cat.name) }}
                            />
                            <span className="font-mono text-[10px] text-slate-400">
                              {cat.color || generateCategoryColor(cat.name)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-400 font-mono text-sm">
                          {cat.slug}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {getCategoryName(cat.parentCategory || null)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(cat._id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/20 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                        No categories found. Add your first category using the form on the left.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <span>
                  {totalCount} {totalCount === 1 ? "item" : "items"}
                </span>
                <div className="flex gap-2 items-center">
                  <span>
                    {currentPage} of {totalPages || 1}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="text-slate-400 hover:text-white disabled:opacity-50"
                    >
                      ««
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="text-slate-400 hover:text-white disabled:opacity-50"
                    >
                      ‹
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="text-slate-400 hover:text-white disabled:opacity-50"
                    >
                      ›
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="text-slate-400 hover:text-white disabled:opacity-50"
                    >
                      »»
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
