/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  Pause,
  Play,
} from 'lucide-react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { saveSession } from './lib/db';
import { api, PackageView, hrs } from './lib/packages';
import { Link } from 'react-router-dom';
import { glass, glassSolid, KindToggle } from './components/Shell';
import { RATES, SITE_URL, SITE_HOST, HOTLINE, lkr } from './lib/site';


const HOURLY_RATE_MIN = RATES.nonCommercial.firstHour;
const HOURLY_RATE_EXTENDED = RATES.nonCommercial.perHour;
const COMMERCIAL_RATE_MIN = RATES.commercial.firstHour;
const COMMERCIAL_RATE_EXTENDED = RATES.commercial.perHour;
const HELP_PHONE_NUMBER = HOTLINE;
const GOOGLE_REVIEW_URL = 'https://g.page/r/CQJsMMv_cZxQEAE/review';
const BANK_DETAILS = { bank: 'Nations Trust Bank', name: 'K K DILSHAN', account: '200560043329' };
const COCO = '#C4956A';


type SessionState = 'IDLE' | 'ACTIVE' | 'SUMMARY';

interface SessionData {
  name: string;
  phone: string;
  sessionType: string;
  startTime: number | null;
  endTime: number | null;
  plannedMinutes: number | null;
}

const DEFAULT_SESSION: SessionData = { name: '', phone: '', sessionType: '', startTime: null, endTime: null, plannedMinutes: null };

const PLANNED_OPTIONS = [
  { label: '1 HR', value: 60 },
  { label: '2 HR', value: 120 },
  { label: '3 HR', value: 180 },
  { label: 'OPEN', value: null },
];

