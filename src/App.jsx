import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const formatBytes = (n = 0) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const NAV = [
  { id: "bucket", label: "Bucket", index: "01" },
  { id: "tags", label: "Tags", index: "02" },
  { id: "encrypt", label: "Encrypt", index: "03" },
  { id: "cors", label: "CORS", index: "04" },
  { id: "block", label: "Block", index: "05" },
  { id: "storage", label: "Storage", index: "06" },
  { id: "backup", label: "Backup", index: "07" },
];

const BLOCK_FLAGS = [
  {
    key: "BlockPublicAcls",
    label: "Block public ACLs",
    hint: "Reject new public ACLs on this bay",
  },
  {
    key: "IgnorePublicAcls",
    label: "Ignore public ACLs",
    hint: "Ignore any public ACLs already on objects",
  },
  {
    key: "BlockPublicPolicy",
    label: "Block public policy",
    hint: "Reject a bucket policy that grants public access",
  },
  {
    key: "RestrictPublicBuckets",
    label: "Restrict public buckets",
    hint: "Limit public policy access to this account only",
  },
];

const EMPTY_BLOCK_POLICY = {
  BlockPublicAcls: false,
  IgnorePublicAcls: false,
  BlockPublicPolicy: false,
  RestrictPublicBuckets: false,
};

const STORAGE_TIERS = [
  { name: "Standard", used: "1.4 TB", share: 58, note: "hot objects" },
  { name: "Infrequent", used: "680 GB", share: 28, note: "cool lane" },
  { name: "Archive", used: "320 GB", share: 14, note: "deep hold" },
];

const BACKUP_SHOTS = [
  { id: "snap-1842", when: "Today 06:12", size: "2.1 GB", state: "sealed" },
  { id: "snap-1837", when: "Yesterday 02:00", size: "2.0 GB", state: "sealed" },
  { id: "snap-1829", when: "Sep 09 02:00", size: "1.9 GB", state: "sealed" },
];

const NavIcon = ({ id }) => {
  if (id === "tags") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.6 13.4 12.7 5.5A2 2 0 0 0 11.3 5H5a2 2 0 0 0-2 2v6.3a2 2 0 0 0 .6 1.4l7.9 7.9a2 2 0 0 0 2.8 0l6.3-6.3a2 2 0 0 0 0-2.8Z" />
        <circle cx="7.5" cy="8.5" r="1.2" />
      </svg>
    );
  }
  if (id === "encrypt") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  if (id === "cors") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
      </svg>
    );
  }
  if (id === "block") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M7 7l10 10" />
      </svg>
    );
  }
  if (id === "storage") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="5" rx="1" />
        <rect x="3" y="10" width="18" height="5" rx="1" />
        <rect x="3" y="16" width="18" height="5" rx="1" />
      </svg>
    );
  }
  if (id === "backup") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12a8 8 0 0 1 13.7-5.6" />
        <polyline points="17 4 18 7 15 7" />
        <path d="M20 12a8 8 0 0 1-13.7 5.6" />
        <polyline points="7 20 6 17 9 17" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h16l-1.2 11.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 8Z" />
      <path d="M8 8V6.5A4 4 0 0 1 12 2.5 4 4 0 0 1 16 6.5V8" />
    </svg>
  );
};

const isBucketName = (name) =>
  /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(name) && !name.includes("..");

const readFile = (file) =>
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

