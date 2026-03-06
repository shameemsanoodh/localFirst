import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft, ArrowRight, Sun, Sunset, Moon, MapPin, Check,
    ShieldCheck, Clock, Loader2, Phone
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useMerchantAPI } from '@/hooks/useMerchantAPI'
import { getAllMajorCategories, getCategoryTemplate } from '@/config/categoryTemplates'
import api from '@/services/api'

// ─── Color tokens: banana yellow palette ──────────────────────────────────────
// Primary: #F5C842  |  Dark: #1A1A1A  |  Cream: #FAF8F5  |  Mid: #6B6B6B

// ─── Merchant Intro Stories ───────────────────────────────────────────────────
const MERCHANT_STORIES = [
    { emoji: '🏪', title: 'Your Shop, Discovered', desc: 'Nearby customers searching for what you sell will find you instantly.' },
    { emoji: '📡', title: 'Get Broadcast Alerts', desc: 'When a user searches for something you carry, you\'re notified first.' },
    { emoji: '🏷️', title: 'Post Offers in Seconds', desc: 'Flash sales and discounts reach nearby customers instantly.' },
    { emoji: '📊', title: 'Watch Revenue Grow', desc: 'Track orders, revenue and customer trends from your dashboard.' },
]

function MerchantIntroStories({ shopName, onDone }: { shopName: string; onDone: () => void }) {
    const [current, setCurrent] = useState(0)
    const [paused, setPaused] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (paused) return
        timerRef.current = setInterval(() => {
            setCurrent(c => {
                if (c >= MERCHANT_STORIES.length - 1) { onDone(); return c }
                return c + 1
            })
        }, 3000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [paused, onDone])

    const s = MERCHANT_STORIES[current]
    const isLast = current === MERCHANT_STORIES.length - 1

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: '#1A1A1A' }}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
        >
            <div className="flex gap-1.5 px-5 pt-14 pb-6">
                {MERCHANT_STORIES.map((_, i) => (
                    <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: '#F5C842' }}
                            initial={{ width: i < current ? '100%' : '0%' }}
                            animate={{ width: i <= current ? '100%' : '0%' }}
                            transition={{ duration: i === current ? 3 : 0, ease: 'linear' }}
                        />
                    </div>
                ))}
            </div>
            <button onClick={onDone} className="absolute top-14 right-5 text-white/50 text-sm font-medium">Skip</button>

            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 flex flex-col items-center justify-center px-8 text-center"
                >
                    <div className="text-8xl mb-10">{s.emoji}</div>
                    <h2 className="text-3xl font-bold text-white mb-4 leading-tight" style={{ letterSpacing: '-0.02em' }}>{s.title}</h2>
                    <p className="text-white/60 text-lg leading-relaxed max-w-xs">{s.desc}</p>
                    {current === 0 && (
                        <p className="mt-6 text-white/40 text-sm">
                            <span className="text-white/70 font-semibold">{shopName}</span> is live on Nearby! 🎉
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 flex pointer-events-none">
                <div className="flex-1 pointer-events-auto" onClick={() => setCurrent(c => Math.max(0, c - 1))} />
                <div className="flex-1 pointer-events-auto" onClick={() => { if (isLast) onDone(); else setCurrent(c => c + 1) }} />
            </div>

            {isLast && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-16 px-6">
                    <button
                        onClick={onDone}
                        className="w-full py-4 rounded-2xl font-bold text-lg text-black transition-transform active:scale-95"
                        style={{ background: '#F5C842' }}
                    >
                        Open My Dashboard 🚀
                    </button>
                </motion.div>
            )}
        </div>
    )
}

// ─── Timing helpers ───────────────────────────────────────────────────────────
interface ShopTiming { openHour: number; closeHour: number }

function getTimeInfo(hour: number) {
    if (hour >= 5 && hour < 12) return { Icon: Sun, label: 'Morning', accent: '#F5C842' }
    if (hour >= 12 && hour < 17) return { Icon: Sun, label: 'Afternoon', accent: '#FF7B3A' }
    if (hour >= 17 && hour < 20) return { Icon: Sunset, label: 'Evening', accent: '#FF5A5A' }
    return { Icon: Moon, label: 'Night', accent: '#5B8DEF' }
}

