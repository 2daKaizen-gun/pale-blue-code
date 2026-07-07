import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  delay?: number // ms — staggers cards that mount together
}

// Fade + slide-up on mount. The hunt result cards arrive asynchronously
// (BLS first, then vetting and KOI in parallel), so mounting alone already
// sequences them; the optional delay staggers cards that appear together.
export default function Reveal({ children, delay = 0 }: Props) {
  return (
    <div className="cosmos-reveal" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
