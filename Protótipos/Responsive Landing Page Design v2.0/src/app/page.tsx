'use client';

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Box3D } from '@/components/Box3D';
import { BackgroundDots } from '@/components/BackgroundDots';

type Theme = 'dark' | 'light';

function getTokens(theme: Theme) {
  const isDark = theme === 'dark';
  return {
    isDark,
    pageBg: isDark
      ? 'radial-gradient(ellipse at 50% 40%, #1a1a1a 0%, #0a0a0a 65%)'
      : 'radial-gradient(ellipse at 50% 40%, #a51515 0%, #7b0d0d 70%)',
    sectionAlt: isDark ? '#0e0e0e' : '#891111',
    navBg: isDark ? 'rgba(10,10,10,0.75)' : 'rgba(100,10,10,0.75)',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.18)',
    cardBorder: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.22)',
    accent: isDark ? '#CC0000' : '#ffffff',
    accentText: isDark ? '#CC0000' : '#ffffff',
    btnPrimary: isDark ? '#CC0000' : '#ffffff',
    btnPrimaryText: isDark ? '#ffffff' : '#8B0000',
    btnOutlineBorder: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
    text: '#ffffff',
    textMuted: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.75)',
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
    iconBg: isDark ? '#CC0000' : 'rgba(255,255,255,0.15)',
    iconColor: '#ffffff',
    dashBg: isDark ? '#111111' : '#7b0d0d',
    barColors: isDark
      ? ['#CC0000', '#FF3333', '#FF6666']
      : ['#ffffff', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.45)'],
    statColor: isDark ? '#CC0000' : '#ffffff',
  };
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function KartonLogo({ small = false }: { small?: boolean }) {
  const size = small ? 'text-xl' : 'text-2xl';
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 28, height: 28, position: 'relative', transformStyle: 'preserve-3d', transform: 'rotateX(-18deg) rotateY(30deg)' }}>
        {[
          { transform: 'translateZ(7px)',                   bg: 'linear-gradient(135deg,#EEE,#CCC)' },
          { transform: 'rotateY(90deg) translateZ(7px)',    bg: 'linear-gradient(135deg,#CCC,#999)' },
          { transform: 'rotateX(90deg) translateZ(7px)',    bg: 'linear-gradient(135deg,#F8F8F8,#DDD)' },
        ].map((f, i) => (
          <div key={i} className="absolute" style={{ width: 14, height: 14, ...f }} />
        ))}
      </div>
      <span className={`${size} tracking-widest text-white`} style={{ fontFamily: 'system-ui,sans-serif', letterSpacing: '0.12em' }}>
        KARTON
      </span>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 999,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)'}`,
        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.15)',
        color: '#fff',
        cursor: 'pointer',
        transition: 'all 0.25s',
        backdropFilter: 'blur(8px)',
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span style={{ fontSize: 13 }}>{isDark ? 'Claro' : 'Escuro'}</span>
    </button>
  );
}

const HERO_BOXES = [
  { size: 175, rotation: { x: -18, y: 32, z: 0  }, position: { bottom: '-6%',  left: '-8%'  }, delay: 0   },
  { size: 145, rotation: { x: -22, y: 28, z: 2  }, position: { bottom:  '4%',  left:  '5%'  }, delay: 1.6 },
  { size: 118, rotation: { x: -16, y: 36, z: -2 }, position: { bottom: '-4%',  left: '20%'  }, delay: 0.9 },
  { size: 108, rotation: { x: -18, y: -32, z: 0  }, position: { top: '-3%',  right: '-4%'  }, delay: 0.5 },
  { size:  86, rotation: { x: -22, y: -28, z: -2 }, position: { top:  '5%',  right: '10%'  }, delay: 1.3 },
  { size:  64, rotation: { x: -16, y: -36, z:  2 }, position: { top: '13%',  right: '22%'  }, delay: 2.1 },
  { size:  90, rotation: { x: -20, y: -30, z:  0 }, position: { top: '40%',  right: '-4%'  }, delay: 1.8 },
  { size:  72, rotation: { x: -20, y:  30, z:  0 }, position: { top: '38%',  left:  '-3%'  }, delay: 2.6 },
  { size: 130, rotation: { x: -16, y: -32, z:  0 }, position: { bottom: '-4%', right: '-5%' }, delay: 1.1 },
];