function fmt12(h: number) {
    const hr = Math.floor(h) % 12 || 12
    const min = h % 1 === 0.5 ? '30' : '00'
    const ap = Math.floor(h) < 12 ? 'AM' : 'PM'
    return `${hr}:${min} ${ap}`
}

function TimingSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    const { Icon, label: timeLabel, accent } = getTimeInfo(value)
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold" style={{ color: '#6B6B6B' }}>{label}</p>
                <div className="flex items-center gap-1.5">
                    <Icon size={14} style={{ color: accent }} />
                    <span className="text-sm font-bold" style={{ color: accent }}>{fmt12(value)}</span>
                    <span className="text-xs" style={{ color: '#9A9895' }}>· {timeLabel}</span>
                </div>
            </div>
            <input
                type="range" min={0} max={47} step={1}
                value={Math.round(value * 2)}
                onChange={e => onChange(parseInt(e.target.value) / 2)}
                className="w-full"
                style={{ accentColor: '#1A1A1A', height: 4 }}
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: '#9A9895' }}>
                <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
            </div>
        </div>
    )
}

// ─── Maps URL helpers ─────────────────────────────────────────────────────────
function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
    const patterns = [
        // @lat,lng,zoom — most common in share links
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // !3d lat !4d lng — embed / place format
        /!3d(-?\d+\.?\d*).*!4d(-?\d+\.?\d*)/,
        // /maps/search/lat,+lng or /maps/search/lat,lng — goo.gl redirect target
        /\/maps\/search\/(-?\d+\.?\d*)[,+\s]+(-?\d+\.?\d*)/,
        // ?q=lat,lng
        /[?&]q=(-?\d+\.?\d*),(?:\+*)(-?\d+\.?\d*)/,
        // ll=lat,lng
        /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // center=lat,lng
        /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    ]
    for (const p of patterns) {
        const m = url.match(p)
        if (m) {
            const lat = parseFloat(m[1]), lng = parseFloat(m[2])
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng }
        }
    }
    return null
}
const isShortUrl = (url: string) => url.includes('maps.app.goo.gl') || url.includes('goo.gl')

// ─── Steps config ─────────────────────────────────────────────────────────────
const TOTAL_STEPS = 5
const STEP_LABELS = ['Phone', 'Category', 'Subcategory', 'Capabilities', 'Shop Details']

