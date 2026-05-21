import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  CheckSquare, Users, Cloud, BarChart2, Shield, Layers,
  ArrowRight, ChevronRight, Github, Star,
  Database, Globe, Activity, Lock, Server,
  Menu, X, Cpu, Network, BarChart3,
} from 'lucide-react'

/* ─── Background Grid ─────────────────────────────────────────── */
function BackgroundGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(126,20,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(126,20,255,.04) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/30 to-[#0a0a0f]" />
    </div>
  )
}

/* ─── Floating Particles ──────────────────────────────────────── */
function Particles() {
  const dots = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: (i * 37) % 100,
        y: (i * 53) % 100,
        size: (i % 3) + 1,
        dur: 12 + (i % 8),
        delay: (i % 6) * 0.8,
      })),
    []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-violet-400/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -24, 0], opacity: [0.15, 0.6, 0.15] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ─── Navbar ──────────────────────────────────────────────────── */
function Navbar({ scrolled }) {
  const [open, setOpen] = useState(false)

  const links = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'Architecture', href: '#architecture' },
  ]

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0f]/90 backdrop-blur-2xl border-b border-purple-500/15 shadow-lg shadow-black/30'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand */}
        <motion.span
          whileHover={{ scale: 1.04 }}
          className="text-xl font-extrabold bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent tracking-tight cursor-default select-none"
        >
          Mini Jira
        </motion.span>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200 font-medium"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold transition-all duration-200 shadow-md shadow-purple-600/30"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-gray-400 hover:text-white transition-colors"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0c0c12]/98 backdrop-blur-xl border-b border-purple-500/15"
          >
            <div className="px-4 py-4 space-y-1">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-2.5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-3 flex flex-col gap-2">
                <Link to="/login" className="text-center py-2.5 text-gray-400 hover:text-white text-sm">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-center py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-semibold"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ─── Hero Section ────────────────────────────────────────────── */
function HeroSection() {
  const techs = ['React 19', 'Node.js', 'DynamoDB', 'AWS Cognito', 'Lambda', 'CloudFront', 'S3', 'SNS/SQS']

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BackgroundGrid />
      <Particles />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple-700/8 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-[15%] w-[260px] h-[260px] rounded-full bg-violet-600/6 blur-[90px] pointer-events-none" />
      <div className="absolute top-1/2 right-[15%] w-[260px] h-[260px] rounded-full bg-indigo-600/6 blur-[90px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center pt-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/25 bg-purple-500/8 text-purple-300 text-xs font-medium mb-8 backdrop-blur-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Powered by AWS Cloud Architecture
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.08 }}
          className="text-5xl sm:text-6xl lg:text-[80px] font-extrabold leading-[1.08] tracking-tight mb-6"
        >
          <span className="text-white">Mini&nbsp;Jira</span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent">
            Cloud Platform
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.18 }}
          className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
        >
          Modern team collaboration and task management powered by AWS cloud architecture.
          Built for scale, designed for teams.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.26 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold text-sm transition-all duration-300 shadow-xl shadow-purple-600/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-purple-500/25 bg-white/[0.03] hover:bg-white/[0.07] hover:border-purple-500/50 text-white font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-sm"
          >
            View Dashboard
            <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Tech stack pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {techs.map((t, i) => (
            <motion.span
              key={t}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-500 text-xs font-medium"
            >
              {t}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0], y: [0, 0, 6, 0] }}
        transition={{ duration: 2.5, delay: 1.2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-gray-600 text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-purple-500/50 to-transparent" />
      </motion.div>
    </section>
  )
}

/* ─── Features Section ────────────────────────────────────────── */
const FEATURES = [
  {
    icon: CheckSquare,
    title: 'Task Management',
    desc: 'Create, assign, and track tasks with priorities, labels, and due dates. Kanban boards with intuitive drag-and-drop.',
    accent: 'from-purple-500/15 to-violet-500/5',
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Real-time notifications, threaded comments, and team assignments to keep every contributor aligned.',
    accent: 'from-blue-500/15 to-indigo-500/5',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: Cloud,
    title: 'AWS Infrastructure',
    desc: 'Enterprise AWS services: ALB, EC2, DynamoDB, S3, Lambda, SNS/SQS, EventBridge, and CloudFront.',
    accent: 'from-orange-500/15 to-amber-500/5',
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    iconColor: 'text-orange-400',
  },
  {
    icon: BarChart2,
    title: 'Real-Time Analytics',
    desc: 'Track team productivity, task completion rates, and project velocity with interactive live charts.',
    accent: 'from-green-500/15 to-emerald-500/5',
    iconBg: 'bg-green-500/10 border-green-500/20',
    iconColor: 'text-green-400',
  },
  {
    icon: Shield,
    title: 'Secure Authentication',
    desc: 'AWS Cognito-powered auth with MFA support, email verification, JWT sessions, and role-based access.',
    accent: 'from-rose-500/15 to-red-500/5',
    iconBg: 'bg-rose-500/10 border-rose-500/20',
    iconColor: 'text-rose-400',
  },
  {
    icon: Layers,
    title: 'High Availability',
    desc: 'Multi-AZ deployment with CloudFront CDN, auto-scaling groups, and 99.9% uptime SLA by design.',
    accent: 'from-cyan-500/15 to-teal-500/5',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
]

function FeatureCard({ icon: Icon, title, desc, accent, iconBg, iconColor, delay }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="relative group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-purple-500/25 transition-colors duration-300 cursor-default overflow-hidden"
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${accent}`}
      />
      <div className="relative z-10">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
        <h3 className="text-white font-semibold text-base mb-2 tracking-tight">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

function FeaturesSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/6 text-purple-400 text-xs font-medium mb-5">
            <Star size={10} />
            Platform Features
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Everything your team needs
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            A complete project management suite built on AWS cloud-native services.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.07} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Architecture Section ────────────────────────────────────── */
function ArchNode({ icon: Icon, label, color, delay, inView }) {
  const palette = {
    purple: 'border-purple-500/35 bg-purple-500/8 text-purple-300',
    blue:   'border-blue-500/35 bg-blue-500/8 text-blue-300',
    orange: 'border-orange-500/35 bg-orange-500/8 text-orange-300',
    green:  'border-green-500/35 bg-green-500/8 text-green-300',
    cyan:   'border-cyan-500/35 bg-cyan-500/8 text-cyan-300',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.45, delay }}
      whileHover={{ scale: 1.06, transition: { duration: 0.15 } }}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border backdrop-blur-sm min-w-[100px] ${palette[color]}`}
    >
      <Icon size={22} />
      <span className="text-xs font-semibold text-gray-300 text-center leading-tight whitespace-nowrap">{label}</span>
    </motion.div>
  )
}

