import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { CityConfig, FacilityPin, Report } from '../../types'

// Fix Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const URGENCY_COLORS = { emergency: '#e05252', today: '#e6a817', safe: '#3d8b85' }

function facilityIcon(type: FacilityPin['type']): L.DivIcon {
  const emojis = { hospital: '🏥', clinic: '🏥', school: '🏫', mosque: '🕌' }
  return L.divIcon({
    html: `<div style="font-size:18px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4))">${emojis[type]}</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function reportIcon(urgency: Report['urgency'], isNew: boolean): L.DivIcon {
  const color = URGENCY_COLORS[urgency]
  const pulse = isNew ? `animation:ripplePinOut 1.5s ease-out;` : ''
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.3);${pulse}"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

const FALLBACK_FACILITIES: Record<string, FacilityPin[]> = {
  gaza:      [{ id: 'f1', name: 'Al-Shifa Hospital', type: 'hospital', lat: 31.5215, lng: 34.4380 }],
  khartoum:  [{ id: 'f2', name: 'Khartoum Teaching Hospital', type: 'hospital', lat: 15.5522, lng: 32.5246 }],
  istanbul:  [{ id: 'f3', name: 'Istanbul University Hospital', type: 'hospital', lat: 41.0186, lng: 28.9537 }],
  karachi:   [{ id: 'f4', name: 'Jinnah Postgraduate Medical Centre', type: 'hospital', lat: 24.8738, lng: 67.0647 }],
  cairo:     [{ id: 'f5', name: 'Cairo University Hospital', type: 'hospital', lat: 30.0271, lng: 31.2109 }],
}

const facilityCache = new Map<string, FacilityPin[]>()

async function fetchFacilities(city: CityConfig): Promise<FacilityPin[]> {
  if (facilityCache.has(city.id)) return facilityCache.get(city.id)!

  const { lat, lng } = city
  const query = `[out:json][timeout:10];(node["amenity"="hospital"](around:20000,${lat},${lng});node["amenity"="clinic"](around:12000,${lat},${lng});node["amenity"="school"](around:10000,${lat},${lng});node["amenity"="place_of_worship"]["religion"="muslim"](around:8000,${lat},${lng}););out body;`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  
  try {
    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      { signal: controller.signal },
    )
    clearTimeout(timer)

    const text = await res.text()
    let data;
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error("Overpass returned XML/HTML (Rate limited or 504 Gateway Timeout)")
    }

    const pins = (data.elements as any[])
      .filter((el: any) => el.lat && el.lon)
      .slice(0, 60)
      .map((el: any) => ({
        id: `${el.type}-${el.id}`,
        name: el.tags?.name || el.tags?.['name:en'] || 'Unnamed facility',
        type: (el.tags?.amenity === 'place_of_worship' ? 'mosque' : el.tags?.amenity) as FacilityPin['type'],
        lat: el.lat,
        lng: el.lon,
      }))
    
    facilityCache.set(city.id, pins)
    return pins
  } catch (e) {
    clearTimeout(timer)
    console.log(`[${new Date().toISOString()}] Overpass API unavailable:`, (e as Error).message)
    const fallbacks = FALLBACK_FACILITIES[city.id] || []
    
    // Cache the fallbacks too so we don't re-spam Overpass on subsequent tab clicks
    facilityCache.set(city.id, fallbacks)
    return fallbacks
  }
}

interface LayerToggles {
  reports: boolean
  hospitals: boolean
  shelters: boolean
  mosques: boolean
  coverage: boolean
}

interface Props {
  city: CityConfig
  reports: Report[]
  newestId: string | null
  t: (k: string) => string
}

export default function LiveMap({ city, reports, newestId, t }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<L.Map | null>(null)
  const reportLayerRef = useRef<L.LayerGroup | null>(null)
  const facilityLayerRef = useRef<L.LayerGroup | null>(null)

  const [facilities, setFacilities]   = useState<FacilityPin[]>([])
  const [layers, setLayers]           = useState<LayerToggles>({
    reports: true, hospitals: true, shelters: true, mosques: true, coverage: false,
  })

  // Init map once per city
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }

    const map = L.map(el, { center: [city.lat, city.lng], zoom: city.zoom, zoomControl: true })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://osm.org">OpenStreetMap</a> contributors, © <a href="https://carto.com">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)

    reportLayerRef.current   = L.layerGroup().addTo(map)
    facilityLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    // Fetch facilities
    setFacilities([])
    fetchFacilities(city).then((pins) => {
      setFacilities(pins)
    })

    return () => { map.remove(); mapRef.current = null }
  }, [city.id])

  // Update report markers
  useEffect(() => {
    const layer = reportLayerRef.current
    if (!layer || !layers.reports) { layer?.clearLayers(); return }
    layer.clearLayers()
    reports.forEach((r) => {
      const marker = L.marker([r.lat, r.lng], { icon: reportIcon(r.urgency, r.id === newestId) })
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:180px">
          <div style="font-weight:700;font-size:13px;color:#1a2734;margin-bottom:4px">
            ${r.urgency === 'emergency' ? '🆘' : r.urgency === 'today' ? '⚠️' : '✅'} 
            ${r.type} — ${r.people} ${r.people === 1 ? 'person' : 'people'}
          </div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px">📍 ${r.neighborhood}</div>
          ${r.note ? `<div style="font-size:12px;color:#1a2734;font-style:italic">"${r.note}"</div>` : ''}
        </div>
      `)
      marker.addTo(layer)
    })
  }, [reports, layers.reports, newestId])

  // Update facility markers
  useEffect(() => {
    const layer = facilityLayerRef.current
    if (!layer) return
    layer.clearLayers()
    facilities.forEach((f) => {
      const show =
        (f.type === 'hospital' || f.type === 'clinic') && layers.hospitals ||
        f.type === 'school' && layers.shelters ||
        f.type === 'mosque' && layers.mosques
      if (!show) return
      const marker = L.marker([f.lat, f.lng], { icon: facilityIcon(f.type) })
      marker.bindPopup(`<div style="font-family:Inter,sans-serif"><b>${f.name}</b><br><small style="color:#6b7280">${f.type}</small></div>`)
      marker.addTo(layer)
    })
  }, [facilities, layers])

  function toggleLayer(key: keyof LayerToggles) {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Layer toggles */}
      <div className="glass-card" style={{ borderRadius: 14, padding: '8px 14px', display: 'flex', gap: 12, flexWrap: 'nowrap', overflowX: 'auto', alignItems: 'center' }}>
        {(Object.keys(layers) as (keyof LayerToggles)[]).map((key) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, color: '#1a2734', fontWeight: 500, whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={() => toggleLayer(key)}
              style={{ accentColor: '#3d8b85', width: 14, height: 14 }}
            />
            {t(`map.${key}`)}
          </label>
        ))}
      </div>

      {/* Map */}
      <div className="glass-card" style={{ borderRadius: 20, overflow: 'hidden', height: 'calc(100vh - 280px)', minHeight: 400, padding: 0 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <style>{`
        @keyframes ripplePinOut {
          0%   { box-shadow: 0 0 0 0 rgba(61,139,133,0.7); }
          70%  { box-shadow: 0 0 0 20px rgba(61,139,133,0); }
          100% { box-shadow: 0 0 0 0 rgba(61,139,133,0); }
        }
      `}</style>
    </div>
  )
}
