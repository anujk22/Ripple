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

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }} dir={rtl ? 'rtl' : 'ltr'}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 40, height: 40,
            border: '2px solid rgba(61,139,133,0.6)',
            borderRadius: '50%',
            animation: `rippleSuccess 2.4s ${i * 0.5}s ease-out infinite`,
          }} />
        ))}
        <div className="glass-card" style={{
          position: 'relative', zIndex: 1,
          textAlign: 'center', padding: '40px 32px', maxWidth: 380, width: '100%',
          borderRadius: 24, boxShadow: '0 8px 32px rgba(61,139,133,0.15)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#1a2734', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            {t('success.title')}
          </h2>
          <p style={{ color: '#4b5563', fontSize: 15, marginBottom: 6 }}>
            {t('success.ref')} <strong style={{ color: '#3d8b85' }}>{refId}</strong>
          </p>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>
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
              background: 'rgba(255,255,255,0.7)', color: '#4b5563',
              fontWeight: 600, fontSize: 14, border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer',
            }}
          >
            {t('success.back')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} dir={rtl ? 'rtl' : 'ltr'}>

      <div className="glass-card" style={{
        width: '100%', maxWidth: 480,
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
      }}>
        {/* Top bar */}
        <div style={{
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <button key={l} onClick={() => onLangChange(l)} style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 14, cursor: 'pointer',
                background: lang === l ? '#3d8b85' : 'rgba(255,255,255,0.5)',
                border: lang === l ? '1px solid #3d8b85' : '1px solid rgba(0,0,0,0.1)',
                color: lang === l ? '#fff' : '#4b5563',
              }}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: step === s ? '#3d8b85' : step > s ? 'rgba(61,139,133,0.3)' : 'rgba(0,0,0,0.1)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 24px 20px' }}>
          {/* Step 1 */}
          {step === 1 && (
            <>
              <h2 style={{ color: '#1a2734', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{t('form.step1')}</h2>
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>Select all that apply</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {NEED_OPTIONS.map(({ type, emoji, key }) => {
                  const sel = needs.includes(type)
                  return (
                    <button key={type} onClick={() => toggleNeed(type)} style={{
                      height: 80, borderRadius: 16, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: sel ? 'rgba(61,139,133,0.1)' : 'rgba(255,255,255,0.5)',
                      border: sel ? '2px solid #3d8b85' : '1px solid rgba(0,0,0,0.06)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 32 }}>{emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sel ? '#3d8b85' : '#4b5563' }}>
                        {t(key)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <h2 style={{ color: '#1a2734', fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{t('form.step2')}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {URGENCY_OPTIONS.map(({ urgency: u, key, color, bg }) => {
                  const sel = urgency === u
                  return (
                    <button key={u} onClick={() => setUrgency(u)} style={{
                      padding: '16px 20px', borderRadius: 16, textAlign: rtl ? 'right' : 'left',
                      background: sel ? bg : 'rgba(255,255,255,0.5)',
                      border: sel ? `2px solid ${color}` : '1px solid rgba(0,0,0,0.06)',
                      color: sel ? color : '#4b5563',
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

          {/* Step 3 */}
          {step === 3 && (
            <>
              <h2 style={{ color: '#1a2734', fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{t('form.step3')}</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 32 }}>
                <button onClick={() => setPeople((v) => Math.max(1, v - 1))} style={{
                  width: 52, height: 52, borderRadius: '50%', fontSize: 24,
                  background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.1)',
                  color: '#1a2734', cursor: 'pointer',
                }}>−</button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 52, fontWeight: 800, color: '#1a2734', lineHeight: 1 }}>{people}</div>
                  <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{t('form.people')}</div>
                </div>
                <button onClick={() => setPeople((v) => Math.min(999, v + 1))} style={{
                  width: 52, height: 52, borderRadius: '50%', fontSize: 24,
                  background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.1)',
                  color: '#1a2734', cursor: 'pointer',
                }}>+</button>
              </div>
            </>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <>
              <h2 style={{ color: '#1a2734', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>{t('form.step4')}</h2>
              <textarea
                ref={noteRef}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                placeholder={t('form.note_placeholder')}
                rows={4}
                style={{
                  width: '100%', borderRadius: 14, padding: '14px 16px',
                  background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)',
                  color: '#1a2734', fontSize: 14, resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.5,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <button onClick={handleVoice} style={{
                  fontSize: 12, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 600,
                  background: voiceActive ? '#e05252' : 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  color: voiceActive ? '#fff' : '#4b5563',
                  animation: voiceActive ? 'voicePulse 1s ease-in-out infinite' : undefined,
                }}>
                  {t('form.voice')} {voiceActive ? '●' : ''}
                </button>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{note.length}/280</span>
              </div>
            </>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <>
              <h2 style={{ color: '#1a2734', fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{t('form.step5')}</h2>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 14, padding: '16px', cursor: 'pointer', marginBottom: 14,
              }}>
                <input type="checkbox" checked={shareLocation} onChange={handleLocationToggle}
                  style={{ width: 18, height: 18, accentColor: '#3d8b85' }} />
                <span style={{ color: '#1a2734', fontSize: 14, fontWeight: 600 }}>
                  {t('form.location_toggle')}
                </span>
              </label>

              {location && (
                <div style={{ fontSize: 12, color: '#3d8b85', marginBottom: 12, fontWeight: 600 }}>
                  📍 {location.lat}, {location.lng} (approximate)
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>{t('form.city_select')}</div>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.1)',
                    color: '#1a2734', fontSize: 14, outline: 'none', fontWeight: 500,
                  }}
                >
                  {CITIES.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            {step > 1 && (
              <button onClick={() => setStep((s) => (s - 1) as Step)} style={{
                flex: '0 0 auto', padding: '14px 20px', borderRadius: 14,
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(0,0,0,0.08)',
                color: '#4b5563', fontWeight: 600, fontSize: 14, cursor: 'pointer',
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
                  boxShadow: canProceed ? '0 4px 14px rgba(61,139,133,0.2)' : 'none',
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
                  boxShadow: submitting ? 'none' : '0 4px 14px rgba(61,139,133,0.2)',
                }}
              >
                {submitting ? t('form.submitting') : t('form.submit')}
              </button>
            )}
          </div>

          <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
            {t('form.privacy')}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes voicePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes rippleSuccess {
          0%   { transform: scale(1);  opacity: 0.8; }
          100% { transform: scale(12); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
