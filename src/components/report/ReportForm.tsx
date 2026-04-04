import { useState, useRef } from 'react'
import type { NeedType, Urgency, Lang } from '../../types'
import { CITIES } from '../../data/cities'
import { addReport } from '../../data/reportStore'
import { useLang, isRTL, LANG_LABELS } from '../../i18n'

const NEED_OPTIONS: { type: NeedType; emoji: string; key: string }[] = [
  { type: 'Water',      emoji: '🚰', key: 'need.Water' },
  { type: 'Medical',    emoji: '🏥', key: 'need.Medical' },
  { type: 'Shelter',    emoji: '⛺', key: 'need.Shelter' },
  { type: 'Food',       emoji: '🍞', key: 'need.Food' },
  { type: 'Evacuation', emoji: '🚗', key: 'need.Evacuation' },
  { type: 'Safety',     emoji: '🆘', key: 'need.Safety' },
]

const URGENCY_OPTIONS: { urgency: Urgency; key: string; color: string; bg: string }[] = [
  { urgency: 'safe',      key: 'form.safe',      color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  { urgency: 'today',     key: 'form.today',     color: '#e6a817', bg: 'rgba(230,168,23,0.08)' },
  { urgency: 'emergency', key: 'form.emergency', color: '#e05252', bg: 'rgba(224,82,82,0.1)'  },
]

function makeId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

interface Props {
  onBack: () => void
  lang: Lang
  onLangChange: (l: Lang) => void
}

type Step = 1 | 2 | 3 | 4 | 5

export default function ReportForm({ onBack, lang, onLangChange }: Props) {
  const t   = useLang(lang)
  const rtl = isRTL(lang)

  const [step, setStep]           = useState<Step>(1)
  const [needs, setNeeds]         = useState<NeedType[]>([])
  const [urgency, setUrgency]     = useState<Urgency | null>(null)
  const [people, setPeople]       = useState(1)
  const [note, setNote]           = useState('')
  const [cityId, setCityId]       = useState(CITIES[0].id)
  const [shareLocation, setShareLocation] = useState(false)
  const [location, setLocation]   = useState<{ lat: number; lng: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [refId, setRefId]         = useState('')
  const [voiceActive, setVoiceActive] = useState(false)

  const noteRef = useRef<HTMLTextAreaElement>(null)

  function toggleNeed(type: NeedType) {
    setNeeds((prev) =>
      prev.includes(type) ? prev.filter((n) => n !== type) : [...prev, type],
    )
  }

  function handleLocationToggle() {
    if (!shareLocation) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          // Round to 3dp for privacy
          setLocation({
            lat: Math.round(pos.coords.latitude * 1000) / 1000,
            lng: Math.round(pos.coords.longitude * 1000) / 1000,
          })
        },
        () => setLocation(null),
      )
    } else {
      setLocation(null)
    }
    setShareLocation((v) => !v)
  }

  function handleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice input not supported in this browser.'); return }
    const rec = new SR()
    rec.lang = lang === 'ar' ? 'ar-SA' : lang === 'ur' ? 'ur-PK' : lang === 'tr' ? 'tr-TR' : 'en-US'
    rec.continuous = false
    setVoiceActive(true)
    rec.start()
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setNote((prev) => prev + (prev ? ' ' : '') + transcript + ' (voice)')
      setVoiceActive(false)
    }
    rec.onerror = () => setVoiceActive(false)
    rec.onend   = () => setVoiceActive(false)
  }

  async function handleSubmit() {
    if (needs.length === 0 || !urgency) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))

    const city = CITIES.find((c) => c.id === cityId)!
    const jitter = () => (Math.random() - 0.5) * 0.04
    const lat = location ? location.lat : city.lat + jitter()
    const lng = location ? location.lng : city.lng + jitter()

    const id = makeId()
    addReport({
      id,
      type: needs[0],
      urgency,
      people,
      note,
      neighborhood: 'Submitted via form',
      timestamp: Date.now(),
      lat, lng,
      status: 'active',
      cityId,
    })

    setRefId(id)
    setSubmitting(false)
    setSubmitted(true)
  }

  const canProceed = [
    needs.length > 0,
    urgency !== null,
    true,
    true,
    true,
  ][step - 1]

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0d1b2a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden',
      }} dir={rtl ? 'rtl' : 'ltr'}>
        {/* Ripple rings */}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 40, height: 40,
            border: '2px solid rgba(61,139,133,0.6)',
            borderRadius: '50%',
            animation: `rippleSuccess 2.4s ${i * 0.5}s ease-out infinite`,
          }} />
        ))}

        <div style={{
          position: 'relative', zIndex: 1,
          textAlign: 'center', padding: 32, maxWidth: 360,
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {t('success.title')}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 6 }}>
            {t('success.ref')} <strong style={{ color: '#3d8b85' }}>{refId}</strong>
          </p>
          <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 28 }}>
            {t('success.help')}
          </p>
          <button
            onClick={() => { setSubmitted(false); setStep(1); setNeeds([]); setUrgency(null); setPeople(1); setNote('') }}
            style={{
              display: 'block', width: '100%', padding: '14px 0', borderRadius: 14,
              background: '#3d8b85', color: '#fff', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: 'pointer', marginBottom: 10,
            }}
          >
            {t('success.another')}
          </button>
          <button
            onClick={onBack}
            style={{
              display: 'block', width: '100%', padding: '14px 0', borderRadius: 14,
              background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
              fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
            }}
          >
            {t('success.back')}
          </button>
        </div>

        <style>{`
          @keyframes rippleSuccess {
            0%   { transform: scale(1);  opacity: 0.8; }
            100% { transform: scale(12); opacity: 0; }
          }
        `}</style>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#0d1b2a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif', padding: 16,
    }} dir={rtl ? 'rtl' : 'ltr'}>

      <div style={{
        width: '100%', maxWidth: 480,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 24, overflow: 'hidden',
      }}>

        {/* Top bar */}
        <div style={{
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <button key={l} onClick={() => onLangChange(l)} style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                background: lang === l ? '#3d8b85' : 'rgba(255,255,255,0.1)',
                border: lang === l ? '1px solid #3d8b85' : '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
              }}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: step === s ? '#3d8b85' : step > s ? 'rgba(61,139,133,0.4)' : 'rgba(255,255,255,0.2)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 24px 20px' }}>
          {/* Step 1 — Need type */}
          {step === 1 && (
            <>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t('form.step1')}</h2>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>Select all that apply</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {NEED_OPTIONS.map(({ type, emoji, key }) => {
                  const sel = needs.includes(type)
                  return (
                    <button key={type} onClick={() => toggleNeed(type)} style={{
                      height: 80, borderRadius: 14, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: sel ? 'rgba(61,139,133,0.2)' : 'rgba(255,255,255,0.06)',
                      border: sel ? '2px solid #3d8b85' : '2px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 32 }}>{emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sel ? '#3d8b85' : '#cbd5e1' }}>
                        {t(key)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Step 2 — Urgency */}
          {step === 2 && (
            <>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{t('form.step2')}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {URGENCY_OPTIONS.map(({ urgency: u, key, color, bg }) => {
                  const sel = urgency === u
                  return (
                    <button key={u} onClick={() => setUrgency(u)} style={{
                      padding: '16px 20px', borderRadius: 14, textAlign: rtl ? 'right' : 'left',
                      background: sel ? bg : 'rgba(255,255,255,0.06)',
                      border: `2px solid ${sel ? color : 'rgba(255,255,255,0.1)'}`,
                      color: sel ? color : '#cbd5e1',
                      fontSize: 14, fontWeight: sel ? 700 : 500, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                      {t(key)}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Step 3 — People count */}
          {step === 3 && (
            <>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{t('form.step3')}</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 32 }}>
                <button onClick={() => setPeople((v) => Math.max(1, v - 1))} style={{
                  width: 52, height: 52, borderRadius: '50%', fontSize: 24,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', cursor: 'pointer',
                }}>−</button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{people}</div>
                  <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>{t('form.people')}</div>
                </div>
                <button onClick={() => setPeople((v) => Math.min(999, v + 1))} style={{
                  width: 52, height: 52, borderRadius: '50%', fontSize: 24,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', cursor: 'pointer',
                }}>+</button>
              </div>
            </>
          )}

          {/* Step 4 — Note */}
          {step === 4 && (
            <>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{t('form.step4')}</h2>
              <textarea
                ref={noteRef}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                placeholder={t('form.note_placeholder')}
                rows={4}
                style={{
                  width: '100%', borderRadius: 12, padding: '12px 14px',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: 14, resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.5,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <button onClick={handleVoice} style={{
                  fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                  background: voiceActive ? '#e05252' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
                  animation: voiceActive ? 'voicePulse 1s ease-in-out infinite' : undefined,
                }}>
                  {t('form.voice')} {voiceActive ? '●' : ''}
                </button>
                <span style={{ fontSize: 11, color: '#64748b' }}>{note.length}/280</span>
              </div>
            </>
          )}

          {/* Step 5 — Location */}
          {step === 5 && (
            <>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{t('form.step5')}</h2>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer', marginBottom: 14,
              }}>
                <input type="checkbox" checked={shareLocation} onChange={handleLocationToggle}
                  style={{ width: 18, height: 18, accentColor: '#3d8b85' }} />
                <span style={{ color: '#cbd5e1', fontSize: 14, fontWeight: 500 }}>
                  {t('form.location_toggle')}
                </span>
              </label>

              {location && (
                <div style={{ fontSize: 12, color: '#3d8b85', marginBottom: 12, fontWeight: 500 }}>
                  📍 {location.lat}, {location.lng} (approximate)
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{t('form.city_select')}</div>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', fontSize: 14, outline: 'none',
                  }}
                >
                  {CITIES.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {step > 1 && (
              <button onClick={() => setStep((s) => (s - 1) as Step)} style={{
                flex: '0 0 auto', padding: '14px 18px', borderRadius: 14,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
                {t('form.back')}
              </button>
            )}
            {step < 5 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canProceed}
                style={{
                  flex: 1, padding: '14px 0', borderRadius: 14,
                  background: canProceed ? '#3d8b85' : 'rgba(61,139,133,0.3)',
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  border: 'none', cursor: canProceed ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
              >
                {t('form.next')}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 1, padding: '14px 0', borderRadius: 14,
                  background: submitting ? 'rgba(61,139,133,0.5)' : '#3d8b85',
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? t('form.submitting') : t('form.submit')}
              </button>
            )}
          </div>

          {/* Privacy notice */}
          <p style={{ fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
            {t('form.privacy')}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes voicePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
