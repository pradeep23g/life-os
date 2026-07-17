type DataLabEmptyStateProps = {
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  emptyMessage?: string
}

function DataLabEmptyState({
  isLoading = false,
  isError = false,
  errorMessage,
  emptyMessage = 'No data available.',
}: DataLabEmptyStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-8 justify-center">
        <div className="h-4 w-4 rounded-full border-t-2 border-slate-400 animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Loading telemetry...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-rose-400">
          {errorMessage ?? 'Failed to load data.'}
        </p>
      </div>
    )
  }

  return (
    <div className="py-8 text-center">
      <p className="text-sm text-slate-500">{emptyMessage}</p>
    </div>
  )
}

export default DataLabEmptyState
