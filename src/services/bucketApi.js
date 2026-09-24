const readResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || fallbackMessage);
  return data;
};

export const listBuckets = async () => {
  const response = await fetch("/api/buckets");
  return readResponse(response, "Could not load buckets");
};

export const getBucketVersioning = async (bucketName) => {
  const response = await fetch(
    `/api/bucket-versioning?bucketName=${encodeURIComponent(bucketName)}`,
  );
  const data = await readResponse(response, "Could not load versioning");
  return {
    versioning: data.versioning || "Off",
    mfaDelete: data.mfaDelete || "Disabled",
  };
};

export const updateBucketVersioning = async (bucketName, status) => {
  const response = await fetch("/api/bucket-versioning", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketName, status }),
  });
  return readResponse(response, "Could not update versioning");
};

export const getBucketTags = async (bucketName) => {
  const response = await fetch(
    `/api/bucket-tags?bucketName=${encodeURIComponent(bucketName)}`,
  );
  return readResponse(response, "Could not load tags");
};

export const updateBucketTags = async (bucketName, tags) => {
  const response = await fetch("/api/bucket-tags", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketName, tags }),
  });
  return readResponse(response, "Could not save tags");
};

export const getBucketEncryption = async (bucketName) => {
  const response = await fetch(
    `/api/get-bucket-encryption?bucketName=${encodeURIComponent(bucketName)}`,
  );
  return readResponse(response, "Could not load encryption");
};

export const enableBucketEncryption = async (bucketName) => {
  const response = await fetch("/api/encrypt-bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketName, algorithm: "AES256" }),
  });
  return readResponse(response, "Could not enable encryption");
};

export const deleteBucketEncryption = async (bucketName) => {
  const response = await fetch("/api/delete-bucket-encryption", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketName }),
  });
  return readResponse(response, "Could not remove encryption");
};

export const getBucketCors = async (bucketName) => {
  const response = await fetch(
    `/api/bucket-cors?bucketName=${encodeURIComponent(bucketName)}`,
  );
  return readResponse(response, "Could not load CORS");
};

export const updateBucketCors = async (payload) => {
  const response = await fetch("/api/bucket-cors", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readResponse(response, "Could not save CORS");
};

export const deleteBucketCors = async (bucketName) => {
  const response = await fetch("/api/bucket-cors", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketName }),
  });
  return readResponse(response, "Could not remove CORS");
};

export const getBucketBlockAccess = async (bucketName) => {
  const response = await fetch(
    `/api/bucket-block-access?bucketName=${encodeURIComponent(bucketName)}`,
  );
  return readResponse(response, "Could not load block access");
};

export const updateBucketBlockAccess = async (bucketName, policy) => {
  const response = await fetch("/api/bucket-block-access", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketName, policy }),
  });
  return readResponse(response, "Could not save block access");
};

export const deleteBucketBlockAccess = async (bucketName) => {
  const response = await fetch("/api/bucket-block-access", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketName }),
  });
  return readResponse(response, "Could not remove block access");
};

export const createBucket = async (bucketName) => {
  const response = await fetch("/api/create-bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketName }),
  });
  return readResponse(response, "Could not create bucket");
};

export const copyBucket = async (sourceBucketName, targetBucketName) => {
  const response = await fetch("/api/copy-bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceBucketName, targetBucketName }),
  });
  return readResponse(response, "Could not copy bucket");
};

export const listObjects = async (bucketName) => {
  const response = await fetch(
    `/api/objects?bucket=${encodeURIComponent(bucketName)}`,
  );
  const data = await readResponse(response, "Could not list files");
  return (data.objects || []).map((object) => ({
    key: object.key,
    size: object.size,
    type: "application/octet-stream",
  }));
};

export const uploadObject = async (payload) => {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readResponse(response, "Upload failed");
};

export const uploadMultipartObject = async (payload) => {
  const response = await fetch("/api/multipart-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readResponse(response, "Multipart upload failed");
};

export const downloadObject = async (bucketName, key) => {
  const response = await fetch(
    `/api/download-file?key=${encodeURIComponent(key)}&bucketName=${encodeURIComponent(bucketName)}`,
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Could not download file");
  }
  return response.blob();
};

export const deleteObject = async (bucketName, key) => {
  const response = await fetch("/api/delete-bucket-object", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketName, key }),
  });
  return readResponse(response, "Could not delete file");
};

export const deleteBucket = async (bucketName) => {
  const response = await fetch("/api/delete-bucket", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketName }),
  });
  return readResponse(response, "Could not delete bucket");
};

export const getBucketNotification = async (bucketName) => {
  const response = await fetch(
    `/api/bucketnotification?bucketName=${encodeURIComponent(bucketName)}`,
  );
  const data = await readResponse(response, "Could not load notification");
  return data.result || {};
};

export const updateBucketNotification = async (payload) => {
  const response = await fetch("/api/bucketnotification", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readResponse(response, "Could not save notification");
  return data.result || {};
};

export const deleteBucketNotification = async (bucketName) => {
  const response = await fetch("/api/bucketnotification", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucketName }),
  });
  const data = await readResponse(response, "Could not remove notification");
  return data.result || {};
};

export const configureBucketNotification = async (payload) => {
  const response = await fetch("/api/bucketnotification/configure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readResponse(response, "Could not configure notification");
  return data.result || {};
};
