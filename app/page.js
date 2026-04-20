'use client'

import {
  useState, useEffect, useRef,
  useCallback, useMemo
} from 'react'
import { supabase } from '../lib/supabase'

// ─── CONSTANTS ───────────────────────────────────────────────

const MOODS = [
  { key:'joyful',     label:'Joyful',     symbol:'◈', grad:'135deg,#f59e0b,#ef4444', glow:'rgba(245,158,11,0.35)',  light:'rgba(245,158,11,0.12)'  },
  { key:'calm',       label:'Calm',       symbol:'◌', grad:'135deg,#06b6d4,#3b82f6', glow:'rgba(6,182,212,0.35)',   light:'rgba(6,182,212,0.12)'   },
  { key:'excited',    label:'Excited',    symbol:'◉', grad:'135deg,#8b5cf6,#ec4899', glow:'rgba(139,92,246,0.35)', light:'rgba(139,92,246,0.12)'  },
  { key:'reflective', label:'Reflective', symbol:'◎', grad:'135deg,#10b981,#06b6d4', glow:'rgba(16,185,129,0.35)', light:'rgba(16,185,129,0.12)'  },
  { key:'melancholy', label:'Melancholy', symbol:'◇', grad:'135deg,#6366f1,#8b5cf6', glow:'rgba(99,102,241,0.35)', light:'rgba(99,102,241,0.12)'  },
  { key:'grateful',   label:'Grateful',   symbol:'✦', grad:'135deg,#f43f5e,#f59e0b', glow:'rgba(244,63,94,0.35)',  light:'rgba(244,63,94,0.12)'   },
  { key:'anxious',    label:'Anxious',    symbol:'◬', grad:'135deg,#f97316,#eab308', glow:'rgba(249,115,22,0.35)', light:'rgba(249,115,22,0.12)'  },
  { key:'hopeful',    label:'Hopeful',    symbol:'✧', grad:'135deg,#a78bfa,#34d399', glow:'rgba(167,139,250,0.35)',light:'rgba(167,139,250,0.12)' },
]

const TAGS = [
  'Personal','Work','Health','Travel',
  'Family','Goals','Dreams','Gratitude','Ideas','Relationships'
]

const SORT_OPTIONS = [
  { key:'newest',   label:'Newest first'   },
  { key:'oldest',   label:'Oldest first'   },
  { key:'longest',  label:'Longest first'  },
  { key:'shortest', label:'Shortest first' },
]

// ─── UTILITIES ───────────────────────────────────────────────

const getMood     = key => MOODS.find(m => m.key === key) || MOODS[1]
const wordCount   = t   => t?.trim() ? t.trim().split(/\s+/).length : 0
const readingTime = t   => {
  const m = Math.ceil(wordCount(t) / 200)
  return m < 1 ? '< 1 min' : `${m} min read`
}
const fmtDateShort = ds => new Date(ds).toLocaleDateString('en-US',{
  month:'short', day:'numeric', year:'numeric'
})
const fmtTime = ds => new Date(ds).toLocaleTimeString('en-US',{
  hour:'2-digit', minute:'2-digit'
})
const fmtDateFull = ds => new Date(ds).toLocaleDateString('en-US',{
  weekday:'long', year:'numeric', month:'long', day:'numeric'
})

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getStreak(entries) {
  if (!entries.length) return 0
  const dates = [...new Set(
    entries.map(e => new Date(e.created_at).toDateString())
  )].map(d => new Date(d)).sort((a,b) => b - a)
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const diff = (dates[i-1] - dates[i]) / (1000*60*60*24)
    if (diff === 1) streak++
    else break
  }
  const diffToday = (new Date() - dates[0]) / (1000*60*60*24)
  return diffToday > 1 ? 0 : streak
}

// ─── FONT CONSTANTS ──────────────────────────────────────────

const FF = {
  display: "'Instrument Serif', serif",
  body:    "'Inter', sans-serif",
}

const GRAD_BTN = 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)'

// ─── HOOK: USE WINDOW SIZE ───────────────────────────────────
// Tells us if we're on mobile so we can adjust layouts

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// ─── BACKGROUND ──────────────────────────────────────────────

function Background() {
  return (
    <div style={{
      position:'fixed', inset:0,
      overflow:'hidden', pointerEvents:'none', zIndex:0,
    }}>
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse 70% 50% at 50% -5%, var(--orb-1) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 85%, var(--orb-2) 0%, transparent 60%), var(--bg-primary)',
        transition:'background 0.4s ease',
      }}/>
      {/* Orb 1 */}
      <div style={{
        position:'absolute', top:'-15%', left:'-10%',
        width:'55vmax', height:'55vmax', borderRadius:'50%',
        background:'radial-gradient(circle, var(--orb-1) 0%, transparent 70%)',
        animation:'orbDrift1 18s ease-in-out infinite',
      }}/>
      {/* Orb 2 */}
      <div style={{
        position:'absolute', bottom:'-20%', right:'-10%',
        width:'50vmax', height:'50vmax', borderRadius:'50%',
        background:'radial-gradient(circle, var(--orb-2) 0%, transparent 70%)',
        animation:'orbDrift2 22s ease-in-out infinite',
      }}/>
      {/* Orb 3 */}
      <div style={{
        position:'absolute', top:'35%', left:'35%',
        width:'30vmax', height:'30vmax', borderRadius:'50%',
        background:'radial-gradient(circle, var(--orb-3) 0%, transparent 65%)',
        animation:'orbDrift3 14s ease-in-out infinite',
      }}/>
      {/* Dot grid */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(var(--border) 1px, transparent 1px)',
        backgroundSize:'40px 40px',
        maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
      }}/>
    </div>
  )
}

// ─── 3D BOOK ─────────────────────────────────────────────────

function Book3D({ scale = 1 }) {
  const w = 160 * scale
  const h = 195 * scale
  return (
    <div style={{
      position:'relative',
      width: w * 1.7,
      height: h * 1.5,
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
    }}>
      {/* Glow */}
      <div style={{
        position:'absolute',
        width: w * 1.3, height: w * 1.3,
        borderRadius:'50%',
        background:'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        filter:'blur(28px)',
        animation:'orbDrift1 8s ease-in-out infinite',
      }}/>

      {/* Book */}
      <div style={{ animation:'floatBook 5s ease-in-out infinite' }}>
        <svg
          width={w} height={h}
          viewBox="0 0 160 195"
          fill="none"
          style={{
            filter:'drop-shadow(0 20px 40px var(--accent-glow)) drop-shadow(0 6px 12px rgba(0,0,0,0.4))',
          }}
        >
          <defs>
            <linearGradient id="cvr" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#6d28d9"/>
              <stop offset="45%"  stopColor="#4338ca"/>
              <stop offset="100%" stopColor="#1d4ed8"/>
            </linearGradient>
            <linearGradient id="spn" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#4c1d95"/>
              <stop offset="100%" stopColor="#312e81"/>
            </linearGradient>
            <linearGradient id="shn" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.22)"/>
              <stop offset="70%"  stopColor="rgba(255,255,255,0)"/>
            </linearGradient>
            <radialGradient id="glw" cx="25%" cy="20%" r="60%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.18)"/>
              <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
            </radialGradient>
          </defs>

          {/* Page stack */}
          {[6,4,2].map((o,i) => (
            <rect key={i}
              x={25+o} y={7+o*0.4}
              width={112} height={180-o}
              rx="3"
              fill={`rgba(210,210,220,${0.5-i*0.13})`}
            />
          ))}

          {/* Page edge lines */}
          {Array.from({length:14}).map((_,i) => (
            <line key={i}
              x1="136" y1={13+i*11}
              x2="139" y2={13+i*11}
              stroke="rgba(180,180,190,0.6)"
              strokeWidth="0.8"
            />
          ))}

          {/* Spine */}
          <rect x="18" y="5" width="17" height="184" rx="3" fill="url(#spn)"/>
          <rect x="18" y="5" width="5"  height="184" rx="3" fill="rgba(255,255,255,0.1)"/>

          {/* Cover */}
          <rect x="23" y="5" width="115" height="184" rx="5" fill="url(#cvr)"/>
          <rect x="23" y="5" width="115" height="184" rx="5" fill="url(#shn)"/>
          <rect x="23" y="5" width="115" height="184" rx="5" fill="url(#glw)"/>

          {/* Border */}
          <rect x="31" y="13" width="99" height="168" rx="3"
            fill="none"
            stroke="rgba(255,255,255,0.13)"
            strokeWidth="1"
          />

          {/* Title */}
          <text x="81" y="74" textAnchor="middle"
            fontFamily="Georgia,serif"
            fontSize="16"
            fontStyle="italic"
            fill="rgba(255,255,255,0.92)"
            letterSpacing="0.5"
          >
            Inkwell
          </text>

          {/* Divider */}
          <line x1="51" y1="81" x2="111" y2="81"
            stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>

          {/* Pen nib */}
          <path d="M76 98 Q81 90 86 98 Q84 108 81 113 Q78 108 76 98Z"
            fill="rgba(255,255,255,0.28)"/>
          <line x1="81" y1="113" x2="81" y2="122"
            stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>

          {/* Ruled lines */}
          {[142,152,162,172].map((y,i) => (
            <line key={i}
              x1="43" y1={y}
              x2={130 - i*9} y2={y}
              stroke={`rgba(255,255,255,${0.14 - i*0.03})`}
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Sparkles */}
        {[
          {x:'-22%',y:'-12%',s:6, d:'0s',   t:'3.2s'},
          {x:'108%', y:'5%',  s:4, d:'0.6s', t:'4s'  },
          {x:'-15%', y:'50%', s:5, d:'1.1s', t:'3.7s'},
          {x:'112%', y:'70%', s:3, d:'1.7s', t:'5s'  },
          {x:'20%',  y:'110%',s:4, d:'0.4s', t:'4.5s'},
          {x:'78%',  y:'-18%',s:3, d:'2s',   t:'3.5s'},
        ].map((p,i) => (
          <div key={i} style={{
            position:'absolute', top:p.y, left:p.x,
            width:p.s, height:p.s, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(196,181,253,1),rgba(147,197,253,0.7))',
            boxShadow:`0 0 ${p.s*2}px rgba(196,181,253,0.9)`,
            animation:`floatSpark ${p.t} ease-in-out ${p.d} infinite`,
          }}/>
        ))}
      </div>

      {/* Shadow */}
      <div style={{
        position:'absolute', bottom:'5%', left:'50%',
        transform:'translateX(-50%)',
        width:w*0.7, height:14,
        background:'radial-gradient(ellipse, var(--accent-glow) 0%, transparent 70%)',
        filter:'blur(8px)',
        animation:'floatBook 5s ease-in-out infinite',
      }}/>
    </div>
  )
}

