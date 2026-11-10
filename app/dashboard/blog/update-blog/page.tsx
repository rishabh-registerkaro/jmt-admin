"use client";

import { useState, useEffect, ChangeEvent, FormEvent, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updatePost, getPostById } from "@/lib/apiCalling";
import { toast } from "sonner";
import Editor from "@/components/common/Editor";
import AdditionalFieldsBlog from "@/components/common/AdditionalFileldsBlog";

import { Upload, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { uploadFileToMedia } from "@/app/lib/utils/media";


interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string[];
  status: "draft" | "published";
  publishedAt: string;
  faq_items: Array<{ question: string; answer: string }>;
  additionalFields: Record<string, {
    label: string;
    type: "text" | "image" | "file" | "editor";
    value: any;
    options?: string[];
  }>;
}

interface Category {
  id: string;
  _id: string;
  name: string;
  slug: string;
  parentCategory?: string | null;
}

function UpdatePostPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const postId = searchParams.get("id");

  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    category: [],
    status: "draft",
    publishedAt: "",
    faq_items: [],
    additionalFields: {},
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [author, setAuthor] = useState<{ _id?: string; username?: string; email?: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [schemas, setSchemas] = useState<string[]>([""]); // Array of schema strings, start with one empty

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Check if ID is provided, redirect if not
  useEffect(() => {
    if (!postId) {
      router.push("/dashboard/blog");
    }
  }, [postId, router]);

  // Fetch post data on mount
  useEffect(() => {
    if (postId) {
      fetchPostData();
    }
  }, [postId]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchPostData = async () => {
    if (!postId) return;

    try {
      setFetching(true);
      const response = await getPostById(postId);

      if (response.success && response.post) {
        const post = response.post;

        // Format publishedAt for datetime-local input
        let publishedAtFormatted = "";
        if (post.publishedAt) {
          const date = new Date(post.publishedAt);
          publishedAtFormatted = date.toISOString().slice(0, 16);
        }

        // Format category IDs
        const categoryIds = post.category
          ? post.category.map((cat: any) => {
            return cat._id ? cat._id.toString() : cat.toString();
          })
          : [];

        // Extract author information
        if (post.author) {
          setAuthor({
            _id: post.author._id || "",
            username: post.author.username || "",
            email: post.author.email || "",
          });
        }

        setFormData({
          title: post.title || "",
          slug: post.slug || "",
          excerpt: post.excerpt || "",
          content: post.content || "",
          featuredImage: post.featuredImage || "",
          category: categoryIds,
          status: post.status || "draft",
          publishedAt: publishedAtFormatted,
          faq_items: post.faq_items || [],
          additionalFields: post.additionalFields || {},
        });

        // Load schemas from post data (now schema is an array of objects)
        if (post.schema && Array.isArray(post.schema) && post.schema.length > 0) {
          const schemaStrings = post.schema.map((obj: any) => JSON.stringify(obj, null, 2));
          setSchemas(schemaStrings);
        } else {
          setSchemas([""]);
        }
      } else {
        alert("Failed to fetch post data");
        router.push("/dashboard/blog");
      }
    } catch (error: any) {
      console.error("Error fetching post:", error);
      alert(error.message || "Failed to fetch post data");
      router.push("/dashboard/blog");
    } finally {
      setFetching(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await fetch("/api/post/category/get-all-categories", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      } else {
        console.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "title" && autoGenerateSlug) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  // FAQ Items Management - Editable
  const addFAQItem = () => {
    setFormData((prev) => ({
      ...prev,
      faq_items: [...prev.faq_items, { question: "", answer: "" }],
    }));
  };

  const updateFAQItem = (index: number, field: "question" | "answer", value: string) => {
    setFormData((prev) => {
      const updated = [...prev.faq_items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, faq_items: updated };
    });
  };

  const removeFAQItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      faq_items: prev.faq_items.filter((_, i) => i !== index),
    }));
  };

  // Category Management
  const handleCategoryChange = (categoryId: string, isChecked: boolean) => {
    setFormData((prev) => {
      if (isChecked) {
        return {
          ...prev,
          category: [...prev.category, categoryId],
        };
      } else {
        return {
          ...prev,
          category: prev.category.filter((id) => id !== categoryId),
        };
      }
    });
  };

  const removeCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category.filter((id) => id !== categoryId),
    }));
  };

  const isCategorySelected = (categoryId: string) => {
    return formData.category.includes(categoryId);
  };

  // Schema Management Functions
  const addSchemaField = () => {
    setSchemas((prev) => [...prev, ""]);
  };

  const removeSchemaField = (index: number) => {
    setSchemas((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSchemaField = (index: number, value: string) => {
    setSchemas((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // Handle image upload
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file", {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
      return;
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Image size should be less than 10MB", {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
      return;
    }

    setUploadingImage(true);
    const loadingToastId = toast.loading("Uploading image...", {
      closeButton: true,
      className: "!bg-transparent !text-white",
    });

    try {
      const result = await uploadFileToMedia(file);
      setFormData((prev) => ({
        ...prev,
        featuredImage: result.url,
      }));
      toast.dismiss(loadingToastId);
      toast.success("Image uploaded successfully!", {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
    } catch (error: any) {
      toast.dismiss(loadingToastId);
      toast.error(error.message || "Failed to upload image", {
        closeButton: true,
        className: "!bg-transparent !text-white",
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Open media library in new tab
  const openMediaLibrary = () => {
    window.open("/dashboard/media", "_blank");
  };


  // Submit handler
  // const handleUpdate = async (e: FormEvent) => {
  //   e.preventDefault();

  //   if (!postId) {
  //     toast.error("Post ID is missing", { closeButton: true });
  //     return;
  //   }

  //   if (!formData.title || !formData.slug || !formData.content) {
  //     toast.error("Please fill in all required fields (Title, Slug, Content)", { closeButton: true });
  //     return;
  //   }

  //   setLoading(true);
  //   // Store loading toast ID to dismiss it later
  //   const loadingToastId = toast.loading("Updating post...", { closeButton: true });

  //   try {
  //     // Transform extraFields back to additionalFields format
  //     // Preserve existing metadata (label, type) from formData.additionalFields
  //     // For new fields added through AdditionalFields, use field name as label and 'text' as default type
  //     const transformedAdditionalFields: Record<string, {
  //       label: string;
  //       type: string;
  //       value: any;
  //       options?: string[];
  //     }> = {};

  //     // Map extraFields back to the complex structure
  //     Object.entries(extraFields).forEach(([key, value]) => {
  //       const existingField = formData.additionalFields[key];
  //       // Use existing metadata if available, otherwise use defaults for new fields
  //       transformedAdditionalFields[key] = {
  //         label: existingField?.label || key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Convert field-name to Field Name
  //         type: existingField?.type || 'text',
  //         value: value,
  //       };
  //     });

  //     const payload = {
  //       id: postId,
  //       title: formData.title,
  //       slug: formData.slug,
  //       excerpt: formData.excerpt,
  //       content: formData.content,
  //       featuredImage: formData.featuredImage,
  //       category: formData.category,
  //       status: formData.status,
  //       publishedAt: formData.status === "published"
  //         ? (formData.publishedAt || new Date().toISOString())
  //         : null,
  //       faq_items: formData.faq_items.filter(faq => faq.question.trim() && faq.answer.trim()),
  //       additionalFields: transformedAdditionalFields,
  //     };

  //     const data = await updatePost(payload);

  //     // Dismiss loading toast
  //     toast.dismiss(loadingToastId);

  //     if (data.success) {
  //       toast.success("Post updated successfully!", { closeButton: true });
  //       // Small delay to show success message before redirect
  //       setTimeout(() => {
  //         router.push("/dashboard/blog");
  //       }, 1000);
  //     } else {
  //       toast.error(data.message || "Failed to update post", { closeButton: true });
  //     }
  //   } catch (error: any) {
  //     console.error(error);
  //     // Dismiss loading toast
  //     toast.dismiss(loadingToastId);

  //     const errorMessage = error.message || error.errors?.join(", ") || "Something went wrong. Please try again.";
  //     toast.error(errorMessage, { closeButton: true });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // Submit handler
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();

    if (!postId) {
      toast.error("Post ID is missing", { closeButton: true });
      return;
    }

    if (!formData.title || !formData.slug || !formData.content) {
      toast.error("Please fill in all required fields (Title, Slug, Content)", { closeButton: true });
      return;
    }

    setLoading(true);
    // Store loading toast ID to dismiss it later
    const loadingToastId = toast.loading("Updating post...", { closeButton: true });

    try {
      // Parse all schemas from textareas
      const parsedSchemas: Array<Record<string, any>> = [];
      for (const schemaStr of schemas) {
        if (schemaStr.trim()) {
          try {
            const parsed = JSON.parse(schemaStr.trim());
            // If it's an array, add all items; if it's an object, add it
            if (Array.isArray(parsed)) {
              parsedSchemas.push(...parsed);
            } else {
              parsedSchemas.push(parsed);
            }
          } catch (error: any) {
            toast.dismiss(loadingToastId);
            toast.error(`Invalid JSON in schema field: ${error.message}. Please check your JSON syntax.`, {
              closeButton: true,
              duration: 5000,
            });
            setLoading(false);
            return;
          }
        }
      }

      const payload = {
        id: postId,
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        featuredImage: formData.featuredImage,
        category: formData.category,
        status: formData.status,
        publishedAt: formData.status === "published"
          ? (formData.publishedAt || new Date().toISOString())
          : null,
        faq_items: formData.faq_items.filter(faq => faq.question.trim() && faq.answer.trim()),
        additionalFields: formData.additionalFields,
        schema: parsedSchemas.length > 0 ? parsedSchemas : null,
      };

      const data = await updatePost(payload);

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      if (data.success) {
        toast.success("Post updated successfully!", { closeButton: true });
        // Small delay to show success message before redirect
        setTimeout(() => {
          router.push("/dashboard/blog");
        }, 1000);
      } else {
        toast.error(data.message || "Failed to update post", { closeButton: true });
      }
    } catch (error: any) {
      console.error(error);
      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      const errorMessage = error.message || error.errors?.join(", ") || "Something went wrong. Please try again.";
      toast.error(errorMessage, { closeButton: true });
    } finally {
      setLoading(false);
    }
  };

  // Publish handler - marks draft post as published
  const handlePublish = async () => {
    if (!postId) {
      toast.error("Post ID is missing", { closeButton: true });
      return;
    }

    if (!formData.title || !formData.slug || !formData.content) {
      toast.error("Please fill in all required fields (Title, Slug, Content)", { closeButton: true });
      return;
    }

    setLoading(true);
    const loadingToastId = toast.loading("Publishing post...", { closeButton: true });

    try {
      // Parse all schemas from textareas
      const parsedSchemas: Array<Record<string, any>> = [];
      for (const schemaStr of schemas) {
        if (schemaStr.trim()) {
          try {
            const parsed = JSON.parse(schemaStr.trim());
            // If it's an array, add all items; if it's an object, add it
            if (Array.isArray(parsed)) {
              parsedSchemas.push(...parsed);
            } else {
              parsedSchemas.push(parsed);
            }
          } catch (error: any) {
            toast.dismiss(loadingToastId);
            toast.error(`Invalid JSON in schema field: ${error.message}. Please check your JSON syntax.`, {
              closeButton: true,
              duration: 5000,
            });
            setLoading(false);
            return;
          }
        }
      }

      const currentDate = new Date().toISOString();
      const publishedAtFormatted = currentDate.slice(0, 16); // Format for datetime-local input

      const payload = {
        id: postId,
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        featuredImage: formData.featuredImage,
        category: formData.category,
        status: "published" as const,
        publishedAt: currentDate,
        faq_items: formData.faq_items.filter(faq => faq.question.trim() && faq.answer.trim()),
        additionalFields: formData.additionalFields,
        schema: parsedSchemas.length > 0 ? parsedSchemas : null,
      };

      const data = await updatePost(payload);

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      if (data.success) {
        // Update local state to reflect published status
        setFormData((prev) => ({
          ...prev,
          status: "published",
          publishedAt: publishedAtFormatted,
        }));

        toast.success("Post published successfully!", { closeButton: true });
        // Small delay to show success message before redirect
        setTimeout(() => {
          router.push("/dashboard/blog");
        }, 1000);
      } else {
        toast.error(data.message || "Failed to publish post", { closeButton: true });
      }
    } catch (error: any) {
      console.error(error);
      toast.dismiss(loadingToastId);

      const errorMessage = error.message || error.errors?.join(", ") || "Something went wrong. Please try again.";
      toast.error(errorMessage, { closeButton: true });
    } finally {
      setLoading(false);
    }
  };


  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading post data...</div>
      </div>
    );
  }

  if (!postId) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
      <div className="w-full">
        <div className="flex items-center justify-between">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Update Post</h1>
            <p className="text-slate-400">Edit the details of your blog post</p>
          </div>
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:bg-slate-600 disabled:cursor-not-allowed cursor-pointer" onClick={() => router.push("/dashboard/blog/create-blog")}>
            Create New Post
          </Button>
        </div>

        <form className="space-y-6" onSubmit={handleUpdate}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-slate-200">
                Title <span className="text-red-400">*</span>
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter post title"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white"
              />
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
                  Auto-generate from title
                </label>
              </div>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="post-url-slug"
                required
                disabled={autoGenerateSlug}
                className={cn(
                  "w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white",
                  autoGenerateSlug && "opacity-60 cursor-not-allowed"
                )}
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <label htmlFor="excerpt" className="block text-sm font-medium text-slate-200">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="Brief description of the post"
                rows={3}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 resize-y selection:bg-indigo-500 selection:text-white"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label htmlFor="content" className="block text-sm font-medium text-slate-200">
                Content <span className="text-red-400">*</span>
              </label>
              <Editor
                content={formData.content}
                onChange={(html) => {
                  setFormData((prev) => ({
                    ...prev,
                    content: html,
                  }));
                }}
                placeholder="Write your post content here..."
              />
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <label htmlFor="featuredImage" className="block text-sm font-medium text-slate-200">
                Featured Image
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  variant="outline"
                  className="bg-slate-800/60 !text-white border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingImage ? "Uploading..." : "Upload"}
                </Button>
                <Button
                  type="button"
                  onClick={openMediaLibrary}
                  variant="outline"
                  className="bg-slate-800/60 !text-white border-slate-600 hover:bg-slate-700 cursor-pointer"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Media Library
                </Button>
                <Input
                  id="featuredImage"
                  name="featuredImage"
                  type="url"
                  value={formData.featuredImage}
                  onChange={handleChange}
                  placeholder="Enter image URL or upload an image"
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </div>
              <div className="flex items-start justify-center gap-2 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-300">
                  <strong>Warning:</strong> Please ensure you have saved your data to draft before clicking Media Library or Open the Media Library in a new tab, otherwise your content may be lost.
                </p>
              </div>
              {formData.featuredImage && (
                <div className="mt-2">
                  <img
                    src={formData.featuredImage}
                    alt="Featured preview"
                    className="max-w-full h-48 object-cover rounded-lg border border-slate-600"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">Category</label>
              {categoriesLoading ? (
                <div className="text-sm text-slate-400">Loading categories...</div>
              ) : categories.length > 0 ? (
                <>
                  <div className="bg-slate-900/60 border border-slate-600 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {categories.map((cat) => {
                        const categoryId = cat.id || cat._id;
                        const isSelected = isCategorySelected(categoryId);
                        return (
                          <label
                            key={categoryId}
                            className="flex items-center gap-2 text-slate-200 cursor-pointer hover:text-white transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleCategoryChange(categoryId, e.target.checked)}
                              className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="text-sm">{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  {formData.category.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.category.map((categoryId) => {
                        const category = categories.find((cat) => (cat.id || cat._id) === categoryId);
                        return (
                          <span
                            key={categoryId}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30"
                          >
                            {category?.name || categoryId}
                            <button
                              type="button"
                              onClick={() => removeCategory(categoryId)}
                              className="hover:text-red-400 transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-slate-400">No categories available</div>
              )}
            </div>

            {/* Published Date */}
            {formData.status === "published" && (
              <div className="space-y-2">
                <label htmlFor="publishedAt" className="block text-sm font-medium text-slate-200">
                  Published Date
                </label>
                <Input
                  id="publishedAt"
                  name="publishedAt"
                  disabled
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white selection:bg-indigo-500 selection:text-white"
                />
              </div>
            )}

            {/* Author */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Author
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Username</label>
                  <Input
                    id="author-username"
                    value={author?.username || ""}
                    disabled
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white opacity-60 cursor-not-allowed selection:bg-indigo-500 selection:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <Input
                    id="author-email"
                    value={author?.email || ""}
                    disabled
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white opacity-60 cursor-not-allowed selection:bg-indigo-500 selection:text-white"
                  />
                </div>
              </div>
            </div>

            {/* FAQ Items Section - Editable */}
            <div className="pt-6 border-t border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-200">FAQ Items</h3>
                <Button
                  type="button"
                  onClick={addFAQItem}
                  variant="outline"
                  size="sm"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-500"
                >
                  + Add FAQ
                </Button>
              </div>

              {formData.faq_items.length > 0 ? (
                <div className="space-y-4">
                  {formData.faq_items.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/30 p-4 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-300">FAQ #{index + 1}</span>
                        <Button
                          type="button"
                          onClick={() => removeFAQItem(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Question</label>
                          <Input
                            type="text"
                            value={faq.question}
                            onChange={(e) => updateFAQItem(index, "question", e.target.value)}
                            placeholder="Enter FAQ question"
                            className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400 selection:bg-indigo-500 selection:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Answer</label>
                          <textarea
                            value={faq.answer}
                            onChange={(e) => updateFAQItem(index, "answer", e.target.value)}
                            placeholder="Enter FAQ answer (HTML supported)"
                            rows={4}
                            className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 resize-y selection:bg-indigo-500 selection:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-lg">
                  <p className="text-sm">No FAQ items added yet</p>
                  <p className="text-xs mt-1">Click "Add FAQ" to create FAQ items</p>
                </div>
              )}
            </div>

            {/* Additional Fields Section */}
            <AdditionalFieldsBlog
              additionalFields={formData.additionalFields}
              setAdditionalFields={(fields) => {
                setFormData((prev) => ({
                  ...prev,
                  additionalFields: typeof fields === 'function' ? fields(prev.additionalFields) : fields,
                }));
              }}
              isEditing={true}
            />

            {/* Schema Section */}
            <div className="pt-6 border-t border-slate-700">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200">
                      Schema (JSON-LD)
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                    Add multiple JSON-LD schemas. Each schema will be stored directly in the database array.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addSchemaField}
                    variant="outline"
                    size="sm"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-500"
                  >
                    + Add More Schema
                  </Button>
                </div>

                <div className="space-y-4">
                  {schemas.map((schema, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/30 p-4 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-300">
                          Schema #{index + 1}
                        </span>
                        {schemas.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeSchemaField(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <textarea
                        value={schema}
                        onChange={(e) => updateSchemaField(index, e.target.value)}
                        placeholder={`Paste your JSON-LD schema here, e.g.:
{"@type": "Article", "headline": "..."}
or
{"@type": "BreadcrumbList", "itemListElement": [...]}
or
{"@type": "FAQPage", "mainEntity": [...]}`}
                        className="w-full min-h-[200px] p-4 rounded-lg border border-slate-600 bg-slate-900/60 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                        style={{ fontFamily: 'monospace', lineHeight: '1.5' }}
                      />
                      <p className="text-xs text-slate-400">
                        Supports any JSON-LD schema format (Article, BlogPosting, BreadcrumbList, FAQPage, etc.)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/blog")}
              className="bg-slate-800/60 text-white border-slate-600 hover:bg-slate-700"
            >
              Cancel
            </Button>

            {/* Publish Button - Only show for draft posts */}
            {formData.status === "draft" && (
              <Button
                type="button"
                onClick={handlePublish}
                disabled={loading || !formData.title || !formData.slug || !formData.content}
                className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {loading ? "Publishing..." : "Publish"}
              </Button>
            )}

            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.slug || !formData.content}
              className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Loading fallback component
function UpdatePostPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  );
}

// Export the wrapped component with Suspense
export default function UpdatePostPage() {
  return (
    <Suspense fallback={<UpdatePostPageLoading />}>
      <UpdatePostPageContent />
    </Suspense>
  );
}