function ConnectorArrow({ inView, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={inView ? { opacity: 1, scaleY: 1 } : {}}
      transition={{ duration: 0.35, delay }}
      style={{ transformOrigin: 'top' }}
      className="flex justify-center my-2"
    >
      <div className="flex flex-col items-center">
        <div className="w-px h-7 bg-gradient-to-b from-purple-500/50 to-purple-500/20" />
        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-purple-500/50" />
      </div>
    </motion.div>
  )
}

function ArchitectureSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="architecture" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[#0d0d15]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/15 to-transparent" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-purple-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/6 text-orange-400 text-xs font-medium mb-5">
            <Cloud size={10} />
            AWS Architecture
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Enterprise cloud backbone
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Battle-tested AWS services layered for reliability, security, and infinite scale.
          </p>
        </motion.div>

        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="flex justify-center">
              <ArchNode icon={Globe} label="CloudFront CDN" color="blue" delay={0.25} inView={inView} />
            </div>
            <ConnectorArrow inView={inView} delay={0.4} />

            <div className="flex justify-center">
              <ArchNode icon={Network} label="Load Balancer" color="purple" delay={0.45} inView={inView} />
            </div>
            <ConnectorArrow inView={inView} delay={0.6} />

            <div className="flex justify-center">
              <ArchNode icon={Server} label="EC2 / Node.js" color="orange" delay={0.65} inView={inView} />
            </div>
            <ConnectorArrow inView={inView} delay={0.8} />

            <div className="flex justify-center gap-4 flex-wrap">
              {[
                { icon: Database, label: 'DynamoDB', color: 'green' },
                { icon: Cpu,      label: 'Lambda',   color: 'orange' },
                { icon: Cloud,    label: 'S3 Bucket', color: 'blue' },
              ].map((n, i) => (
                <ArchNode key={n.label} {...n} delay={0.85 + i * 0.1} inView={inView} />
              ))}
            </div>
            <ConnectorArrow inView={inView} delay={1.05} />

            <div className="flex justify-center gap-4 flex-wrap">
              {[
                { icon: Activity,  label: 'SNS / SQS',  color: 'purple' },
                { icon: Lock,      label: 'Cognito',     color: 'cyan' },
                { icon: BarChart3, label: 'CloudWatch',  color: 'green' },
              ].map((n, i) => (
                <ArchNode key={n.label} {...n} delay={1.1 + i * 0.08} inView={inView} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ─── Stats Section ───────────────────────────────────────────── */
function CountUp({ target, suffix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    let n = 0
    const step = Math.ceil(target / 55)
    const id = setInterval(() => {
      n += step
      if (n >= target) {
        setVal(target)
        clearInterval(id)
      } else {
        setVal(n)
      }
    }, 28)
    return () => clearInterval(id)
  }, [inView, target])

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  )
}

const STATS = [
  { value: 10000, suffix: '+',   label: 'Tasks Managed' },
  { value: 500,   suffix: '+',   label: 'Teams Active' },
  { value: 12,    suffix: '+',   label: 'AWS Services' },
  { value: 99,    suffix: '.9%', label: 'System Uptime' },
]

function StatCard({ value, suffix, label, delay }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay }}
      whileHover={{ borderColor: 'rgba(168,85,247,0.25)', transition: { duration: 0.2 } }}
      className="text-center p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
    >
      <div className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent mb-2 tabular-nums">
        <CountUp target={value} suffix={suffix} />
      </div>
      <div className="text-gray-500 text-sm font-medium">{label}</div>
    </motion.div>
  )
}

function StatsSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#0d0d15]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map(({ value, suffix, label }, i) => (
            <StatCard key={label} value={value} suffix={suffix} label={label} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Footer ──────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="relative border-t border-white/[0.05] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
              Mini Jira
            </span>
            <span className="text-gray-700 text-sm">— Cloud Platform</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all text-sm font-medium"
            >
              <Github size={14} />
              GitHub
            </a>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-500/20 bg-orange-500/6 text-orange-400 text-sm font-medium">
              <Cloud size={14} />
              AWS Powered
            </span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/[0.04] text-center text-gray-700 text-sm">
          Built with React 19, Vite, TailwindCSS, and AWS Cloud Services.
        </div>
      </div>
    </footer>
  )
}

/* ─── Page Root ───────────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <Navbar scrolled={scrolled} />
      <HeroSection />
      <FeaturesSection />
      <ArchitectureSection />
      <StatsSection />
      <Footer />
    </div>
  )
}
