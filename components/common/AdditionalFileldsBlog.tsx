import { ChangeEvent, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

import Editor from "./Editor";
import { deleteFileFromMedia, uploadFileToMedia } from "@/app/lib/utils/media";

interface AdditionalFieldData {
  label: string;
  type: "text" | "image" | "file" | "editor";
  value: string;
}

interface AdditionalFieldsBlogProps {
  additionalFields: Record<string, AdditionalFieldData>;
  setAdditionalFields: React.Dispatch<
    React.SetStateAction<Record<string, AdditionalFieldData>>
  >;
  isEditing?: boolean;
}

// Internal metadata for managing file uploads
interface FieldMetadata {
  publicId?: string;
  resource_type?: string;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image Upload" },
  { value: "file", label: "File Upload" },
  { value: "editor", label: "Rich Text Editor" },
];

// Constants for file validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ...ALLOWED_IMAGE_TYPES,
];

const AdditionalFieldsBlog = ({
  additionalFields,
  setAdditionalFields,
}: AdditionalFieldsBlogProps) => {
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(
    new Set()
  );

  const [fieldMetadata, setFieldMetadata] = useState<
    Record<string, FieldMetadata>
  >({});

  const [newField, setNewField] = useState<{
    label: string;
    type: "text" | "image" | "file" | "editor";
    value: string | File | null;
  }>({
    label: "",
    type: "text",
    value: "",
  });

  // Initialize metadata from existing fields
  useEffect(() => {
    const metadata: Record<string, FieldMetadata> = {};
    Object.entries(additionalFields).forEach(([fieldName, fieldData]) => {
      if (fieldData.type === "image" || fieldData.type === "file") {
        const value = fieldData.value;
        if (typeof value === "string" && value.includes("amazonaws.com")) {
          try {
            const part = value.split("/upload/")[1];
            if (part) {
              const segments = part.split("/");
              const fileWithExt = segments.slice(1).join("/");
              const publicId = fileWithExt.replace(/\.[a-zA-Z0-9]+$/, "");
              metadata[fieldName] = {
                publicId,
                resource_type: fieldData.type === "image" ? "image" : "raw",
              };
            }
          } catch {
            // Ignore errors
          }
        }
      }
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount initialisation from the initial additionalFields; kept as an effect to preserve timing
    setFieldMetadata(metadata);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "type") {
      setNewField((prev) => ({
        ...prev,
        type: value as "text" | "image" | "file" | "editor",
        value: value === "text" || value === "editor" ? "" : null,
      }));
      return;
    }

    setNewField((prev) => ({ ...prev, [name]: value }));
  };

  const generateFieldName = (label: string): string => {
    return label
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const validateFile = (file: File, type: "image" | "file"): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB`;
    }
    const allowedTypes =
      type === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed types: ${allowedTypes
        .map((t) => t.split("/")[1].toUpperCase())
        .join(", ")}`;
    }

    return null;
  };

  const addCustomField = async () => {
    if (!newField.label.trim()) {
      alert("Please enter a field label");
      return;
    }

    const fieldName = generateFieldName(newField.label);

    if (additionalFields[fieldName]) {
      alert("A field with this name already exists.");
      return;
    }

    if (newField.type === "text" || newField.type === "editor") {
      setAdditionalFields((prev) => ({
        ...prev,
        [fieldName]: {
          label: newField.label.trim(),
          type: newField.type,
          value: String(newField.value || ""),
        },
      }));
    } else if (newField.value instanceof File) {
      const error = validateFile(newField.value, newField.type);
      if (error) {
        alert(error);
        return;
      }

      try {
        setUploadingFields((prev) => new Set(prev).add(fieldName));

        const { url, publicId } = await uploadFileToMedia(newField.value);

        setAdditionalFields((prev) => ({
          ...prev,
          [fieldName]: {
            label: newField.label.trim(),
            type: newField.type,
            value: url,
          },
        }));

        setFieldMetadata((prev) => ({
          ...prev,
          [fieldName]: {
            publicId,
            resource_type: newField.type === "image" ? "image" : "raw",
          },
        }));

        setUploadingFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fieldName);
          return newSet;
        });

        setNewField({ label: "", type: "text", value: "" });
        setShowAddFieldForm(false);
        return;
      } catch (error) {
        console.error("Upload error:", error);
        alert(
          `Failed to upload file: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setUploadingFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fieldName);
          return newSet;
        });
        return;
      }
    }

    setNewField({ label: "", type: "text", value: "" });
    setShowAddFieldForm(false);
  };

  const removeCustomField = async (fieldName: string) => {
    const field = additionalFields[fieldName];

    // Show confirmation
    if (!confirm(`Are you sure you want to remove "${field?.label}"?`)) {
      return;
    }

    const metadata = fieldMetadata[fieldName];
    if (metadata?.publicId) {
      await deleteFileFromMedia(
        metadata.publicId,
        metadata.resource_type || "image"
      );
    }

    setAdditionalFields((prev) => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });

    setFieldMetadata((prev) => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const updateFieldValue = (
    fieldName: string,
    value: string,
    publicId?: string,
    resource_type?: string
  ) => {
    setAdditionalFields((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
      },
    }));

    if (publicId !== undefined) {
      setFieldMetadata((prev) => ({
        ...prev,
        [fieldName]: {
          publicId,
          resource_type: resource_type || "image",
        },
      }));
    }
  };

  const handleFileUpload = async (fieldName: string, file: File) => {
    const field = additionalFields[fieldName];

    // Validate file
    const error = validateFile(file, field.type as "image" | "file");
    if (error) {
      alert(error);
      return;
    }

    try {
      setUploadingFields((prev) => new Set(prev).add(fieldName));

      // Delete old file if exists
      const metadata = fieldMetadata[fieldName];
      if (metadata?.publicId) {
        await deleteFileFromMedia(
          metadata.publicId,
          metadata.resource_type || "image"
        );
      }

      // Upload new file
      const { url, publicId } = await uploadFileToMedia(file);

      updateFieldValue(
        fieldName,
        url,
        publicId,
        field.type === "image" ? "image" : "raw"
      );
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `Failed to upload file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      updateFieldValue(fieldName, "");
    } finally {
      setUploadingFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }
  };

  return (
    <div>
      <div className="pt-6 border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Additional Fields
          </h3>

          <Button
            type="button"
            onClick={() => setShowAddFieldForm(!showAddFieldForm)}
            variant="outline"
          >
            + Add Field
          </Button>
        </div>

        {/* Add Field Form */}
        {showAddFieldForm && (
          <div className="bg-muted/40 p-4 rounded-lg border border-border space-y-4 mb-4">
            <h4 className="text-sm font-semibold text-foreground">
              Add New Field
            </h4>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Field Label *
              </label>
              <Input
                type="text"
                name="label"
                value={newField.label}
                onChange={handleNewFieldChange}
                placeholder="e.g., Hero Section, SEO Title"
              />

              {newField.label && (
                <p className="text-xs text-muted-foreground mt-1">
                  Field name:{" "}
                  <span className="font-mono text-muted-foreground">
                    {generateFieldName(newField.label)}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Input Type *
              </label>
              <select
                name="type"
                value={newField.type}
                onChange={handleNewFieldChange}
                className="w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              {newField.type === "text" ? (
                <Input
                  type="text"
                  value={
                    typeof newField.value === "string" ? newField.value : ""
                  }
                  onChange={(e) =>
                    setNewField((prev) => ({ ...prev, value: e.target.value }))
                  }
                  placeholder="Enter text"
                  className="w-full"
                />
              ) : newField.type === "editor" ? (
                <div className="bg-muted/40 rounded-lg border border-border p-2">
                  <Editor
                    content={
                      typeof newField.value === "string" ? newField.value : ""
                    }
                    onChange={(html) =>
                      setNewField((prev) => ({ ...prev, value: html }))
                    }
                    placeholder="Enter rich text content..."
                  />
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept={newField.type === "image" ? "image/*" : "*"}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewField((prev) => ({ ...prev, value: file }));
                    }}
                    className="text-foreground-light max-w-full"
                  />
                  {newField.value instanceof File && (
                    <div className="mt-2 p-2 bg-muted/40 rounded border border-border">
                      <p className="text-xs text-foreground-light">
                        📎 Selected:{" "}
                        <span className="font-semibold">
                          {newField.value.name}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Size: {(newField.value.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-warning mt-2 flex items-center gap-1">
                    <span>⚡</span>
                    File will be uploaded when you click &quot;Add
                    Field&quot;
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={addCustomField}
                disabled={uploadingFields.size > 0}
                className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingFields.size > 0 ? "Uploading..." : "Add Field"}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setShowAddFieldForm(false);
                  setNewField({ label: "", type: "text", value: "" });
                }}
                variant="outline"
                disabled={uploadingFields.size > 0}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Existing Fields */}
        {Object.keys(additionalFields).length > 0 && (
          <div className="space-y-4 mt-4">
            {Object.entries(additionalFields).map(([fieldName, fieldData]) => {
              const isUploading = uploadingFields.has(fieldName);

              return (
                <div
                  key={fieldName}
                  className="bg-muted/40 p-4 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground">
                        {fieldData.label}
                      </h4>
                      <p className="text-xs text-muted-foreground font-mono mt-1 break-all">
                        {fieldName}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-brand/10 text-brand-link border border-brand/30">
                        {fieldData.type.toUpperCase()}
                      </span>
                    </div>

                    <Button
                      type="button"
                      onClick={() => removeCustomField(fieldName)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>

                  {/* TEXT FIELD */}
                  {fieldData.type === "text" && (
                    <Input
                      value={fieldData.value || ""}
                      onChange={(e) =>
                        updateFieldValue(fieldName, e.target.value)
                      }
                      className="bg-muted/40 border-border text-foreground"
                      placeholder="Enter text value"
                    />
                  )}

                  {/* EDITOR FIELD */}
                  {fieldData.type === "editor" && (
                    <div className="bg-muted/40 rounded-lg border border-border p-2">
                      <Editor
                        content={fieldData.value || ""}
                        onChange={(html) => updateFieldValue(fieldName, html)}
                        placeholder="Enter rich text content..."
                      />
                    </div>
                  )}

                  {/* IMAGE FIELD */}
                  {fieldData.type === "image" && (
                    <div className="space-y-2">
                      {isUploading ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : fieldData.value ? (
                        <>
                          <img
                            src={fieldData.value}
                            className="h-32 w-32 object-cover rounded-md border border-border"
                            alt={fieldData.label}
                          />

                          <button
                            type="button"
                            className="text-brand-link text-xs underline"
                            onClick={() =>
                              document
                                .getElementById(`file-${fieldName}`)
                                ?.click()
                            }
                          >
                            Change Image
                          </button>

                          <input
                            id={`file-${fieldName}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              e.target.files &&
                              handleFileUpload(fieldName, e.target.files[0])
                            }
                          />
                        </>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              e.target.files &&
                              handleFileUpload(fieldName, e.target.files[0])
                            }
                            className="text-foreground-light max-w-full"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Max size: {MAX_FILE_SIZE / 1024 / 1024}MB |
                            Formats: JPEG, PNG, WebP, GIF
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FILE FIELD */}
                  {fieldData.type === "file" && (
                    <div className="space-y-2">
                      {isUploading ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : fieldData.value ? (
                        <>
                          <div className="space-y-1">
                            <p className="text-xs text-brand-link">
                              ✓ Uploaded
                            </p>
                            <a
                              href={fieldData.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-link hover:underline underline break-all block font-mono"
                            >
                              {fieldData.value}
                            </a>
                          </div>
                          <button
                            type="button"
                            className="text-brand-link text-xs underline"
                            onClick={() =>
                              document
                                .getElementById(`file-${fieldName}`)
                                ?.click()
                            }
                          >
                            Replace File
                          </button>

                          <input
                            id={`file-${fieldName}`}
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              e.target.files &&
                              handleFileUpload(fieldName, e.target.files[0])
                            }
                          />
                        </>
                      ) : (
                        <div>
                          <input
                            type="file"
                            onChange={(e) =>
                              e.target.files &&
                              handleFileUpload(fieldName, e.target.files[0])
                            }
                            className="text-foreground-light max-w-full"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Max size: {MAX_FILE_SIZE / 1024 / 1024}MB |
                            Formats: PDF, DOC, DOCX, XLS, XLSX, Images
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {Object.keys(additionalFields).length === 0 && !showAddFieldForm && (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            <p className="text-sm">No additional fields added yet</p>
            <p className="text-xs mt-1">
              Click &quot;Add Field&quot; to create custom fields
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdditionalFieldsBlog;