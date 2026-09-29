export default function NotificationScreen({ state, actions }) {
  const {
    buckets,
    notificationBucketName,
    notificationConfig,
    lambdaFunctionArn,
    lambdaEvents,
    lambdaNotificationId,
    queueArn,
    sqsMessages,
    sqsSetupResults,
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
    enableSqsObjectNotifications,
    loadSqsMessages,
    removeBucketNotification,
  } = actions;

  return (
    <div className="stage">
      <section className="panel bays">
        <header>
          <h2>SET NOTIFICATION</h2>
          <span className="count">
            PUT /api/bucketnotification · POST /api/bucketnotification/configure
          </span>
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
            <h3 className="subhead">SQS OBJECT UPLOAD</h3>
            <button
              className="primary"
              type="button"
              disabled={notificationBusy || buckets.length === 0}
              onClick={enableSqsObjectNotifications}
            >
              Enable SQS for All Existing Buckets
            </button>
            <label>
              Shared SQS queue ARN
              <input
                value={queueArn}
                readOnly
                placeholder="Enable object upload events to create the queue"
              />
            </label>
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
          <h2>RULES & MESSAGES</h2>
          <span className="count">GET /api/bucketnotification · GET /api/sqs-messages</span>
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
        {sqsSetupResults.length > 0 && (
          <div className="notification-results">
            {sqsSetupResults.map((result) => (
              <div key={result.bucketName} className="notification-rule">
                <strong>
                  {result.bucketName}: {result.success ? "configured" : "failed"}
                </strong>
                {result.error && <p>{result.error}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="notification-messages">
          <div className="subhead">
            <h3>SQS MESSAGES</h3>
            <button
              className="ghost"
              type="button"
              disabled={notificationBusy || !queueArn}
              onClick={loadSqsMessages}
            >
              Check Queue
            </button>
          </div>
          {sqsMessages.length === 0 ? (
            <p className="empty">
              {queueArn
                ? "Waiting for object-created messages..."
                : "Create or select a queue to view its messages."}
            </p>
          ) : (
            sqsMessages.map((message) => (
              <div key={message.messageId} className="notification-rule">
                <strong>{message.messageId}</strong>
                <pre>{message.body}</pre>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}