export default function App() {
  const inputRef = useRef(null);
  const [buckets, setBuckets] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [createName, setCreateName] = useState("");
  const [createRegion, setCreateRegion] = useState("us-east-1");
  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("us-east-1");
  const [editNote, setEditNote] = useState("");
  const [file, setFile] = useState(null);
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
  const [corsMethods, setCorsMethods] = useState([
    "GET",
    "HEAD",
    "PUT",
    "POST",
    "DELETE",
  ]);
  const [corsBusy, setCorsBusy] = useState(false);
  const [blockBucketName, setBlockBucketName] = useState("");
  const [blockAccess, setBlockAccess] = useState(null);
  const [blockPolicy, setBlockPolicy] = useState(EMPTY_BLOCK_POLICY);
  const [blockBusy, setBlockBusy] = useState(false);

  const active = useMemo(
    () => buckets.find((b) => b.id === activeId) || null,
    [buckets, activeId],
  );

  const fetchVersioning = async (bucketName) => {
    const res = await fetch(
      `/api/bucket-versioning?bucketName=${encodeURIComponent(bucketName)}`,
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Could not load versioning");
    return {
      versioning: data.versioning || "Off",
      mfaDelete: data.mfaDelete || "Disabled",
    };
  };

  const applyVersioning = (bucketName, info) => {
    setBuckets((list) =>
      list.map((b) => (b.name === bucketName ? { ...b, ...info } : b)),
    );
  };

  const loadBuckets = async () => {
    try {
      const res = await fetch("/api/buckets");
      const data = await res.json().catch(() => ({}));

      console.log("data", data);
      if (!res.ok) {
        setError(data.message || "Could not load buckets");
        return;
      }
      const next = (data.buckets || []).map((bucket) => ({
        id: bucket.name,
        name: bucket.name,
        region: "us-east-1",
          note: "",
          files: [],
          versioning: "",
          mfaDelete: "",
        }));
      setBuckets(next);
      const withVersioning = await Promise.all(
        next.map(async (bucket) => {
          try {
            const info = await fetchVersioning(bucket.name);
            return { ...bucket, ...info };
          } catch {
            return bucket;
          }
        }),
      );
      setBuckets(withVersioning);
    } catch (err) {
      setError(err.message || "Could not load buckets");
    }
  };

  useEffect(() => {
    loadBuckets();
  }, []);

  useEffect(() => {
    if (view !== "tags") return;
    if (!tagBucket) return;
    setError("");
    fetch(`/api/bucket-tags?bucketName=${encodeURIComponent(tagBucket)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Could not load tags");
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
    fetch(
      `/api/get-bucket-encryption?bucketName=${encodeURIComponent(encryptBucketName)}`,
    )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Could not load encryption");
        setEncryption(data);
        setStatus(
          data.encrypted
            ? `${encryptBucketName} encrypted with ${data.algorithm}`
            : `${encryptBucketName} is not encrypted`,
        );
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
    fetch(`/api/bucket-cors?bucketName=${encodeURIComponent(corsBucketName)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Could not load CORS");
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
        setStatus(
          rules.length
            ? `Loaded ${rules.length} CORS rule(s) for ${corsBucketName}`
            : `${corsBucketName} has no CORS rules`,
        );
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
    fetch(
      `/api/bucket-block-access?bucketName=${encodeURIComponent(blockBucketName)}`,
    )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Could not load block access");
        }
        const policy = { ...EMPTY_BLOCK_POLICY, ...(data.policy || {}) };
        setBlockAccess(data);
        setBlockPolicy(policy);
        setStatus(
          data.configured
            ? data.blockAll
              ? `${blockBucketName} blocks all public access`
              : `Loaded block access for ${blockBucketName}`
            : `${blockBucketName} has no block access rules`,
        );
      })
      .catch((err) => {
        setBlockAccess(null);
        setBlockPolicy(EMPTY_BLOCK_POLICY);
        setError(err.message);
      });
  }, [view, blockBucketName]);

  const saveBucketCors = async (e) => {
    e.preventDefault();
    if (!corsBucketName) {
      setError("Pick a bucket first");
      return;
    }
    if (!corsMethods.length) {
      setError("Pick at least one CORS method");
      return;
    }
    setError("");
    setCorsBusy(true);
    try {
      const res = await fetch("/api/bucket-cors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucketName: corsBucketName,
          allowedOrigins: corsOrigins,
          allowedHeaders: corsHeaders,
          allowedMethods: corsMethods,
          exposeHeaders: corsExposeHeaders,
          maxAgeSeconds: Number(corsMaxAge) || 3000,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not save CORS");
      setCorsRules(data.rules || []);
      setStatus(`CORS saved on ${corsBucketName}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCorsBusy(false);
    }
  };

  const removeBucketCors = async () => {
    if (!corsBucketName) return;
    setError("");
    setCorsBusy(true);
    try {
      const res = await fetch("/api/bucket-cors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName: corsBucketName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not remove CORS");
      setCorsRules(data.rules || []);
      setStatus(`CORS removed from ${corsBucketName}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCorsBusy(false);
    }
  };

  const toggleCorsMethod = (method) => {
    setCorsMethods((list) =>
      list.includes(method)
        ? list.filter((item) => item !== method)
        : [...list, method],
    );
  };

  const toggleBlockFlag = (key) => {
    setBlockPolicy((policy) => ({ ...policy, [key]: !policy[key] }));
  };

  const toggleBlockAll = () => {
    const next = !Object.values(blockPolicy).every(Boolean);
    setBlockPolicy({
      BlockPublicAcls: next,
      IgnorePublicAcls: next,
      BlockPublicPolicy: next,
      RestrictPublicBuckets: next,
    });
  };

  const saveBlockAccess = async (e) => {
    e.preventDefault();
    if (!blockBucketName) {
      setError("Pick a bucket first");
      return;
    }
    setError("");
    setBlockBusy(true);
    try {
      const res = await fetch("/api/bucket-block-access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucketName: blockBucketName,
          policy: blockPolicy,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not save block access");
      const policy = { ...EMPTY_BLOCK_POLICY, ...(data.policy || {}) };
      setBlockAccess(data);
      setBlockPolicy(policy);
      setStatus(
        data.blockAll
          ? `Blocked all public access on ${blockBucketName}`
          : `Block access saved on ${blockBucketName}`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBlockBusy(false);
    }
  };

  const removeBlockAccess = async () => {
    if (!blockBucketName) return;
    setError("");
    setBlockBusy(true);
    try {
      const res = await fetch("/api/bucket-block-access", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName: blockBucketName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Could not remove block access");
      }
      const policy = { ...EMPTY_BLOCK_POLICY, ...(data.policy || {}) };
      setBlockAccess(data);
      setBlockPolicy(policy);
      setStatus(`Block access removed from ${blockBucketName}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBlockBusy(false);
    }
  };

  const enableBucketEncryption = async () => {
    if (!encryptBucketName) {
      setError("Pick a bucket first");
      return;
    }
    setError("");
    setEncryptBusy(true);
    try {
      const res = await fetch("/api/encrypt-bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucketName: encryptBucketName,
          algorithm: "AES256",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not enable encryption");
      setEncryption(data);
      setStatus(`Encryption enabled on ${encryptBucketName}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setEncryptBusy(false);
    }
  };

  const removeBucketEncryption = async () => {
    if (!encryptBucketName) return;
    setError("");
    setEncryptBusy(true);
    try {
      const res = await fetch("/api/delete-bucket-encryption", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName: encryptBucketName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not remove encryption");
      setEncryption(data);
      setStatus(`Encryption removed from ${encryptBucketName}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setEncryptBusy(false);
    }
  };

  const saveBucketTags = async (bucketName, tags) => {
    const res = await fetch("/api/bucket-tags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucketName, tags }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Could not save tags");
    setBucketTags(data.tags || tags);
    return data.tags || tags;
  };

  const addBucketTag = async (e) => {
    e.preventDefault();
    if (!tagBucket) {
      setError("Pick a bucket first");
      return;
    }
    const key = tagKey.trim();
    if (!key) {
      setError("Tag key is required");
      return;
    }
    setError("");
    setTagBusy(true);
    try {
      const next = [
        ...bucketTags.filter((tag) => (tag.Key || tag.key) !== key),
        { Key: key, Value: tagValue },
      ];
      await saveBucketTags(tagBucket, next);
      setTagKey("");
      setTagValue("");
      setStatus(`Saved tag ${key} on ${tagBucket}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setTagBusy(false);
    }
  };

  const removeBucketTag = async (key) => {
    if (!tagBucket) return;
    setError("");
    setTagBusy(true);
    try {
      const next = bucketTags.filter((tag) => (tag.Key || tag.key) !== key);
      await saveBucketTags(tagBucket, next);
      setStatus(`Removed tag ${key} from ${tagBucket}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setTagBusy(false);
    }
  };

  const loadFiles = async (bucketName) => {
    const res = await fetch(
      `/api/objects?bucket=${encodeURIComponent(bucketName)}`,
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not list files");
    const files = (data.objects || []).map((obj) => ({
      key: obj.key,
      size: obj.size,
      type: "application/octet-stream",
    }));
    setBuckets((list) =>
      list.map((b) => (b.name === bucketName ? { ...b, files } : b)),
    );
    return files;
  };

  const loadVersioning = async (bucketName) => {
    const info = await fetchVersioning(bucketName);
    applyVersioning(bucketName, info);
    return info;
  };

  const setVersioning = async (status) => {
    if (!active) return;
    setError("");
    setVersionBusy(true);
    try {
      const res = await fetch("/api/bucket-versioning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName: active.name, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not update versioning");
      const info = await loadVersioning(active.name);
      setStatus(`Versioning ${info.versioning} on ${active.name}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setVersionBusy(false);
    }
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
  const createBucket = (e) => {
    e.preventDefault();
    const name = createName.trim().toLowerCase();
    setError("");
    if (!isBucketName(name)) {
      setError("Bucket name: 3-63 chars, lowercase, numbers, dots or hyphens.");
      return;
    }

    fetch("/api/create-bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucketName: name }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Could not create bucket");
        }
        const bucket = {
          id: name,
          name,
          region: createRegion,
          note: "",
          files: [],
          versioning: "",
          mfaDelete: "",
        };
        setBuckets((list) =>
          list.some((b) => b.name === name) ? list : [bucket, ...list],
        );
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
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  };

  const copyBucket = async (e) => {
    e.preventDefault();
    setError("");
    if (!copySource || !copyTarget) {
      setError("Pick a source and target bay.");
      return;
    }
    if (copySource === copyTarget) {
      setError("Source and target must be different.");
      return;
    }
    try {
      const res = await fetch("/api/copy-bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceBucketName: copySource,
          targetBucketName: copyTarget,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not copy bucket");
      setStatus(`Copied ${data.copied || 0} file(s) ${copySource} → ${copyTarget}`);
      const target = buckets.find((b) => b.name === copyTarget);
      if (target) {
        await openBucket(target);
      } else {
        await loadFiles(copyTarget);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const updateBucket = (e) => {
    e.preventDefault();
    if (!active) return;
    const name = editName.trim().toLowerCase();
    setError("");
    if (!isBucketName(name)) {
      setError("Bucket name: 3-63 chars, lowercase, numbers, dots or hyphens.");
      return;
    }
    if (buckets.some((b) => b.name === name && b.id !== active.id)) {
      setError("Another bay already uses that name.");
      return;
    }
    setBuckets((list) =>
      list.map((b) =>
        b.id === active.id
          ? { ...b, name, region: editRegion, note: editNote.trim() }
          : b,
      ),
    );
    setStatus(`Bay updated: ${name}`);
  };

  const downloadFile = async (bucketName, key) => {
    setError("");
    try {
      const res = await fetch(
        `/api/download-file?key=${encodeURIComponent(key)}&bucketName=${encodeURIComponent(bucketName)}`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not download file");
      }
      const blob = await res.blob();
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
      const res = await fetch("/api/delete-bucket-object", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName, key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not delete file");
      setBuckets((list) =>
        list.map((b) =>
          b.name === bucketName
            ? { ...b, files: b.files.filter((f) => f.key !== key) }
            : b,
        ),
      );
      if (preview?.key === key) setPreview(null);
      setStatus(`Removed ${key} from ${bucketName}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteBucket = async (bucketName) => {
    setError("");
    try {
      const res = await fetch("/api/delete-bucket", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not delete bucket");
      setBuckets((list) => list.filter((b) => b.name !== bucketName));
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
    if (!active || !file) return;
    setError("");
    try {
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(String(reader.result).split(",")[1] || "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content,
          contentType: file.type || "application/octet-stream",
          bucketName: active.name,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Upload failed");

      const previewData = await readFile(file);
      const entry = {
        key: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        ...previewData,
      };
      setBuckets((list) =>
        list.map((b) =>
          b.id === active.id
            ? {
                ...b,
                files: [entry, ...b.files.filter((f) => f.key !== file.name)],
              }
            : b,
        ),
      );
      setStatus(`Stowed ${file.name} in ${active.name}`);
      setFile(null);
      setPreview(entry);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="vault">
      <aside className="sidebar">
        <p className="brand">FLOCI</p>
        <nav className="nav" aria-label="Vault sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => {
                setView(item.id);
                if (item.id === "tags") {
                  setTagBucket(active?.name || buckets[0]?.name || "");
                }
                if (item.id === "encrypt") {
                  setEncryptBucketName(active?.name || buckets[0]?.name || "");
                }
                if (item.id === "cors") {
                  setCorsBucketName(active?.name || buckets[0]?.name || "");
                }
                if (item.id === "block") {
                  setBlockBucketName(active?.name || buckets[0]?.name || "");
                }
              }}
            >
              <span className="nav-index">{item.index}</span>
              <span className="nav-icon">
                <NavIcon id={item.id} />
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <p className="nav-foot">UI only</p>
      </aside>

      <div className="workspace">
      <header className="mast">
        <div>
          <p className="kicker">
            {view === "bucket"
              ? "Yard ledger"
              : view === "tags"
                ? "Label rack"
                : view === "encrypt"
                  ? "Cipher lock"
                  : view === "cors"
                    ? "Origin gate"
                    : view === "block"
                      ? "Public gate"
                      : view === "storage"
                        ? "Object store"
                        : "Snapshot dock"}
          </p>
          <h1>
            {view === "bucket"
              ? "BUCKET"
              : view === "tags"
                ? "TAGS"
                : view === "encrypt"
                  ? "ENCRYPT"
                  : view === "cors"
                    ? "CORS"
                    : view === "block"
                      ? "BLOCK"
                      : view === "storage"
                        ? "STORAGE"
                        : "BACKUP"}
          </h1>
        </div>
        <dl className="ticket">
          {view === "bucket" ? (
            <>
              <dt>Open bay</dt>
              <dd>{active ? active.name : "none selected"}</dd>
              <dt>Bays on lot</dt>
              <dd>{buckets.length}</dd>
              <dt>Versioning</dt>
              <dd>{active?.versioning || "—"}</dd>
            </>
          ) : view === "tags" ? (
            <>
              <dt>Tagged bay</dt>
              <dd>{tagBucket || "none selected"}</dd>
              <dt>Tags</dt>
              <dd>{bucketTags.length}</dd>
            </>
          ) : view === "encrypt" ? (
            <>
              <dt>Locked bay</dt>
              <dd>{encryptBucketName || "none selected"}</dd>
              <dt>Encryption</dt>
              <dd>
                {encryption?.encrypted ? encryption.algorithm : "off"}
              </dd>
            </>
          ) : view === "cors" ? (
            <>
              <dt>Open bay</dt>
              <dd>{corsBucketName || "none selected"}</dd>
              <dt>CORS rules</dt>
              <dd>{corsRules.length}</dd>
            </>
          ) : view === "block" ? (
            <>
              <dt>Gated bay</dt>
              <dd>{blockBucketName || "none selected"}</dd>
              <dt>Public access</dt>
              <dd>
                {blockAccess?.blockAll
                  ? "blocked"
                  : blockAccess?.configured
                    ? "partial"
                    : "open"}
              </dd>
            </>
          ) : view === "storage" ? (
            <>
              <dt>Capacity</dt>
              <dd>2.4 TB / 10 TB</dd>
              <dt>Objects</dt>
              <dd>18,402</dd>
            </>
          ) : (
            <>
              <dt>Last snap</dt>
              <dd>Today 06:12</dd>
              <dt>Retention</dt>
              <dd>30 days</dd>
            </>
          )}
          <dt>Status</dt>
          <dd className="live">
            <i />
            ui only
          </dd>
        </dl>
      </header>

      {(error || status) && (
        <p
          className={`banner ${error ? "err" : ""}`}
          role={error ? "alert" : "status"}
        >
          {error || status}
        </p>
      )}

      {view === "bucket" && (
      <div className="yard">
        <section className="panel bays">
          <header>
            <h2>NEW BAY</h2>
            <span className="count">create bucket</span>
          </header>
          <form className="form" onSubmit={createBucket}>
            <label>
              Bucket name
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="photos-2026"
                autoComplete="off"
              />
            </label>
            <label>
              Region
              <select
                value={createRegion}
                onChange={(e) => setCreateRegion(e.target.value)}
              >
                <option value="us-east-1">us-east-1</option>
                <option value="us-west-2">us-west-2</option>
                <option value="eu-west-1">eu-west-1</option>
                <option value="ap-south-1">ap-south-1</option>
              </select>
            </label>
            <button className="primary" type="submit">
              Stamp bay
            </button>
          </form>

          <header className="subhead">
            <h2>COPY BAY</h2>
            <span className="count">copy objects</span>
          </header>
          {buckets.length < 2 ? (
            <p className="empty">Need two bays to copy cargo.</p>
          ) : (
            <form className="form" onSubmit={copyBucket}>
              <label>
                Source bucket
                <select
                  value={copySource}
                  onChange={(e) => {
                    setCopySource(e.target.value);
                    if (copyTarget === e.target.value) setCopyTarget("");
                  }}
                >
                  <option value="">select source</option>
                  {buckets.map((bucket) => (
                    <option key={bucket.id} value={bucket.name}>
                      {bucket.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Target bucket
                <select
                  value={copyTarget}
                  onChange={(e) => setCopyTarget(e.target.value)}
                >
                  <option value="">select target</option>
                  {buckets
                    .filter((bucket) => bucket.name !== copySource)
                    .map((bucket) => (
                      <option key={bucket.id} value={bucket.name}>
                        {bucket.name}
                      </option>
                    ))}
                </select>
              </label>
              <button
                className="primary"
                type="submit"
                disabled={!copySource || !copyTarget}
              >
                Copy bay
              </button>
            </form>
          )}

          <header className="subhead">
            <h2>BAYS</h2>
            <span className="count">{buckets.length}</span>
          </header>
          {buckets.length === 0 ? (
            <p className="empty">No bays yet. Stamp one to start.</p>
          ) : (
            buckets.map((bucket) => (
              <div
                key={bucket.id}
                className={`bay-row ${activeId === bucket.id ? "selected" : ""}`}
              >
                <button
                  type="button"
                  className="row"
                  onClick={() => openBucket(bucket)}
                >
                  <span className="stub" />
                  <span className="key">
                    {bucket.name}
                    {bucket.versioning ? (
                      <span
                        className={`ver-tag ${bucket.versioning === "Enabled" ? "on" : ""}`}
                      >
                        {bucket.versioning}
                      </span>
                    ) : null}
                  </span>
                  <span className="meta">{bucket.files.length} files</span>
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteBucket(bucket.name)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </section>

        <section className="panel dock">
          <header>
            <h2>UPDATE BAY</h2>
            <span className="count">{active ? "selected" : "pick a bay"}</span>
          </header>
          {active ? (
            <form className="form" onSubmit={updateBucket}>
              <label>
                Bucket name
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label>
                Region
                <select
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                >
                  <option value="us-east-1">us-east-1</option>
                  <option value="us-west-2">us-west-2</option>
                  <option value="eu-west-1">eu-west-1</option>
                  <option value="ap-south-1">ap-south-1</option>
                </select>
              </label>
              <label>
                Dock note
                <input
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="optional label"
                />
              </label>
              <button className="primary" type="submit">
                Save bay
              </button>
            </form>
          ) : (
            <p className="empty">Select a bay before you edit it.</p>
          )}

          {active && (
            <>
              <header className="subhead">
                <h2>VERSIONING</h2>
                <span className="count">GET /bucket-versioning</span>
              </header>
              <dl className="version-data">
                <div>
                  <dt>Bucket</dt>
                  <dd>{active.name}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{active.versioning || "loading…"}</dd>
                </div>
                <div>
                  <dt>MFA delete</dt>
                  <dd>{active.mfaDelete || "—"}</dd>
                </div>
              </dl>
              <div className="version-box">
                <p>
                  Keep prior object revisions when a file in {active.name} is
                  replaced.
                </p>
                <button
                  type="button"
                  className={`toggle ${active.versioning === "Enabled" ? "on" : ""}`}
                  disabled={versionBusy || !active.versioning}
                  onClick={() =>
                    setVersioning(
                      active.versioning === "Enabled"
                        ? "Suspended"
                        : "Enabled",
                    )
                  }
                >
                  <i />
                  {active.versioning === "Enabled" ? "Enabled" : "Off"}
                </button>
              </div>
            </>
          )}

          <header className="subhead">
            <h2>ADD FILE</h2>
            <span className="count">{active ? active.name : "no bay"}</span>
          </header>
          <div
            className={`drop ${drag ? "active" : ""} ${!active ? "locked" : ""}`}
            onClick={() => active && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (active) setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (active) onFiles(e.dataTransfer.files);
            }}
          >
            <div>
              <strong>{active ? "LOADING BAY" : "CLOSED"}</strong>
              <p>
                {active
                  ? `Drop cargo into ${active.name}`
                  : "Open a bay first, then drop a file"}
              </p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
          {file && (
            <p className="file-chip">
              {file.name} · {formatBytes(file.size)}
            </p>
          )}
          <div className="actions">
            <button
              className="primary"
              type="button"
              disabled={!active || !file}
              onClick={addFile}
            >
              Stow in bay
            </button>
          </div>
        </section>

        <section className="panel manifest">
          <header>
            <h2>CARGO</h2>
            <span className="count">
              {active
                ? `${active.files.length} in ${active.name}`
                : "0 objects"}
            </span>
          </header>
          {!active ? (
            <p className="empty">Pick a bay to see its files.</p>
          ) : active.files.length === 0 ? (
            <p className="empty">This bay is empty.</p>
          ) : (
            active.files.map((obj) => (
              <div
                key={obj.key}
                className={`bay-row ${preview?.key === obj.key ? "selected" : ""}`}
              >
                <button
                  type="button"
                  className={`row ${preview?.key === obj.key ? "selected" : ""}`}
                  onClick={async () => {
                    if (obj.text || obj.dataUrl) {
                      setPreview(obj);
                      return;
                    }
                    try {
                      const res = await fetch("api/delete-bucket-object", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          bucketName: active.name,
                          key: obj.key,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message);
                      setPreview({
                        key: data.key,
                        type: data.contentType,
                        text: data.text,
                        dataUrl: data.dataUrl,
                      });
                    } catch (err) {
                      setError(err.message);
                    }
                  }}
                >
                  <span className="stub" />
                  <span className="key">{obj.key}</span>
                  <span className="meta">{formatBytes(obj.size)}</span>
                </button>
                <div className="row-actions">
                  <button
                    type="button"
                    className="download-button"
                    onClick={() => downloadFile(active.name, obj.key)}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => deleteObject(active.name, obj.key)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {preview && (
          <section className="panel preview">
            <header>
              <h2>{preview.key}</h2>
              <span className="count">{preview.type}</span>
            </header>
            {preview.text ? (
              <pre>{preview.text}</pre>
            ) : preview.dataUrl ? (
              <img src={preview.dataUrl} alt={preview.key} />
            ) : (
              <p className="empty">No preview for this object.</p>
            )}
          </section>
        )}
      </div>
      )}

      {view === "tags" && (
        <div className="stage">
          <section className="panel bays">
            <header>
              <h2>SET TAG</h2>
              <span className="count">PUT /bucket-tags</span>
            </header>
            {buckets.length === 0 ? (
              <p className="empty">Stamp a bay before you tag it.</p>
            ) : (
              <form className="form" onSubmit={addBucketTag}>
                <label>
                  Bucket
                  <select
                    value={tagBucket}
                    onChange={(e) => setTagBucket(e.target.value)}
                  >
                    <option value="">select bucket</option>
                    {buckets.map((bucket) => (
                      <option key={bucket.id} value={bucket.name}>
                        {bucket.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Key
                  <input
                    value={tagKey}
                    onChange={(e) => setTagKey(e.target.value)}
                    placeholder="env"
                    autoComplete="off"
                  />
                </label>
                <label>
                  Value
                  <input
                    value={tagValue}
                    onChange={(e) => setTagValue(e.target.value)}
                    placeholder="prod"
                    autoComplete="off"
                  />
                </label>
                <button
                  className="primary"
                  type="submit"
                  disabled={tagBusy || !tagBucket}
                >
                  Save tag
                </button>
              </form>
            )}
          </section>
          <section className="panel snaps">
            <header>
              <h2>TAGS</h2>
              <span className="count">
                {tagBucket
                  ? `${bucketTags.length} on ${tagBucket}`
                  : "GET /bucket-tags"}
              </span>
            </header>
            {!tagBucket ? (
              <p className="empty">Pick a bay to load its tags.</p>
            ) : bucketTags.length === 0 ? (
              <p className="empty">No tags on this bay yet.</p>
            ) : (
              bucketTags.map((tag) => {
                const key = tag.Key || tag.key;
                const value = tag.Value ?? tag.value ?? "";
                return (
                  <div key={key} className="bay-row">
                    <div className="row static">
                      <span className="stub" />
                      <span className="key">{key}</span>
                      <span className="meta">{value || "—"}</span>
                    </div>
                    <button
                      type="button"
                      className="delete-button"
                      disabled={tagBusy}
                      onClick={() => removeBucketTag(key)}
                    >
                      Delete
                    </button>
                  </div>
                );
              })
            )}
          </section>
        </div>
      )}

      {view === "encrypt" && (
        <div className="stage">
          <section className="panel bays">
            <header>
              <h2>LOCK BAY</h2>
              <span className="count">POST /encrypt-bucket</span>
            </header>
            {buckets.length === 0 ? (
              <p className="empty">Stamp a bay before you encrypt it.</p>
            ) : (
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  enableBucketEncryption();
                }}
              >
                <label>
                  Bucket
                  <select
                    value={encryptBucketName}
                    onChange={(e) => setEncryptBucketName(e.target.value)}
                  >
                    <option value="">select bucket</option>
                    {buckets.map((bucket) => (
                      <option key={bucket.id} value={bucket.name}>
                        {bucket.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Algorithm
                  <select value="AES256" disabled>
                    <option value="AES256">AES256</option>
                  </select>
                </label>
                <button
                  className="primary"
                  type="submit"
                  disabled={encryptBusy || !encryptBucketName}
                >
                  Enable encryption
                </button>
                <button
                  className="ghost"
                  type="button"
                  disabled={
                    encryptBusy || !encryptBucketName || !encryption?.encrypted
                  }
                  onClick={removeBucketEncryption}
                >
                  Remove encryption
                </button>
              </form>
            )}
          </section>
          <section className="panel snaps">
            <header>
              <h2>ENCRYPTION</h2>
              <span className="count">GET /get-bucket-encryption</span>
            </header>
            {!encryptBucketName ? (
              <p className="empty">Pick a bay to load encryption.</p>
            ) : !encryption ? (
              <p className="empty">Loading encryption…</p>
            ) : (
              <dl className="version-data">
                <div>
                  <dt>Bucket</dt>
                  <dd>{encryption.bucketName}</dd>
                </div>
                <div>
                  <dt>Encrypted</dt>
                  <dd>{encryption.encrypted ? "yes" : "no"}</dd>
                </div>
                <div>
                  <dt>Algorithm</dt>
                  <dd>{encryption.algorithm || "—"}</dd>
                </div>
                <div>
                  <dt>KMS key</dt>
                  <dd>{encryption.kmsKeyId || "—"}</dd>
                </div>
                <div>
                  <dt>Bucket key</dt>
                  <dd>{encryption.bucketKeyEnabled ? "on" : "off"}</dd>
                </div>
              </dl>
            )}
          </section>
        </div>
      )}

      {view === "cors" && (
        <div className="stage">
          <section className="panel bays">
            <header>
              <h2>SET CORS</h2>
              <span className="count">PUT /bucket-cors</span>
            </header>
            {buckets.length === 0 ? (
              <p className="empty">Stamp a bay before you set CORS.</p>
            ) : (
              <form className="form" onSubmit={saveBucketCors}>
                <label>
                  Bucket
                  <select
                    value={corsBucketName}
                    onChange={(e) => setCorsBucketName(e.target.value)}
                  >
                    <option value="">select bucket</option>
                    {buckets.map((bucket) => (
                      <option key={bucket.id} value={bucket.name}>
                        {bucket.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Allowed origins
                  <textarea
                    value={corsOrigins}
                    onChange={(e) => setCorsOrigins(e.target.value)}
                    placeholder={"*\nor https://app.example.com"}
                    rows={3}
                  />
                </label>
                <label>
                  Allowed headers
                  <input
                    value={corsHeaders}
                    onChange={(e) => setCorsHeaders(e.target.value)}
                    placeholder="*"
                    autoComplete="off"
                  />
                </label>
                <label>
                  Expose headers
                  <input
                    value={corsExposeHeaders}
                    onChange={(e) => setCorsExposeHeaders(e.target.value)}
                    placeholder="ETag, x-amz-request-id"
                    autoComplete="off"
                  />
                </label>
                <label>
                  Max age (seconds)
                  <input
                    type="number"
                    min="0"
                    value={corsMaxAge}
                    onChange={(e) => setCorsMaxAge(e.target.value)}
                  />
                </label>
                <fieldset className="method-set">
                  <legend>Allowed methods</legend>
                  {["GET", "HEAD", "PUT", "POST", "DELETE"].map((method) => (
                    <label key={method} className="check">
                      <input
                        type="checkbox"
                        checked={corsMethods.includes(method)}
                        onChange={() => toggleCorsMethod(method)}
                      />
                      {method}
                    </label>
                  ))}
                </fieldset>
                <button
                  className="primary"
                  type="submit"
                  disabled={corsBusy || !corsBucketName}
                >
                  Save CORS
                </button>
                <button
                  className="ghost"
                  type="button"
                  disabled={corsBusy || !corsBucketName || !corsRules.length}
                  onClick={removeBucketCors}
                >
                  Remove CORS
                </button>
              </form>
            )}
          </section>
          <section className="panel snaps">
            <header>
              <h2>RULES</h2>
              <span className="count">GET /bucket-cors</span>
            </header>
            {!corsBucketName ? (
              <p className="empty">Pick a bay to load CORS.</p>
            ) : corsRules.length === 0 ? (
              <p className="empty">No CORS rules on this bay.</p>
            ) : (
              corsRules.map((rule, index) => (
                <div key={index} className="cors-rule">
                  <strong>Rule {index + 1}</strong>
                  <p>
                    <span>Origins</span>
                    {(rule.AllowedOrigins || []).join(", ") || "—"}
                  </p>
                  <p>
                    <span>Methods</span>
                    {(rule.AllowedMethods || []).join(", ") || "—"}
                  </p>
                  <p>
                    <span>Headers</span>
                    {(rule.AllowedHeaders || []).join(", ") || "—"}
                  </p>
                  <p>
                    <span>Expose</span>
                    {(rule.ExposeHeaders || []).join(", ") || "—"}
                  </p>
                  <p>
                    <span>Max age</span>
                    {rule.MaxAgeSeconds ?? "—"}
                  </p>
                </div>
              ))
            )}
          </section>
        </div>
      )}

      {view === "block" && (
        <div className="stage">
          <section className="panel bays">
            <header>
              <h2>SET BLOCK</h2>
              <span className="count">PUT /bucket-block-access</span>
            </header>
            {buckets.length === 0 ? (
              <p className="empty">Stamp a bay before you set block access.</p>
            ) : (
              <form className="form" onSubmit={saveBlockAccess}>
                <label>
                  Bucket
                  <select
                    value={blockBucketName}
                    onChange={(e) => setBlockBucketName(e.target.value)}
                  >
                    <option value="">select bucket</option>
                    {buckets.map((bucket) => (
                      <option key={bucket.id} value={bucket.name}>
                        {bucket.name}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset className="method-set">
                  <legend>Public access</legend>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Object.values(blockPolicy).every(Boolean)}
                      onChange={toggleBlockAll}
                    />
                    Block all public access
                  </label>
                </fieldset>
                <fieldset className="method-set">
                  <legend>Settings</legend>
                  {BLOCK_FLAGS.map((flag) => (
                    <label key={flag.key} className="check block-check">
                      <input
                        type="checkbox"
                        checked={Boolean(blockPolicy[flag.key])}
                        onChange={() => toggleBlockFlag(flag.key)}
                      />
                      <span>
                        {flag.label}
                        <small>{flag.hint}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <button
                  className="primary"
                  type="submit"
                  disabled={blockBusy || !blockBucketName}
                >
                  Save block access
                </button>
                <button
                  className="ghost"
                  type="button"
                  disabled={
                    blockBusy || !blockBucketName || !blockAccess?.configured
                  }
                  onClick={removeBlockAccess}
                >
                  Remove block access
                </button>
              </form>
            )}
          </section>
          <section className="panel snaps">
            <header>
              <h2>POLICY</h2>
              <span className="count">GET /bucket-block-access</span>
            </header>
            {!blockBucketName ? (
              <p className="empty">Pick a bay to load block access.</p>
            ) : !blockAccess ? (
              <p className="empty">Loading block access…</p>
            ) : (
              <dl className="version-data block-data">
                <div>
                  <dt>Bucket</dt>
                  <dd>{blockAccess.bucketName}</dd>
                </div>
                <div>
                  <dt>Configured</dt>
                  <dd>{blockAccess.configured ? "yes" : "no"}</dd>
                </div>
                <div>
                  <dt>Block all</dt>
                  <dd>{blockAccess.blockAll ? "on" : "off"}</dd>
                </div>
                {BLOCK_FLAGS.map((flag) => (
                  <div key={flag.key}>
                    <dt>{flag.label}</dt>
                    <dd>
                      {blockAccess.policy?.[flag.key] ? "blocked" : "allowed"}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>
      )}

      {view === "storage" && (
        <div className="stage">
          <section className="panel capacity">
            <header>
              <h2>CAPACITY</h2>
              <span className="count">2.4 TB used</span>
            </header>
            <div className="cap-body">
              <div className="cap-bar" aria-hidden="true">
                <i style={{ width: "24%" }} />
              </div>
              <p className="cap-note">10 TB provisioned · 76% free</p>
              <div className="cell-map">
                {Array.from({ length: 48 }, (_, i) => (
                  <span
                    key={i}
                    className={`cell ${i < 12 ? "hot" : i < 26 ? "warm" : ""}`}
                  />
                ))}
              </div>
            </div>
          </section>
          <section className="panel tiers">
            <header>
              <h2>TIERS</h2>
              <span className="count">ui mock</span>
            </header>
            {STORAGE_TIERS.map((tier) => (
              <div key={tier.name} className="tier-row">
                <div>
                  <strong>{tier.name}</strong>
                  <span>{tier.note}</span>
                </div>
                <em>{tier.used}</em>
                <b>{tier.share}%</b>
              </div>
            ))}
          </section>
        </div>
      )}

      {view === "backup" && (
        <div className="stage">
          <section className="panel schedule">
            <header>
              <h2>SCHEDULE</h2>
              <span className="count">daily 02:00 UTC</span>
            </header>
            <div className="form">
              <label>
                Cadence
                <select defaultValue="daily" disabled>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
              <label>
                Retention
                <select defaultValue="30" disabled>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                </select>
              </label>
              <p className="cap-note">Controls are display-only.</p>
            </div>
          </section>
          <section className="panel snaps">
            <header>
              <h2>SNAPSHOTS</h2>
              <span className="count">{BACKUP_SHOTS.length} sealed</span>
            </header>
            {BACKUP_SHOTS.map((shot) => (
              <div key={shot.id} className="bay-row">
                <div className="row static">
                  <span className="stub" />
                  <span className="key">{shot.id}</span>
                  <span className="meta">
                    {shot.when} · {shot.size}
                  </span>
                </div>
                <span className="seal">{shot.state}</span>
              </div>
            ))}
          </section>
        </div>
      )}

      </div>
    </div>
  );
}
