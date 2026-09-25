export default function NotificationScreen({ state, actions }) {
  const {
    buckets,
    notificationBucketName,
    notificationConfig,
    lambdaFunctionArn,
    lambdaEvents,
    lambdaNotificationId,
    notificationBusy,
    notificationRules,
  } = state;
  const {
    setNotificationBucketName,
    setNotificationConfig,
    setLambdaFunctionArn,
    setLambdaEvents,
    setLambdaNotificationId,
    loadBucketNotification,
    saveBucketNotification,
    configureBucketNotification,
    removeBucketNotification,
  } = actions;

  return (
    <div className="stage">
      <section className="panel bays">
        <header>
          <h2>SET NOTIFICATION</h2>
          <span className="count">PUT /bucket-notification</span>
        </header>
        {buckets.length === 0 ? (
          <p className="empty">Stamp a bay before you set notification.</p>
        ) : (
          <form className="form" onSubmit={saveBucketNotification}>
            <label>
              Bucket
              <select
                value={notificationBucketName}
                onChange={(e) => {
                  const bucketName = e.target.value;
                  setNotificationBucketName(bucketName);
                  loadBucketNotification(bucketName);
                }}
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
              Lambda function ARN
              <input
                value={lambdaFunctionArn}
                onChange={(e) => setLambdaFunctionArn(e.target.value)}
                placeholder="arn:aws:lambda:region:account:function:name"
              />
            </label>
            <label>
              Lambda events
              <textarea
                value={lambdaEvents.join("\n")}
                onChange={(e) =>
                  setLambdaEvents(
                    e.target.value
                      .split("\n")
                      .map((event) => event.trim())
                      .filter(Boolean),
                  )
                }
                rows={3}
              />
            </label>
            <label>
              Notification ID
              <input
                value={lambdaNotificationId}
                onChange={(e) => setLambdaNotificationId(e.target.value)}
              />
            </label>
            <label>
              Notification configuration
              <textarea
                value={notificationConfig}
                onChange={(e) => setNotificationConfig(e.target.value)}
                placeholder={
                  '{\n  "LambdaFunctionConfigurations": [],\n  "QueueConfigurations": [],\n  "TopicConfigurations": []\n}'
                }
                rows={6}
              />
            </label>
            <button
              className="primary"
              type="submit"
              disabled={notificationBusy || !notificationBucketName}
            >
              Save Notification
            </button>
            <button
              className="primary"
              type="button"
              disabled={
                notificationBusy ||
                !notificationBucketName ||
                !lambdaFunctionArn ||
                !lambdaEvents.length
              }
              onClick={configureBucketNotification}
            >
              Configure Notification
            </button>
            <button
              className="ghost"
              type="button"
              disabled={notificationBusy || !notificationBucketName || !notificationRules.length}
              onClick={removeBucketNotification}
            >
              Remove Notification
            </button>
          </form>
        )}
      </section>
      <section className="panel snaps">
        <header>
          <h2>RULES</h2>
          <span className="count">GET /bucket-notification</span>
        </header>
        {!notificationBucketName ? (
          <p className="empty">Pick a bay to load notification.</p>
        ) : notificationRules.length === 0 ? (
          <p className="empty">No notification rules on this bay.</p>
        ) : (
          notificationRules.map((rule, index) => (
            <div key={index} className="notification-rule">
              <strong>Rule {index + 1}</strong>
              <pre>{JSON.stringify(rule, null, 2)}</pre>
            </div>
          ))
        )}
      </section>
    </div>
  );
}