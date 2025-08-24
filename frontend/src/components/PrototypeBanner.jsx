import { AlertTriangle } from 'lucide-react'

const PrototypeBanner = () => {
  return (
    <div className="prototype-banner animate-slide-up">
      <div className="flex items-center justify-center gap-3">
        <AlertTriangle size={18} className="animate-bounce-gentle" />
        <span className="font-bold tracking-wide">PROTOTYPE • SIMULATION ONLY • NOT FOR PRODUCTION</span>
        <AlertTriangle size={18} className="animate-bounce-gentle" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  )
}

export default PrototypeBanner