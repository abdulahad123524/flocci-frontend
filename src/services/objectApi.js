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
export const getObjectVersions = async (bucketName, key) => {
  const params = new URLSearchParams({
    bucketName,
    key,
  });

  const response = await fetch(`/api/object-versions?${params.toString()}`);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Could not load object versions");
  }

  return data;
};
