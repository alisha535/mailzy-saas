export default function AntigravityBar({ active, onToggle }) {
  if (!active) return null
  return (
    <div className="fixed bottom-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 animate-pulse z-[9999]" />
  )
}