// ─── ORBITAL RINGS ────────────────────────────────────────────

function Rings({ size }) {
  return (
    <div style={{
      position:'absolute', top:'50%', left:'50%',
      transform:'translate(-50%,-50%)',
      width:size, height:size,
      pointerEvents:'none',
    }}>
      {/* Outer */}
      <div style={{
        position:'absolute', inset:0, borderRadius:'50%',
        border:'1px solid rgba(139,92,246,0.15)',
        animation:'rotateCW 24s linear infinite',
      }}>
        <div style={{
          position:'absolute', top:-4, left:'50%',
          transform:'translateX(-50%)',
          width:7, height:7, borderRadius:'50%',
          background:'rgba(167,139,250,0.9)',
          boxShadow:'0 0 10px rgba(167,139,250,0.9)',
        }}/>
      </div>
      {/* Middle */}
      <div style={{
        position:'absolute', inset:size*0.12, borderRadius:'50%',
        border:'1px solid rgba(59,130,246,0.12)',
        animation:'rotateCCW 16s linear infinite',
      }}>
        <div style={{
          position:'absolute', bottom:-3, left:'50%',
          transform:'translateX(-50%)',
          width:5, height:5, borderRadius:'50%',
          background:'rgba(147,197,253,0.9)',
          boxShadow:'0 0 8px rgba(147,197,253,0.8)',
        }}/>
      </div>
      {/* Inner */}
      <div style={{
        position:'absolute', inset:size*0.25, borderRadius:'50%',
        border:'1px solid rgba(236,72,153,0.08)',
        animation:'rotateCW 10s linear infinite',
      }}/>
    </div>
  )
}

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────
// Shows on mobile only — tab bar at the bottom of the screen

function MobileBottomNav({ view, onNavigate, onWrite }) {
  const tabs = [
    { id:'hero',    icon:'🏠', label:'Home'    },
    { id:'dash',    icon:'📊', label:'Journal' },
    { id:'entries', icon:'📚', label:'Entries' },
  ]

  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0,
      zIndex:999,
      background:'var(--nav-bg)',
      backdropFilter:'blur(24px)',
      WebkitBackdropFilter:'blur(24px)',
      borderTop:'1px solid var(--border)',
      display:'flex', alignItems:'stretch',
      paddingBottom:'env(safe-area-inset-bottom, 8px)',
    }}>
      {/* Home */}
      <button
        onClick={() => onNavigate('hero')}
        style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          gap:'3px', padding:'10px 0',
          background:'none', border:'none', cursor:'pointer',
          minHeight:'56px',
        }}
      >
        <span style={{fontSize:'20px', lineHeight:1}}>🏠</span>
        <span style={{
          fontFamily:FF.body, fontSize:'10px', fontWeight:'500',
          color: view==='hero' ? 'var(--accent)' : 'var(--text-muted)',
        }}>Home</span>
      </button>

      {/* Journal */}
      <button
        onClick={() => onNavigate('dash')}
        style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          gap:'3px', padding:'10px 0',
          background:'none', border:'none', cursor:'pointer',
          minHeight:'56px',
        }}
      >
        <span style={{fontSize:'20px', lineHeight:1}}>📊</span>
        <span style={{
          fontFamily:FF.body, fontSize:'10px', fontWeight:'500',
          color: view==='dash' ? 'var(--accent)' : 'var(--text-muted)',
        }}>Journal</span>
      </button>

      {/* Centre write button */}
      <div style={{
        flex:1, display:'flex',
        alignItems:'center', justifyContent:'center',
        padding:'6px 0',
      }}>
        <button
          onClick={onWrite}
          style={{
            width:50, height:50, borderRadius:'50%',
            background: GRAD_BTN,
            border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'22px', lineHeight:1,
            boxShadow:'0 4px 20px var(--accent-glow)',
            transition:'transform 0.2s ease',
          }}
          onTouchStart={e => e.currentTarget.style.transform='scale(0.92)'}
          onTouchEnd={e   => e.currentTarget.style.transform='scale(1)'}
        >
          ✏️
        </button>
      </div>

      {/* Entries */}
      <button
        onClick={() => onNavigate('entries')}
        style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          gap:'3px', padding:'10px 0',
          background:'none', border:'none', cursor:'pointer',
          minHeight:'56px',
        }}
      >
        <span style={{fontSize:'20px', lineHeight:1}}>📚</span>
        <span style={{
          fontFamily:FF.body, fontSize:'10px', fontWeight:'500',
          color: view==='entries' ? 'var(--accent)' : 'var(--text-muted)',
        }}>Entries</span>
      </button>

      {/* Theme toggle */}
      <button
        onClick={onWrite}
        style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          gap:'3px', padding:'10px 0',
          background:'none', border:'none', cursor:'pointer',
          minHeight:'56px',
        }}
      >
        <span style={{fontSize:'20px', lineHeight:1}}>⚙️</span>
        <span style={{
          fontFamily:FF.body, fontSize:'10px', fontWeight:'500',
          color:'var(--text-muted)',
        }}>More</span>
      </button>
    </div>
  )
}

// ─── DESKTOP NAV BAR ─────────────────────────────────────────