const CTA_BOXES = [
  { size:  60, rotation: { x: -18, y: 32, z: 0 }, position: { top:  '10%', left:  '5%'  }, delay: 0   },
  { size:  45, rotation: { x: -22, y: 28, z: 2 }, position: { top:  '40%', left: '12%'  }, delay: 1.2 },
  { size:  55, rotation: { x: -18, y:-32, z: 0 }, position: { top:  '10%', right: '5%'  }, delay: 0.6 },
  { size:  40, rotation: { x: -20, y:-28, z:-2 }, position: { top:  '50%', right:'12%'  }, delay: 1.8 },
  { size:  35, rotation: { x: -16, y: 36, z: 0 }, position: { bottom:'5%', left: '25%'  }, delay: 0.3 },
  { size:  38, rotation: { x: -16, y:-36, z: 0 }, position: { bottom:'5%', right:'25%'  }, delay: 1.4 },
];

const FEATURES = [
  {
    title: 'Rastreamento em Tempo Real',
    description: 'Monitore seus níveis de estoque instantaneamente com atualizações ao vivo e alertas automáticos.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Análise Inteligente',
    description: 'Obtenha insights acionáveis com análises baseadas em IA e previsão preditiva.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Integração Fácil',
    description: 'Conecte-se perfeitamente com suas ferramentas e sistemas existentes em minutos.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const BENEFITS = [
  { title: 'Economize Tempo', description: 'Automatize tarefas repetitivas e reduza a entrada manual de dados em até 80%.',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { title: 'Reduza Erros', description: 'Elimine erros com leitura de código de barras e validação automática.',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { title: 'Escale com Facilidade', description: 'Cresça de um armazém para centenas sem mudar de sistema.',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
  { title: 'Segurança Total', description: 'Segurança empresarial com controle de acesso baseado em funções.',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
];

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>('dark');
  const t = getTokens(theme);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    document.documentElement.style.transition = 'background 0.4s ease';
  }, []);

  const sectionStyle = (alt = false): CSSProperties => ({
    background: alt
      ? t.sectionAlt
      : (theme === 'dark'
          ? 'radial-gradient(ellipse at 50% 50%, #141414 0%, #0a0a0a 100%)'
          : 'radial-gradient(ellipse at 50% 50%, #9a1212 0%, #7b0d0d 100%)'),
    position: 'relative',
    overflow: 'hidden',
    perspective: '1000px',
  });

  return (
    <div style={{ background: t.sectionAlt, color: t.text, fontFamily: 'system-ui, sans-serif', overflowX: 'hidden' }}>

      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 32px',
          background: t.navBg,
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${t.divider}`,
          transition: 'background 0.4s ease',
        }}
      >
        <KartonLogo small />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button
            style={{
              padding: '7px 20px',
              borderRadius: 999,
              background: t.btnPrimary,
              color: t.btnPrimaryText,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              letterSpacing: '0.03em',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Começar Grátis
          </button>
        </div>
      </nav>

      <section
        style={{
          ...sectionStyle(),
          background: t.pageBg,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 80,
        }}
      >
        <BackgroundDots theme={theme} />

        {HERO_BOXES.map((b, i) => (
          <Box3D
            key={i}
            size={b.size}
            rotation={b.rotation}
            position={b.position}
            delay={b.delay}
            theme={theme}
            animate
          />
        ))}

        {/* Center content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            padding: '0 24px',
            maxWidth: 680,
            animation: 'fadeInUp 0.8s ease-out both',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 999,
              background: t.cardBg,
              border: `1px solid ${t.cardBorder}`,
              color: t.accentText,
              fontSize: 12,
              letterSpacing: '0.08em',
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 7, height: 7,
                borderRadius: '50%',
                background: t.accent,
                display: 'inline-block',
              }}
            />
            GESTÃO DE ESTOQUE INTELIGENTE
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.8rem, 6vw, 5.2rem)',
              lineHeight: 1.08,
              marginBottom: 24,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              fontWeight: 700,
            }}
          >
            Organize seu armazém<br />
            <span style={{ color: t.accentText }}>com precisão.</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: t.textMuted,
              maxWidth: 520,
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
          >
            O Karton simplifica o gerenciamento de inventário com rastreamento em tempo real,
            análises inteligentes e integrações poderosas.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                padding: '14px 34px',
                borderRadius: 999,
                background: t.btnPrimary,
                color: t.btnPrimaryText,
                border: 'none',
                cursor: 'pointer',
                fontSize: 15,
                letterSpacing: '0.03em',
                boxShadow: theme === 'dark'
                  ? '0 0 32px rgba(204,0,0,0.35)'
                  : '0 0 32px rgba(255,255,255,0.25)',
                transition: 'transform 0.2s, opacity 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Começar Grátis
            </button>
            <button
              style={{
                padding: '14px 34px',
                borderRadius: 999,
                background: 'transparent',
                color: '#ffffff',
                border: `1px solid ${t.btnOutlineBorder}`,
                cursor: 'pointer',
                fontSize: 15,
                letterSpacing: '0.03em',
                backdropFilter: 'blur(8px)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Ver Demo
            </button>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            opacity: 0.5,
            animation: 'float 2s ease-in-out infinite',
          }}
        >
          <div style={{ width: 20, height: 32, border: `1.5px solid rgba(255,255,255,0.5)`, borderRadius: 999, display: 'flex', justifyContent: 'center', paddingTop: 5 }}>
            <div style={{ width: 2, height: 7, background: 'white', borderRadius: 999 }} />
          </div>
        </div>

        <p style={{ position: 'absolute', bottom: 14, fontSize: 12, color: t.textMuted, letterSpacing: '0.06em' }}>
          © KARTON · 2026
        </p>
      </section>

      <section style={{ ...sectionStyle(true), padding: '100px 24px' }}>
        <BackgroundDots theme={theme} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{ color: t.accentText, fontSize: 12, letterSpacing: '0.12em', display: 'block', marginBottom: 12 }}>
              FUNCIONALIDADES
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                color: '#ffffff',
                marginBottom: 16,
                lineHeight: 1.2,
              }}
            >
              Ferramentas que trabalham por você
            </h2>
            <p style={{ color: t.textMuted, maxWidth: 500, margin: '0 auto' }}>
              Recursos simples e poderosos para otimizar as operações do seu armazém.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.cardBorder}`,
                  borderRadius: 20,
                  padding: '36px 32px',
                  backdropFilter: 'blur(8px)',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                  animation: `fadeInUp 0.6s ease-out ${i * 0.15}s both`,
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 50px rgba(0,0,0,0.35)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: t.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: t.iconColor,
                    marginBottom: 24,
                  }}
                >
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 12, color: '#ffffff' }}>{f.title}</h3>
                <p style={{ color: t.textMuted, lineHeight: 1.7, fontSize: '0.92rem' }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...sectionStyle(), padding: '100px 24px' }}>
        <BackgroundDots theme={theme} />
        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{ color: t.accentText, fontSize: 12, letterSpacing: '0.12em', display: 'block', marginBottom: 12 }}>PAINEL DE CONTROLE</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#ffffff', marginBottom: 16 }}>
              Seu centro de comando
            </h2>
            <p style={{ color: t.textMuted, maxWidth: 440, margin: '0 auto' }}>
              Um dashboard belo e intuitivo que coloca tudo ao seu alcance.
            </p>
          </div>

          <div
            style={{
              background: t.dashBg,
              border: `1px solid ${t.divider}`,
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
              animation: 'scaleIn 0.8s ease-out both',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px',
                borderBottom: `1px solid ${t.divider}`,
                background: theme === 'dark' ? '#0a0a0a' : '#6b0a0a',
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                {['#CC0000', '#FF4444', '#FF8888'].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: theme === 'dark' ? 1 : 0.8 }} />
                ))}
              </div>
              <div
                style={{
                  flex: 1,
                  marginLeft: 12,
                  background: t.cardBg,
                  borderRadius: 6,
                  padding: '4px 14px',
                  fontSize: 12,
                  color: t.textMuted,
                  border: `1px solid ${t.cardBorder}`,
                }}
              >
                karton.app/dashboard
              </div>
            </div>

            <div style={{ padding: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total de Itens', value: '2.847', i: 0 },
                  { label: 'Estoque Baixo',  value: '12',    i: 1 },
                  { label: 'Pedidos Hoje',   value: '43',    i: 2 },
                ].map(s => (
                  <div
                    key={s.i}
                    style={{
                      background: t.cardBg,
                      border: `1px solid ${t.cardBorder}`,
                      borderRadius: 14,
                      padding: '18px 20px',
                    }}
                  >
                    <p style={{ fontSize: 11, color: t.textMuted, letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</p>
                    <p style={{ fontSize: '1.8rem', color: t.statColor, lineHeight: 1 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.cardBorder}`,
                  borderRadius: 14,
                  padding: '20px 24px',
                }}
              >
                <p style={{ fontSize: 13, color: '#ffffff', marginBottom: 18, letterSpacing: '0.04em' }}>Níveis de Inventário</p>
                {[
                  { name: 'Categoria A', pct: 85, i: 0 },
                  { name: 'Categoria B', pct: 62, i: 1 },
                  { name: 'Categoria C', pct: 45, i: 2 },
                ].map(item => (
                  <div key={item.i} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.textMuted, marginBottom: 6 }}>
                      <span>{item.name}</span>
                      <span>{item.pct}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${item.pct}%`,
                          background: t.barColors[item.i],
                          borderRadius: 999,
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...sectionStyle(true), padding: '100px 24px' }}>
        <BackgroundDots theme={theme} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{ color: t.accentText, fontSize: 12, letterSpacing: '0.12em', display: 'block', marginBottom: 12 }}>BENEFÍCIOS</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#ffffff', marginBottom: 16 }}>
              Por que escolher o Karton?
            </h2>
            <p style={{ color: t.textMuted, maxWidth: 440, margin: '0 auto' }}>
              Criado por gestores de armazém, para gestores de armazém.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.cardBorder}`,
                  borderRadius: 18,
                  padding: '28px 28px',
                  display: 'flex',
                  gap: 20,
                  alignItems: 'flex-start',
                  backdropFilter: 'blur(8px)',
                  animation: `slideInFromLeft 0.55s ease-out ${i * 0.1}s both`,
                  transition: 'transform 0.25s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: t.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: t.iconColor,
                  }}
                >
                  {b.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: 8, color: '#ffffff' }}>{b.title}</h3>
                  <p style={{ color: t.textMuted, fontSize: '0.88rem', lineHeight: 1.65 }}>{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          ...sectionStyle(),
          padding: '100px 24px',
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #1a0000 0%, #0a0a0a 50%, #0a0000 100%)'
            : 'linear-gradient(135deg, #6b0000 0%, #8b1111 50%, #aa1515 100%)',
        }}
      >
        <BackgroundDots theme={theme} />

        {CTA_BOXES.map((b, i) => (
          <Box3D
            key={i}
            size={b.size}
            rotation={b.rotation}
            position={b.position}
            delay={b.delay}
            theme={theme}
            animate
          />
        ))}

        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <span style={{ color: t.accentText, fontSize: 12, letterSpacing: '0.12em', display: 'block', marginBottom: 16 }}>
            COMECE AGORA
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#ffffff', marginBottom: 20, lineHeight: 1.2 }}>
            Pronto para transformar seu armazém?
          </h2>
          <p style={{ color: t.textMuted, marginBottom: 44, lineHeight: 1.7 }}>
            Junte-se a milhares de gestores que simplificaram suas operações com o Karton.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <input
              type="email"
              placeholder="Seu endereço de e-mail"
              style={{
                padding: '14px 22px',
                borderRadius: 999,
                border: `1px solid ${t.cardBorder}`,
                background: t.cardBg,
                color: '#ffffff',
                fontSize: 14,
                outline: 'none',
                width: '100%',
                maxWidth: 300,
                backdropFilter: 'blur(8px)',
              }}
            />
            <button
              style={{
                padding: '14px 30px',
                borderRadius: 999,
                background: t.btnPrimary,
                color: t.btnPrimaryText,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                whiteSpace: 'nowrap',
                boxShadow: theme === 'dark' ? '0 0 28px rgba(204,0,0,0.4)' : '0 0 28px rgba(255,255,255,0.25)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Teste Grátis por 14 Dias
            </button>
          </div>

          <p style={{ fontSize: 12, color: t.textMuted }}>
            Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>
      </section>

      <footer
        style={{
          background: theme === 'dark' ? '#050505' : '#600a0a',
          borderTop: `1px solid ${t.divider}`,
          padding: '60px 24px',
          color: t.textMuted,
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 48 }}>
            <div>
              <KartonLogo small />
              <p style={{ fontSize: 13, marginTop: 14, lineHeight: 1.7 }}>
                Gestão inteligente de armazém para empresas modernas.
              </p>
            </div>
            {[
              { title: 'Produto', links: ['Funcionalidades', 'Preços', 'Segurança', 'Roadmap'] },
              { title: 'Empresa',  links: ['Sobre', 'Blog', 'Carreiras', 'Contato'] },
              { title: 'Legal',    links: ['Privacidade', 'Termos', 'Cookies'] },
            ].map(col => (
              <div key={col.title}>
                <p style={{ fontSize: 12, letterSpacing: '0.1em', color: t.accentText, marginBottom: 16 }}>{col.title.toUpperCase()}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(link => (
                    <li key={link}>
                      <a
                        href="#"
                        style={{
                          color: t.textMuted,
                          textDecoration: 'none',
                          fontSize: 13,
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = t.textMuted; }}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${t.divider}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
            <span>© 2026 Karton. Todos os direitos reservados.</span>
            <span style={{ color: t.accentText }}>Made with ♥ for warehouse managers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