export default function App() {
  const [session, setSession] = useState<SessionData>(() => {
    const saved = localStorage.getItem('neon_studio_session');
    return saved ? JSON.parse(saved) : DEFAULT_SESSION;
  });
  const [view, setView] = useState<SessionState>(() => {
    if (session.endTime) return 'SUMMARY';
    if (session.startTime) return 'ACTIVE';
    return 'IDLE';
  });
  const [elapsed, setElapsed] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showTestMode, setShowTestMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testHours, setTestHours] = useState('1');
  const [testMinutes, setTestMinutes] = useState('30');
  const [discountPct, setDiscountPct] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [paymentModal, setPaymentModal] = useState<'online' | 'cash' | null>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const [lastPricing, setLastPricing] = useState<ReturnType<typeof calculateTotal> | null>(null);
  const [lastPayMethod, setLastPayMethod] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [isCommercial, setIsCommercial] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalPausedMs, setTotalPausedMs] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [showPausePin, setShowPausePin] = useState(false);
  const [pausePinInput, setPausePinInput] = useState('');
  const [pausePinError, setPausePinError] = useState('');
  const [pinChecking, setPinChecking] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  // Monthly package: set once this session has been charged to the customer's package.
  const [pkgUse, setPkgUse] = useState<{ pkg: PackageView; charged: number; extraHours: number; extraDue: number } | null>(null);
  const [pkgOffer, setPkgOffer] = useState<PackageView | null>(null);
  const [pkgBusy, setPkgBusy] = useState(false);
  const [pkgError, setPkgError] = useState('');

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    if (showQR && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, SITE_URL, {
        width: 280, margin: 2, color: { dark: '#000000', light: '#ffffff' },
      });
    }
  }, [showQR]);

  useEffect(() => { localStorage.setItem('neon_studio_session', JSON.stringify(session)); }, [session]);

  useEffect(() => {
    let interval: number;
    if (view === 'ACTIVE' && session.startTime && !isPaused) {
      interval = window.setInterval(() => setElapsed(Date.now() - (session.startTime || 0) - totalPausedMs), 1000);
    }
    return () => clearInterval(interval);
  }, [view, session.startTime, isPaused, totalPausedMs]);

  // Online/offline detection + pending save retry
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const pending = localStorage.getItem('studio_pending_save');
      if (pending) {
        try {
          await saveSession(JSON.parse(pending));
          localStorage.removeItem('studio_pending_save');
        } catch (err) {
          console.error('Retry upload failed:', err);
        }
      }
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  function calculateTotal(ms: number, commercial = isCommercial) {
    const roundedHours = Math.round((ms / (1000 * 60 * 60)) * 2) / 2;
    const baseMin = commercial ? COMMERCIAL_RATE_MIN : HOURLY_RATE_MIN;
    const baseExt = commercial ? COMMERCIAL_RATE_EXTENDED : HOURLY_RATE_EXTENDED;
    let subtotal = 0;
    if (roundedHours <= 1.0) {
      subtotal = baseMin;
    } else {
      const wholeHours = Math.floor(roundedHours);
      subtotal = wholeHours * baseExt + (roundedHours % 1 !== 0 ? 3500 : 0);
    }
    // Charged to a monthly package: only hours beyond the package are payable.
    if (pkgUse) subtotal = pkgUse.extraDue;
    const discountAmount = Math.round(subtotal * (discountPct / 100));
    const finalTotal = Math.max(0, subtotal - discountAmount);
    return { roundedHours, subtotal, discountAmount, finalTotal };
  }

  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    return {
      h: Math.floor(s / 3600).toString().padStart(2, '0'),
      m: Math.floor((s % 3600) / 60).toString().padStart(2, '0'),
      s: (s % 60).toString().padStart(2, '0'),
    };
  }

  const durationMs = view === 'SUMMARY' && session.endTime && session.startTime
    ? session.endTime - session.startTime - totalPausedMs : elapsed;
  const t = formatTime(durationMs);
  const pricing = calculateTotal(durationMs);

  const plannedMs = session.plannedMinutes ? session.plannedMinutes * 60 * 1000 : null;
  const remainingMs = plannedMs !== null ? plannedMs - elapsed : null;
  const timeWarningActive = !warningDismissed && remainingMs !== null && remainingMs <= 10 * 60 * 1000;

  const formatRemaining = (ms: number) => {
    const clamped = Math.max(0, ms);
    const totalSec = Math.ceil(clamped / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.name || !session.phone) return;
    setSession(prev => ({ ...prev, startTime: Date.now() }));
    setView('ACTIVE');
  };

  const handleEnd = () => {
    if (isPaused && pauseStartTime) {
      setTotalPausedMs(prev => prev + (Date.now() - pauseStartTime));
    }
    setSession(prev => ({ ...prev, endTime: Date.now() }));
    setView('SUMMARY');
    setShowEndConfirm(false);
    setIsPaused(false);
  };

  const handlePausePin = async () => {
    if (pinChecking || pausePinInput.length < 4) return;
    setPinChecking(true);
    let ok = false;
    try {
      const r = await fetch('/api/verify-pin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: pausePinInput }),
      });
      if (r.status !== 200) throw new Error(String(r.status));
      ok = (await r.json()).ok === true;
    } catch {
      setPinChecking(false);
      setPausePinError('Could not check the PIN. Check the connection and try again.');
      return;
    }
    setPinChecking(false);
    if (ok) {
      setPausePinError('');
      setPausePinInput('');
      setShowPausePin(false);
      if (isPaused && pauseStartTime) {
        setTotalPausedMs(prev => prev + (Date.now() - pauseStartTime));
        setPauseStartTime(null);
        setIsPaused(false);
      } else {
        setPauseStartTime(Date.now());
        setIsPaused(true);
      }
    } else {
      setPausePinError('Incorrect PIN');
      setPausePinInput('');
    }
  };

  const handlePayment = async (method: 'online' | 'cash' | 'package') => {
    const methodLabel = method === 'online' ? 'Bank Transfer' : method === 'package' ? 'Monthly Package' : pkgUse ? 'Monthly Package + Cash' : 'Cash';
    const endTime = session.endTime || Date.now();
    const ms = endTime - (session.startTime || 0) - totalPausedMs;
    const p = calculateTotal(ms);
    setLastPricing(p);
    setLastPayMethod(method === 'online' && pkgUse ? 'Monthly Package + Bank Transfer' : methodLabel);
    setIsSaving(true);
    setPaymentModal(null);

    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');

    const payload = {
      name: session.name,
      phone: session.phone,
      sessionType: isCommercial ? 'Commercial' : 'Non-Commercial',
      paymentMethod: method === 'online' && pkgUse ? 'Monthly Package + Bank Transfer' : methodLabel,
      startedAt: session.startTime ? new Date(session.startTime).toLocaleString() : '',
      duration: `${h}h ${m}m`,
      amount: p.finalTotal,
    };
    try {
      await saveSession(payload);
      localStorage.removeItem('studio_pending_save');
    } catch (err) {
      localStorage.setItem('studio_pending_save', JSON.stringify(payload));
      console.error('Offline — queued for retry when connection returns');
    } finally {
      setIsSaving(false);
    }
    setShowGreeting(true);
  };

  // When a session ends, check whether this phone number has a monthly package.
  useEffect(() => {
    if (view !== 'SUMMARY' || pkgUse || !session.phone) return;
    let live = true;
    api<{ package: PackageView | null }>('package-lookup', { phone: session.phone })
      .then(r => { if (live && r.ok && r.package && !r.package.expired) setPkgOffer(r.package); })
      .catch(() => {});
    return () => { live = false; };
  }, [view, session.phone, pkgUse]);

  const applyPackage = async () => {
    if (!session.startTime || !session.endTime) return;
    setPkgBusy(true); setPkgError('');
    try {
      const r = await api<{ package: PackageView | null; charged: number; extraHours: number; extraDue: number }>('package-use', {
        phone: session.phone, startedAt: session.startTime, endedAt: session.endTime,
        durationMs: session.endTime - session.startTime - totalPausedMs,
      });
      if (!r.ok || !r.package) throw new Error(r.error);
      setDiscountPct(0);
      setPkgUse({ pkg: r.package, charged: r.charged, extraHours: r.extraHours, extraDue: r.extraDue });
    } catch {
      setPkgError('Could not charge the package. Check the connection, or take payment and tell staff.');
    }
    setPkgBusy(false);
  };

  const handleReset = () => {
    setSession(DEFAULT_SESSION);
    setView('IDLE');
    setElapsed(0);
    setDiscountPct(0);
    setLastPricing(null);
    setPkgUse(null); setPkgOffer(null); setPkgError('');
    setWarningDismissed(false);
    setIsCommercial(false);
    setIsPaused(false);
    setTotalPausedMs(0);
    setPauseStartTime(null);
    localStorage.removeItem('neon_studio_session');
  };

  const downloadInvoice = () => {
    const W = 800, H = 1050, sc = 2;
    const cv = document.createElement('canvas');
    cv.width = W * sc; cv.height = H * sc;
    const ctx = cv.getContext('2d')!;
    ctx.scale(sc, sc);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0a0807'; ctx.fillRect(0, 0, W, 110);
    ctx.fillStyle = COCO; ctx.font = 'bold 42px Arial Black, Arial'; ctx.textAlign = 'left';
    ctx.fillText('STUDIO ALORA', 40, 68);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '12px Arial';
    ctx.fillText('THE VISUAL COLLECTIVE', 42, 92);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px Arial Black, Arial'; ctx.textAlign = 'right';
    ctx.fillText('INVOICE', W - 40, 62);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '12px Arial';
    ctx.fillText(session.startTime ? new Date(session.startTime).toLocaleDateString() : '', W - 40, 90);
    const row = (label: string, value: string, y: number) => {
      ctx.fillStyle = '#888'; ctx.font = '11px Arial'; ctx.textAlign = 'left'; ctx.fillText(label.toUpperCase(), 40, y);
      ctx.fillStyle = '#111'; ctx.font = '16px Arial'; ctx.textAlign = 'right'; ctx.fillText(value, W - 40, y + 2);
    };
    const divider = (y: number, color = '#eee') => {
      ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 40, y); ctx.stroke();
    };
    ctx.fillStyle = '#111'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'left'; ctx.fillText('BILLED TO', 40, 155);
    ctx.font = 'bold 22px Arial Black, Arial'; ctx.fillText(session.name, 40, 182);
    ctx.fillStyle = '#555'; ctx.font = '14px Arial'; ctx.fillText(session.phone, 40, 202);
    divider(245);
    let y = 275;
    row('Session Started', session.startTime ? new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--', y); y += 40;
    row('Session Ended', session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--', y); y += 40;
    row('Total Duration', `${t.h}h ${t.m}m`, y); y += 40;
    row('Rated Hours', `${(lastPricing || pricing).roundedHours} hrs`, y); y += 40;
    divider(y + 15); y += 45;
    row('Subtotal', `${(lastPricing || pricing).subtotal.toLocaleString()} LKR`, y); y += 40;
    if (discountPct > 0) { row('Discount', `-${discountPct}% (${(lastPricing || pricing).discountAmount.toLocaleString()} LKR)`, y); y += 40; }
    row('Payment Method', lastPayMethod || 'Cash', y); y += 50;
    divider(y, '#000'); y += 30;
    ctx.fillStyle = '#111'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left'; ctx.fillText('TOTAL DUE', 40, y + 24);
    ctx.fillStyle = '#A67848'; ctx.font = 'bold 38px Arial Black, Arial'; ctx.textAlign = 'right';
    ctx.fillText(`${(lastPricing || pricing).finalTotal.toLocaleString()} LKR`, W - 40, y + 28);
    ctx.fillStyle = '#0a0807'; ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
    ctx.fillText('Thank you for choosing Studio Alora  •  ' + SITE_HOST, W / 2, H - 25);
    const a = document.createElement('a');
    a.href = cv.toDataURL('image/png');
    a.download = `studio-alora-invoice-${session.name.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const josefin: React.CSSProperties = { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.25em' };

  return (
    <div className="min-h-screen text-[#F0EDE8] font-sans selection:bg-[#C4956A] selection:text-black flex flex-col items-center justify-center p-4 pt-24">


      <main className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">

          {/* ── IDLE ── */}
          {view === 'IDLE' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4 }}
              className={`${glass} p-8 space-y-8`}>

              <div className="space-y-2 text-center">
                <h1 style={josefin} className="text-4xl uppercase leading-none text-[#C4956A]">STUDIO ALORA</h1>
                <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase mt-1">The Visual Collective</p>
              </div>

              <form onSubmit={handleStart} className="space-y-6">

                <KindToggle value={isCommercial ? 'commercial' : 'nonCommercial'} onChange={k => setIsCommercial(k === 'commercial')} />

                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4956A]/30 group-focus-within:text-[#C4956A] transition-colors" size={20} />
                    <input required type="text" placeholder="YOUR NAME OR BRAND NAME"
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A]/40 transition-all uppercase font-medium placeholder:text-white/20 text-[#F0EDE8]"
                      value={session.name} onChange={e => setSession(prev => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4956A]/30 group-focus-within:text-[#C4956A] transition-colors" size={20} />
                    <input required type="tel" placeholder="PHONE NUMBER"
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A]/40 transition-all font-mono placeholder:text-white/20 text-[#F0EDE8]"
                      value={session.phone} onChange={e => setSession(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>
                </div>

                {/* Planned duration */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/25 ml-1">Planned Duration</p>
                  <div className="flex gap-2 flex-wrap">
                    {PLANNED_OPTIONS.map(opt => (
                      <button key={String(opt.value)} type="button"
                        onClick={() => setSession(prev => ({ ...prev, plannedMinutes: opt.value }))}
                        className={cn(
                          'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border transition-all',
                          session.plannedMinutes === opt.value
                            ? 'bg-[#C4956A] text-black border-[#C4956A]'
                            : 'bg-white/[0.04] text-white/40 border-white/[0.08] hover:border-[#C4956A]/40 hover:text-white/70'
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.04] border border-[#C4956A]/10 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs font-bold text-white/35 uppercase">
                    <span>1 Hour (Flat)</span>
                    <span className="text-[#C4956A]">{lkr(isCommercial ? COMMERCIAL_RATE_MIN : HOURLY_RATE_MIN)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-white/35 uppercase">
                    <span>2+ Hours (Per Hour)</span>
                    <span className="text-[#C4956A]">{lkr(isCommercial ? COMMERCIAL_RATE_EXTENDED : HOURLY_RATE_EXTENDED)}/HR</span>
                  </div>
                  <div className="pt-1 border-t border-white/[0.06]">
                    <p className="text-[9px] text-white/20 uppercase tracking-wider">
                      {RATES[isCommercial ? 'commercial' : 'nonCommercial'].note}
                    </p>
                  </div>
                </div>

                <button type="submit"
                  className="w-full bg-[#C4956A] text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform uppercase tracking-tighter text-lg">
                  Start Session <ArrowRight size={24} />
                </button>

                <button type="button" onClick={() => setShowQR(true)}
                  className="w-full flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white hover:border-[#C4956A]/40 font-bold py-3 rounded-2xl transition-all uppercase tracking-widest text-[11px]">
                  <QrCode size={14} /> Scan to Check-in
                </button>

                <Link to="/calculator"
                  className="block w-full text-center text-white/30 hover:text-[#C4956A] transition-colors uppercase font-bold text-[10px] tracking-widest pt-2">
                  Price Calculator
                </Link>
              </form>
            </motion.div>
          )}

          {/* ── ACTIVE ── */}
          {view === 'ACTIVE' && (
            <motion.div key="active" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 0.4 }}
              className="relative text-center">

              <div className={`${glass} p-10 space-y-10`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={isPaused ? { opacity: 1 } : { opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1.6, repeat: isPaused ? 0 : Infinity }}
                        className={cn('w-2 h-2 rounded-full', isPaused ? 'bg-amber-400' : 'bg-[#C4956A]')}
                      />
                      <p className={cn('font-black uppercase tracking-[0.2em] text-sm', isPaused ? 'text-amber-400' : 'text-[#C4956A]')}>
                        {isPaused ? 'Session Paused' : 'Session in Progress'}
                      </p>
                    </div>
                    {/* Offline indicator */}
                    {!isOnline && (
                      <span className="text-[9px] font-black uppercase tracking-wide bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full">Offline</span>
                    )}
                  </div>

                  {/* Low-time warning banner */}
                  <AnimatePresence>
                    {timeWarningActive && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          <div>
                            <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">Time Remaining</p>
                            <p className="text-red-300 text-2xl font-black tabular-nums leading-tight">
                              {remainingMs !== null ? formatRemaining(remainingMs) : ''}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => setWarningDismissed(true)} className="text-red-400/40 hover:text-red-400 text-xs font-black px-1">✕</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <h2 className="text-2xl font-black uppercase tracking-tight opacity-50">{session.name}</h2>
                </div>

                <div className="flex gap-4 justify-center items-end">
                  {[{ v: t.h, l: 'Hrs' }, { v: ':', l: '' }, { v: t.m, l: 'Min' }, { v: ':', l: '' }, { v: t.s, l: 'Sec', accent: true }].map((item, i) =>
                    item.l === '' ? (
                      <span key={i} className="text-[10vw] sm:text-[80px] font-black tracking-tighter opacity-15 leading-none pb-4">:</span>
                    ) : (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className={cn('text-[10vw] sm:text-[80px] font-black tracking-tighter tabular-nums leading-none', item.accent ? 'text-[#C4956A]' : 'text-[#F0EDE8]')}>
                          {item.v}
                        </div>
                        <span className="text-white/25 text-[9px] font-black uppercase tracking-[0.3em]">{item.l}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="text-center space-y-0.5">
                  <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em]">Running Cost</p>
                  <p className="text-lg font-black tabular-nums text-[#C4956A]/70">{pricing.finalTotal.toLocaleString()} <span className="text-sm font-bold">LKR</span></p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-[#C4956A]/20 to-transparent" />

                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                  <button onClick={() => { setPausePinInput(''); setPausePinError(''); setShowPausePin(true); }}
                    className={cn(
                      'w-full font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all uppercase tracking-widest text-sm border',
                      isPaused
                        ? 'bg-[#C4956A]/15 border-[#C4956A]/40 text-[#C4956A] hover:bg-[#C4956A]/25'
                        : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white'
                    )}>
                    {isPaused ? <><Play size={16} strokeWidth={1.5} /> Resume Session</> : <><Pause size={16} strokeWidth={1.5} /> Pause Session</>}
                  </button>
                  <button onClick={() => setShowEndConfirm(true)}
                    className="w-full border border-red-500/40 bg-red-500/5 text-red-400 font-black py-5 rounded-2xl flex items-center justify-center hover:bg-red-500/15 hover:border-red-500/60 active:scale-[0.98] transition-all uppercase tracking-tighter text-lg">
                    End Session
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SUMMARY ── */}
          {view === 'SUMMARY' && (
            <motion.div key="summary" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4 }}
              className={`${glass} p-8 space-y-8`}>

              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C4956A]/10 border border-[#C4956A]/20 text-[#C4956A] mb-2">
                  <CheckCircle2 size={40} />
                </div>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase">Session Finished</h1>
                <p className="text-white/40 text-sm font-medium tracking-wide">Summary for {session.name}</p>
                {isSaving && (
                  <div className="flex items-center justify-center gap-2 text-[#C4956A] text-[10px] font-black uppercase tracking-widest mt-2">
                    <Loader2 size={12} className="animate-spin" /> Syncing to Cloud...
                  </div>
                )}
              </div>

              <div className="space-y-4 border-y border-[#C4956A]/10 py-6">
                <div className="flex justify-between items-center">
                  <span className="text-white/35 font-bold uppercase text-xs">Started</span>
                  <span className="text-sm font-black tabular-nums">
                    {session.startTime ? new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/35 font-bold uppercase text-xs">Finished</span>
                  <span className="text-sm font-black tabular-nums">
                    {session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#C4956A]/10">
                  <span className="text-white/35 font-bold uppercase text-xs">Total Duration</span>
                  <span className="text-2xl font-black italic tabular-nums">{t.h}h {t.m}m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/35 font-bold uppercase text-xs">Rated Hours</span>
                  <span className="text-xl font-black tabular-nums">{pricing.roundedHours} HRS</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#C4956A]/10">
                  <span className="text-white/35 font-bold uppercase text-xs">Subtotal</span>
                  <span className="text-xl font-bold tabular-nums italic text-white/70">{pricing.subtotal.toLocaleString()} LKR</span>
                </div>

                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2">
                  <input type="number" min="0" max="100" placeholder="DISCOUNT %"
                    className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full tabular-nums text-[#F0EDE8]"
                    value={discountPct || ''}
                    onChange={e => setDiscountPct(Math.min(100, Math.max(0, Number(e.target.value))))} />
                  {discountPct > 0 && (
                    <span className="text-xs text-red-400 font-bold shrink-0">-{pricing.discountAmount.toLocaleString()} LKR</span>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-[#C4956A]/25">
                  <span className="text-black bg-[#C4956A] px-2 py-0.5 rounded font-black uppercase text-[10px] tracking-widest">Total Due</span>
                  <span className="text-4xl font-black text-[#C4956A] tabular-nums italic">{pricing.finalTotal.toLocaleString()} LKR</span>
                </div>
              </div>

              {/* Monthly package */}
              {pkgOffer && !pkgUse && (
                <div className="bg-[#C4956A]/10 border border-[#C4956A]/40 rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#C4956A]">Monthly package found</p>
                  <p className="text-sm font-bold text-white/80">{pkgOffer.name} has {hrs(pkgOffer.left)} left of {pkgOffer.hours}.</p>
                  <button onClick={applyPackage} disabled={pkgBusy}
                    className="w-full bg-[#C4956A] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-tighter disabled:opacity-50">
                    {pkgBusy ? <Loader2 size={18} className="animate-spin" /> : null} Use Package Hours
                  </button>
                  {pkgError && <p role="alert" className="text-red-400 text-xs font-bold text-center">{pkgError}</p>}
                </div>
              )}
              {pkgUse && (
                <div className="bg-[#C4956A]/10 border border-[#C4956A]/40 rounded-2xl p-4 space-y-1 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#C4956A]">Charged to monthly package</p>
                  <p className="text-sm font-bold text-white/80">{hrs(pkgUse.charged)} used · {hrs(pkgUse.pkg.left)} left</p>
                  {pkgUse.extraHours > 0 && <p className="text-xs font-bold text-amber-400">{hrs(pkgUse.extraHours)} over the package, payable now at the package rate.</p>}
                </div>
              )}

              <div className="space-y-3">
                {pkgUse && pkgUse.extraDue === 0 ? (
                  <button onClick={() => handlePayment('package')}
                    className="w-full bg-[#C4956A] text-black font-black py-4 rounded-2xl flex items-center justify-center uppercase tracking-tighter text-lg">
                    Finish
                  </button>
                ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPaymentModal('online')}
                    className="w-full bg-[#C4956A]/10 border border-[#C4956A]/25 text-[#C4956A] font-black py-4 rounded-2xl flex items-center justify-center hover:bg-[#C4956A]/20 transition-all uppercase tracking-tighter">
                    Pay Online
                  </button>
                  <button onClick={() => handlePayment('cash')}
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-white font-black py-4 rounded-2xl flex items-center justify-center hover:bg-white/[0.08] transition-all uppercase tracking-tighter">
                    Pay by Cash
                  </button>
                </div>
                )}
                <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer"
                  className="w-full bg-[#F0EDE8] text-black font-black py-4 rounded-2xl flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-transform uppercase tracking-tighter">
                  Leave a Google Review
                </a>
                <button onClick={handleReset}
                  className="w-full border border-white/[0.08] text-white/30 font-bold py-4 rounded-2xl hover:text-white/50 transition-all uppercase tracking-widest text-[10px]">
                  Close & Ready Next Client
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Call for Help */}
      <button onClick={() => setShowHelp(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#1a1512] hover:bg-[#C4956A] hover:text-black border border-[#C4956A]/20 rounded-full flex items-center justify-center transition-all z-50 group">
        <Phone size={22} />
        <span className="absolute right-16 scale-0 group-hover:scale-100 transition-transform bg-[#C4956A] text-black px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap">Call for Help</span>
      </button>

      {/* ── MODALS ── */}
      <AnimatePresence>

        {/* Pay Online */}
        {paymentModal === 'online' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`${glassSolid} p-8 max-w-sm w-full space-y-6`}>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black tracking-tighter uppercase italic">Bank Transfer</h3>
                <p className="text-white/40 text-sm font-medium">Transfer the total and tap Transferred when done</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-white/25 text-[10px] font-black uppercase tracking-widest">Bank</span>
                  <p className="text-lg font-bold text-white/80">{BANK_DETAILS.bank}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-white/25 text-[10px] font-black uppercase tracking-widest">Account Name</span>
                  <div className="flex items-center justify-between bg-white/[0.06] p-3 rounded-xl border border-white/[0.08]">
                    <p className="text-lg font-bold text-white/80">{BANK_DETAILS.name}</p>
                    <button onClick={() => handleCopy(BANK_DETAILS.name, 'name')}
                      className={cn('flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wide transition-all',
                        copiedField === 'name' ? 'bg-[#C4956A]/20 text-[#C4956A]' : 'bg-white/10 text-white/50 hover:bg-white/20')}>
                      {copiedField === 'name' ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-white/25 text-[10px] font-black uppercase tracking-widest">Account Number</span>
                  <div className="flex items-center justify-between bg-white/[0.06] p-3 rounded-xl border border-white/[0.08]">
                    <p className="text-xl font-black tabular-nums tracking-wider text-[#C4956A]">{BANK_DETAILS.account}</p>
                    <button onClick={() => handleCopy(BANK_DETAILS.account, 'account')}
                      className={cn('flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wide transition-all',
                        copiedField === 'account' ? 'bg-[#C4956A]/20 text-[#C4956A]' : 'bg-white/10 text-white/50 hover:bg-white/20')}>
                      {copiedField === 'account' ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                    </button>
                  </div>
                </div>
                <div className="bg-[#C4956A]/8 border border-[#C4956A]/20 rounded-xl p-3 text-center">
                  <span className="text-white/35 text-[10px] font-black uppercase tracking-widest">Amount to Transfer</span>
                  <p className="text-3xl font-black text-[#C4956A] tabular-nums italic mt-1">{pricing.finalTotal.toLocaleString()} LKR</p>
                </div>
              </div>
              <div className="space-y-3">
                <button onClick={() => handlePayment('online')} disabled={isSaving}
                  className="w-full bg-[#C4956A] text-black font-black py-4 rounded-2xl uppercase tracking-tighter text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50">
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : null} Transferred
                </button>
                <button onClick={() => setPaymentModal(null)}
                  className="w-full bg-white/[0.04] text-white/35 font-bold py-3 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-white/[0.08] transition-colors">Back</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Greeting */}
        {showGreeting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }}
              className={`${glassSolid} p-10 max-w-sm w-full text-center space-y-6`}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C4956A]/10 border border-[#C4956A]/20 text-[#C4956A]">
                <CheckCircle2 size={48} />
              </motion.div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tighter uppercase italic text-[#C4956A]">Thank You!</h2>
                <p className="text-white/60 font-bold text-base leading-relaxed">
                  {session.name ? `See you next time, ${session.name}!` : 'See you next time!'}<br />
                  <span className="text-white/35 text-sm">We appreciate your visit to Studio Alora.</span>
                </p>
              </div>
              <button onClick={downloadInvoice}
                className="w-full flex items-center justify-center gap-2 bg-white/[0.06] border border-white/15 text-white font-bold py-3 rounded-2xl uppercase tracking-tighter text-sm hover:bg-white/10 transition-colors">
                <Download size={16} /> Download Invoice
              </button>
              <button onClick={() => { setShowGreeting(false); handleReset(); }}
                className="w-full bg-[#C4956A] text-black font-black py-4 rounded-2xl uppercase tracking-tighter text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform">
                Done
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Help */}
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`${glassSolid} p-8 max-w-sm w-full space-y-6 text-center`}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C4956A]/10 border border-[#C4956A]/20 text-[#C4956A]">
                <Phone size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tighter uppercase italic">Call for Help</h3>
                <p className="text-white/40 text-sm font-medium">Tap the number below to call the studio manager.</p>
              </div>
              <a href={`tel:${HELP_PHONE_NUMBER.replace(/\s/g, '')}`}
                className="block w-full bg-[#C4956A] text-black font-black py-4 rounded-2xl text-xl tracking-wide font-mono">
                {HELP_PHONE_NUMBER}
              </a>
              <button onClick={() => setShowHelp(false)}
                className="text-white/25 hover:text-white font-bold uppercase text-[10px] tracking-widest pt-2">
                Stay in session
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* End confirm */}
        {showEndConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`${glassSolid} p-8 max-w-sm w-full space-y-6 text-center`}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tighter uppercase italic">End Session?</h3>
                <p className="text-white/40 text-sm font-medium">This will stop the timer and calculate the final amount due.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleEnd} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl text-lg uppercase tracking-tighter hover:bg-red-600 transition-colors">
                  Yes, End Session
                </button>
                <button onClick={() => setShowEndConfirm(false)}
                  className="w-full bg-white/[0.04] text-white/40 font-black py-4 rounded-2xl text-lg uppercase tracking-tighter hover:bg-white/[0.08] transition-colors">
                  Back to Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Price tester */}
        {showTestMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`${glassSolid} p-8 max-w-sm w-full space-y-6`}>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black tracking-tighter uppercase italic">Price Calculator</h3>
                <p className="text-white/40 text-sm font-medium">Verify your rates logic here</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-white/25 ml-2">Hours</label>
                  <input type="number" className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl p-4 font-black text-xl tabular-nums focus:border-[#C4956A] focus:ring-0 outline-none"
                    value={testHours} onChange={e => setTestHours(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-white/25 ml-2">Minutes</label>
                  <input type="number" className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl p-4 font-black text-xl tabular-nums focus:border-[#C4956A] focus:ring-0 outline-none"
                    value={testMinutes} onChange={e => setTestMinutes(e.target.value)} />
                </div>
              </div>
              <div className="bg-white/[0.04] p-6 rounded-2xl border border-[#C4956A]/10 space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase text-white/30">
                  <span>Duration</span><span className="text-[#F0EDE8]">{testHours}H {testMinutes}M</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase text-white/30">
                  <span>Rated Hours</span>
                  <span className="text-[#F0EDE8]">{calculateTotal((parseInt(testHours || '0') * 3600 + parseInt(testMinutes || '0') * 60) * 1000).roundedHours} HRS</span>
                </div>
                <div className="pt-4 border-t border-[#C4956A]/10 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#C4956A]">Price</span>
                  <span className="text-3xl font-black italic text-[#C4956A]">
                    {calculateTotal((parseInt(testHours || '0') * 3600 + parseInt(testMinutes || '0') * 60) * 1000).finalTotal.toLocaleString()} LKR
                  </span>
                </div>
              </div>
              <button onClick={() => setShowTestMode(false)}
                className="w-full bg-[#F0EDE8] text-black font-black py-4 rounded-2xl text-lg uppercase tracking-tighter">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* QR */}
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white text-black p-8 rounded-3xl max-w-sm w-full space-y-6 text-center shadow-2xl">
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tighter uppercase italic">STUDIO ALORA</h2>
                <p className="text-black/40 text-[10px] font-bold tracking-[0.2em] uppercase">The Visual Collective</p>
              </div>
              <div className="flex justify-center"><canvas ref={qrCanvasRef} className="rounded-xl" /></div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-wide">Scan to Check-in</p>
                <p className="text-black/40 text-[10px] font-bold tracking-widest uppercase">{SITE_HOST}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={async () => {
                  if (!qrCanvasRef.current) return;
                  const qrDataUrl = qrCanvasRef.current.toDataURL('image/png');
                  const win = window.open('', '_blank');
                  if (!win) return;
                  win.document.write(`<!DOCTYPE html><html><head><title>Studio Alora QR</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial Black,Arial,sans-serif;background:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh}.card{text-align:center;padding:40px 48px;border:3px solid #000;border-radius:24px;display:inline-block}.title{font-size:28px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;font-style:italic}.sub{font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#999;margin-top:4px}img{display:block;margin:24px auto;border-radius:12px}.cta{font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:2px}.url{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#aaa;margin-top:6px}@media print{body{margin:0}.card{border:3px solid #000}}</style></head><body><div class="card"><div class="title">STUDIO ALORA</div><div class="sub">The Visual Collective</div><img src="${qrDataUrl}" width="260" height="260"/><div class="cta">Scan to Check-in</div><div class="url">${SITE_HOST}</div></div><script>window.onload=()=>window.print()<\/script></body></html>`);
                  win.document.close();
                }} className="flex-1 flex items-center justify-center gap-2 bg-black text-white font-black py-3 rounded-2xl uppercase tracking-tighter text-sm hover:bg-black/80 transition-colors">
                  <Printer size={16} /> Print
                </button>
                <button onClick={async () => {
                  if (!qrCanvasRef.current) return;
                  const size = 1200, pad = 80, qrSize = size - pad * 2;
                  const qrCanvas = document.createElement('canvas');
                  await QRCode.toCanvas(qrCanvas, SITE_URL, { width: qrSize, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
                  const out = document.createElement('canvas');
                  out.width = size; out.height = size;
                  const ctx = out.getContext('2d')!;
                  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
                  ctx.drawImage(qrCanvas, pad, pad, qrSize, qrSize);
                  ctx.fillStyle = '#000000'; ctx.font = '900 52px Arial Black, Arial'; ctx.textAlign = 'center';
                  ctx.fillText('STUDIO ALORA', size / 2, 60);
                  ctx.font = '700 36px Arial Black, Arial'; ctx.fillText('SCAN TO CHECK-IN', size / 2, size - 36);
                  ctx.fillStyle = '#aaaaaa'; ctx.font = '400 22px Arial'; ctx.fillText(SITE_HOST, size / 2, size - 8);
                  const a = document.createElement('a'); a.href = out.toDataURL('image/png'); a.download = 'studio-alora-qr.png'; a.click();
                }} className="flex-1 flex items-center justify-center gap-2 bg-black/10 text-black font-black py-3 rounded-2xl uppercase tracking-tighter text-sm hover:bg-black/20 transition-colors">
                  <Download size={16} /> PNG
                </button>
                <button onClick={() => setShowQR(false)}
                  className="flex-1 bg-black/10 text-black font-black py-3 rounded-2xl uppercase tracking-tighter text-sm hover:bg-black/20 transition-colors">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Pause PIN */}
        {showPausePin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`${glassSolid} p-8 max-w-sm w-full space-y-5`}>
              <div className="text-center space-y-1">
                <h3 className="text-xl font-black tracking-tighter uppercase">{isPaused ? 'Resume Session' : 'Pause Session'}</h3>
                <p className="text-white/40 text-xs font-medium tracking-wide">Enter staff PIN to {isPaused ? 'resume' : 'pause'}</p>
              </div>
              {!isPaused && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center space-y-1">
                  <p className="text-amber-400 text-sm font-black uppercase tracking-wide">⚡ Before Pausing</p>
                  <p className="text-amber-300/70 text-xs font-medium leading-relaxed">Breaks are for shoots of 6 hours or more, up to 1 hour. Please turn off all video lights and the AC while the session is paused.</p>
                </div>
              )}
              <div className="space-y-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Enter 4-digit PIN"
                  autoFocus
                  value={pausePinInput}
                  onChange={e => { setPausePinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setPausePinError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handlePausePin()}
                  className="w-full bg-white/[0.06] border border-white/[0.10] rounded-2xl py-4 px-5 text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A]/40 transition-all"
                />
                {pausePinError && <p className="text-red-400 text-xs font-black uppercase tracking-widest text-center">{pausePinError}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowPausePin(false); setPausePinInput(''); setPausePinError(''); }}
                  className="flex-1 bg-white/[0.04] text-white/40 font-bold py-3 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-white/[0.08] transition-colors">
                  Cancel
                </button>
                <button onClick={handlePausePin} disabled={pinChecking}
                  className="flex-1 disabled:opacity-50 bg-[#C4956A] text-black font-black py-3 rounded-2xl uppercase tracking-tighter hover:scale-[1.02] active:scale-[0.98] transition-transform">
                  {pinChecking ? 'Checking…' : isPaused ? 'Resume' : 'Pause'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      <footer className="fixed bottom-4 left-0 right-0 pointer-events-none opacity-15 hidden sm:block">
        <p className="text-[10px] font-black uppercase text-center tracking-[0.5em] text-[#C4956A]">STUDIO ALORA MANAGEMENT SYSTEM v1.0.0</p>
      </footer>
    </div>
  );
}
