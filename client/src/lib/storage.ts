// Client-side storage helper for file uploads
// This calls the server-side storage API

export async function storagePut(
  key: string,
  data: BlobPart,
  contentType?: string
): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  const blob = new Blob([data], { type: contentType || "application/octet-stream" });
  formData.append("file", blob);
  formData.append("key", key);
  if (contentType) {
    formData.append("contentType", contentType);
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
}
