export const getObject = async (bucketName, key) => {
  const params = new URLSearchParams({ bucket: bucketName });
  const response = await fetch(
    `/api/objects/${encodeURIComponent(key)}?${params.toString()}`,
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Could not load file");
  }
  return data;
};
export const handleViewVersions = async (bucketName, key) => {
  const result = await getObjectVersions(bucketName, key);
  setObjectVersions(result.versions);
  setShowVersions(true);
};
