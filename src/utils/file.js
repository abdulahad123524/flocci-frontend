export const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const readFilePreview = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    if (
      file.type.startsWith("text/") ||
      /\.(txt|json|md|csv)$/i.test(file.name)
    ) {
      reader.onload = () =>
        resolve({ text: String(reader.result), dataUrl: null });
      reader.readAsText(file);
    } else if (file.type.startsWith("image/")) {
      reader.onload = () =>
        resolve({ text: null, dataUrl: String(reader.result) });
      reader.readAsDataURL(file);
    } else {
      resolve({ text: null, dataUrl: null });
    }
  });

export const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bytes = new Uint8Array(reader.result);
        const chunkSize = 0x8000;
        const encodedChunks = [];

        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
          const chunk = bytes.subarray(offset, offset + chunkSize);
          let binary = "";

          for (const byte of chunk) {
            binary += String.fromCharCode(byte);
          }

          encodedChunks.push(btoa(binary));
        }

        resolve(encodedChunks.join(""));
      } catch {
        reject(new Error("This file is too large to prepare for upload."));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
