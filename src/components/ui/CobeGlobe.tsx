"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"
import { CITIES } from "../../data/cities"
import type { CityStatus } from "../../types"

interface CobeGlobeProps {
  className?: string
  speed?: number
  onRegionClick?: (cityId: string) => void
  cityStatuses?: Record<string, CityStatus>
}

const MARKERS = CITIES.map((c) => ({
  id: c.id,
  name: c.name,
  lat: c.lat,
  lng: c.lng,
}))

interface DotPos {
  id: string
  name: string
  x: number
  y: number
  visible: boolean
}

function cobeVec(lat: number, lng: number): [number, number, number] {
  const latR = lat * Math.PI / 180
  const lngR = lng * Math.PI / 180
  const cosLat = Math.cos(latR)
  return [cosLat * Math.cos(lngR), Math.sin(latR), -cosLat * Math.sin(lngR)]
}

function cobeProject(t: [number, number, number], phi: number, theta: number) {
  const a = Math.cos(phi), i = Math.sin(phi), r = Math.cos(theta), o = Math.sin(theta)
  const c = (a * t[0] + i * t[2]) * 0.8
  const s = (i * o * t[0] + r * t[1] - a * o * t[2]) * 0.8
  const vis = -i * r * t[0] + o * t[1] + a * r * t[2]
  return { x: (c + 1) / 2, y: (-s + 1) / 2, visible: vis >= 0 }
}

const ALERT_COLORS: Record<string, string> = {
  critical: '#e05252',
  warning:  '#e6a817',
  stable:   '#3d8b85',
}

const ALERT_DOTS: Record<string, string> = {
  critical: '🔴',
  warning:  '🟠',
  stable:   '🟢',
}

export default function CobeGlobe({
  className = "", speed = 0.001, onRegionClick, cityStatuses = {},
}: CobeGlobeProps) {
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
      if (width === 0 || globe) return

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
        const curPhi   = phi + phiOffsetRef.current + dragOffset.current.phi
        const curTheta = 0.2 + thetaOffsetRef.current + dragOffset.current.theta
        globe!.update({ phi: curPhi, theta: curTheta })

        if (frame++ % 2 === 0) {
          setDots(MARKERS.map((m) => {
            const vec  = cobeVec(m.lat, m.lng)
            const proj = cobeProject(vec, curPhi, curTheta)
            return { id: m.id, name: m.name, x: proj.x, y: proj.y, visible: proj.visible }
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

      {dots.map((dot) => {
        const status = cityStatuses[dot.id]
        const alertLevel = status?.alertLevel || 'stable'
        const pinColor = ALERT_COLORS[alertLevel]
        const isHovered = hoveredId === dot.id

        return (
          <button
            key={dot.id}
            onClick={() => onRegionClickRef.current?.(dot.id)}
            onMouseEnter={() => setHoveredId(dot.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              position: "absolute",
              left: `${dot.x * 100}%`,
              top:  `${dot.y * 100}%`,
              transform: "translate(-50%, -50%)",
              opacity: dot.visible ? 1 : 0,
              pointerEvents: dot.visible ? "auto" : "none",
              transition: "opacity 0.2s",
              background: "none", border: "none", padding: 6, cursor: "pointer",
            }}
          >
            {/* Pulse ring on hover */}
            {isHovered && (
              <span style={{
                position: "absolute", inset: -6, borderRadius: "50%",
                background: `${pinColor}25`,
                animation: "cobePulse 1.5s ease-out infinite",
                pointerEvents: "none",
              }} />
            )}
            {/* Critical alert ring */}
            {alertLevel === 'critical' && (
              <span style={{
                position: "absolute", inset: -4, borderRadius: "50%",
                border: `1.5px solid ${pinColor}`,
                animation: "criticalRing 2s ease-out infinite",
                pointerEvents: "none",
              }} />
            )}
            {/* Pin dot */}
            <span style={{
              display: "block",
              width: isHovered ? 14 : 11,
              height: isHovered ? 14 : 11,
              borderRadius: "50%",
              background: pinColor,
              border: "2.5px solid rgba(255,255,255,0.9)",
              boxShadow: `0 1px 6px rgba(0,0,0,0.25), 0 0 0 2px ${pinColor}30`,
              transition: "width 0.15s, height 0.15s, background 0.3s",
            }} />

            {/* Status badge tooltip */}
            {isHovered && status && (
              <div style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(26,39,52,0.95)",
                backdropFilter: "blur(8px)",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 600,
                padding: "7px 12px",
                borderRadius: 10,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.1)",
                pointerEvents: "none",
                animation: "tooltipFade 0.15s ease-out",
              }}>
                <div style={{ marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>{ALERT_DOTS[alertLevel]}</span>
                  <span style={{ fontWeight: 700 }}>{dot.name}</span>
                </div>
                {status.active > 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: 10 }}>
                    {status.active} active
                    {status.critical > 0 && (
                      <span style={{ color: '#e05252', fontWeight: 700 }}> · {status.critical} critical</span>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#3d8b85', fontSize: 10 }}>All clear</div>
                )}
                <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>Click to open dashboard</div>
              </div>
            )}

            {/* Fallback: name only when no status */}
            {isHovered && !status && (
              <div style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
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
              </div>
            )}
          </button>
        )
      })}



      <style>{`
        @keyframes cobePulse {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes criticalRing {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes tooltipFade {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