function DesktopNav({ view, theme, onNavigate, onToggleTheme, onWrite, scrolled }) {
  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 clamp(20px, 4vw, 48px)',
      height:'68px', zIndex:1000,
      background: scrolled ? 'var(--nav-bg)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : 'none',
      transition:'all 0.4s ease',
    }}>
      {/* Logo */}
      <button
        onClick={() => onNavigate('hero')}
        style={{
          display:'flex', alignItems:'center', gap:'10px',
          background:'none', border:'none', cursor:'pointer', padding:0,
          minHeight:'auto',
        }}
      >
        <div style={{
          width:'34px', height:'34px', borderRadius:'10px',
          background:'linear-gradient(135deg,#7c3aed,#2563eb)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontSize:'15px', fontWeight:'700',
          fontFamily:FF.display,
          boxShadow:'0 4px 16px var(--accent-glow)',
          flexShrink:0,
        }}>I</div>
        <span style={{
          fontFamily:FF.display, fontSize:'20px',
          color:'var(--text-primary)', letterSpacing:'-0.5px',
        }}>
          Inkwell
          <sup style={{
            fontFamily:FF.body, fontSize:'10px',
            color:'var(--text-muted)', marginLeft:'2px',
          }}>®</sup>
        </span>
      </button>

      {/* Pill nav */}
      <div style={{
        display:'flex', alignItems:'center', gap:'4px',
        background:'var(--bg-card)',
        border:'1px solid var(--border)',
        borderRadius:'100px', padding:'4px',
        backdropFilter:'blur(20px)',
        minHeight:'auto',
      }}>
        {[
          {label:'Home',    id:'hero'    },
          {label:'Journal', id:'dash'    },
          {label:'Entries', id:'entries' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              fontFamily:FF.body, fontSize:'13px', fontWeight:'500',
              color: view===item.id ? '#fff' : 'var(--text-muted)',
              background: view===item.id ? GRAD_BTN : 'transparent',
              border:'none', borderRadius:'100px',
              padding:'7px 16px', cursor:'pointer',
              transition:'all 0.25s ease',
              boxShadow: view===item.id ? '0 2px 8px var(--accent-glow)' : 'none',
              minHeight:'auto',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Right controls */}
      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme==='dark' ? 'light' : 'dark'} mode`}
          style={{
            width:38, height:38, borderRadius:'50%',
            background:'var(--bg-card)',
            border:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', fontSize:'16px',
            transition:'all 0.3s ease',
            minHeight:'auto', flexShrink:0,
          }}
        >
          {theme==='dark' ? '☀️' : '🌙'}
        </button>

        {/* Write button */}
        <button
          onClick={onWrite}
          style={{
            fontFamily:FF.body, fontSize:'13px', fontWeight:'600',
            color:'#fff', background: GRAD_BTN,
            border:'none', borderRadius:'100px',
            padding:'9px 20px', cursor:'pointer',
            boxShadow:'0 4px 20px var(--accent-glow)',
            transition:'all 0.25s ease',
            minHeight:'auto',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform='scale(1.04)'
            e.currentTarget.style.boxShadow='0 8px 32px var(--accent-glow)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform='scale(1)'
            e.currentTarget.style.boxShadow='0 4px 20px var(--accent-glow)'
          }}
        >
          + Write
        </button>
      </div>
    </nav>
  )
}

// ─── TOAST SYSTEM ────────────────────────────────────────────

function ToastContainer({ toasts, removeToast, isMobile }) {
  return (
    <div style={{
      position:'fixed',
      // On mobile — toasts appear at TOP so bottom nav doesn't block them
      // On desktop — toasts appear at BOTTOM RIGHT
      ...(isMobile
        ? { top:80, left:12, right:12 }
        : { bottom:24, right:24 }
      ),
      zIndex:9999,
      display:'flex', flexDirection:'column', gap:8,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'12px 16px', borderRadius:'14px',
          background: t.type==='error'
            ? 'rgba(239,68,68,0.12)'
            : t.type==='success'
            ? 'rgba(52,211,153,0.12)'
            : 'rgba(124,58,237,0.12)',
          border:`1px solid ${
            t.type==='error'
              ? 'rgba(239,68,68,0.25)'
              : t.type==='success'
              ? 'rgba(52,211,153,0.25)'
              : 'rgba(124,58,237,0.25)'
          }`,
          backdropFilter:'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          color: t.type==='error'
            ? 'rgba(252,165,165,0.95)'
            : t.type==='success'
            ? 'rgba(110,231,183,0.95)'
            : 'rgba(196,181,253,0.95)',
          fontFamily:FF.body, fontSize:'13px',
          animation:'toastIn 0.3s ease-out both',
          boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <span style={{fontSize:'14px'}}>
            {t.type==='error' ? '⚠' : t.type==='success' ? '✓' : 'ℹ'}
          </span>
          <span style={{flex:1, lineHeight:1.4}}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} style={{
            background:'none', border:'none', cursor:'pointer',
            color:'inherit', opacity:0.5, fontSize:'13px',
            padding:0, minHeight:'auto',
          }}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ─── STAT CARD ────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, delay=0 }) {
  return (
    <div
      className="aScale"
      style={{
        animationDelay:`${delay}s`,
        background:'var(--bg-card)',
        border:'1px solid var(--border)',
        borderRadius:'18px',
        padding:'16px 18px',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        transition:'all 0.3s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background='var(--bg-card-hover)'
        e.currentTarget.style.borderColor='var(--border-hover)'
        e.currentTarget.style.transform='translateY(-2px)'
        e.currentTarget.style.boxShadow='var(--shadow-elevated)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background='var(--bg-card)'
        e.currentTarget.style.borderColor='var(--border)'
        e.currentTarget.style.transform='translateY(0)'
        e.currentTarget.style.boxShadow='none'
      }}
    >
      <div style={{fontSize:'18px', marginBottom:'8px'}}>{icon}</div>
      <div style={{
        fontFamily:FF.display,
        fontSize:'clamp(1.5rem, 4vw, 2rem)',
        lineHeight:1, letterSpacing:'-1px',
        color:'var(--text-primary)', marginBottom:'3px',
        animation:'countUp 0.6s ease-out both',
      }}>
        {value}
      </div>
      <div style={{
        fontFamily:FF.body, fontSize:'12px', fontWeight:'600',
        color:'var(--text-secondary)', marginBottom:'2px',
      }}>
        {label}
      </div>
      {sub && (
        <div style={{
          fontFamily:FF.body, fontSize:'10px',
          color:'var(--text-muted)',
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ─── MOOD CHART ───────────────────────────────────────────────

function MoodChart({ entries }) {
  const counts = useMemo(() => {
    const c = {}
    MOODS.forEach(m => { c[m.key] = 0 })
    entries.forEach(e => { if (c[e.mood]!==undefined) c[e.mood]++ })
    return c
  }, [entries])

  const max = Math.max(...Object.values(counts), 1)

  return (
    <div style={{
      background:'var(--bg-card)',
      border:'1px solid var(--border)',
      borderRadius:'18px', padding:'20px',
      backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)',
    }}>
      <div style={{
        fontFamily:FF.display, fontSize:'1.1rem',
        color:'var(--text-primary)', marginBottom:'16px',
        letterSpacing:'-0.3px',
      }}>
        Mood Distribution
      </div>
      <div style={{
        display:'flex', alignItems:'flex-end',
        gap:'6px', height:'80px',
      }}>
        {MOODS.map(m => {
          const pct = (counts[m.key] / max) * 100
          return (
            <div key={m.key} style={{
              flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', gap:'4px', height:'100%',
              justifyContent:'flex-end',
            }}
              title={`${m.label}: ${counts[m.key]}`}
            >
              <div style={{
                width:'100%', borderRadius:'4px 4px 0 0',
                height:`${Math.max(pct,4)}%`,
                background:`linear-gradient(${m.grad})`,
                opacity: counts[m.key]===0 ? 0.18 : 1,
                transformOrigin:'bottom',
                animation:'barGrow 0.8s ease-out both',
                boxShadow: counts[m.key]>0 ? `0 2px 8px ${m.glow}` : 'none',
              }}/>
              <div style={{fontSize:'9px'}}>{m.symbol}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── STREAK CALENDAR ─────────────────────────────────────────

function StreakCalendar({ entries }) {
  const days = useMemo(() => {
    const written = new Set(
      entries.map(e => new Date(e.created_at).toDateString())
    )
    return Array.from({length:28}, (_,i) => {
      const d = new Date()
      d.setDate(d.getDate() - (27-i))
      return {
        date: d.toDateString(),
        written: written.has(d.toDateString()),
        label: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}),
      }
    })
  }, [entries])

  return (
    <div style={{
      background:'var(--bg-card)',
      border:'1px solid var(--border)',
      borderRadius:'18px', padding:'20px',
      backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)',
    }}>
      <div style={{
        fontFamily:FF.display, fontSize:'1.1rem',
        color:'var(--text-primary)', marginBottom:'4px',
        letterSpacing:'-0.3px',
      }}>
        Writing Streak
      </div>
      <div style={{
        fontFamily:FF.body, fontSize:'11px',
        color:'var(--text-muted)', marginBottom:'14px',
      }}>
        Last 28 days
      </div>
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(7, 1fr)',
        gap:'5px',
      }}>
        {days.map((d,i) => (
          <div
            key={i}
            title={`${d.label}: ${d.written ? '✓ Wrote' : 'No entry'}`}
            style={{
              aspectRatio:'1', borderRadius:'5px',
              background: d.written
                ? GRAD_BTN
                : 'var(--bg-input)',
              border:'1px solid var(--border)',
              boxShadow: d.written ? '0 2px 6px var(--accent-glow)' : 'none',
              transition:'transform 0.2s ease',
              cursor:'default',
            }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.25)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
          />
        ))}
      </div>
    </div>
  )
}

// ─── SEARCH BAR ───────────────────────────────────────────────

function SearchBar({ value, onChange }) {
  return (
    <div style={{position:'relative', flex:1}}>
      <span style={{
        position:'absolute', left:'13px', top:'50%',
        transform:'translateY(-50%)',
        fontSize:'13px', color:'var(--text-muted)',
        pointerEvents:'none',
      }}>🔍</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search entries…"
        style={{
          width:'100%', minHeight:'44px',
          fontFamily:FF.body,
          color:'var(--text-primary)',
          background:'var(--bg-input)',
          border:'1px solid var(--border)',
          borderRadius:'12px',
          padding:'0 36px 0 38px',
          outline:'none',
          transition:'all 0.25s ease',
        }}
        onFocus={e => {
          e.target.style.borderColor='var(--border-focus)'
          e.target.style.background='var(--bg-input-focus)'
          e.target.style.boxShadow='0 0 0 3px var(--accent-subtle)'
        }}
        onBlur={e => {
          e.target.style.borderColor='var(--border)'
          e.target.style.background='var(--bg-input)'
          e.target.style.boxShadow='none'
        }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{
          position:'absolute', right:'10px', top:'50%',
          transform:'translateY(-50%)',
          background:'none', border:'none', cursor:'pointer',
          color:'var(--text-muted)', fontSize:'13px',
          padding:0, minHeight:'auto',
        }}>✕</button>
      )}
    </div>
  )
}

// ─── TAG PILL ─────────────────────────────────────────────────

function TagPill({ label, selected, onClick, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily:FF.body,
        fontSize: small ? '11px' : '12px',
        fontWeight:'500',
        color: selected ? 'var(--accent)' : 'var(--text-muted)',
        background: selected ? 'var(--accent-subtle)' : 'var(--bg-input)',
        border:`1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius:'100px',
        padding: small ? '2px 9px' : '5px 13px',
        cursor:'pointer',
        transition:'all 0.2s ease',
        whiteSpace:'nowrap',
        minHeight: small ? 'auto' : '36px',
      }}
    >
      {label}
    </button>
  )
}

