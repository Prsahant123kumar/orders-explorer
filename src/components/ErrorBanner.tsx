interface ErrorBannerProps {
  messages: string[];
  onDismiss: () => void;
}

export function ErrorBanner({ messages, onDismiss }: ErrorBannerProps) {
  if (messages.length === 0) return null;

  return (
    <div className="banner" role="alert">
      <div>
        <strong>Part of this link was not valid.</strong> The default view is shown for it.
        <ul>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
      <button type="button" className="btn small" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}