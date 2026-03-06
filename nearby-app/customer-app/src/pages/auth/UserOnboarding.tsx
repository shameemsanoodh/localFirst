import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { categoriesService } from '@/services/categories.service'
import type { Category } from '@/types/category.types'

// ─── Color tokens ─────────────────────────────────────────────────────────────
// Banana Yellow: #F5C842  |  Cream: #FAF8F5  |  Dark: #1A1A1A  |  Mid: #6B6B6B

// ─── Merchant Intro Stories ───────────────────────────────────────────────────
const USER_STORIES = [
    { emoji: '📍', title: 'Discover what\'s near you', desc: 'Local shops, pharmacies, groceries — found in seconds.', color: '#F5C842' },
    { emoji: '📡', title: 'Broadcast your need', desc: 'Ask nearby shops if they have it. Get replies in minutes.', color: '#FF7B3A' },
    { emoji: '🏷️', title: 'Grab local deals', desc: 'Flash offers from stores around you, only for today.', color: '#3ABEFF' },
    { emoji: '🚀', title: 'You\'re all set!', desc: 'Start discovering shops around you right now.', color: '#5B8DEF' },
]

function AppIntroStories({ userName, onDone }: { userName: string; onDone: () => void }) {
    const [current, setCurrent] = useState(0)
    const [paused, setPaused] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (paused) return
        timerRef.current = setInterval(() => {
            setCurrent(c => {
                if (c >= USER_STORIES.length - 1) { onDone(); return c }
                return c + 1
            })
        }, 3000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [paused, onDone])

    const story = USER_STORIES[current]
    const isLast = current === USER_STORIES.length - 1

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: '#1A1A1A' }}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
        >
            {/* Progress bars */}
            <div className="flex gap-1.5 px-5 pt-14 pb-6 safe-top">
                {USER_STORIES.map((_, i) => (
                    <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: story.color }}
                            initial={{ width: i < current ? '100%' : '0%' }}
                            animate={{ width: i <= current ? '100%' : '0%' }}
                            transition={{ duration: i === current ? 3 : 0, ease: 'linear' }}
                        />
                    </div>
                ))}
            </div>

            {/* Skip */}
            <button onClick={onDone} className="absolute top-14 right-5 text-white/50 text-sm font-medium">
                Skip
            </button>

            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 flex flex-col items-center justify-center px-8 text-center"
                >
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 22 }}
                        className="text-8xl mb-10"
                    >
                        {story.emoji}
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                        {story.title}
                    </h2>
                    <p className="text-white/60 text-lg leading-relaxed max-w-xs">
                        {story.desc}
                    </p>
                    {current === 0 && (
                        <p className="mt-6 text-white/40 text-sm">
                            Welcome, <span className="text-white/70 font-semibold">{userName}</span> 👋
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Tap zones + CTA */}
            <div className="absolute inset-0 flex pointer-events-none">
                <div className="flex-1 pointer-events-auto" onClick={() => setCurrent(c => Math.max(0, c - 1))} />
                <div className="flex-1 pointer-events-auto" onClick={() => { if (isLast) onDone(); else setCurrent(c => c + 1) }} />
            </div>

            {isLast && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pb-16 px-6 safe-bottom"
                >
                    <button
                        onClick={onDone}
                        className="w-full py-4 rounded-2xl font-bold text-lg text-black transition-transform active:scale-95"
                        style={{ backgroundColor: '#F5C842' }}
                    >
                        Start Exploring →
                    </button>
                </motion.div>
            )}
        </div>
    )
}

// ─── Device profile types ─────────────────────────────────────────────────────
type DeviceProfile = 'daily' | 'express' | 'family' | 'business'
const DEVICE_OPTIONS: { id: DeviceProfile; emoji: string; label: string; sub: string }[] = [
    { id: 'daily', emoji: '🛒', label: 'Daily Shopper', sub: 'Groceries, pharmacy, essentials' },
    { id: 'express', emoji: '⚡', label: 'Express Needs', sub: 'Need it now, fast delivery' },
    { id: 'family', emoji: '👨‍👩‍👧', label: 'For the Family', sub: 'Bulk orders & household' },
    { id: 'business', emoji: '💼', label: 'Business', sub: 'Wholesale & bulk sourcing' },
]

// ─── Step definitions ─────────────────────────────────────────────────────────
const TOTAL_STEPS = 5