const MerchantOnboarding: React.FC = () => {
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()
    const { registerMerchant } = useMerchantAPI()

    const [step, setStep] = useState(0)
    const [dir, setDir] = useState(1)
    const [loading, setLoading] = useState(false)
    const [showStories, setShowStories] = useState(false)

    // Form - New 5-step flow
    const [phone, setPhone] = useState('')
    const [majorCategory, setMajorCategory] = useState('')
    const [subCategory, setSubCategory] = useState('')
    const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([])
    const [shopName, setShopName] = useState('')
    const [ownerName, setOwnerName] = useState('')
    const [timing, setTiming] = useState<ShopTiming>({ openHour: 9, closeHour: 21 })
    const [mapLink, setMapLink] = useState('')
    const [latLng, setLatLng] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
    const [mapLinkError, setMapLinkError] = useState('')
    const [resolvingLink, setResolvingLink] = useState(false)
    const [whatsapp, setWhatsapp] = useState('')
    const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const majorCategories = getAllMajorCategories()
    const categoryTemplate = majorCategory ? getCategoryTemplate(majorCategory) : null

    const goNext = () => { setDir(1); setStep(s => s + 1) }
    const goBack = () => { setDir(-1); setStep(s => Math.max(0, s - 1)) }

    // Auto-select recommended capabilities when subcategory changes
    useEffect(() => {
        if (categoryTemplate && subCategory) {
            setSelectedCapabilities(categoryTemplate.recommended_capabilities || [])
        }
    }, [subCategory, categoryTemplate])

    const handleMapLink = useCallback(async (link: string) => {
        setMapLink(link)
        setMapLinkError('')
        setLatLng({ lat: null, lng: null })
        if (resolveTimer.current) clearTimeout(resolveTimer.current)
        if (!link.trim()) return

        // ── Tier 1: direct regex (works for full Google Maps URLs) ──────────
        const direct = extractCoordsFromUrl(link)
        if (direct) { setLatLng(direct); return }

        resolveTimer.current = setTimeout(async () => {
            setResolvingLink(true)
            let resolved = false

            // ── Tier 2: our deployed backend ────────────────────────────────
            try {
                const res = await api.get<{ success: boolean; data?: { lat: number; lng: number }; error?: string; resolvedUrl?: string }>(
                    `/utils/resolve-maps?url=${encodeURIComponent(link)}`,
                    { timeout: 5000 } as any
                )
                if (res.data.success && res.data.data) {
                    setLatLng({ lat: res.data.data.lat, lng: res.data.data.lng })
                    resolved = true
                } else {
                    const fb = res.data.resolvedUrl ? extractCoordsFromUrl(res.data.resolvedUrl) : null
                    if (fb) { setLatLng(fb); resolved = true }
                }
            } catch { /* backend not running – fall through to Tier 3 */ }

            if (resolved) { setResolvingLink(false); return }

            // ── Tier 3: CORS proxy A — allorigins.win ────────────────────
            //    Follows redirects server-side; final URL is in status.url
            if (!resolved) {
                try {
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(link)}`
                    const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) })
                    if (proxyRes.ok) {
                        const json = await proxyRes.json() as { status?: { url?: string }; contents?: string }
                        const finalUrl = json.status?.url ?? ''
                        const coords = extractCoordsFromUrl(finalUrl)
                            || extractCoordsFromUrl(decodeURIComponent(finalUrl))
                            || extractCoordsFromUrl(json.contents ?? '')
                        if (coords) { setLatLng(coords); resolved = true }
                    }
                } catch { /* proxy A unreachable */ }
            }

            // ── Tier 4: CORS proxy B — corsproxy.io ──────────────────────
            if (!resolved) {
                try {
                    const proxyRes = await fetch(
                        `https://corsproxy.io/?${encodeURIComponent(link)}`,
                        { redirect: 'follow', signal: AbortSignal.timeout(8000) }
                    )
                    // corsproxy follows redirects; grab the final response URL
                    const finalUrl = proxyRes.url
                    const coords = extractCoordsFromUrl(finalUrl)
                        || extractCoordsFromUrl(decodeURIComponent(finalUrl))
                    if (coords) { setLatLng(coords); resolved = true }
                } catch { /* proxy B unreachable */ }
            }

            if (!resolved) {
                setMapLinkError(
                    isShortUrl(link)
                        ? 'Could not resolve this short link automatically. Open the link in Google Maps, tap Share → Copy link, and paste the longer URL here.'
                        : 'Could not find coordinates in this link. Share a specific place pin from Google Maps.'
                )
            }

            setResolvingLink(false)
        }, 600)
    }, [])

    const canNext: Record<number, boolean> = {
        0: phone.trim().length === 10,
        1: majorCategory !== '',
        2: subCategory !== '',
        3: selectedCapabilities.length >= 1,
        4: shopName.trim().length >= 2 && ownerName.trim().length >= 2 && latLng.lat !== null,
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const response = await registerMerchant({
                owner_phone: `+91${phone}`,
                shop_name: shopName,
                major_category: majorCategory,
                sub_category: subCategory,
                capabilities_enabled: selectedCapabilities,
                location: {
                    lat: latLng.lat!,
                    lng: latLng.lng!,
                },
                whatsapp: whatsapp ? `+91${whatsapp}` : undefined,
            })
            
            // Store merchant data
            const mockUser = { 
                userId: response.shop_id || `merchant-${Date.now()}`, 
                name: ownerName, 
                phone: `+91${phone}`,
                role: 'merchant', 
                shopName 
            }
            const tok = `merchant-token-${Date.now()}`
            localStorage.setItem('auth-token', tok)
            localStorage.setItem('merchant-data', JSON.stringify(mockUser))
            setAuth(mockUser as any, [{ userId: mockUser.userId, role: 'merchant' as any }], tok)
            setShowStories(true)
        } catch (error) {
            console.error('Registration failed:', error)
            alert('Registration failed. Please try again.')
        } finally { 
            setLoading(false)
        }
    }

    if (showStories) return <MerchantIntroStories shopName={shopName} onDone={() => navigate('/merchant')} />

    const slideVariants = {
        enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
    }

    const isLastStep = step === TOTAL_STEPS - 1

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: '#FAF8F5', fontFamily: "'Inter', sans-serif" }}
        >
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between px-6 pt-14 pb-2">
                <button
                    onClick={step > 0 ? goBack : () => navigate('/login')}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: '#EFEFEB' }}
                >
                    <ArrowLeft size={18} color="#1A1A1A" />
                </button>

                {/* Step pill progress */}
                <div className="flex-1 mx-4">
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#E5E3DF' }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: '#1A1A1A' }}
                            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </div>
                    <p className="text-center text-xs mt-1.5 font-medium" style={{ color: '#9A9895' }}>
                        {STEP_LABELS[step]}
                    </p>
                </div>

                <button onClick={() => navigate('/login')} className="text-sm font-medium" style={{ color: '#6B6B6B' }}>
                    Sign in
                </button>
            </div>

            {/* ── Step content ── */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <AnimatePresence custom={dir} mode="wait">
                    <motion.div
                        key={step}
                        custom={dir}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="flex-1 flex flex-col px-6 pt-6"
                        style={{ position: 'absolute', inset: 0 }}
                    >

                        {/* ── Step 0: Phone Number ── */}
                        {step === 0 && (
                            <div className="flex-1 flex flex-col pt-6">
                                <p className="text-sm font-semibold mb-3" style={{ color: '#F5C842', letterSpacing: '0.08em' }}>WELCOME TO NEARBY</p>
                                <h1 className="text-4xl font-bold leading-tight mb-3" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                                    Get discovered<br />by customers
                                </h1>
                                <p className="text-base mb-10" style={{ color: '#6B6B6B' }}>
                                    Enter your mobile number to get started
                                </p>
                                <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '2px solid', borderColor: phone.length === 10 ? '#1A1A1A' : '#E5E3DF' }}>
                                    <Phone size={24} style={{ color: '#6B6B6B' }} />
                                    <span className="text-2xl font-semibold" style={{ color: '#6B6B6B' }}>+91</span>
                                    <input
                                        autoFocus
                                        type="tel"
                                        placeholder="9876543210"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        onKeyDown={e => e.key === 'Enter' && canNext[0] && goNext()}
                                        className="flex-1 text-3xl font-bold bg-transparent border-0 outline-none"
                                        style={{ color: '#1A1A1A' }}
                                    />
                                </div>
                                {phone.length === 10 && (
                                    <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm mt-4" style={{ color: '#22C55E' }}>
                                        ✓ Valid number
                                    </motion.p>
                                )}
                                <div className="mt-8 p-4 rounded-2xl" style={{ background: '#EFEFEB' }}>
                                    <p className="text-xs" style={{ color: '#6B6B6B' }}>
                                        📱 1000+ shops near you are already live on NearBy
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Step 1: Major Category ── */}
                        {step === 1 && (
                            <div className="flex-1 flex flex-col pt-4">
                                <p className="text-sm font-semibold mb-3" style={{ color: '#F5C842', letterSpacing: '0.08em' }}>BUSINESS TYPE</p>
                                <h1 className="text-4xl font-bold leading-tight mb-2" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                                    What kind of<br />shop do you run?
                                </h1>
                                <p className="text-sm mb-5" style={{ color: '#6B6B6B' }}>Select your main business category</p>
                                <div className="flex flex-wrap gap-2.5 overflow-y-auto flex-1 content-start pb-4">
                                    {majorCategories.map(cat => {
                                        const sel = majorCategory === cat.name
                                        return (
                                            <motion.button
                                                key={cat.name}
                                                whileTap={{ scale: 0.93 }}
                                                onClick={() => { setMajorCategory(cat.name); setSubCategory(''); setSelectedCapabilities([]) }}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all"
                                                style={{
                                                    background: sel ? '#1A1A1A' : '#EFEFEB',
                                                    color: sel ? '#F5C842' : '#1A1A1A',
                                                    border: '2px solid',
                                                    borderColor: sel ? '#1A1A1A' : 'transparent',
                                                }}
                                            >
                                                <span>{cat.icon}</span>
                                                <span>{cat.name}</span>
                                                {sel && <Check size={12} />}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Subcategory ── */}
                        {step === 2 && categoryTemplate && (
                            <div className="flex-1 flex flex-col pt-4">
                                <p className="text-sm font-semibold mb-3" style={{ color: '#F5C842', letterSpacing: '0.08em' }}>
                                    {categoryTemplate.icon} {categoryTemplate.major_category.toUpperCase()}
                                </p>
                                <h1 className="text-4xl font-bold leading-tight mb-2" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                                    What specifically<br />do you sell?
                                </h1>
                                <p className="text-sm mb-5" style={{ color: '#6B6B6B' }}>Choose your subcategory</p>
                                <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 pb-4">
                                    {categoryTemplate.subcategories.map(sub => {
                                        const sel = subCategory === sub
                                        return (
                                            <motion.button
                                                key={sub}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSubCategory(sub)}
                                                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
                                                style={{
                                                    background: sel ? '#1A1A1A' : '#EFEFEB',
                                                    color: sel ? '#F5C842' : '#1A1A1A',
                                                    border: '2px solid',
                                                    borderColor: sel ? '#1A1A1A' : 'transparent',
                                                }}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0`}
                                                    style={{ borderColor: sel ? '#F5C842' : '#9A9895' }}>
                                                    {sel && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F5C842' }} />}
                                                </div>
                                                <span className="font-semibold">{sub}</span>
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Capabilities ── */}
                        {step === 3 && categoryTemplate && (
                            <div className="flex-1 flex flex-col pt-4">
                                <p className="text-sm font-semibold mb-3" style={{ color: '#F5C842', letterSpacing: '0.08em' }}>CAPABILITIES</p>
                                <h1 className="text-4xl font-bold leading-tight mb-2" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                                    What do you<br />have in stock?
                                </h1>
                                <p className="text-sm mb-5" style={{ color: '#6B6B6B' }}>
                                    Select all that apply (we've pre-selected common items)
                                </p>
                                <div className="flex flex-wrap gap-2.5 overflow-y-auto flex-1 content-start pb-4">
                                    {categoryTemplate.recommended_capabilities.map(capId => {
                                        const sel = selectedCapabilities.includes(capId)
                                        // Convert capability ID to readable label
                                        const label = capId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                                        return (
                                            <motion.button
                                                key={capId}
                                                whileTap={{ scale: 0.93 }}
                                                onClick={() => setSelectedCapabilities(p => 
                                                    sel ? p.filter(c => c !== capId) : [...p, capId]
                                                )}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all"
                                                style={{
                                                    background: sel ? '#1A1A1A' : '#EFEFEB',
                                                    color: sel ? '#F5C842' : '#1A1A1A',
                                                    border: '2px solid',
                                                    borderColor: sel ? '#1A1A1A' : 'transparent',
                                                }}
                                            >
                                                {sel && <Check size={12} />}
                                                {label}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                                {selectedCapabilities.length > 0 && (
                                    <p className="text-xs text-center pb-2" style={{ color: '#6B6B6B' }}>
                                        {selectedCapabilities.length} capabilit{selectedCapabilities.length > 1 ? 'ies' : 'y'} selected ✓
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Step 4: Shop Details (Name, Owner, Location, Timing, WhatsApp) ── */}
                        {step === 4 && (
                            <div className="flex-1 flex flex-col pt-4 overflow-y-auto pb-4">
                                <p className="text-sm font-semibold mb-3" style={{ color: '#F5C842', letterSpacing: '0.08em' }}>SHOP DETAILS</p>
                                <h1 className="text-4xl font-bold leading-tight mb-2" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                                    Almost<br />done!
                                </h1>
                                <p className="text-sm mb-5" style={{ color: '#6B6B6B' }}>
                                    Fill in your shop details
                                </p>

                                {/* Shop Name */}
                                <div className="mb-5">
                                    <label className="text-xs font-semibold mb-2 block" style={{ color: '#6B6B6B' }}>Shop Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ram Mobile Centre"
                                        value={shopName}
                                        onChange={e => setShopName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                        style={{ background: '#EFEFEB', color: '#1A1A1A', border: 'none' }}
                                    />
                                </div>

                                {/* Owner Name */}
                                <div className="mb-5">
                                    <label className="text-xs font-semibold mb-2 block" style={{ color: '#6B6B6B' }}>Owner Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your full name"
                                        value={ownerName}
                                        onChange={e => setOwnerName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                        style={{ background: '#EFEFEB', color: '#1A1A1A', border: 'none' }}
                                    />
                                </div>

                                {/* Location */}
                                <div className="mb-5">
                                    <label className="text-xs font-semibold mb-2 block" style={{ color: '#6B6B6B' }}>
                                        Shop Location (Google Maps Link)
                                    </label>
                                    <textarea
                                        placeholder="Paste Google Maps link here..."
                                        value={mapLink}
                                        onChange={e => handleMapLink(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none transition-all"
                                        style={{
                                            background: latLng.lat ? '#F0FBF4' : mapLinkError ? '#FFF4F4' : '#EFEFEB',
                                            color: '#1A1A1A',
                                            border: '2px solid',
                                            borderColor: latLng.lat ? '#22C55E' : mapLinkError ? '#FF5454' : 'transparent',
                                        }}
                                    />
                                    {resolvingLink && (
                                        <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: '#5B8DEF' }}>
                                            <Loader2 size={12} className="animate-spin" /> Resolving...
                                        </div>
                                    )}
                                    {mapLinkError && !resolvingLink && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                            className="mt-2 p-2 rounded-lg flex items-start gap-2"
                                            style={{ background: '#FFF4F4' }}
                                        >
                                            <span className="text-xs">⚠️</span>
                                            <p className="text-xs" style={{ color: '#CC2222' }}>{mapLinkError}</p>
                                        </motion.div>
                                    )}
                                    {latLng.lat && latLng.lng && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                            className="mt-2 p-3 rounded-xl flex items-center gap-2"
                                            style={{ background: '#F0FBF4' }}
                                        >
                                            <MapPin size={14} style={{ color: '#22C55E' }} />
                                            <p className="text-xs font-semibold" style={{ color: '#166534' }}>Location found ✓</p>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Shop Timings */}
                                <div className="mb-5">
                                    <label className="text-xs font-semibold mb-3 block" style={{ color: '#6B6B6B' }}>Shop Timings</label>
                                    <div className="space-y-6">
                                        <TimingSlider label="Opening time" value={timing.openHour} onChange={v => setTiming(t => ({ ...t, openHour: v }))} />
                                        <TimingSlider label="Closing time" value={timing.closeHour} onChange={v => setTiming(t => ({ ...t, closeHour: v }))} />
                                    </div>
                                    <div className="mt-4 p-3 rounded-xl flex items-center gap-2" style={{ background: '#EFEFEB' }}>
                                        <Clock size={14} style={{ color: '#6B6B6B' }} />
                                        <p className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>
                                            {fmt12(timing.openHour)} – {fmt12(timing.closeHour)}
                                        </p>
                                    </div>
                                </div>

                                {/* WhatsApp (Optional) */}
                                <div className="mb-5">
                                    <label className="text-xs font-semibold mb-2 block" style={{ color: '#6B6B6B' }}>
                                        WhatsApp Number (Optional)
                                    </label>
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: '#EFEFEB' }}>
                                        <span className="text-sm font-semibold" style={{ color: '#6B6B6B' }}>+91</span>
                                        <input
                                            type="tel"
                                            placeholder="9876543210"
                                            value={whatsapp}
                                            onChange={e => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            className="flex-1 text-sm bg-transparent outline-none"
                                            style={{ color: '#1A1A1A' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Bottom CTA ── */}
            <div className="px-6 pb-10 pt-4">
                {!isLastStep ? (
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm" style={{ color: '#6B6B6B' }}>
                                {step + 1} / {TOTAL_STEPS}
                            </p>
                            <motion.button
                                onClick={goNext}
                                disabled={!canNext[step]}
                                whileTap={{ scale: 0.9 }}
                                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all"
                                style={{
                                    background: canNext[step] ? '#1A1A1A' : '#CFCDC9',
                                    cursor: canNext[step] ? 'pointer' : 'not-allowed',
                                }}
                            >
                                <ArrowRight size={22} color={canNext[step] ? '#F5C842' : '#9A9895'} />
                            </motion.button>
                        </div>
                    </div>
                ) : (
                    <motion.button
                        onClick={handleSubmit}
                        disabled={loading || !canNext[4]}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                        style={{
                            background: canNext[4] ? '#1A1A1A' : '#CFCDC9',
                            color: canNext[4] ? '#F5C842' : '#9A9895',
                        }}
                    >
                        {loading
                            ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : <><ShieldCheck size={20} />Launch My Shop 🚀</>}
                    </motion.button>
                )}

                {step === 0 && (
                    <p className="text-center text-xs mt-4" style={{ color: '#9A9895' }}>
                        Already have an account?{' '}
                        <button onClick={() => navigate('/login')} className="font-bold underline" style={{ color: '#1A1A1A' }}>
                            Sign in
                        </button>
                    </p>
                )}
            </div>
        </div>
    )
}

export default MerchantOnboarding
