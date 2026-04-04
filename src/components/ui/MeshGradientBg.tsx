import { MeshGradient } from "@paper-design/shaders-react"
import { useEffect, useState } from "react"

interface MeshGradientBgProps {
  className?: string
}

export default function MeshGradientBg({ className = "" }: MeshGradientBgProps) {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  if (!mounted) return null

  return (
    <div className={`fixed inset-0 w-screen h-screen ${className}`}>
      <MeshGradient
        width={dimensions.width}
        height={dimensions.height}
        colors={["#72b9bb", "#b5d9d9", "#ffd1bd", "#ffebe0", "#8cc5b8", "#dbf4a4"]}
        distortion={1.2}
        swirl={0.6}
        grainMixer={0}
        grainOverlay={0}
        speed={0.8}
        offsetX={0.08}
      />
      {/* Subtle veil to soften the gradient */}
      <div className="absolute inset-0 pointer-events-none bg-white/20" />
    </div>
  )
}
