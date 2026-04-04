"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import scenarios from "../../data/scenarios"

interface GlobeProps {
  width?: number
  height?: number
  className?: string
  onRegionClick?: (scenarioId: string) => void
}

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
  const onRegionClickRef = useRef(onRegionClick)

  // Keep the callback ref updated without re-running effect
  useEffect(() => {
    onRegionClickRef.current = onRegionClick
  }, [onRegionClick])

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

    // --- Point-in-polygon for dot generation ---
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

    // Track hovered region with a mutable ref (no state → no re-renders)
    let hoveredRegionId: string | null = null
    let pulsePhase = 0

    const render = () => {
      context.clearRect(0, 0, containerWidth, containerHeight)

      const currentScale = projection.scale()
      const scaleFactor = currentScale / radius

      // Globe sphere
      context.beginPath()
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI)
      context.fillStyle = "#000000"
      context.fill()
      context.strokeStyle = "rgba(255,255,255,0.12)"
      context.lineWidth = 1 * scaleFactor
      context.stroke()

      if (landFeatures) {
        // Graticule
        const graticule = d3.geoGraticule()
        context.beginPath()
        path(graticule())
        context.strokeStyle = "rgba(255,255,255,0.06)"
        context.lineWidth = 0.5 * scaleFactor
        context.stroke()

        // Land outlines
        context.beginPath()
        landFeatures.features.forEach((feature: any) => { path(feature) })
        context.strokeStyle = "rgba(255,255,255,0.2)"
        context.lineWidth = 0.8 * scaleFactor
        context.stroke()

        // Dots on land
        allDots.forEach((dot) => {
          const projected = projection([dot.lng, dot.lat])
          if (
            projected &&
            projected[0] >= 0 && projected[0] <= containerWidth &&
            projected[1] >= 0 && projected[1] <= containerHeight
          ) {
            context.beginPath()
            context.arc(projected[0], projected[1], 0.8 * scaleFactor, 0, 2 * Math.PI)
            context.fillStyle = "rgba(255,255,255,0.2)"
            context.fill()
          }
        })

        // City markers with pulse
        pulsePhase += 0.03
        REGIONS.forEach((region) => {
          const projected = projection(region.coordinates)
          if (!projected) return

          const d = d3.geoDistance(
            region.coordinates,
            [-projection.rotate()[0], -projection.rotate()[1]]
          )
          if (d > Math.PI / 2) return

          const pulse = Math.sin(pulsePhase) * 0.3 + 1
          const isHovered = hoveredRegionId === region.id

          // Outer pulse ring
          context.beginPath()
          context.arc(projected[0], projected[1], (isHovered ? 20 : 14) * pulse * scaleFactor, 0, 2 * Math.PI)
          context.fillStyle = isHovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"
          context.fill()

          // Inner dot
          context.beginPath()
          context.arc(projected[0], projected[1], (isHovered ? 5.5 : 4) * scaleFactor, 0, 2 * Math.PI)
          context.fillStyle = isHovered ? "#ffffff" : "rgba(255,255,255,0.9)"
          context.fill()

          // Label on hover
          if (isHovered) {
            context.font = `600 ${12 * scaleFactor}px Inter, system-ui, sans-serif`
            context.fillStyle = "#ffffff"
            context.textAlign = "center"
            context.fillText(region.label, projected[0], projected[1] - 16 * scaleFactor)

            // Sub-label
            context.font = `400 ${9 * scaleFactor}px Inter, system-ui, sans-serif`
            context.fillStyle = "rgba(255,255,255,0.6)"
            context.fillText("Click to explore →", projected[0], projected[1] - 16 * scaleFactor + 13 * scaleFactor)
          }
        })
      }
    }

    // Load world GeoJSON
    const loadWorldData = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json"
        )
        if (!response.ok) throw new Error("Failed to load")
        landFeatures = await response.json()
        landFeatures.features.forEach((feature: any) => {
          const dots = generateDotsInPolygon(feature, 16)
          dots.forEach(([lng, lat]) => allDots.push({ lng, lat }))
        })
        render()
      } catch {
        console.error("Failed to load globe data")
      }
    }

    // Rotation state (all mutable, no React state)
    const rotation: [number, number] = [0, 0]
    let autoRotate = true
    const rotationSpeed = 0.3

    const rotationTimer = d3.timer(() => {
      if (autoRotate) {
        rotation[0] += rotationSpeed
        projection.rotate(rotation)
      }
      render()
    })

    // Find region within click radius
    const findRegionAtPixel = (x: number, y: number): string | null => {
      for (const region of REGIONS) {
        const projected = projection(region.coordinates)
        if (!projected) continue
        // Check if region is on the visible side
        const d = d3.geoDistance(
          region.coordinates,
          [-projection.rotate()[0], -projection.rotate()[1]]
        )
        if (d > Math.PI / 2) continue
        const dist = Math.sqrt((projected[0] - x) ** 2 + (projected[1] - y) ** 2)
        if (dist < 25) return region.id
      }
      return null
    }

    // Click vs drag detection
    let dragStartX = 0
    let dragStartY = 0

    const handleMouseDown = (event: MouseEvent) => {
      dragStartX = event.clientX
      dragStartY = event.clientY
      autoRotate = false

      const startRotation: [number, number] = [...rotation]
      let didDrag = false

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - dragStartX
        const dy = moveEvent.clientY - dragStartY
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag = true

        rotation[0] = startRotation[0] + dx * 0.5
        rotation[1] = startRotation[1] - dy * 0.5
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]))
        projection.rotate(rotation)
      }

      const handleMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)

        if (!didDrag) {
          // This was a click, not a drag
          const rect = canvas.getBoundingClientRect()
          const x = upEvent.clientX - rect.left
          const y = upEvent.clientY - rect.top
          const regionId = findRegionAtPixel(x, y)
          if (regionId) {
            // Navigate!
            onRegionClickRef.current?.(regionId)
            return
          }
        }

        // Resume auto-rotation after a pause
        setTimeout(() => { autoRotate = true }, 2000)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    // Hover detection — updates mutable var, no React re-render
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const regionId = findRegionAtPixel(x, y)
      hoveredRegionId = regionId
      canvas.style.cursor = regionId ? "pointer" : "grab"
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const sf = event.deltaY > 0 ? 0.95 : 1.05
      const newScale = Math.max(radius * 0.5, Math.min(radius * 3, projection.scale() * sf))
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
  }, [width, height]) // No state in deps — everything is mutable inside

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  )
}
