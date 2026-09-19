import { useEffect, useMemo, useRef, useState } from "react";
import { getObject } from "../services/objectApi";
import {
  copyBucket as copyBucketRequest,
  createBucket as createBucketRequest,
  deleteBucket as deleteBucketRequest,
  deleteBucketBlockAccess,
  deleteBucketCors,
  deleteBucketEncryption,
  deleteObject as deleteObjectRequest,
  downloadObject,
  enableBucketEncryption as enableBucketEncryptionRequest,
  getBucketBlockAccess,
  getBucketCors,
  getBucketEncryption,
  getBucketTags,
  getBucketVersioning,
  listBuckets,
  listObjects,
  updateBucketBlockAccess,
  updateBucketCors,
  updateBucketTags,
  updateBucketVersioning,
  uploadObject,
} from "../services/bucketApi";
import { readFileAsBase64, readFilePreview } from "../utils/file";

export const BLOCK_FLAGS = [
  { key: "BlockPublicAcls", label: "Block public ACLs", hint: "Reject new public ACLs on this bay" },
  { key: "IgnorePublicAcls", label: "Ignore public ACLs", hint: "Ignore any public ACLs already on objects" },
  { key: "BlockPublicPolicy", label: "Block public policy", hint: "Reject a bucket policy that grants public access" },
  { key: "RestrictPublicBuckets", label: "Restrict public buckets", hint: "Limit public policy access to this account only" },
];

export const EMPTY_BLOCK_POLICY = {
  BlockPublicAcls: false,
  IgnorePublicAcls: false,
  BlockPublicPolicy: false,
  RestrictPublicBuckets: false,
};

const isBucketName = (name) =>
  /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(name) && !name.includes("..");

const emptyBucket = (name, region = "us-east-1") => ({
  id: name,
  name,
  region,
  note: "",
  files: [],
  versioning: "",
  mfaDelete: "",
});

