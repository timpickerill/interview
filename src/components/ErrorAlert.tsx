export function ErrorAlert({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
      <p className="font-medium">Something went wrong</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded border border-red-400 px-3 py-1 text-sm hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        >
          Try again
        </button>
      )}
    </div>
  )
}
