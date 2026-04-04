"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as d3 from "d3"
import scenarios from "../../data/scenarios"

interface GlobeProps {
  width?: number
  height?: number
  className?: string
  onRegionClick?: (scenarioId: string) => void
}

// Define clickable regions with their scenario IDs
const REGIONS = scenarios.map((s) => ({
  id: s.id,
  label: s.region,
  coordinates: s.coordinates as [number, number],
}))

export default function Globe({
  width = 800,
  height = 600,
  className = "",
  onRegionClick,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  const handleRegionClick = useCallback(
    (id: string) => {
      onRegionClick?.(id)
    },
    [onRegionClick]
  )

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    const containerWidth = Math.min(width, window.innerWidth - 40)
    const containerHeight = Math.min(height, window.innerHeight - 100)
    const radius = Math.min(containerWidth, containerHeight) / 2.5

    const dpr = window.devicePixelRatio || 1
    canvas.width = containerWidth * dpr
    canvas.height = containerHeight * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`
    context.scale(dpr, dpr)

    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90)

    const path = d3.geoPath().projection(projection).context(context)

    const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
      const [x, y] = point
      let inside = false
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]
        const [xj, yj] = polygon[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside
        }
      }
      return inside
    }

    const pointInFeature = (point: [number, number], feature: any): boolean => {
      const geometry = feature.geometry
      if (geometry.type === "Polygon") {
        if (!pointInPolygon(point, geometry.coordinates[0])) return false
        for (let i = 1; i < geometry.coordinates.length; i++) {
          if (pointInPolygon(point, geometry.coordinates[i])) return false
        }
        return true
      } else if (geometry.type === "MultiPolygon") {
        for (const polygon of geometry.coordinates) {
          if (pointInPolygon(point, polygon[0])) {
            let inHole = false
            for (let i = 1; i < polygon.length; i++) {
              if (pointInPolygon(point, polygon[i])) { inHole = true; break }
            }
            if (!inHole) return true
          }
        }
      }
      return false
    }

    const generateDotsInPolygon = (feature: any, dotSpacing = 16) => {
      const dots: [number, number][] = []
      const bounds = d3.geoBounds(feature)
      const [[minLng, minLat], [maxLng, maxLat]] = bounds
      const stepSize = dotSpacing * 0.08
      for (let lng = minLng; lng <= maxLng; lng += stepSize) {
        for (let lat = minLat; lat <= maxLat; lat += stepSize) {
          const point: [number, number] = [lng, lat]
          if (pointInFeature(point, feature)) dots.push(point)
        }
      }
      return dots
    }

    interface DotData { lng: number; lat: number }
    const allDots: DotData[] = []
    let landFeatures: any

    // Pulse animation
    let pulsePhase = 0

    const render = () => {
      context.clearRect(0, 0, containerWidth, containerHeight)

      const currentScale = projection.scale()
      const scaleFactor = currentScale / radius

      // Globe background
      context.beginPath()
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI)
      context.fillStyle = "#000000"
      context.fill()
      context.strokeStyle = "rgba(255,255,255,0.15)"
      context.lineWidth = 1 * scaleFactor
      context.stroke()

      if (landFeatures) {
        // Graticule
        const graticule = d3.geoGraticule()
        context.beginPath()
        path(graticule())
        context.strokeStyle = "rgba(255,255,255,0.08)"
        context.lineWidth = 0.5 * scaleFactor
        context.stroke()

        // Land outlines
        context.beginPath()
        landFeatures.features.forEach((feature: any) => { path(feature) })
        context.strokeStyle = "rgba(255,255,255,0.25)"
        context.lineWidth = 0.8 * scaleFactor
        context.stroke()

        // Dots
        allDots.forEach((dot) => {
          const projected = projection([dot.lng, dot.lat])
          if (projected && projected[0] >= 0 && projected[0] <= containerWidth && projected[1] >= 0 && projected[1] <= containerHeight) {
            context.beginPath()
            context.arc(projected[0], projected[1], 0.8 * scaleFactor, 0, 2 * Math.PI)
            context.fillStyle = "rgba(255,255,255,0.25)"
            context.fill()
          }
        })

        // City markers
        pulsePhase += 0.03
        REGIONS.forEach((region) => {
          const projected = projection(region.coordinates)
          if (!projected) return

          const d = d3.geoDistance(
            region.coordinates,
            [-projection.rotate()[0], -projection.rotate()[1]]
          )
          if (d > Math.PI / 2) return // behind globe

          const pulse = Math.sin(pulsePhase) * 0.3 + 1
          const isHovered = hoveredRegion === region.id

          // Outer pulse ring
          context.beginPath()
          context.arc(projected[0], projected[1], (isHovered ? 18 : 12) * pulse * scaleFactor, 0, 2 * Math.PI)
          context.fillStyle = isHovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)"
          context.fill()

          // Inner dot
          context.beginPath()
          context.arc(projected[0], projected[1], (isHovered ? 5 : 3.5) * scaleFactor, 0, 2 * Math.PI)
          context.fillStyle = isHovered ? "#ffffff" : "rgba(255,255,255,0.85)"
          context.fill()

          // Label
          if (isHovered) {
            context.font = `${11 * scaleFactor}px Inter, system-ui, sans-serif`
            context.fillStyle = "#ffffff"
            context.textAlign = "center"
            context.fillText(region.label, projected[0], projected[1] - 14 * scaleFactor)
          }
        })
      }
    }

    const loadWorldData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json"
        )
        if (!response.ok) throw new Error("Failed to load land data")
        landFeatures = await response.json()
        landFeatures.features.forEach((feature: any) => {
          const dots = generateDotsInPolygon(feature, 16)
          dots.forEach(([lng, lat]) => allDots.push({ lng, lat }))
        })
        render()
        setIsLoading(false)
      } catch {
        setError("Failed to load globe data. Check your internet connection.")
        setIsLoading(false)
      }
    }

    const rotation: [number, number] = [0, 0]
    let autoRotate = true
    const rotationSpeed = 0.3

    const animate = () => {
      if (autoRotate) {
        rotation[0] += rotationSpeed
        projection.rotate(rotation)
      }
      render()
    }

    const rotationTimer = d3.timer(animate)

    // Click detection for regions
    const findRegionAtPixel = (x: number, y: number): string | null => {
      for (const region of REGIONS) {
        const projected = projection(region.coordinates)
        if (!projected) continue
        const dist = Math.sqrt((projected[0] - x) ** 2 + (projected[1] - y) ** 2)
        if (dist < 20) return region.id
      }
      return null
    }

    let isDragging = false
    let dragStartX = 0
    let dragStartY = 0

    const handleMouseDown = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      dragStartX = event.clientX
      dragStartY = event.clientY
      isDragging = false
      autoRotate = false

      const startRotation: [number, number] = [...rotation]

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - dragStartX
        const dy = moveEvent.clientY - dragStartY
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging = true

        rotation[0] = startRotation[0] + dx * 0.5
        rotation[1] = startRotation[1] - dy * 0.5
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]))
        projection.rotate(rotation)
      }

      const handleMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)

        if (!isDragging) {
          const rect = canvas.getBoundingClientRect()
          const x = upEvent.clientX - rect.left
          const y = upEvent.clientY - rect.top
          const regionId = findRegionAtPixel(x, y)
          if (regionId) handleRegionClick(regionId)
        }

        setTimeout(() => { autoRotate = true }, 2000)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const regionId = findRegionAtPixel(x, y)
      setHoveredRegion(regionId)
      canvas.style.cursor = regionId ? "pointer" : "grab"
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const scaleFactor = event.deltaY > 0 ? 0.95 : 1.05
      const newScale = Math.max(radius * 0.5, Math.min(radius * 3, projection.scale() * scaleFactor))
      projection.scale(newScale)
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("wheel", handleWheel, { passive: false })

    loadWorldData()

    return () => {
      rotationTimer.stop()
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("wheel", handleWheel)
    }
  }, [width, height, handleRegionClick, hoveredRegion])

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <p className="text-red-400 font-medium mb-2">Error loading globe</p>
          <p className="text-neutral-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  )
}