export default function useVaultController() {
  const inputRef = useRef(null);
  const [buckets, setBuckets] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [createName, setCreateName] = useState("");
  const [createRegion, setCreateRegion] = useState("us-east-1");
  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("us-east-1");
  const [editNote, setEditNote] = useState("");
  const [file, setFile] = useState(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [copySource, setCopySource] = useState("");
  const [copyTarget, setCopyTarget] = useState("");
  const [view, setView] = useState("bucket");
  const [versionBusy, setVersionBusy] = useState(false);
  const [tagBucket, setTagBucket] = useState("");
  const [bucketTags, setBucketTags] = useState([]);
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [tagBusy, setTagBusy] = useState(false);
  const [encryptBucketName, setEncryptBucketName] = useState("");
  const [encryption, setEncryption] = useState(null);
  const [encryptBusy, setEncryptBusy] = useState(false);
  const [corsBucketName, setCorsBucketName] = useState("");
  const [corsRules, setCorsRules] = useState([]);
  const [corsOrigins, setCorsOrigins] = useState("*");
  const [corsHeaders, setCorsHeaders] = useState("*");
  const [corsExposeHeaders, setCorsExposeHeaders] = useState("");
  const [corsMaxAge, setCorsMaxAge] = useState("3000");
  const [corsMethods, setCorsMethods] = useState(["GET", "HEAD", "PUT", "POST", "DELETE"]);
  const [corsBusy, setCorsBusy] = useState(false);
  const [blockBucketName, setBlockBucketName] = useState("");
  const [blockAccess, setBlockAccess] = useState(null);
  const [blockPolicy, setBlockPolicy] = useState(EMPTY_BLOCK_POLICY);
  const [blockBusy, setBlockBusy] = useState(false);

  const active = useMemo(
    () => buckets.find((bucket) => bucket.id === activeId) || null,
    [buckets, activeId],
  );

  const applyVersioning = (bucketName, info) =>
    setBuckets((list) => list.map((bucket) => (bucket.name === bucketName ? { ...bucket, ...info } : bucket)));

  const loadVersioning = async (bucketName) => {
    const info = await getBucketVersioning(bucketName);
    applyVersioning(bucketName, info);
    return info;
  };

  const loadFiles = async (bucketName) => {
    const files = await listObjects(bucketName);
    setBuckets((list) => list.map((bucket) => (bucket.name === bucketName ? { ...bucket, files } : bucket)));
    return files;
  };

  const loadBuckets = async () => {
    try {
      const data = await listBuckets();
      const next = (data.buckets || []).map((bucket) => emptyBucket(bucket.name));
      setBuckets(next);
      const withVersioning = await Promise.all(next.map(async (bucket) => {
        try {
          return { ...bucket, ...(await getBucketVersioning(bucket.name)) };
        } catch {
          return bucket;
        }
      }));
      setBuckets(withVersioning);
    } catch (err) {
      setError(err.message || "Could not load buckets");
    }
  };

  useEffect(() => {
    loadBuckets();
  }, []);

  useEffect(() => {
    if (view !== "tags" || !tagBucket) return;
    setError("");
    getBucketTags(tagBucket)
      .then((data) => {
        setBucketTags(data.tags || []);
        setStatus(`Loaded ${data.tags?.length || 0} tag(s) for ${tagBucket}`);
      })
      .catch((err) => {
        setBucketTags([]);
        setError(err.message);
      });
  }, [view, tagBucket]);

  useEffect(() => {
    if (view !== "encrypt") return;
    if (!encryptBucketName) {
      setEncryption(null);
      return;
    }
    setError("");
    getBucketEncryption(encryptBucketName)
      .then((data) => {
        setEncryption(data);
        setStatus(data.encrypted ? `${encryptBucketName} encrypted with ${data.algorithm}` : `${encryptBucketName} is not encrypted`);
      })
      .catch((err) => {
        setEncryption(null);
        setError(err.message);
      });
  }, [view, encryptBucketName]);

  useEffect(() => {
    if (view !== "cors") return;
    if (!corsBucketName) {
      setCorsRules([]);
      return;
    }
    setError("");
    getBucketCors(corsBucketName)
      .then((data) => {
        const rules = data.rules || [];
        setCorsRules(rules);
        const first = rules[0];
        if (first) {
          setCorsOrigins((first.AllowedOrigins || ["*"]).join("\n"));
          setCorsHeaders((first.AllowedHeaders || ["*"]).join(", "));
          setCorsExposeHeaders((first.ExposeHeaders || []).join(", "));
          setCorsMaxAge(String(first.MaxAgeSeconds || 3000));
          setCorsMethods(first.AllowedMethods || ["GET"]);
        } else {
          setCorsOrigins("*");
          setCorsHeaders("*");
          setCorsExposeHeaders("");
          setCorsMaxAge("3000");
          setCorsMethods(["GET", "HEAD", "PUT", "POST", "DELETE"]);
        }
        setStatus(rules.length ? `Loaded ${rules.length} CORS rule(s) for ${corsBucketName}` : `${corsBucketName} has no CORS rules`);
      })
      .catch((err) => {
        setCorsRules([]);
        setError(err.message);
      });
  }, [view, corsBucketName]);

  useEffect(() => {
    if (view !== "block") return;
    if (!blockBucketName) {
      setBlockAccess(null);
      setBlockPolicy(EMPTY_BLOCK_POLICY);
      return;
    }
    setError("");
    getBucketBlockAccess(blockBucketName)
      .then((data) => {
        const policy = { ...EMPTY_BLOCK_POLICY, ...(data.policy || {}) };
        setBlockAccess(data);
        setBlockPolicy(policy);
        setStatus(data.configured ? (data.blockAll ? `${blockBucketName} blocks all public access` : `Loaded block access for ${blockBucketName}`) : `${blockBucketName} has no block access rules`);
      })
      .catch((err) => {
        setBlockAccess(null);
        setBlockPolicy(EMPTY_BLOCK_POLICY);
        setError(err.message);
      });
  }, [view, blockBucketName]);

  const runAction = async (action, busySetter) => {
    setError("");
    busySetter(true);
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      busySetter(false);
    }
  };

  const saveBucketCors = async (event) => {
    event.preventDefault();
    if (!corsBucketName) return setError("Pick a bucket first");
    if (!corsMethods.length) return setError("Pick at least one CORS method");
    await runAction(async () => {
      const data = await updateBucketCors({ bucketName: corsBucketName, allowedOrigins: corsOrigins, allowedHeaders: corsHeaders, allowedMethods: corsMethods, exposeHeaders: corsExposeHeaders, maxAgeSeconds: Number(corsMaxAge) || 3000 });
      setCorsRules(data.rules || []);
      setStatus(`CORS saved on ${corsBucketName}`);
    }, setCorsBusy);
  };

  const removeBucketCors = async () => {
    if (!corsBucketName) return;
    await runAction(async () => {
      const data = await deleteBucketCors(corsBucketName);
      setCorsRules(data.rules || []);
      setStatus(`CORS removed from ${corsBucketName}`);
    }, setCorsBusy);
  };

  const toggleCorsMethod = (method) => setCorsMethods((list) => list.includes(method) ? list.filter((item) => item !== method) : [...list, method]);
  const toggleBlockFlag = (key) => setBlockPolicy((policy) => ({ ...policy, [key]: !policy[key] }));
  const toggleBlockAll = () => {
    const next = !Object.values(blockPolicy).every(Boolean);
    setBlockPolicy(Object.fromEntries(Object.keys(EMPTY_BLOCK_POLICY).map((key) => [key, next])));
  };

  const saveBlockAccess = async (event) => {
    event.preventDefault();
    if (!blockBucketName) return setError("Pick a bucket first");
    await runAction(async () => {
      const data = await updateBucketBlockAccess(blockBucketName, blockPolicy);
      const policy = { ...EMPTY_BLOCK_POLICY, ...(data.policy || {}) };
      setBlockAccess(data);
      setBlockPolicy(policy);
      setStatus(data.blockAll ? `Blocked all public access on ${blockBucketName}` : `Block access saved on ${blockBucketName}`);
    }, setBlockBusy);
  };

  const removeBlockAccess = async () => {
    if (!blockBucketName) return;
    await runAction(async () => {
      const data = await deleteBucketBlockAccess(blockBucketName);
      setBlockAccess(data);
      setBlockPolicy({ ...EMPTY_BLOCK_POLICY, ...(data.policy || {}) });
      setStatus(`Block access removed from ${blockBucketName}`);
    }, setBlockBusy);
  };

  const enableBucketEncryption = async () => {
    if (!encryptBucketName) return setError("Pick a bucket first");
    await runAction(async () => {
      const data = await enableBucketEncryptionRequest(encryptBucketName);
      setEncryption(data);
      setStatus(`Encryption enabled on ${encryptBucketName}`);
    }, setEncryptBusy);
  };

  const removeBucketEncryption = async () => {
    if (!encryptBucketName) return;
    await runAction(async () => {
      const data = await deleteBucketEncryption(encryptBucketName);
      setEncryption(data);
      setStatus(`Encryption removed from ${encryptBucketName}`);
    }, setEncryptBusy);
  };

  const saveBucketTags = async (bucketName, tags) => {
    const data = await updateBucketTags(bucketName, tags);
    setBucketTags(data.tags || tags);
    return data.tags || tags;
  };

  const addBucketTag = async (event) => {
    event.preventDefault();
    if (!tagBucket) return setError("Pick a bucket first");
    const key = tagKey.trim();
    if (!key) return setError("Tag key is required");
    await runAction(async () => {
      const next = [...bucketTags.filter((tag) => (tag.Key || tag.key) !== key), { Key: key, Value: tagValue }];
      await saveBucketTags(tagBucket, next);
      setTagKey("");
      setTagValue("");
      setStatus(`Saved tag ${key} on ${tagBucket}`);
    }, setTagBusy);
  };

  const removeBucketTag = async (key) => {
    if (!tagBucket) return;
    await runAction(async () => {
      await saveBucketTags(tagBucket, bucketTags.filter((tag) => (tag.Key || tag.key) !== key));
      setStatus(`Removed tag ${key} from ${tagBucket}`);
    }, setTagBusy);
  };

  const setVersioning = async (statusValue) => {
    if (!active) return;
    await runAction(async () => {
      await updateBucketVersioning(active.name, statusValue);
      const info = await loadVersioning(active.name);
      setStatus(`Versioning ${info.versioning} on ${active.name}`);
    }, setVersionBusy);
  };

  const openBucket = async (bucket) => {
    setActiveId(bucket.id);
    setEditName(bucket.name);
    setEditRegion(bucket.region);
    setEditNote(bucket.note);
    setPreview(null);
    setFile(null);
    setError("");
    setCopySource(bucket.name);
    if (copyTarget === bucket.name) setCopyTarget("");
    setStatus(`Opened ${bucket.name}`);
    try {
      await Promise.all([loadFiles(bucket.name), loadVersioning(bucket.name)]);
    } catch (err) {
      setError(err.message);
    }
  };

  const createBucket = async (event) => {
    event.preventDefault();
    const name = createName.trim().toLowerCase();
    setError("");
    if (!isBucketName(name)) return setError("Bucket name: 3-63 chars, lowercase, numbers, dots or hyphens.");
    try {
      await createBucketRequest(name);
      const bucket = emptyBucket(name, createRegion);
      setBuckets((list) => list.some((item) => item.name === name) ? list : [bucket, ...list]);
      setCreateName("");
      setActiveId(name);
      setEditName(name);
      setEditRegion(createRegion);
      setEditNote("");
      setPreview(null);
      setFile(null);
      setStatus(`Bay stamped: ${name}`);
      loadFiles(name).catch(() => {});
      loadVersioning(name).catch(() => {});
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const copyBucket = async (event) => {
    event.preventDefault();
    setError("");
    if (!copySource || !copyTarget) return setError("Pick a source and target bay.");
    if (copySource === copyTarget) return setError("Source and target must be different.");
    try {
      const data = await copyBucketRequest(copySource, copyTarget);
      setStatus(`Copied ${data.copied || 0} file(s) ${copySource} -> ${copyTarget}`);
      const target = buckets.find((bucket) => bucket.name === copyTarget);
      if (target) await openBucket(target);
      else await loadFiles(copyTarget);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateBucket = (event) => {
    event.preventDefault();
    if (!active) return;
    const name = editName.trim().toLowerCase();
    setError("");
    if (!isBucketName(name)) return setError("Bucket name: 3-63 chars, lowercase, numbers, dots or hyphens.");
    if (buckets.some((bucket) => bucket.name === name && bucket.id !== active.id)) return setError("Another bay already uses that name.");
    setBuckets((list) => list.map((bucket) => bucket.id === active.id ? { ...bucket, name, region: editRegion, note: editNote.trim() } : bucket));
    setStatus(`Bay updated: ${name}`);
  };

  const downloadFile = async (bucketName, key) => {
    setError("");
    try {
      const blob = await downloadObject(bucketName, key);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = key.split("/").pop() || key;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus(`Downloaded ${key}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteObject = async (bucketName, key) => {
    setError("");
    try {
      await deleteObjectRequest(bucketName, key);
      setBuckets((list) => list.map((bucket) => bucket.name === bucketName ? { ...bucket, files: bucket.files.filter((fileItem) => fileItem.key !== key) } : bucket));
      if (preview?.key === key) setPreview(null);
      setStatus(`Removed ${key} from ${bucketName}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteBucket = async (bucketName) => {
    setError("");
    try {
      await deleteBucketRequest(bucketName);
      setBuckets((list) => list.filter((bucket) => bucket.name !== bucketName));
      if (activeId === bucketName) {
        setActiveId(null);
        setPreview(null);
        setEditName("");
        setEditNote("");
      }
      setStatus(`Bay scrapped: ${bucketName}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const onFiles = (list) => {
    const next = list?.[0];
    if (next) setFile(next);
  };

  const addFile = async () => {
    if (!active || !file || uploadBusy) return;
    if (!file.size) {
      setError("Cannot upload an empty file.");
      return;
    }
    setError("");
    setUploadBusy(true);
    try {
      const content = await readFileAsBase64(file);
      if (!content) {
        setError("Could not read the selected file.");
        return;
      }
      await uploadObject({ filename: file.name, content, contentType: file.type || "application/octet-stream", bucketName: active.name });
      const previewData = await readFilePreview(file);
      const entry = { key: file.name, size: file.size, type: file.type || "application/octet-stream", ...previewData };
      setBuckets((list) => list.map((bucket) => bucket.id === active.id ? { ...bucket, files: [entry, ...bucket.files.filter((item) => item.key !== file.name)] } : bucket));
      setStatus(`Stowed ${file.name} in ${active.name}`);
      setFile(null);
      setPreview(entry);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadBusy(false);
    }
  };

  const openObject = async (object, bucketName) => {
    if (object.text || object.dataUrl) return setPreview(object);
    try {
      const data = await getObject(bucketName, object.key);
      setPreview({ key: data.key, type: data.contentType, text: data.text, dataUrl: data.dataUrl });
    } catch (err) {
      setError(err.message);
    }
  };

  const navigate = (nextView) => {
    setView(nextView);
    const bucketName = active?.name || buckets[0]?.name || "";
    if (nextView === "tags") setTagBucket(bucketName);
    if (nextView === "encrypt") setEncryptBucketName(bucketName);
    if (nextView === "cors") setCorsBucketName(bucketName);
    if (nextView === "block") setBlockBucketName(bucketName);
  };

  return {
    state: {
      inputRef, buckets, activeId, active, createName, createRegion, editName,
      editRegion, editNote, file, uploadBusy, drag, status, error, preview, copySource,
      copyTarget, view, versionBusy, tagBucket, bucketTags, tagKey, tagValue,
      tagBusy, encryptBucketName, encryption, encryptBusy, corsBucketName,
      corsRules, corsOrigins, corsHeaders, corsExposeHeaders, corsMaxAge,
      corsMethods, corsBusy, blockBucketName, blockAccess, blockPolicy, blockBusy,
    },
    actions: {
      setCreateName, setCreateRegion, setEditName, setEditRegion, setEditNote,
      setCopySource, setCopyTarget, setDrag, setTagBucket, setTagKey, setTagValue,
      setEncryptBucketName, setCorsBucketName, setCorsOrigins, setCorsHeaders,
      setCorsExposeHeaders, setCorsMaxAge, setBlockBucketName, setView: navigate,
      createBucket, copyBucket, openBucket, deleteBucket, updateBucket, setVersioning,
      onFiles, addFile, openObject, downloadFile, deleteObject, saveBucketCors,
      removeBucketCors, toggleCorsMethod, toggleBlockFlag, toggleBlockAll,
      saveBlockAccess, removeBlockAccess, addBucketTag, removeBucketTag,
      enableBucketEncryption, removeBucketEncryption,
    },
    blockFlags: BLOCK_FLAGS,
  };
}
