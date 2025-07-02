interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Background circle */}
        <circle cx="50" cy="50" r="45" fill="#3B82F6" stroke="#1E40AF" strokeWidth="2"/>
        
        {/* Money/coins */}
        <circle cx="35" cy="40" r="12" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
        <circle cx="55" cy="35" r="10" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5"/>
        <circle cx="65" cy="55" r="8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5"/>
        
        {/* ETB symbols */}
        <text x="35" y="45" fontSize="8" fill="#F59E0B" textAnchor="middle" fontWeight="bold">ETB</text>
        <text x="55" y="39" fontSize="6" fill="#F59E0B" textAnchor="middle" fontWeight="bold">ETB</text>
        
        {/* Arrow indicating flow/tracking */}
        <path 
          d="M25 65 L45 65 M40 60 L45 65 L40 70" 
          stroke="#FFFFFF" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M55 65 L75 65 M70 60 L75 65 L70 70" 
          stroke="#FFFFFF" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">እዳ</span>
        <span className="text-xs text-gray-600 dark:text-gray-400 -mt-1">Tracker</span>
      </div>
    </div>
  )
} 