"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"
import scenarios from "../../data/scenarios"

interface CobeGlobeProps {
  className?: string
  speed?: number
  onRegionClick?: (scenarioId: string) => void
}

const MARKERS = scenarios.map((s) => ({
  id: s.id,
  name: s.region,
  lat: s.coordinates[1],
  lng: s.coordinates[0],
}))

interface DotPos {
  id: string
  name: string
  x: number  // 0..1 fraction of canvas width
  y: number  // 0..1 fraction of canvas height
  visible: boolean
}

// Matches cobe's exact internal U() function:
// var{sin:le,cos:_e}=Math; U([lat,lng]) => [-cos(lat)*cos(lngA), sin(lat), cos(lat)*sin(lngA)]
// where lngA = lng*PI/180 - PI
// Expanding: cos(lngA)=cos(lng-π)=-cos(lng), sin(lngA)=sin(lng-π)=-sin(lng)
// → x = cos(lat)*cos(lng),  y = sin(lat),  z = -cos(lat)*sin(lng)
function cobeVec(lat: number, lng: number): [number, number, number] {
  const latR = lat * Math.PI / 180
  const lngR = lng * Math.PI / 180
  const cosLat = Math.cos(latR)
  return [
    cosLat * Math.cos(lngR),   // x
    Math.sin(latR),             // y
    -cosLat * Math.sin(lngR),  // z — NEGATED vs standard spherical coords
  ]
}

// Matches cobe's O(t) function exactly (B=1, T=[0,0] defaults)
// f=phi, l=theta, a=cos(phi), i=sin(phi), r=cos(theta), o=sin(theta)
function cobeProject(t: [number, number, number], phi: number, theta: number): { x: number; y: number; visible: boolean } {
  const a = Math.cos(phi)
  const i = Math.sin(phi)
  const r = Math.cos(theta)
  const o = Math.sin(theta)
  const c = (a * t[0] + i * t[2]) * 0.8        // scale by cobe's ee=0.8 globe fill ratio
  const s = (i * o * t[0] + r * t[1] - a * o * t[2]) * 0.8
  const vis = -i * r * t[0] + o * t[1] + a * r * t[2]
  return {
    x: (c + 1) / 2,
    y: (-s + 1) / 2,
    visible: vis >= 0,  // only show on front face — no edge-bleed
  }
}

export default function CobeGlobe({ className = "", speed = 0.001, onRegionClick }: CobeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)
  const onRegionClickRef = useRef(onRegionClick)
  const [dots, setDots] = useState<DotPos[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => { onRegionClickRef.current = onRegionClick }, [onRegionClick])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        }
      }
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let globe: ReturnType<typeof createGlobe> | null = null
    let animId: number
    let phi = 0
    let frame = 0

    function init() {
      const width = canvas!.offsetWidth
      if (width === 0) return
      if (globe) return

      globe = createGlobe(canvas!, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width, height: width,
        phi: 0, theta: 0.2,
        dark: 0, diffuse: 1.5,
        mapSamples: 16000, mapBrightness: 10,
        baseColor: [1, 1, 1],
        markerColor: [0.1, 0.2, 0.45],
        glowColor: [0.94, 0.93, 0.91],
        markerElevation: 0,
        markers: [],
        opacity: 0.7,
      })

      function animate() {
        if (!isPausedRef.current) phi += speed
        const curPhi = phi + phiOffsetRef.current + dragOffset.current.phi
        const curTheta = 0.2 + thetaOffsetRef.current + dragOffset.current.theta

        globe!.update({ phi: curPhi, theta: curTheta })

        // Update dot positions every 2 frames
        if (frame++ % 2 === 0) {
          setDots(MARKERS.map((m) => {
            const vec = cobeVec(m.lat, m.lng)
            const proj = cobeProject(vec, curPhi, curTheta)
            return {
              id: m.id, name: m.name,
              x: proj.x,   // fraction 0..1
              y: proj.y,
              visible: proj.visible,
            }
          }))
        }

        animId = requestAnimationFrame(animate)
      }
      animate()
      setTimeout(() => canvas && (canvas.style.opacity = "1"))
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) { ro.disconnect(); init() }
      })
      ro.observe(canvas)
    }

    return () => { cancelAnimationFrame(animId); globe?.destroy() }
  }, [speed])

  return (
    <div ref={containerRef} className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%", height: "100%",
          cursor: "grab", opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%", touchAction: "none",
        }}
      />

      {/* Dots positioned as percentage of the container (matching cobe's 0..1 output) */}
      {dots.map((dot) => (
        <button
          key={dot.id}
          onClick={() => onRegionClickRef.current?.(dot.id)}
          onMouseEnter={() => setHoveredId(dot.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            position: "absolute",
            left: `${dot.x * 100}%`,
            top: `${dot.y * 100}%`,
            transform: "translate(-50%, -50%)",
            opacity: dot.visible ? 1 : 0,
            pointerEvents: dot.visible ? "auto" : "none",
            transition: "opacity 0.2s",
            background: "none",
            border: "none",
            padding: 4,  // extra hit area
            cursor: "pointer",
          }}
        >
          {/* Pulsing ring on hover */}
          {hoveredId === dot.id && (
            <span style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              background: "rgba(26,26,46,0.2)",
              animation: "cobePulse 1.5s ease-out infinite",
              pointerEvents: "none",
            }} />
          )}
          {/* The dot */}
          <span style={{
            display: "block",
            width: hoveredId === dot.id ? 13 : 10,
            height: hoveredId === dot.id ? 13 : 10,
            borderRadius: "50%",
            background: "#1a1a2e",
            border: "2.5px solid rgba(255,255,255,0.85)",
            boxShadow: "0 1px 6px rgba(0,0,0,0.25)",
            transition: "width 0.15s, height 0.15s",
          }} />
          {/* Tooltip on hover */}
          {hoveredId === dot.id && (
            <span style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#1a1a2e",
              color: "#fff",
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0.3rem 0.7rem",
              borderRadius: 5,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              pointerEvents: "none",
            }}>
              {dot.name}
            </span>
          )}
        </button>
      ))}

      <style>{`
        @keyframes cobePulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