// ─── Main component ───────────────────────────────────────────────────────────
const UserOnboarding: React.FC = () => {
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()

    const [step, setStep] = useState(0)
    const [dir, setDir] = useState(1)
    const [loading, setLoading] = useState(false)
    const [showStories, setShowStories] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [device, setDevice] = useState<DeviceProfile>('daily')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    useEffect(() => {
        categoriesService.getAll().then(setCategories).catch(() => {
            setCategories([
                { categoryId: 'c1', name: 'Groceries', emoji: '🛒', color: 'bg-green-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 0, sortOrder: 0, createdAt: '', updatedAt: '' },
                { categoryId: 'c2', name: 'Mobile & Accessories', emoji: '📱', color: 'bg-blue-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 1, sortOrder: 1, createdAt: '', updatedAt: '' },
                { categoryId: 'c3', name: 'Pharmacy', emoji: '💊', color: 'bg-red-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 2, sortOrder: 2, createdAt: '', updatedAt: '' },
                { categoryId: 'c4', name: 'Electronics', emoji: '💻', color: 'bg-purple-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 3, sortOrder: 3, createdAt: '', updatedAt: '' },
                { categoryId: 'c5', name: 'Hardware', emoji: '🔧', color: 'bg-yellow-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 4, sortOrder: 4, createdAt: '', updatedAt: '' },
                { categoryId: 'c6', name: 'Fashion', emoji: '👕', color: 'bg-pink-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 5, sortOrder: 5, createdAt: '', updatedAt: '' },
                { categoryId: 'c7', name: 'Food & Restaurants', emoji: '🍽️', color: 'bg-orange-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 6, sortOrder: 6, createdAt: '', updatedAt: '' },
                { categoryId: 'c8', name: 'Books & Stationery', emoji: '📚', color: 'bg-indigo-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 7, sortOrder: 7, createdAt: '', updatedAt: '' },
                { categoryId: 'c9', name: 'Automobile', emoji: '🚗', color: 'bg-gray-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 8, sortOrder: 8, createdAt: '', updatedAt: '' },
                { categoryId: 'c10', name: 'Pet Supplies', emoji: '🐾', color: 'bg-amber-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 9, sortOrder: 9, createdAt: '', updatedAt: '' },
                { categoryId: 'c11', name: 'Home Essentials', emoji: '🏠', color: 'bg-cyan-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 10, sortOrder: 10, createdAt: '', updatedAt: '' },
                { categoryId: 'c12', name: 'Sports & Fitness', emoji: '⚽', color: 'bg-lime-100', icon: '', isActive: true, parentId: 'root', level: 0, depth: 0, order: 11, sortOrder: 11, createdAt: '', updatedAt: '' },
            ])
        })
    }, [])

    const goNext = () => { setDir(1); setStep(s => s + 1) }
    const goBack = () => { setDir(-1); setStep(s => Math.max(0, s - 1)) }

    const toggleCat = (id: string) =>
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )

    const canAdvance: Record<number, boolean> = {
        0: name.trim().length >= 2,
        1: email.includes('@'),
        2: selectedCategories.length >= 1,
        3: true,
        4: password.length >= 8,
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const { authService } = await import('@/services/auth.service')
            const response = await authService.register({
                name, email, password,
                phone: `+91${Date.now().toString().slice(-10)}`,
                role: 'user',
                // @ts-ignore
                preferredCategories: selectedCategories,
                deviceProfile: device,
            })
            localStorage.setItem('auth-token', response.token)
            localStorage.setItem('refresh-token', response.refreshToken)
            setAuth(response.user, [{ userId: response.userId, role: response.user.role as any }], response.token)
        } catch {
            const mockUser = { userId: `user-${Date.now()}`, name, email, role: 'user' as const }
            const tok = `tok-${Date.now()}`
            localStorage.setItem('auth-token', tok)
            setAuth(mockUser as any, [{ userId: mockUser.userId, role: 'user' as any }], tok)
        } finally {
            setLoading(false)
            setShowStories(true)
        }
    }

    if (showStories) {
        return <AppIntroStories userName={name} onDone={() => navigate('/')} />
    }

    const slideVariants = {
        enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
    }

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: '#FAF8F5', fontFamily: "'Inter', sans-serif" }}
        >
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between px-6 pt-14 pb-4">
                <button
                    onClick={step > 0 ? goBack : () => navigate('/login')}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{ background: '#EFEFEB' }}
                >
                    <ArrowLeft size={18} color="#1A1A1A" />
                </button>

                {/* Progress dots */}
                <div className="flex gap-2">
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ width: i === step ? 24 : 6, opacity: i <= step ? 1 : 0.3 }}
                            transition={{ duration: 0.3 }}
                            className="h-1.5 rounded-full"
                            style={{ backgroundColor: '#1A1A1A' }}
                        />
                    ))}
                </div>

                <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-medium"
                    style={{ color: '#6B6B6B' }}
                >
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
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="flex-1 flex flex-col px-6 pt-4"
                        style={{ position: 'absolute', inset: 0 }}
                    >

                        {/* ── Step 0: Name ── */}
                        {step === 0 && (
                            <div className="flex-1 flex flex-col pt-8">
                                <div className="mb-10">
                                    <p className="text-sm font-semibold mb-3" style={{ color: '#F5C842', letterSpacing: '0.08em' }}>WELCOME</p>
                                    <h1 className="text-4xl font-bold leading-tight mb-3" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                                        What should<br />we call you?
                                    </h1>
                                    <p className="text-base" style={{ color: '#6B6B6B' }}>
                                        Let's personalize your experience
                                    </p>
                                </div>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Your name..."
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && canAdvance[0] && goNext()}
                                    className="w-full text-3xl font-bold bg-transparent border-0 outline-none pb-3 mb-2"
                                    style={{
                                        borderBottom: '2px solid',
                                        borderColor: name ? '#1A1A1A' : '#E5E3DF',
                                        color: '#1A1A1A',
                                    }}
                                />
                                {name.length >= 2 && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm mt-2"
                                        style={{ color: '#6B6B6B' }}
                                    >
                                        Hey, {name}! Great to meet you 👋
                                    </motion.p>
                                )}
                            </div>
                        )}

                        {/* ── Step 1: Email ── */}
                        {step === 1 && (
                            <div className="flex-1 flex flex-col pt-8">
                                <div className="mb-10">
                                    <p className="text-sm font-semibold mb-3" style={{ color: '#F5C842', letterSpacing: '0.08em' }}>ACCOUNT</p>
                                    <h1 className="text-4xl font-bold leading-tight mb-3" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                                        Your email<br />address
                                    </h1>
                                    <p className="text-base" style={{ color: '#6B6B6B' }}>
                                        We'll send order updates here
                                    </p>
                                </div>
                                <input
                                    autoFocus
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && canAdvance[1] && goNext()}
                                    className="w-full text-2xl font-semibold bg-transparent border-0 outline-none pb-3"
                                    style={{
                                        borderBottom: '2px solid',
                                        borderColor: email.includes('@') ? '#1A1A1A' : '#E5E3DF',
                                        color: '#1A1A1A',
                                    }}
                                />
                            </div>
                        )}

                        {/* ── Step 2: Categories ── */}
                        {step === 2 && (
                            <div className="flex-1 flex flex-col">
                                <div className="mb-6 pt-8">
                                    <p className="text-sm font-semibold mb-3" style={{ color: '#F5C842', letterSpacing: '0.08em' }}>INTERESTS</p>
                                    <h1 className="text-4xl font-bold leading-tight mb-2" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                                        Choose your<br />categories
                                    </h1>
                                    <p className="text-sm" style={{ color: '#6B6B6B' }}>
                                        Pick at least <span className="font-bold" style={{ color: '#1A1A1A' }}>1</span> to see relevant shops near you
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2.5 overflow-y-auto flex-1 pb-4 content-start">
                                    {categories.map(cat => {
                                        const sel = selectedCategories.includes(cat.categoryId)
                                        return (
                                            <motion.button
                                                key={cat.categoryId}
                                                onClick={() => toggleCat(cat.categoryId)}
                                                whileTap={{ scale: 0.93 }}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all"
                                                style={{
                                                    background: sel ? '#1A1A1A' : '#EFEFEB',
                                                    color: sel ? '#F5C842' : '#1A1A1A',
                                                    border: '2px solid',
                                                    borderColor: sel ? '#1A1A1A' : 'transparent',
                                                }}
                                            >
                                                <span>{cat.emoji}</span>
                                                <span>{cat.name}</span>
                                                {sel && <Check size={13} />}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                                {selectedCategories.length > 0 && (
                                    <p className="text-xs text-center pb-2" style={{ color: '#6B6B6B' }}>
                                        {selectedCategories.length} selected
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Step 3: Profile type ── */}
                        {step === 3 && (
                            <div className="flex-1 flex flex-col pt-8">
                                <div className="mb-8">
                                    <p className="text-sm font-semibold mb-3" style={{ color: '#F5C842', letterSpacing: '0.08em' }}>PERSONALIZE</p>
                                    <h1 className="text-4xl font-bold leading-tight mb-2" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                                        How do you<br />usually shop?
                                    </h1>
                                    <p className="text-base" style={{ color: '#6B6B6B' }}>
                                        We'll tailor your feed accordingly
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {DEVICE_OPTIONS.map(opt => {
                                        const sel = device === opt.id
                                        return (
                                            <motion.button
                                                key={opt.id}
                                                onClick={() => setDevice(opt.id)}
                                                whileTap={{ scale: 0.97 }}
                                                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                                                style={{
                                                    background: sel ? '#1A1A1A' : '#EFEFEB',
                                                    border: '2px solid',
                                                    borderColor: sel ? '#1A1A1A' : 'transparent',
                                                }}
                                            >
                                                <span className="text-2xl">{opt.emoji}</span>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm" style={{ color: sel ? '#F5C842' : '#1A1A1A' }}>{opt.label}</p>
                                                    <p className="text-xs mt-0.5" style={{ color: sel ? '#F5C842CC' : '#6B6B6B' }}>{opt.sub}</p>
                                                </div>
                                                {sel && (
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#F5C842' }}>
                                                        <Check size={11} color="#1A1A1A" strokeWidth={3} />
                                                    </div>
                                                )}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Step 4: Password ── */}
                        {step === 4 && (
                            <div className="flex-1 flex flex-col pt-8">
                                <div className="mb-10">
                                    <p className="text-sm font-semibold mb-3" style={{ color: '#F5C842', letterSpacing: '0.08em' }}>SECURE</p>
                                    <h1 className="text-4xl font-bold leading-tight mb-3" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                                        Set your<br />password
                                    </h1>
                                    <p className="text-base" style={{ color: '#6B6B6B' }}>
                                        At least 8 characters
                                    </p>
                                </div>
                                <div className="relative">
                                    <input
                                        autoFocus
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full text-3xl font-bold bg-transparent border-0 outline-none pb-3 pr-12"
                                        style={{
                                            borderBottom: '2px solid',
                                            borderColor: password.length >= 8 ? '#1A1A1A' : '#E5E3DF',
                                            color: '#1A1A1A',
                                            letterSpacing: '0.1em',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(v => !v)}
                                        className="absolute right-0 bottom-4"
                                        style={{ color: '#6B6B6B' }}
                                    >
                                        {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                {/* Strength bar */}
                                {password.length > 0 && (
                                    <div className="mt-4 space-y-1.5">
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map(lvl => (
                                                <div
                                                    key={lvl}
                                                    className="flex-1 h-1 rounded-full transition-all duration-300"
                                                    style={{
                                                        background: password.length >= lvl * 4
                                                            ? lvl === 1 ? '#FF5454' : lvl === 2 ? '#F5C842' : '#22C55E'
                                                            : '#E5E3DF',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs" style={{ color: '#6B6B6B' }}>
                                            {password.length < 4 ? 'Too short' : password.length < 8 ? 'Getting there...' : '✓ Strong enough'}
                                        </p>
                                    </div>
                                )}

                                {/* Summary */}
                                <div className="mt-8 p-4 rounded-2xl" style={{ background: '#EFEFEB' }}>
                                    <p className="text-xs font-semibold mb-3" style={{ color: '#6B6B6B', letterSpacing: '0.06em' }}>YOUR ACCOUNT</p>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold" style={{ background: '#F5C842', color: '#1A1A1A' }}>
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{name}</p>
                                            <p className="text-xs" style={{ color: '#6B6B6B' }}>{email}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {selectedCategories.slice(0, 4).map(id => {
                                            const cat = categories.find(c => c.categoryId === id)
                                            return cat ? (
                                                <span key={id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1A1A1A', color: '#F5C842' }}>
                                                    {cat.emoji} {cat.name}
                                                </span>
                                            ) : null
                                        })}
                                        {selectedCategories.length > 4 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#E5E3DF', color: '#6B6B6B' }}>
                                                +{selectedCategories.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Bottom CTA ── */}
            <div className="px-6 pb-10 pt-4 safe-bottom">
                {step < TOTAL_STEPS - 1 ? (
                    <div className="flex items-center justify-between">
                        <p className="text-sm" style={{ color: '#6B6B6B' }}>
                            Step {step + 1} of {TOTAL_STEPS}
                        </p>
                        <motion.button
                            onClick={goNext}
                            disabled={!canAdvance[step]}
                            whileTap={{ scale: 0.92 }}
                            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all"
                            style={{
                                background: canAdvance[step] ? '#1A1A1A' : '#CFCDC9',
                                cursor: canAdvance[step] ? 'pointer' : 'not-allowed',
                            }}
                        >
                            <ArrowRight size={22} color={canAdvance[step] ? '#F5C842' : '#9A9895'} />
                        </motion.button>
                    </div>
                ) : (
                    <motion.button
                        onClick={handleSubmit}
                        disabled={loading || !canAdvance[4]}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                        style={{
                            background: canAdvance[4] ? '#1A1A1A' : '#CFCDC9',
                            color: canAdvance[4] ? '#F5C842' : '#9A9895',
                        }}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Create My Account →'
                        )}
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

export default UserOnboarding
