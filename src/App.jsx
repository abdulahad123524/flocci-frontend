import "./App.css";
import AppShell from "./layouts/AppShell";
import { NAV_ITEMS } from "./config/navigation";
import useVaultController from "./hooks/useVaultController";
import BlockScreen from "./screens/BlockScreen";
import BackupScreen from "./screens/BackupScreen";
import BucketScreen from "./screens/BucketScreen";
import CorsScreen from "./screens/CorsScreen";
import EncryptionScreen from "./screens/EncryptionScreen";
import NotificationScreen from "./screens/NotificationScreen";
import StorageScreen from "./screens/StorageScreen";
import TagsScreen from "./screens/TagsScreen";

function ScreenContent({ view, state, actions, blockFlags }) {
  const screenState = { ...state, blockFlags };

  if (view === "bucket") {
    return <BucketScreen state={state} actions={actions} />;
  }
  if (view === "tags") {
    return <TagsScreen state={state} actions={actions} />;
  }
  if (view === "encrypt") {
    return <EncryptionScreen state={state} actions={actions} />;
  }
  if (view === "cors") {
    return <CorsScreen state={state} actions={actions} />;
  }
  if (view === "block") {
    return <BlockScreen state={screenState} actions={actions} />;
  }
  if (view === "notification") {
    return <NotificationScreen state={state} actions={actions} />;
  }
  if (view === "storage") {
    return <StorageScreen />;
  }
  return <BackupScreen />;
}

function getHeaderStats(state) {
  const {
    view,
    active,
    buckets,
    tagBucket,
    bucketTags,
    encryptBucketName,
    encryption,
    corsBucketName,
    corsRules,
    blockBucketName,
    blockAccess,
    notificationBucketName,
    notificationRules,
  } = state;

  if (view === "bucket") {
    return [
      { label: "Open bay", value: active?.name || "none selected" },
      { label: "Bays on lot", value: buckets.length },
      { label: "Versioning", value: active?.versioning || "-" },
    ];
  }
  if (view === "tags") {
    return [
      { label: "Tagged bay", value: tagBucket || "none selected" },
      { label: "Tags", value: bucketTags.length },
    ];
  }
  if (view === "encrypt") {
    return [
      { label: "Locked bay", value: encryptBucketName || "none selected" },
      { label: "Encryption", value: encryption?.encrypted ? encryption.algorithm : "off" },
    ];
  }
  if (view === "cors") {
    return [
      { label: "Open bay", value: corsBucketName || "none selected" },
      { label: "CORS rules", value: corsRules.length },
    ];
  }
  if (view === "block") {
    return [
      { label: "Gated bay", value: blockBucketName || "none selected" },
      {
        label: "Public access",
        value: blockAccess?.blockAll ? "blocked" : blockAccess?.configured ? "partial" : "open",
      },
    ];
  }
  if (view === "notification") {
    return [
      { label: "Alert bay", value: notificationBucketName || "none selected" },
      { label: "Notification rules", value: notificationRules.length },
    ];
  }
  if (view === "storage") {
    return [
      { label: "Capacity", value: "2.4 TB / 10 TB" },
      { label: "Objects", value: "18,402" },
    ];
  }
  return [
    { label: "Last snap", value: "Today 06:12" },
    { label: "Retention", value: "30 days" },
  ];
}

export default function App() {
  const { state, actions, blockFlags } = useVaultController();
  const stats = getHeaderStats(state);

  return (
    <AppShell
      items={NAV_ITEMS}
      view={state.view}
      onNavigate={actions.setView}
      stats={stats}
    >
      {(state.error || state.status) && (
        <p
          className={`banner ${state.error ? "err" : ""}`}
          role={state.error ? "alert" : "status"}
        >
          {state.error || state.status}
        </p>
      )}
      <ScreenContent
        view={state.view}
        state={state}
        actions={actions}
        blockFlags={blockFlags}
      />
    </AppShell>
  );
}