// ─── MOOD PILL ────────────────────────────────────────────────

function MoodPill({ mood: m, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily:FF.body, fontSize:'13px', fontWeight:'500',
        color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
        background: selected ? m.light : 'var(--bg-input)',
        border:`1px solid ${selected ? m.glow : 'var(--border)'}`,
        borderRadius:'100px', padding:'7px 13px',
        cursor:'pointer',
        transition:'all 0.22s ease',
        display:'flex', alignItems:'center', gap:'5px',
        boxShadow: selected ? `0 3px 12px ${m.glow}` : 'none',
        minHeight:'40px',
      }}
    >
      <span style={{
        width:7, height:7, borderRadius:'50%', flexShrink:0,
        background:`linear-gradient(${m.grad})`,
      }}/>
      {m.label}
    </button>
  )
}

// ─── ENTRY CARD ───────────────────────────────────────────────

function EntryCard({ entry, expanded, onToggle, onDelete, onEdit }) {
  const m    = getMood(entry.mood)
  const wc   = wordCount(entry.content)
  const rt   = readingTime(entry.content)
  const tags = (() => { try { return JSON.parse(entry.tags||'[]') } catch { return [] } })()

  return (
    <div
      onClick={onToggle}
      className="touch-card"
      style={{
        background: expanded ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border:`1px solid ${expanded ? m.glow : 'var(--border)'}`,
        borderRadius:'20px', overflow:'hidden',
        cursor:'pointer', marginBottom:'10px',
        backdropFilter:'blur(24px)',
        WebkitBackdropFilter:'blur(24px)',
        transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: expanded
          ? `var(--shadow-elevated), 0 0 0 1px ${m.glow}`
          : 'var(--shadow-card)',
      }}
      onMouseEnter={e => {
        if (!expanded) {
          e.currentTarget.style.background='var(--bg-card-hover)'
          e.currentTarget.style.transform='translateY(-2px)'
        }
      }}
      onMouseLeave={e => {
        if (!expanded) {
          e.currentTarget.style.background='var(--bg-card)'
          e.currentTarget.style.transform='translateY(0)'
        }
      }}
    >
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'flex-start',
        gap:'12px', padding:'16px',
      }}>
        {/* Mood orb */}
        <div style={{
          flexShrink:0, width:40, height:40, borderRadius:'12px',
          background:`linear-gradient(${m.grad})`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontSize:'14px',
          boxShadow:`0 4px 14px ${m.glow}`, marginTop:2,
        }}>
          {m.symbol}
        </div>

        {/* Text */}
        <div style={{flex:1, minWidth:0}}>
          <div style={{
            fontFamily:FF.display,
            fontSize:'clamp(0.95rem,3vw,1.1rem)',
            letterSpacing:'-0.3px',
            color:'var(--text-primary)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            marginBottom:'5px',
          }}>
            {entry.title}
          </div>
          {/* Meta row */}
          <div style={{
            display:'flex', alignItems:'center',
            gap:'6px', flexWrap:'wrap',
          }}>
            <span style={{
              fontFamily:FF.body, fontSize:'11px',
              color:'var(--text-muted)',
            }}>
              {fmtDateShort(entry.created_at)}
            </span>
            <span style={{color:'var(--border)'}}>·</span>
            <span style={{
              fontFamily:FF.body, fontSize:'11px',
              background:`linear-gradient(${m.grad})`,
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
              fontWeight:'600',
            }}>
              {m.label}
            </span>
            <span style={{color:'var(--border)'}}>·</span>
            <span style={{
              fontFamily:FF.body, fontSize:'11px',
              color:'var(--text-muted)',
            }}>
              {wc}w
            </span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{
              display:'flex', gap:'4px',
              flexWrap:'wrap', marginTop:'6px',
            }}>
              {tags.slice(0,3).map(tag => (
                <span key={tag} style={{
                  fontFamily:FF.body, fontSize:'10px',
                  color:'var(--accent)',
                  background:'var(--accent-subtle)',
                  border:'1px solid var(--accent-glow)',
                  borderRadius:'100px', padding:'2px 8px',
                }}>
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span style={{
                  fontFamily:FF.body, fontSize:'10px',
                  color:'var(--text-muted)',
                }}>
                  +{tags.length-3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chevron */}
        <div style={{
          flexShrink:0, width:26, height:26, borderRadius:'50%',
          border:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--text-muted)', fontSize:'11px',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition:'transform 0.3s ease',
          flexShrink:0,
        }}>↓</div>
      </div>

      {/* Preview */}
      {!expanded && (
        <div style={{padding:'0 16px 14px', marginTop:'-4px'}}>
          <p style={{
            fontFamily:FF.body, fontSize:'13px',
            color:'var(--text-muted)', lineHeight:1.5,
            overflow:'hidden', textOverflow:'ellipsis',
            display:'-webkit-box',
            WebkitLineClamp:2,
            WebkitBoxOrient:'vertical',
          }}>
            {entry.content}
          </p>
        </div>
      )}

      {/* Expanded */}
      {expanded && (
        <div
          className="aFade"
          onClick={e => e.stopPropagation()}
          style={{padding:'0 16px 16px'}}
        >
          <div style={{
            height:1, background:'var(--border)',
            margin:'0 0 14px 0',
          }}/>
          <p style={{
            fontFamily:FF.body,
            fontSize:'clamp(13px, 3.5vw, 15px)',
            lineHeight:'1.8', color:'var(--text-secondary)',
            whiteSpace:'pre-wrap',
          }}>
            {entry.content}
          </p>

          {/* Time + reading time */}
          <div style={{
            display:'flex', gap:'8px',
            marginTop:'12px', flexWrap:'wrap',
          }}>
            <span style={{
              fontFamily:FF.body, fontSize:'11px',
              color:'var(--text-muted)',
            }}>
              {fmtTime(entry.created_at)}
            </span>
            <span style={{color:'var(--border)'}}>·</span>
            <span style={{
              fontFamily:FF.body, fontSize:'11px',
              color:'var(--text-muted)',
            }}>
              {rt}
            </span>
          </div>

          {/* Actions */}
          <div style={{
            display:'flex', gap:'8px',
            justifyContent:'flex-end', marginTop:'14px',
          }}>
            <button
              onClick={() => onEdit(entry)}
              style={{
                fontFamily:FF.body, fontSize:'12px',
                color:'var(--text-secondary)',
                background:'var(--bg-input)',
                border:'1px solid var(--border)',
                borderRadius:'100px', padding:'8px 16px',
                cursor:'pointer', minHeight:'36px',
              }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              style={{
                fontFamily:FF.body, fontSize:'12px',
                color:'rgba(252,165,165,0.85)',
                background:'rgba(239,68,68,0.07)',
                border:'1px solid rgba(239,68,68,0.2)',
                borderRadius:'100px', padding:'8px 16px',
                cursor:'pointer', minHeight:'36px',
              }}
            >
              🗑 Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ENTRY FORM ───────────────────────────────────────────────

function EntryForm({ initial, onSave, onCancel, saving }) {
  const [title,   setTitle]   = useState(initial?.title   || '')
  const [content, setContent] = useState(initial?.content || '')
  const [mood,    setMood]    = useState(initial?.mood    || 'calm')
  const [tags,    setTags]    = useState(() => {
    try { return initial?.tags ? JSON.parse(initial.tags) : [] }
    catch { return [] }
  })
  const [error, setError] = useState(null)
  const titleRef = useRef(null)

  useEffect(() => {
    // Small delay so the form animates in first, then focus
    const t = setTimeout(() => titleRef.current?.focus(), 350)
    return () => clearTimeout(t)
  }, [])

  function toggleTag(tag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev,tag])
  }

  function handleSave() {
    if (!title.trim() || !content.trim()) {
      setError('Please add a title and your thoughts.')
      return
    }
    onSave({
      title:   title.trim(),
      content: content.trim(),
      mood,
      tags:    JSON.stringify(tags),
    })
  }

  const wc = wordCount(content)

  return (
    <div className="aScale" style={{
      background:'var(--bg-card)',
      border:'1px solid var(--border)',
      borderRadius:'22px', overflow:'hidden',
      backdropFilter:'blur(24px)',
      WebkitBackdropFilter:'blur(24px)',
      boxShadow:'var(--shadow-elevated)',
      marginBottom:'24px',
    }}>
      {/* Top bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 20px',
        borderBottom:'1px solid var(--border)',
      }}>
        <span style={{
          fontFamily:FF.display, fontSize:'18px',
          letterSpacing:'-0.4px', color:'var(--text-primary)',
        }}>
          {initial ? 'Edit Entry' : 'New Entry'}
        </span>
        <span style={{
          fontFamily:FF.body, fontSize:'11px',
          color:'var(--text-muted)',
        }}>
          {new Date().toLocaleDateString('en-US',{
            month:'short', day:'numeric'
          })}
        </span>
      </div>

      <div style={{padding:'20px', display:'flex', flexDirection:'column', gap:'20px'}}>

        {/* Error */}
        {error && (
          <div style={{
            display:'flex', alignItems:'center', gap:'8px',
            padding:'10px 14px', borderRadius:'10px',
            background:'rgba(239,68,68,0.08)',
            border:'1px solid rgba(239,68,68,0.2)',
            color:'rgba(252,165,165,0.9)',
            fontFamily:FF.body, fontSize:'13px',
          }}>
            <span>⚠</span>
            <span style={{flex:1}}>{error}</span>
            <button onClick={() => setError(null)} style={{
              background:'none', border:'none', cursor:'pointer',
              color:'inherit', opacity:0.5, padding:0, minHeight:'auto',
            }}>✕</button>
          </div>
        )}

        {/* Title */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Give this moment a title…"
          style={{
            width:'100%',
            fontFamily:FF.display,
            fontSize:'clamp(1.2rem, 5vw, 1.55rem)',
            letterSpacing:'-0.5px',
            color:'var(--text-primary)',
            background:'transparent', border:'none',
            borderBottom:'1px solid var(--border)',
            outline:'none', padding:'4px 0 12px 0',
            caretColor:'var(--accent)',
          }}
          onFocus={e => e.target.style.borderBottomColor='var(--border-focus)'}
          onBlur={e  => e.target.style.borderBottomColor='var(--border)'}
        />

        {/* Mood */}
        <div>
          <p style={{
            fontFamily:FF.body, fontSize:'10px', fontWeight:'700',
            letterSpacing:'2px', textTransform:'uppercase',
            color:'var(--text-muted)', marginBottom:'10px',
          }}>
            Mood
          </p>
          {/* Scrollable mood row on mobile */}
          <div style={{
            display:'flex', gap:'7px',
            overflowX:'auto', paddingBottom:'6px',
            // Hide scrollbar but keep scrollability
            msOverflowStyle:'none', scrollbarWidth:'none',
          }}>
            {MOODS.map(m => (
              <MoodPill key={m.key} mood={m}
                selected={mood===m.key}
                onClick={() => setMood(m.key)}
              />
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <p style={{
            fontFamily:FF.body, fontSize:'10px', fontWeight:'700',
            letterSpacing:'2px', textTransform:'uppercase',
            color:'var(--text-muted)', marginBottom:'10px',
          }}>
            Tags
          </p>
          {/* Scrollable tags row on mobile */}
          <div style={{
            display:'flex', gap:'6px',
            overflowX:'auto', paddingBottom:'6px',
            msOverflowStyle:'none', scrollbarWidth:'none',
          }}>
            {TAGS.map(tag => (
              <TagPill key={tag} label={tag}
                selected={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write freely. This is your private space…"
            rows={8}
            style={{
              width:'100%',
              fontFamily:FF.body,
              fontSize:'clamp(14px, 3.5vw, 15px)',
              lineHeight:'1.8', color:'var(--text-secondary)',
              background:'transparent', border:'none',
              borderBottom:'1px solid var(--border)',
              outline:'none', resize:'none',
              padding:'4px 0 12px 0',
              caretColor:'var(--accent)',
            }}
            onFocus={e => e.target.style.borderBottomColor='var(--border-focus)'}
            onBlur={e  => e.target.style.borderBottomColor='var(--border)'}
          />
          <div style={{
            display:'flex', justifyContent:'space-between',
            marginTop:'4px',
          }}>
            <span style={{
              fontFamily:FF.body, fontSize:'11px',
              color:'var(--text-muted)',
            }}>
              {wc > 0 ? readingTime(content) : 'Start writing…'}
            </span>
            <span style={{
              fontFamily:FF.body, fontSize:'11px',
              color: wc>200 ? 'rgba(52,211,153,0.8)' : 'var(--text-muted)',
            }}>
              {wc} words
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{display:'flex', gap:'10px'}}>
          <button
            onClick={onCancel}
            style={{
              fontFamily:FF.body, fontSize:'14px', fontWeight:'500',
              color:'var(--text-secondary)',
              background:'var(--bg-input)',
              border:'1px solid var(--border)',
              borderRadius:'14px', padding:'0 20px',
              cursor:'pointer', flex:1, minHeight:'48px',
              transition:'all 0.2s ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              fontFamily:FF.body, fontSize:'14px', fontWeight:'600',
              color:'#fff', background: GRAD_BTN,
              border:'none', borderRadius:'14px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              boxShadow:'var(--shadow-glow)',
              flex:2, minHeight:'48px',
              transition:'all 0.25s ease',
            }}
            onMouseEnter={e => {
              if (!saving) e.currentTarget.style.transform='scale(1.02)'
            }}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
          >
            {saving ? 'Saving…' : initial ? '✓ Save Changes' : '✦ Save Entry'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────

export default function Home() {

  // ── STATE ──────────────────────────────────────────────
  const [view,        setView]        = useState('hero')
  const [theme,       setTheme]       = useState('dark')
  const [navScrolled, setNavScrolled] = useState(false)
  const [entries,     setEntries]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [formOpen,    setFormOpen]    = useState(false)
  const [editEntry,   setEditEntry]   = useState(null)
  const [expandedId,  setExpandedId]  = useState(null)
  const [search,      setSearch]      = useState('')
  const [filterMood,  setFilterMood]  = useState('all')
  const [filterTag,   setFilterTag]   = useState('all')
  const [sortBy,      setSortBy]      = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [toasts,      setToasts]      = useState([])
  const [mobileMenu,  setMobileMenu]  = useState(false)

  const isMobile   = useIsMobile()
  const journalRef = useRef(null)

  // ── THEME ────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inkwell-theme') || 'dark'
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    } catch { document.documentElement.setAttribute('data-theme','dark') }
  }, [])

  function toggleTheme() {
    const next = theme==='dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('inkwell-theme', next) } catch {}
    addToast(`${next==='light' ? '☀️ Light' : '🌙 Dark'} mode`, 'info')
  }

  // ── SCROLL ───────────────────────────────────────────
  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive:true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // ── TOASTS ───────────────────────────────────────────
  function addToast(message, type='info') {
    const id = Date.now()
    setToasts(prev => [...prev, {id, message, type}])
    setTimeout(() => removeToast(id), 4000)
  }
  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id!==id))
  }

  // ── FETCH ────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('entries').select('*')
        .order('created_at', {ascending:false})
      if (error) throw error
      setEntries(data || [])
    } catch {
      addToast('Could not load entries. Check your Supabase settings.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  // ── SAVE ─────────────────────────────────────────────
  async function handleSave(data) {
    try {
      setSaving(true)
      if (editEntry) {
        const { error } = await supabase
          .from('entries').update(data).eq('id', editEntry.id)
        if (error) throw error
        addToast('Entry updated!', 'success')
      } else {
        const { error } = await supabase.from('entries').insert([data])
        if (error) throw error
        addToast('Entry saved!', 'success')
      }
      setFormOpen(false); setEditEntry(null)
      fetchEntries()
    } catch {
      addToast('Could not save. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── DELETE ───────────────────────────────────────────
  async function handleDelete(id) {
    if (!confirm('Delete this entry permanently?')) return
    try {
      const { error } = await supabase.from('entries').delete().eq('id',id)
      if (error) throw error
      setEntries(prev => prev.filter(e => e.id!==id))
      if (expandedId===id) setExpandedId(null)
      addToast('Entry deleted.', 'info')
    } catch { addToast('Could not delete.', 'error') }
  }

  // ── EDIT ─────────────────────────────────────────────
  function handleEdit(entry) {
    setEditEntry(entry); setFormOpen(true); setExpandedId(null)
  }

  // ── FILTERED ENTRIES ─────────────────────────────────
  const filteredEntries = useMemo(() => {
    let r = [...entries]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q)
      )
    }
    if (filterMood !== 'all') r = r.filter(e => e.mood===filterMood)
    if (filterTag  !== 'all') r = r.filter(e => {
      try { return JSON.parse(e.tags||'[]').includes(filterTag) } catch { return false }
    })
    switch(sortBy) {
      case 'oldest':   r.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)); break
      case 'longest':  r.sort((a,b)=>wordCount(b.content)-wordCount(a.content)); break
      case 'shortest': r.sort((a,b)=>wordCount(a.content)-wordCount(b.content)); break
      default:         r.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
    }
    return r
  }, [entries, search, filterMood, filterTag, sortBy])

  // ── STATS ────────────────────────────────────────────
  const stats = useMemo(() => {
    const words = entries.reduce((a,e) => a+wordCount(e.content), 0)
    const c = {}
    entries.forEach(e => { c[e.mood] = (c[e.mood]||0)+1 })
    const topMoodKey = Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0]
    return {
      total:    entries.length,
      words,
      streak:   getStreak(entries),
      moods:    new Set(entries.map(e=>e.mood)).size,
      avgWords: entries.length ? Math.round(words/entries.length) : 0,
      topMood:  topMoodKey ? getMood(topMoodKey).label : '—',
    }
  }, [entries])

  // ── NAVIGATION ───────────────────────────────────────
  function goTo(v) {
    setView(v); setFormOpen(false); setEditEntry(null)
    setMobileMenu(false)
    window.scrollTo({top:0, behavior:'smooth'})
  }

   function openWrite() {
    setView('dash')
    setFormOpen(true)
    setEditEntry(null)
    setMobileMenu(false)
    window.scrollTo({top:0, behavior:'smooth'})
  }

  // ── BOTTOM PADDING ───────────────────────────────────
  // On mobile we need extra bottom padding so content
  // doesn't hide behind the fixed bottom nav bar
  const mobilePadBottom = isMobile ? '90px' : '60px'
  const topPadding      = isMobile ? '76px' : '96px'
  const sidePadding     = 'clamp(14px, 4vw, 40px)'

  // ─────────────────────────────────────────────────────
  // SHARED NAV (decides which nav to render)
  // ─────────────────────────────────────────────────────

  const NavBar = isMobile ? (
    /* ── MOBILE TOP BAR ─────────────────────────────── */
    <nav style={{
      position:'fixed', top:0, left:0, right:0,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 16px',
      height:'60px', zIndex:1000,
      background:'var(--nav-bg)',
      backdropFilter:'blur(24px)',
      WebkitBackdropFilter:'blur(24px)',
      borderBottom:'1px solid var(--border)',
    }}>
      {/* Logo */}
      <button
        onClick={() => goTo('hero')}
        style={{
          display:'flex', alignItems:'center', gap:'8px',
          background:'none', border:'none', cursor:'pointer',
          padding:0, minHeight:'auto',
        }}
      >
        <div style={{
          width:'30px', height:'30px', borderRadius:'9px',
          background:'linear-gradient(135deg,#7c3aed,#2563eb)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontSize:'13px', fontWeight:'700',
          fontFamily:FF.display,
          boxShadow:'0 3px 12px var(--accent-glow)',
        }}>I</div>
        <span style={{
          fontFamily:FF.display, fontSize:'17px',
          color:'var(--text-primary)', letterSpacing:'-0.5px',
        }}>Inkwell</span>
      </button>

      {/* Right: theme + write */}
      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
        <button
          onClick={toggleTheme}
          style={{
            width:36, height:36, borderRadius:'50%',
            background:'var(--bg-card)',
            border:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', fontSize:'15px', minHeight:'auto',
          }}
        >
          {theme==='dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={openWrite}
          style={{
            fontFamily:FF.body, fontSize:'13px', fontWeight:'600',
            color:'#fff', background: GRAD_BTN,
            border:'none', borderRadius:'100px',
            padding:'8px 16px', cursor:'pointer',
            boxShadow:'0 3px 14px var(--accent-glow)',
            minHeight:'auto',
          }}
        >
          + Write
        </button>
      </div>
    </nav>
  ) : (
    /* ── DESKTOP NAV ─────────────────────────────────── */
    <DesktopNav
      view={view}
      theme={theme}
      scrolled={navScrolled}
      onNavigate={goTo}
      onToggleTheme={toggleTheme}
      onWrite={openWrite}
    />
  )

  // ─────────────────────────────────────────────────────
  // VIEW: HERO
  // ─────────────────────────────────────────────────────
  if (view === 'hero') return (
    <div style={{
      position:'relative', minHeight:'100vh',
      background:'var(--bg-primary)',
    }}>
      <Background/>
      {NavBar}

      <section style={{
        position:'relative', zIndex:10,
        minHeight:'100vh',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        textAlign:'center',
        padding:`${topPadding} ${sidePadding} ${mobilePadBottom}`,
      }}>
        {/* Book */}
        <div className="a0" style={{
          position:'relative', marginBottom:'28px',
        }}>
          {!isMobile && <Rings size={360}/>}
          <Book3D scale={isMobile ? 0.85 : 1}/>
        </div>

        {/* Eyebrow */}
        <div className="a1" style={{marginBottom:'18px'}}>
          <span style={{
            fontFamily:FF.body,
            fontSize: isMobile ? '10px' : '11px',
            fontWeight:'600', letterSpacing:'3px',
            textTransform:'uppercase', color:'var(--accent)',
            padding:'7px 18px',
            background:'var(--accent-subtle)',
            border:'1px solid var(--accent-glow)',
            borderRadius:'100px',
          }}>
            Your private sanctuary
          </span>
        </div>

        {/* Headline */}
        <h1 className="a2 text-hero" style={{
          fontFamily:FF.display, fontWeight:400,
          color:'var(--text-primary)',
          maxWidth: isMobile ? '340px' : '750px',
          marginBottom:'18px',
        }}>
          Words outlast every{' '}
          <em style={{
            fontStyle:'italic',
            background:'linear-gradient(135deg,#a78bfa,#818cf8)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>moment</em>
          <br/>
          you thought{' '}
          <em style={{
            fontStyle:'italic',
            background:'linear-gradient(135deg,#60a5fa,#38bdf8)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>you'd remember.</em>
        </h1>

        {/* Subline */}
        <p className="a3" style={{
          fontFamily:FF.body,
          fontSize: isMobile ? '14px' : '16px',
          color:'var(--text-secondary)', lineHeight:1.7,
          maxWidth: isMobile ? '300px' : '400px',
          marginBottom:'32px',
        }}>
          Your private space to write freely, track your moods,
          and revisit the moments that shaped you.
        </p>

        {/* CTAs */}
        <div className="a4" style={{
          display:'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap:'10px', width: isMobile ? '100%' : 'auto',
          maxWidth: isMobile ? '300px' : 'none',
          marginBottom:'44px',
          alignItems:'center',
        }}>
          <button
            onClick={() => goTo('dash')}
            style={{
              fontFamily:FF.body, fontSize:'15px', fontWeight:'600',
              color:'#fff', background: GRAD_BTN,
              border:'none', borderRadius:'100px',
              padding:'14px 32px', cursor:'pointer',
              boxShadow:'0 8px 32px var(--accent-glow)',
              transition:'all 0.25s ease',
              width: isMobile ? '100%' : 'auto',
            }}
            onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
            onTouchEnd={e   => e.currentTarget.style.transform='scale(1)'}
          >
            Begin Writing
          </button>
          <button
            onClick={() => goTo('entries')}
            style={{
              fontFamily:FF.body, fontSize:'15px', fontWeight:'500',
              color:'var(--text-secondary)',
              background:'var(--bg-card)',
              border:'1px solid var(--border)',
              borderRadius:'100px', padding:'14px 28px',
              cursor:'pointer', transition:'all 0.25s ease',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            View Entries →
          </button>
        </div>

        {/* Stats */}
        <div className="a5" style={{
          display:'flex', gap: isMobile ? '28px' : '48px',
          justifyContent:'center', flexWrap:'wrap',
          paddingTop:'24px',
          borderTop:'1px solid var(--border)',
          width:'100%', maxWidth:'400px',
        }}>
          {[
            {val:stats.total,  label:'Entries'     },
            {val:stats.streak, label:'Day Streak'   },
            {val:stats.words,  label:'Words'        },
          ].map(s => (
            <div key={s.label} style={{textAlign:'center'}}>
              <div style={{
                fontFamily:FF.display,
                fontSize: isMobile ? '1.8rem' : '2.2rem',
                lineHeight:1, letterSpacing:'-1px',
                color:'var(--text-primary)', marginBottom:'4px',
              }}>
                {s.val}
              </div>
              <div style={{
                fontFamily:FF.body,
                fontSize: isMobile ? '10px' : '11px',
                letterSpacing:'2px', textTransform:'uppercase',
                color:'var(--text-muted)',
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile bottom nav */}
      {isMobile && (
        <MobileBottomNav
          view={view}
          onNavigate={goTo}
          onWrite={openWrite}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} isMobile={isMobile}/>
    </div>
  )

  // ─────────────────────────────────────────────────────
  // VIEW: DASHBOARD
  // ─────────────────────────────────────────────────────
  if (view === 'dash') return (
    <div style={{
      position:'relative', minHeight:'100vh',
      background:'var(--bg-primary)',
    }}>
      <Background/>
      {NavBar}

      <div style={{
        position:'relative', zIndex:10,
        maxWidth:'860px', margin:'0 auto',
        padding:`${topPadding} ${sidePadding} ${mobilePadBottom}`,
      }}>

        {/* Header */}
        <div className="a0" style={{marginBottom:'24px'}}>
          <p style={{
            fontFamily:FF.body, fontSize:'11px', fontWeight:'700',
            letterSpacing:'2.5px', textTransform:'uppercase',
            color:'var(--accent)', marginBottom:'8px',
          }}>
            {getGreeting()} ✦
          </p>
          <h2 className="text-section" style={{
            fontFamily:FF.display, fontWeight:400,
            color:'var(--text-primary)', marginBottom:'8px',
          }}>
            {formOpen
              ? (editEntry ? 'Edit Entry' : "What's on your mind?")
              : 'Your Journal'}
          </h2>
          {!formOpen && (
            <p style={{
              fontFamily:FF.body, fontSize:'14px',
              color:'var(--text-secondary)', lineHeight:1.6,
            }}>
              {stats.streak > 0
                ? `🔥 ${stats.streak}-day writing streak! Keep it up.`
                : 'Start writing to build your streak.'}
            </p>
          )}
        </div>

        {/* Form or prompt */}
        {!formOpen ? (
          <div className="a1" style={{marginBottom:'28px'}}>
            <button
              onClick={openWrite}
              style={{
                width:'100%', textAlign:'left',
                fontFamily:FF.body, fontSize:'15px',
                color:'var(--text-placeholder)',
                background:'var(--bg-card)',
                border:'1px solid var(--border)',
                borderRadius:'16px',
                padding:'16px 18px',
                cursor:'text',
                display:'flex', alignItems:'center', gap:'10px',
                transition:'all 0.3s ease',
                backdropFilter:'blur(20px)',
                minHeight:'56px',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor='var(--border-focus)'
                e.currentTarget.style.boxShadow='0 0 0 3px var(--accent-subtle)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor='var(--border)'
                e.currentTarget.style.boxShadow='none'
              }}
            >
              <span style={{fontSize:'18px'}}>✏️</span>
              <span>What's on your mind today?</span>
            </button>
          </div>
        ) : (
          <EntryForm
            initial={editEntry}
            onSave={handleSave}
            onCancel={() => { setFormOpen(false); setEditEntry(null) }}
            saving={saving}
          />
        )}

        {/* Stats grid — 2 cols on mobile, 4 on desktop */}
        <div className="a2" style={{
          display:'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(2, 1fr)'
            : 'repeat(4, 1fr)',
          gap:'10px', marginBottom:'16px',
        }}>
          <StatCard icon="📝" label="Entries"    value={stats.total}  sub={`${stats.avgWords} avg words`} delay={0}   />
          <StatCard icon="🔥" label="Streak"     value={stats.streak} sub={stats.streak>0?"Keep going!":"Start today"} delay={0.06}/>
          <StatCard icon="✍️" label="Words"      value={stats.words.toLocaleString()} sub="Total written"  delay={0.12}/>
          <StatCard icon="🎭" label="Top Mood"   value={stats.topMood} sub={`${stats.moods} moods`}        delay={0.18}/>
        </div>

        {/* Charts — stack on mobile */}
        <div className="a3" style={{
          display:'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap:'12px', marginBottom:'32px',
        }}>
          <MoodChart entries={entries}/>
          <StreakCalendar entries={entries}/>
        </div>

        {/* Recent entries */}
        <div className="a4">
          <div style={{
            display:'flex', alignItems:'center',
            justifyContent:'space-between', marginBottom:'16px',
          }}>
            <h3 style={{
              fontFamily:FF.display, fontWeight:400,
              fontSize:'clamp(1.2rem, 4vw, 1.5rem)',
              letterSpacing:'-0.8px', color:'var(--text-primary)',
            }}>
              Recent Entries
            </h3>
            <button
              onClick={() => goTo('entries')}
              style={{
                fontFamily:FF.body, fontSize:'12px',
                color:'var(--accent)',
                background:'var(--accent-subtle)',
                border:'1px solid var(--accent-glow)',
                borderRadius:'100px', padding:'6px 14px',
                cursor:'pointer', minHeight:'auto',
              }}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div style={{
              display:'flex', alignItems:'center',
              justifyContent:'center', padding:'48px 0', gap:'12px',
            }}>
              <div style={{
                width:28, height:28, borderRadius:'50%',
                border:'2px solid var(--border)',
                borderTopColor:'var(--accent)',
                animation:'spin 0.8s linear infinite',
              }}/>
              <span style={{
                fontFamily:FF.body, fontSize:'14px',
                color:'var(--text-muted)',
              }}>
                Loading…
              </span>
            </div>
          ) : entries.length === 0 ? (
            <div style={{textAlign:'center', padding:'48px 0'}}>
              <div style={{
                fontFamily:FF.display, fontSize:'3.5rem',
                color:'var(--border)', marginBottom:'14px',
              }}>✦</div>
              <h4 style={{
                fontFamily:FF.display, fontSize:'1.3rem',
                color:'var(--text-secondary)', marginBottom:'6px',
              }}>
                Your journal awaits
              </h4>
              <p style={{
                fontFamily:FF.body, fontSize:'13px',
                color:'var(--text-muted)',
              }}>
                Write your first entry to get started.
              </p>
            </div>
          ) : (
            entries.slice(0,5).map((entry,i) => (
              <div key={entry.id}
                style={{animation:`fadeRise 0.5s ease-out ${i*0.07}s both`}}>
                <EntryCard
                  entry={entry}
                  expanded={expandedId===entry.id}
                  onToggle={() => setExpandedId(expandedId===entry.id ? null : entry.id)}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {isMobile && (
        <MobileBottomNav view={view} onNavigate={goTo} onWrite={openWrite}/>
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} isMobile={isMobile}/>
    </div>
  )

  // ─────────────────────────────────────────────────────
  // VIEW: ENTRIES
  // ─────────────────────────────────────────────────────
  if (view === 'entries') return (
    <div style={{
      position:'relative', minHeight:'100vh',
      background:'var(--bg-primary)',
    }}>
      <Background/>
      {NavBar}

      <div style={{
        position:'relative', zIndex:10,
        maxWidth:'860px', margin:'0 auto',
        padding:`${topPadding} ${sidePadding} ${mobilePadBottom}`,
      }}>

        {/* Header */}
        <div className="a0" style={{marginBottom:'24px'}}>
          <p style={{
            fontFamily:FF.body, fontSize:'11px', fontWeight:'700',
            letterSpacing:'3px', textTransform:'uppercase',
            color:'var(--accent)', marginBottom:'6px',
          }}>
            All Entries
          </p>
          <div style={{
            display:'flex', alignItems:'center',
            justifyContent:'space-between', flexWrap:'wrap', gap:'10px',
          }}>
            <h2 className="text-section" style={{
              fontFamily:FF.display, fontWeight:400,
              color:'var(--text-primary)',
            }}>
              Your Library
            </h2>
            {!isMobile && (
              <button
                onClick={openWrite}
                style={{
                  fontFamily:FF.body, fontSize:'13px', fontWeight:'600',
                  color:'#fff', background: GRAD_BTN,
                  border:'none', borderRadius:'100px',
                  padding:'10px 22px', cursor:'pointer',
                  boxShadow:'var(--shadow-glow)',
                  minHeight:'auto',
                }}
              >
                + New Entry
              </button>
            )}
          </div>
        </div>

        {/* Search + controls */}
        <div className="a1" style={{marginBottom:'12px'}}>
          {/* Row 1: Search + Sort */}
          <div style={{
            display:'flex', gap:'8px',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            marginBottom:'10px',
          }}>
            <SearchBar value={search} onChange={setSearch}/>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                fontFamily:FF.body, fontSize:'13px',
                color:'var(--text-secondary)',
                background:'var(--bg-card)',
                border:'1px solid var(--border)',
                borderRadius:'12px', padding:'0 14px',
                outline:'none', cursor:'pointer',
                minHeight:'44px',
                width: isMobile ? '100%' : 'auto',
                flexShrink:0,
              }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                fontFamily:FF.body, fontSize:'13px', fontWeight:'500',
                color: showFilters ? 'var(--accent)' : 'var(--text-secondary)',
                background: showFilters ? 'var(--accent-subtle)' : 'var(--bg-card)',
                border:`1px solid ${showFilters ? 'var(--accent-glow)' : 'var(--border)'}`,
                borderRadius:'12px', padding:'0 16px',
                cursor:'pointer', transition:'all 0.2s ease',
                display:'flex', alignItems:'center', gap:'6px',
                minHeight:'44px', flexShrink:0,
                width: isMobile ? '100%' : 'auto',
                justifyContent: isMobile ? 'center' : 'flex-start',
              }}
            >
              ⚙ Filters {showFilters ? '▲' : '▼'}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="aScale" style={{
              background:'var(--bg-card)',
              border:'1px solid var(--border)',
              borderRadius:'16px', padding:'16px',
              marginBottom:'10px',
              backdropFilter:'blur(20px)',
            }}>
              <div style={{marginBottom:'14px'}}>
                <p style={{
                  fontFamily:FF.body, fontSize:'10px', fontWeight:'700',
                  letterSpacing:'2px', textTransform:'uppercase',
                  color:'var(--text-muted)', marginBottom:'8px',
                }}>
                  Filter by Mood
                </p>
                {/* Scrollable on mobile */}
                <div style={{
                  display:'flex', gap:'6px',
                  overflowX:'auto', paddingBottom:'4px',
                  msOverflowStyle:'none', scrollbarWidth:'none',
                  flexWrap: isMobile ? 'nowrap' : 'wrap',
                }}>
                  <TagPill label="All" selected={filterMood==='all'}
                    onClick={() => setFilterMood('all')}/>
                  {MOODS.map(m => (
                    <TagPill key={m.key} label={m.label}
                      selected={filterMood===m.key}
                      onClick={() => setFilterMood(m.key)}/>
                  ))}
                </div>
              </div>
              <div>
                <p style={{
                  fontFamily:FF.body, fontSize:'10px', fontWeight:'700',
                  letterSpacing:'2px', textTransform:'uppercase',
                  color:'var(--text-muted)', marginBottom:'8px',
                }}>
                  Filter by Tag
                </p>
                <div style={{
                  display:'flex', gap:'6px',
                  overflowX:'auto', paddingBottom:'4px',
                  msOverflowStyle:'none', scrollbarWidth:'none',
                  flexWrap: isMobile ? 'nowrap' : 'wrap',
                }}>
                  <TagPill label="All" selected={filterTag==='all'}
                    onClick={() => setFilterTag('all')}/>
                  {TAGS.map(tag => (
                    <TagPill key={tag} label={tag}
                      selected={filterTag===tag}
                      onClick={() => setFilterTag(tag)}/>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results summary */}
          <div style={{
            fontFamily:FF.body, fontSize:'12px',
            color:'var(--text-muted)',
          }}>
            {filteredEntries.length} {filteredEntries.length===1 ? 'entry' : 'entries'}
            {search && ` · "${search}"`}
            {filterMood!=='all' && ` · ${getMood(filterMood).label}`}
            {filterTag!=='all'  && ` · #${filterTag}`}
          </div>
        </div>

        {/* Entries list */}
        <div className="a2">
          {loading ? (
            <div style={{
              display:'flex', alignItems:'center',
              justifyContent:'center', padding:'64px 0', gap:'12px',
            }}>
              <div style={{
                width:28, height:28, borderRadius:'50%',
                border:'2px solid var(--border)',
                borderTopColor:'var(--accent)',
                animation:'spin 0.8s linear infinite',
              }}/>
              <span style={{
                fontFamily:FF.body, fontSize:'14px',
                color:'var(--text-muted)',
              }}>Loading…</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div style={{textAlign:'center', padding:'64px 0'}}>
              <div style={{
                fontFamily:FF.display, fontSize:'3.5rem',
                color:'var(--border)', marginBottom:'14px',
              }}>⌕</div>
              <h4 style={{
                fontFamily:FF.display, fontSize:'1.3rem',
                color:'var(--text-secondary)', marginBottom:'6px',
              }}>
                No entries found
              </h4>
              <p style={{
                fontFamily:FF.body, fontSize:'13px',
                color:'var(--text-muted)',
              }}>
                {search || filterMood!=='all' || filterTag!=='all'
                  ? 'Try adjusting your search or filters.'
                  : 'Write your first entry to get started.'}
              </p>
            </div>
          ) : (
            filteredEntries.map((entry,i) => (
              <div key={entry.id}
                style={{animation:`fadeRise 0.5s ease-out ${i*0.06}s both`}}>
                <EntryCard
                  entry={entry}
                  expanded={expandedId===entry.id}
                  onToggle={() => setExpandedId(expandedId===entry.id ? null : entry.id)}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {isMobile && (
        <MobileBottomNav view={view} onNavigate={goTo} onWrite={openWrite}/>
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} isMobile={isMobile}/>
    </div>
  )

  return null
}