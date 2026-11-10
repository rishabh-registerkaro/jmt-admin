export async function uploadFileToMedia(file: File): Promise<{ url: string; publicId: string; resource_type: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/media", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }
  return {
    url: data.url,
    publicId: data.publicId,
    resource_type: data.resource_type,
  };
}
export async function uploadMediaAsset(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/media", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }
  return data;
}

export async function deleteFileFromMedia(
  public_id: string,
  resource_type: string
): Promise<void> {
  try {
    const res = await fetch("/api/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id, resource_type }),
    });
    if (!res.ok) {
      console.error("Failed to delete file");
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}