export const NAV_ITEMS = [
  { id: "bucket", label: "Bucket", index: "01", kicker: "Yard ledger", title: "BUCKET" },
  { id: "tags", label: "Tags", index: "02", kicker: "Label rack", title: "TAGS" },
  { id: "encrypt", label: "Encrypt", index: "03", kicker: "Cipher lock", title: "ENCRYPT" },
  { id: "cors", label: "CORS", index: "04", kicker: "Origin gate", title: "CORS" },
  { id: "block", label: "Block", index: "05", kicker: "Public gate", title: "BLOCK" },
  { id: "storage", label: "Storage", index: "06", kicker: "Object store", title: "STORAGE" },
  { id: "backup", label: "Backup", index: "07", kicker: "Snapshot dock", title: "BACKUP" },
];

export const getNavItem = (id) =>
  NAV_ITEMS.find((item) => item.id === id) || NAV_ITEMS[0];
