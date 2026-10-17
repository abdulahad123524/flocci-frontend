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
    snsError,
    snsBusy,
    snsTopicArn,
    snsTopicName,
    snsSuccess,
    snsEndpoint,
    snsProtocol,
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
    spendSQSTime,
    deleteSqsMessage,
    handleCreateSnsTopic,
    setSnsTopicName,
    setSnsEndPoint,
    setSnsProtocol,
    handleSnsSubcribe,
  } = actions;

  console.log(
    "=======",
    snsBusy,
    "=========",

    !snsTopicName?.trim(),
  );

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
              disabled={
                notificationBusy ||
                !notificationBucketName ||
                !notificationRules.length
              }
              onClick={removeBucketNotification}
            >
              Remove Notification
            </button>
            <button
              className="primary"
              type="button"
              disabled={notificationBusy}
              onClick={spendSQSTime}
            >
              {notificationBusy ? "Sending..." : "Send Test Message"}
            </button>
          </form>
        )}
      </section>
      <section className="panel sns-panel">
        <header>
          <h2>SNS TOPIC</h2>
          <span className="count">POST /api/sns/create-topic</span>
        </header>

        <p className="empty">
          Create an SNS topic to use as a destination for S3 notifications.
        </p>
        <form className="form" onSubmit={handleCreateSnsTopic}>
          <label>
            Topic Name
            <input
              value={snsTopicName}
              onChange={(event) => {
                setSnsTopicName(event.target.value);
              }}
              placeholder="floci-notifications"
              maxLength={256}
              required
            />
          </label>

          <button
            className="primary"
            type="submit"
            disabled={snsBusy || !snsTopicName?.trim()}
          >
            {snsBusy ? "Creating..." : "Create SNS Topic"}
          </button>
        </form>

        {snsError && <p className="error">{snsError}</p>}

        {snsSuccess && (
          <div className="notification-rule">
            <strong>{snsSuccess}</strong>
            <p>Topic: {snsTopicName?.trim()}</p>
            <label>
              Topic ARN
              <input value={snsTopicArn} readOnly />
            </label>
            <button
              className="ghost"
              type="button"
              onClick={() => {
                navigator.clipboard
                  .writeText(snsTopicArn)
                  .catch((error) => console.error("Copy failed:", error));
              }}
            >
              Copy Topic ARN
            </button>
          </div>
        )}

        <form className="form" onSubmit={handleSnsSubcribe}>
          <h3 className="subhead">SNS SUBSCRIPTION</h3>

          <label>
            Topic ARN
            <input
              value={snsTopicName}
              readOnly
              placeholder="Create an SNS topic first"
            />
          </label>

          <label>
            Protocol
            <select
              value={snsProtocol}
              onChange={(event) => setSnsProtocol(event.target.value)}
            >
              <option value="sqs">SQS Queue</option>
              <option value="email">Email</option>
              <option value="https">HTTPS Endpoint</option>
            </select>
          </label>

          <label>
            Subscriber Endpoint
            <input
              value={snsEndpoint}
              onChange={(event) => setSnsEndPoint(event.target.value)}
              placeholder={
                snsProtocol === "sqs"
                  ? "SQS queue ARN"
                  : snsProtocol === "email"
                    ? "your@email.com"
                    : "https://your-endpoint.example.com"
              }
              required
            />
          </label>

          <button
            className="primary"
            type="submit"
            disabled={snsBusy || !snsTopicName || !snsEndpoint.trim()}
          >
            {snsBusy ? "Subscribing..." : "Subscribe to Topic"}
          </button>
        </form>
      </section>

      <section className="panel snaps">
        <header>
          <h2>RULES & MESSAGES</h2>
          <span className="count">
            GET /api/bucketnotification · GET /api/sqs-messages
          </span>
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
                  {result.bucketName}:{" "}
                  {result.success ? "configured" : "failed"}
                </strong>
                {result.error && <p>{result.error}</p>}
              </div>
            ))}
          </div>
        )}
        {/* <div className="notification-messages">
          <div className="subhead">
            <h3>SQS MESSAGES</h3>
            <button
              className="ghost"
              type="button"
              disabled={notificationBusy || !queueArn}
              onClick={() => {
                console.log("hit multiple time ");
                loadSqsMessages();
              }}
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
        </div> */}

        <div className="notification-messages">
          <div className="subhead sqs-messages-header">
            <div>
              <h3>SQS MESSAGES</h3>
              <p>View S3 events and queue messages</p>
            </div>

            <button
              className="ghost"
              type="button"
              disabled={notificationBusy || !queueArn}
              onClick={loadSqsMessages}
            >
              {notificationBusy ? "Loading..." : "↻ Check Queue"}
            </button>
          </div>

          {!queueArn ? (
            <div className="sqs-empty">
              <span className="sqs-empty-icon">☷</span>
              <strong>No queue selected</strong>
              <p>Enable SQS notifications to view messages.</p>
            </div>
          ) : sqsMessages.length === 0 ? (
            <div className="sqs-empty">
              <span className="sqs-empty-icon">✉</span>
              <strong>No messages available</strong>
              <p>Upload an object to your S3 bucket, then check the queue.</p>
            </div>
          ) : (
            <>
              <div className="sqs-messages-summary">
                <span>
                  <span className="sqs-status-dot" />
                  {sqsMessages.length} message
                  {sqsMessages.length !== 1 ? "s" : ""} received
                </span>
                <span>Scroll to view all</span>
              </div>

              <div className="sqs-messages-list">
                {sqsMessages.map((message) => {
                  let body;

                  try {
                    body =
                      typeof message.body === "string"
                        ? JSON.parse(message.body)
                        : message.body;
                  } catch {
                    body = message.body;
                  }

                  const record = body?.Records?.[0];
                  const bucketName = record?.s3?.bucket?.name;
                  const objectKey = record?.s3?.object?.key;
                  const eventName = record?.eventName;
                  const isS3Event = Boolean(record?.s3);
                  const receiveCount =
                    message.attributes?.ApproximateReceiveCount;

                  return (
                    <article
                      key={message.messageId}
                      className="sqs-message-card"
                    >
                      <div className="sqs-message-top">
                        <div className="sqs-message-title">
                          <span
                            className={`sqs-event-badge ${
                              isS3Event ? "s3-event" : "manual-event"
                            }`}
                          >
                            {isS3Event ? "S3 EVENT" : "TEST MESSAGE"}
                          </span>

                          <span
                            className="sqs-message-id"
                            title={message.messageId}
                          >
                            {message.messageId}
                          </span>
                        </div>

                        {receiveCount && (
                          <span className="sqs-receive-count">
                            Received {receiveCount}×
                          </span>
                        )}
                      </div>

                      <div className="sqs-message-details">
                        {eventName && (
                          <div className="sqs-detail-item">
                            <span>Event</span>
                            <strong>{eventName}</strong>
                          </div>
                        )}

                        {bucketName && (
                          <div className="sqs-detail-item">
                            <span>Bucket</span>
                            <strong title={bucketName}>{bucketName}</strong>
                          </div>
                        )}

                        {objectKey && (
                          <div className="sqs-detail-item">
                            <span>Object</span>
                            <strong title={objectKey}>{objectKey}</strong>
                          </div>
                        )}

                        {!isS3Event && body?.source && (
                          <div className="sqs-detail-item">
                            <span>Source</span>
                            <strong>{body.source}</strong>
                          </div>
                        )}

                        {record?.s3?.object?.size != null && (
                          <div className="sqs-detail-item">
                            <span>Size</span>
                            <strong>
                              {(record.s3.object.size / 1024).toFixed(2)} KB
                            </strong>
                          </div>
                        )}

                        {record?.eventTime && (
                          <div className="sqs-detail-item">
                            <span>Event time</span>
                            <strong>
                              {new Date(record.eventTime).toLocaleString()}
                            </strong>
                          </div>
                        )}
                      </div>

                      <details className="sqs-message-json">
                        <summary>View message JSON</summary>
                        <pre>
                          {typeof body === "string"
                            ? body
                            : JSON.stringify(body, null, 2)}
                        </pre>
                      </details>

                      <div className="sqs-message-actions">
                        <button
                          className="danger"
                          type="button"
                          disabled={notificationBusy || !message.receiptHandle}
                          onClick={() => deleteSqsMessage(message)}
                        >
                          Delete
                        </button>
                        <button
                          className="ghost"
                          type="button"
                          onClick={() => {
                            const json =
                              typeof body === "string"
                                ? body
                                : JSON.stringify(body, null, 2);

                            navigator.clipboard
                              .writeText(json)
                              .catch((error) =>
                                console.error("Copy failed:", error),
                              );
                          }}
                        >
                          Copy JSON
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
