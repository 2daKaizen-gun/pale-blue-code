export default function Spinner() {
  return (
    <div className="flex items-center gap-3 text-cosmos-muted">
      <div className="w-4 h-4 border-2 border-cosmos-subtle border-t-cosmos-nebula rounded-full animate-spin" />
      <span className="text-sm font-mono tracking-wider">LOADING...</span>
    </div>
  )
}
