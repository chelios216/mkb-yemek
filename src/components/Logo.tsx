import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }

  // Logo dosyası yüklendikten sonra bu kısmı açın
  // return (
  //   <div className={`${sizeClasses[size]} ${className} relative`}>
  //     <Image
  //       src="/logo.png" // veya logo dosyanızın adı
  //       alt="Malkan Kanaat Yemek Logo"
  //       fill
  //       className="object-contain"
  //     />
  //   </div>
  // )

  // Geçici placeholder logo
  return (
    <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg`}>
      <span className="text-white font-bold text-xl">M</span>
    </div>
  )
}