import { ChangeEvent, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { deleteFileFromMedia, uploadFileToMedia } from "@/app/lib/utils/media";


interface AdditionalFieldsProps {
  extraFields: Record<string, string>;
  setExtraFields: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isEditing?: boolean;
}

// Internal metadata for managing fields
interface FieldMetadata {
  label: string;
  type: "text" | "image" | "file";
  publicId?: string;
  resource_type?:string
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image Upload" },
  { value: "file", label: "File Upload" },
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

const AdditionalFields = ({
  extraFields,
  setExtraFields,
  isEditing,
}: AdditionalFieldsProps) => {
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(
    new Set()
  );

  const [fieldMetadata, setFieldMetadata] = useState<
    Record<string, FieldMetadata>
  >({});

  const [newField, setNewField] = useState<{
    label: string;
    type: "text" | "image" | "file";
    value: string | File | null;
  }>({
    label: "",
    type: "text",
    value: "",
  });

  const handleNewFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "type") {
      setNewField((prev) => ({
        ...prev,
        type: value as "text" | "image" | "file",
        value: value === "text" ? "" : null,
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

    if (extraFields[fieldName]) {
      alert("A field with this name already exists.");
      return;
    }

    if (newField.type !== "text" && newField.value instanceof File) {
      const error = validateFile(newField.value, newField.type);
      if (error) {
        alert(error);
        return;
      }
    }

    if (newField.type === "text") {
      setExtraFields((prev) => ({
        ...prev,
        [fieldName]: String(newField.value || ""),
      }));

      setFieldMetadata((prev) => ({
        ...prev,
        [fieldName]: {
          label: newField.label.trim(),
          type: "text",
        },
      }));
    } else if (newField.value instanceof File) {
      try {
        setUploadingFields((prev) => new Set(prev).add(fieldName));

        const { url, publicId } = await uploadFileToMedia(newField.value);

        setExtraFields((prev) => ({
          ...prev,
          [fieldName]: url,
        }));

        setFieldMetadata((prev) => ({
          ...prev,
          [fieldName]: {
            label: newField.label.trim(),
            type: newField.type,
            publicId,
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
    const metadata = fieldMetadata[fieldName];

    // Show confirmation
    if (!confirm(`Are you sure you want to remove "${metadata?.label}"?`)) {
      return;
    }
    if (metadata?.publicId) {
      await deleteFileFromMedia(metadata.publicId, metadata.resource_type|| "image");
    }

    setExtraFields((prev) => {
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

  const updateCustomFieldValue = (
    fieldName: string,
    value: string,
    publicId?: string
  ) => {
    setExtraFields((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (publicId !== undefined) {
      setFieldMetadata((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          publicId,
        },
      }));
    }
  };

  const handleFileUpload = async (fieldName: string, file: File) => {
    const metadata = fieldMetadata[fieldName];

    // Validate file
    const error = validateFile(file, metadata.type as "image" | "file");
    if (error) {
      alert(error);
      return;
    }

    try {
      setUploadingFields((prev) => new Set(prev).add(fieldName));

      // Delete old file if exists
      if (metadata?.publicId) {
        await deleteFileFromMedia(metadata.publicId , metadata.resource_type || "image");
      }

      // Upload new file
      const { url, publicId } = await uploadFileToMedia(file);

      updateCustomFieldValue(fieldName, url, publicId);
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `Failed to upload file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      updateCustomFieldValue(fieldName, "");
    } finally {
      setUploadingFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }
  };

  const handleChangeFile = async (fieldName: string) => {
    const metadata = fieldMetadata[fieldName];

    if (metadata?.publicId) {
      await deleteFileFromMedia(metadata.publicId , metadata.resource_type || "image");
    }

    updateCustomFieldValue(fieldName, "");
  };

  const renderFieldInput = (fieldName: string, fieldValue: string) => {
    const isUploading = uploadingFields.has(fieldName);
    const metadata = fieldMetadata[fieldName];

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      await handleFileUpload(fieldName, file);
    };

    if (metadata?.type === "text") {
      return (
        <p className="text-slate-300 text-sm mt-2 whitespace-pre-line">
          {fieldValue}
        </p>
      );
    }

    if (metadata?.type === "image") {
      return (
        <div className="space-y-2">
          {isUploading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
              <span>Uploading to S3...</span>
            </div>
          ) : !fieldValue ? (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-slate-300"
              />
              <p className="text-xs text-slate-500 mt-1">
                Max size: {MAX_FILE_SIZE / 1024 / 1024}MB | Formats: JPEG, PNG,
                WebP, GIF
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <img
                  src={fieldValue}
                  alt="preview"
                  className="h-32 w-32 object-cover rounded-md border border-slate-600"
                />
                <p className="text-xs text-emerald-400">
                  ✓ Uploaded to S3
                </p>
                <p className="text-xs text-slate-400 break-all font-mono">
                  {fieldValue}
                </p>
              </div>

              <button
                type="button"
                className="text-blue-400 text-xs underline hover:text-blue-300"
                onClick={() => handleChangeFile(fieldName)}
              >
                Change Image
              </button>
            </>
          )}
        </div>
      );
    }

    if (metadata?.type === "file") {
      return (
        <div className="space-y-2">
          {isUploading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
              <span>Uploading to S3...</span>
            </div>
          ) : !fieldValue ? (
            <div>
              <input
                type="file"
                onChange={handleFileChange}
                className="text-slate-300"
              />
              <p className="text-xs text-slate-500 mt-1">
                Max size: {MAX_FILE_SIZE / 1024 / 1024}MB | Formats: PDF, DOC,
                DOCX, XLS, XLSX, Images
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-xs text-emerald-400">
                  ✓ Uploaded to S3
                </p>
                <a
                  href={fieldValue}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline break-all block font-mono"
                >
                  {fieldValue}
                </a>
              </div>
              <button
                type="button"
                className="text-blue-400 text-xs underline hover:text-blue-300"
                onClick={() => handleChangeFile(fieldName)}
              >
                Change File
              </button>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <div className="pt-6 border-t border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">
            Additional Fields
          </h3>

          <Button
            type="button"
            onClick={() => setShowAddFieldForm(!showAddFieldForm)}
            variant="outline"
            className="bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-500"
          >
            + Add Field
          </Button>
        </div>

        {/* {
          isEditing && (

          )
        } */}
        {isEditing && (
          <div className="space-y-4 mt-4">
            {Object.entries(extraFields).map(([fieldName, fieldValue]) => {
              const metadata = fieldMetadata[fieldName];

              // Auto-detect type when metadata is missing (first time load)
              const detectedType = (() => {
                if (metadata?.type) return metadata.type;

                if (typeof fieldValue !== "string") return "text";
                if (!fieldValue.startsWith("http")) return "text";

                const ext = fieldValue.split(".").pop()?.toLowerCase();
                if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext || ""))
                  return "image";
                return "file";
              })();

              // If metadata missing → rebuild it
              if (!metadata) {
                const derivedMetadata: FieldMetadata = {
                  label: fieldName,
                  type: detectedType,
                  publicId: (() => {
                    try {
                      const part = fieldValue.split("/upload/")[1];
                      if (!part) return undefined;

                      const segments = part.split("/");
                      const fileWithExt = segments.slice(1).join("/");
                      return fileWithExt.replace(/\.[a-zA-Z0-9]+$/, "");
                    } catch {
                      return undefined;
                    }
                  })(),
                };

                // Save to metadata
                fieldMetadata[fieldName] = derivedMetadata;
              }

              return (
                <div
                  key={fieldName}
                  className="bg-slate-800/40 p-4 rounded-lg border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">
                        {metadata?.label || fieldName}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-1">
                        {fieldName}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {detectedType.toUpperCase()}
                      </span>
                    </div>

                    <Button
                      type="button"
                      onClick={() => removeCustomField(fieldName)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                    >
                      Remove
                    </Button>
                  </div>

                  {/* TEXT FIELD */}
                  {detectedType === "text" && (
                    <Input
                      value={fieldValue}
                      onChange={(e) =>
                        updateCustomFieldValue(fieldName, e.target.value)
                      }
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  )}

                  {/* IMAGE FIELD */}
                  {detectedType === "image" && (
                    <div className="space-y-2">
                      {fieldValue ? (
                        <>
                          <img
                            src={fieldValue}
                            className="h-32 w-32 object-cover rounded-md border border-slate-600"
                          />

                          <button
                            type="button"
                            className="text-blue-400 text-xs underline"
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
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files &&
                            handleFileUpload(fieldName, e.target.files[0])
                          }
                        />
                      )}

                      {uploadingFields.has(fieldName) && (
                        <p className="text-xs text-slate-400">Uploading...</p>
                      )}
                    </div>
                  )}

                  {/* FILE FIELD */}
                  {detectedType === "file" && (
                    <div className="space-y-2">
                      <a
                        href={fieldValue}
                        target="_blank"
                        className="text-blue-400 underline break-all block"
                      >
                        {fieldValue}
                      </a>

                      <button
                        type="button"
                        className="text-blue-400 text-xs underline"
                        onClick={() =>
                          document.getElementById(`file-${fieldName}`)?.click()
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

                      {uploadingFields.has(fieldName) && (
                        <p className="text-xs text-slate-400">Uploading...</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showAddFieldForm && (
          <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700 space-y-4 mb-4">
            <h4 className="text-sm font-semibold text-slate-200">
              Add New Field
            </h4>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Field Label *
              </label>
              <Input
                type="text"
                name="label"
                value={newField.label}
                onChange={handleNewFieldChange}
                placeholder="e.g., SEO Title, Hero Image"
                className="bg-slate-900/60 text-white border-slate-600"
              />

              {newField.label && (
                <p className="text-xs text-slate-500 mt-1">
                  Field name:{" "}
                  <span className="font-mono text-slate-400">
                    {generateFieldName(newField.label)}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Input Type *
              </label>
              <select
                name="type"
                value={newField.type}
                onChange={handleNewFieldChange}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white"
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
                  className="w-full bg-slate-900/60 text-white border-slate-600"
                />
              ) : (
                <div>
                  <input
                    type="file"
                    accept={newField.type === "image" ? "image/*" : "*"}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewField((prev) => ({ ...prev, value: file }));
                    }}
                    className="text-slate-300"
                  />
                  {newField.value instanceof File && (
                    <div className="mt-2 p-2 bg-slate-900/60 rounded border border-slate-600">
                      <p className="text-xs text-slate-300">
                        📎 Selected:{" "}
                        <span className="font-semibold">
                          {newField.value.name}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Size: {(newField.value.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                    <span>⚡</span>
                    File will be uploaded to S3 when you click "Add
                    Field"
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={addCustomField}
                disabled={uploadingFields.size > 0}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="bg-slate-700 text-white border-slate-600"
                disabled={uploadingFields.size > 0}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {!isEditing && Object.keys(extraFields).length > 0 && (
        <div className="space-y-4 mt-6">
          {Object.entries(extraFields).map(([fieldName, fieldValue]) => {
            const metadata = fieldMetadata[fieldName];

            return (
              <div
                key={fieldName}
                className="bg-slate-800/30 p-4 rounded-lg border border-slate-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">
                      {metadata?.label || fieldName}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      {fieldName}
                    </p>

                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {
                        FIELD_TYPES.find((t) => t.value === metadata?.type)
                          ?.label
                      }
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={() => removeCustomField(fieldName)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                    disabled={uploadingFields.has(fieldName)}
                  >
                    Remove
                  </Button>
                </div>

                {renderFieldInput(fieldName, fieldValue)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdditionalFields;
