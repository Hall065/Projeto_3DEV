import { useEffect, useState } from 'react';
import { Box3D } from './components/Box3D';
import { Shelf3D } from './components/Shelf3D';
import warehouseImage from '../imports/lucid-origin_warehouse_corridor_perspective_central_vanishing_point_symmetrical_shelves_on_bo-0_(1).jpg';

export default function App() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full overflow-x-hidden bg-[#F5F1E8]">
      {/* Hero Section - Warehouse Corridor */}
      <section
        className="relative h-screen w-full overflow-hidden"
        style={{
          perspective: '1200px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Warehouse Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${warehouseImage})`,
            transform: `translateZ(-300px) scale(1.25) translateY(${scrollY * 0.4}px)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Overlay to darken and create depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#3E4A52]/60 via-transparent to-[#3E4A52]/80" />
        </div>

        {/* 3D Shelves Layer - Left Side */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translateZ(-100px) scale(1.08) translateY(${scrollY * 0.25}px)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {[0, 1, 2, 3].map((level) => (
            <Shelf3D key={`left-${level}`} level={level} side="left" depth={level} />
          ))}
        </div>

        {/* 3D Shelves Layer - Right Side */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translateZ(-100px) scale(1.08) translateY(${scrollY * 0.25}px)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {[0, 1, 2, 3].map((level) => (
            <Shelf3D key={`right-${level}`} level={level} side="right" depth={level} />
          ))}
        </div>

        {/* 3D Boxes on Shelves - Left Side */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translateZ(0px) translateY(${scrollY * 0.15}px)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <Box3D
            size={70}
            rotation={{ x: -15, y: 35, z: 0 }}
            position={{ bottom: '55%', left: '12%' }}
            delay={0}
          />
          <Box3D
            size={60}
            rotation={{ x: -20, y: 40, z: 5 }}
            position={{ bottom: '72%', left: '15%' }}
            delay={0.8}
          />
          <Box3D
            size={65}
            rotation={{ x: -18, y: 38, z: -3 }}
            position={{ bottom: '38%', left: '18%' }}
            delay={1.6}
          />
          <Box3D
            size={55}
            rotation={{ x: -25, y: 42, z: 2 }}
            position={{ bottom: '20%', left: '22%' }}
            delay={2.4}
          />
        </div>

        {/* 3D Boxes on Shelves - Right Side */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translateZ(0px) translateY(${scrollY * 0.15}px)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <Box3D
            size={70}
            rotation={{ x: -15, y: -35, z: 0 }}
            position={{ bottom: '55%', right: '12%' }}
            delay={0.4}
          />
          <Box3D
            size={60}
            rotation={{ x: -20, y: -40, z: -5 }}
            position={{ bottom: '72%', right: '15%' }}
            delay={1.2}
          />
          <Box3D
            size={65}
            rotation={{ x: -18, y: -38, z: 3 }}
            position={{ bottom: '38%', right: '18%' }}
            delay={2}
          />
          <Box3D
            size={55}
            rotation={{ x: -25, y: -42, z: -2 }}
            position={{ bottom: '20%', right: '22%' }}
            delay={2.8}
          />
        </div>

        {/* 3D Boxes on Floor - Foreground */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translateZ(100px) scale(0.92) translateY(${scrollY * 0.05}px)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <Box3D
            size={110}
            rotation={{ x: -25, y: 25, z: 0 }}
            position={{ bottom: '8%', left: '28%' }}
            delay={0}
          />
          <Box3D
            size={95}
            rotation={{ x: -28, y: -20, z: 5 }}
            position={{ bottom: '5%', right: '30%' }}
            delay={1}
          />
          <Box3D
            size={85}
            rotation={{ x: -22, y: 30, z: -3 }}
            position={{ bottom: '12%', left: '38%' }}
            delay={0.5}
          />
          <Box3D
            size={100}
            rotation={{ x: -26, y: -25, z: 2 }}
            position={{ bottom: '6%', right: '40%' }}
            delay={1.5}
          />
        </div>

        {/* Hanging Sign with Lamp Logo - Foreground */}
        <div
          className="absolute top-16 md:top-24 left-1/2 -translate-x-1/2 z-20"
          style={{
            transform: `translateX(-50%) translateZ(150px) scale(0.88) translateY(${scrollY * -0.08}px)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Chains */}
          <div className="absolute -top-16 md:-top-20 left-6 md:left-10 w-1 h-16 md:h-20 bg-[#5F6B73] shadow-lg" />
          <div className="absolute -top-16 md:-top-20 right-6 md:right-10 w-1 h-16 md:h-20 bg-[#5F6B73] shadow-lg" />

          {/* Workshop Sign */}
          <div
            className="relative bg-gradient-to-b from-[#B89968] to-[#A67C52] px-6 md:px-12 py-5 md:py-7 rounded-xl shadow-2xl border-4 border-[#8B6641]"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 -2px 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div className="flex items-center gap-1 md:gap-2">
              {/* K */}
              <span className="font-bold text-4xl md:text-6xl text-[#F5F1E8] drop-shadow-lg" style={{ fontFamily: 'system-ui, sans-serif' }}>
                K
              </span>

              {/* A */}
              <span className="font-bold text-4xl md:text-6xl text-[#F5F1E8] drop-shadow-lg" style={{ fontFamily: 'system-ui, sans-serif' }}>
                A
              </span>

              {/* R */}
              <span className="font-bold text-4xl md:text-6xl text-[#F5F1E8] drop-shadow-lg" style={{ fontFamily: 'system-ui, sans-serif' }}>
                R
              </span>

              {/* T */}
              <span className="font-bold text-4xl md:text-6xl text-[#F5F1E8] drop-shadow-lg" style={{ fontFamily: 'system-ui, sans-serif' }}>
                T
              </span>

              {/* O as Hanging Lamp */}
              <div className="relative flex flex-col items-center -mt-3 md:-mt-5">
                {/* Lamp Cord */}
                <div className="w-0.5 h-6 md:h-10 bg-gradient-to-b from-[#5F6B73] to-[#3E4A52] shadow-md" />

                {/* Lamp Bulb (the O) */}
                <div
                  className="relative w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#FFE5B4] via-[#F5D9A8] to-[#D9B382]"
                  style={{
                    animation: 'lampFlicker 3s ease-in-out infinite, lampGlow 3s ease-in-out infinite',
                    boxShadow: '0 0 50px rgba(255, 229, 180, 0.9), 0 0 80px rgba(217, 179, 130, 0.6), inset 0 0 25px rgba(255, 255, 255, 0.4)',
                  }}
                >
                  {/* Lamp Highlight */}
                  <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 w-3 h-3 md:w-5 md:h-5 rounded-full bg-white opacity-70" />
                  <div className="absolute top-1 left-1 w-2 h-2 md:w-3 md:h-3 rounded-full bg-white opacity-90" />
                </div>

                {/* Light Rays */}
                <div
                  className="absolute -bottom-6 md:-bottom-10 w-20 h-20 md:w-28 md:h-28 rounded-full opacity-40 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 229, 180, 0.8) 0%, rgba(217, 179, 130, 0.4) 40%, transparent 70%)',
                    animation: 'lampFlicker 3s ease-in-out infinite',
                  }}
                />
              </div>

              {/* N */}
              <span className="font-bold text-4xl md:text-6xl text-[#F5F1E8] drop-shadow-lg" style={{ fontFamily: 'system-ui, sans-serif' }}>
                N
              </span>
            </div>

            {/* Subtitle */}
            <p className="text-center mt-3 md:mt-4 text-[#F5F1E8] text-xs md:text-sm opacity-95 drop-shadow-md tracking-wide">
              Smart Warehouse Management
            </p>

            {/* Wood grain texture overlay */}
            <div
              className="absolute inset-0 opacity-10 rounded-xl pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
              }}
            />
          </div>
        </div>

        {/* Tagline */}
        <div
          className="absolute bottom-20 md:bottom-28 left-1/2 -translate-x-1/2 text-center z-10 w-full px-4"
          style={{
            animation: 'fadeInUp 1s ease-out 0.5s both',
          }}
        >
          <p className="text-lg md:text-2xl lg:text-3xl text-[#F5F1E8] mb-6 drop-shadow-2xl">
            Organize your inventory with precision and style
          </p>
          <button className="px-8 py-3 md:px-10 md:py-4 bg-gradient-to-r from-[#D9B382] to-[#E5C59A] text-[#3E4A52] rounded-full hover:from-[#E5C59A] hover:to-[#F0D9B5] transition-all duration-300 shadow-2xl hover:shadow-[0_10px_40px_rgba(217,179,130,0.6)] transform hover:scale-105">
            Get Started Free
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-10">
          <div className="w-5 h-8 md:w-6 md:h-10 border-2 border-[#F5F1E8] rounded-full flex items-start justify-center p-1.5 md:p-2 backdrop-blur-sm bg-black/10">
            <div className="w-0.5 md:w-1 h-2 md:h-3 bg-[#F5F1E8] rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 md:py-32 px-4 bg-[#F5F1E8] overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-[#D9B382] rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#A67C52] rounded-full opacity-10 blur-3xl" />

        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl text-center mb-4 text-[#3E4A52]">
            Features that Work for You
          </h2>
          <p className="text-center text-[#5F6B73] mb-16 max-w-2xl mx-auto">
            Simple, powerful tools designed to streamline your warehouse operations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature 1 - Real-time Tracking */}
            <div
              className="group flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              style={{ animation: 'fadeInUp 0.6s ease-out both' }}
            >
              <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-[#D9B382] to-[#A67C52] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-12 h-12 text-[#F5F1E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl mb-3 text-[#3E4A52]">Real-time Tracking</h3>
              <p className="text-[#5F6B73]">
                Monitor your inventory levels instantly with live updates and automatic alerts
              </p>
            </div>

            {/* Feature 2 - Smart Analytics */}
            <div
              className="group flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}
            >
              <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-[#D9B382] to-[#A67C52] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-12 h-12 text-[#F5F1E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl mb-3 text-[#3E4A52]">Smart Analytics</h3>
              <p className="text-[#5F6B73]">
                Get actionable insights with AI-powered analytics and predictive forecasting
              </p>
            </div>

            {/* Feature 3 - Easy Integration */}
            <div
              className="group flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}
            >
              <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-[#D9B382] to-[#A67C52] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-12 h-12 text-[#F5F1E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl mb-3 text-[#3E4A52]">Easy Integration</h3>
              <p className="text-[#5F6B73]">
                Seamlessly connect with your existing tools and systems in minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section
        className="relative py-20 md:py-32 px-4 bg-gradient-to-br from-[#3E4A52] to-[#5F6B73] overflow-hidden"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      >
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl text-center mb-4 text-[#F5F1E8]">
            Your Command Center
          </h2>
          <p className="text-center text-[#D9B382] mb-16 max-w-2xl mx-auto">
            A beautiful, intuitive dashboard that puts everything at your fingertips
          </p>

          {/* Dashboard Mockup */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ animation: 'scaleIn 0.8s ease-out both' }}
          >
            {/* Mock Browser Header */}
            <div className="bg-[#5F6B73] p-4 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#D9B382]" />
                <div className="w-3 h-3 rounded-full bg-[#A67C52]" />
                <div className="w-3 h-3 rounded-full bg-[#8B6641]" />
              </div>
              <div className="flex-1 ml-4 bg-[#3E4A52] rounded px-4 py-1 text-sm text-[#D9B382]">
                karton.app/dashboard
              </div>
            </div>

            {/* Mock Dashboard Content */}
            <div className="p-8 bg-[#F5F1E8]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {[
                  { label: 'Total Items', value: '2,847', color: '#D9B382' },
                  { label: 'Low Stock', value: '12', color: '#A67C52' },
                  { label: 'Orders Today', value: '43', color: '#5F6B73' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-md">
                    <p className="text-[#5F6B73] text-sm mb-2">{stat.label}</p>
                    <p className="text-3xl" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <p className="text-[#3E4A52] mb-4">Inventory Levels</p>
                <div className="space-y-3">
                  {[
                    { name: 'Category A', percentage: 85, color: '#D9B382' },
                    { name: 'Category B', percentage: 62, color: '#A67C52' },
                    { name: 'Category C', percentage: 45, color: '#5F6B73' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm text-[#5F6B73] mb-1">
                        <span>{item.name}</span>
                        <span>{item.percentage}%</span>
                      </div>
                      <div className="h-2 bg-[#F5F1E8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 md:py-32 px-4 bg-[#F5F1E8]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-center mb-4 text-[#3E4A52]">
            Why Choose Karton?
          </h2>
          <p className="text-center text-[#5F6B73] mb-16 max-w-2xl mx-auto">
            Built by warehouse managers, for warehouse managers
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Save Time',
                description: 'Automate repetitive tasks and reduce manual data entry by up to 80%',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: 'Reduce Errors',
                description: 'Eliminate mistakes with barcode scanning and automated validation',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: 'Scale Easily',
                description: 'Grow from one warehouse to hundreds without changing systems',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
              },
              {
                title: 'Stay Secure',
                description: 'Enterprise-grade security with role-based access control',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="flex gap-6 p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ animation: `slideInFromLeft 0.6s ease-out ${i * 0.1}s both` }}
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D9B382] to-[#A67C52] flex items-center justify-center text-[#F5F1E8] shadow-lg">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-xl mb-2 text-[#3E4A52]">{benefit.title}</h3>
                  <p className="text-[#5F6B73]">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-32 px-4 bg-gradient-to-br from-[#A67C52] to-[#D9B382] overflow-hidden">
        {/* Decorative 3D Boxes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-15 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            >
              <Box3D
                size={40 + i * 10}
                rotation={{ x: -20, y: 25 + i * 5, z: 0 }}
                position={{}}
                delay={i * 0.5}
                animate={true}
              />
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl mb-6 text-[#F5F1E8]">
            Ready to Transform Your Warehouse?
          </h2>
          <p className="text-xl text-[#F5F1E8] mb-10 opacity-90">
            Join thousands of warehouse managers who have simplified their operations with Karton
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-6 py-4 rounded-full w-full sm:w-96 text-[#3E4A52] outline-none focus:ring-4 focus:ring-[#F5F1E8] transition-all shadow-lg"
            />
            <button className="px-8 py-4 bg-[#3E4A52] text-[#F5F1E8] rounded-full hover:bg-[#5F6B73] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 whitespace-nowrap">
              Start Free Trial
            </button>
          </div>

          <p className="text-sm text-[#F5F1E8] opacity-75">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3E4A52] text-[#F5F1E8] py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl mb-4 text-[#D9B382]">Karton</h3>
            <p className="text-sm opacity-75">
              Smart warehouse management for modern businesses
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-[#D9B382]">Product</h4>
            <ul className="space-y-2 text-sm opacity-75">
              <li>Features</li>
              <li>Pricing</li>
              <li>Security</li>
              <li>Roadmap</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[#D9B382]">Company</h4>
            <ul className="space-y-2 text-sm opacity-75">
              <li>About</li>
              <li>Blog</li>
              <li>Careers</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[#D9B382]">Legal</h4>
            <ul className="space-y-2 text-sm opacity-75">
              <li>Privacy</li>
              <li>Terms</li>
              <li>Cookie Policy</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-[#5F6B73] text-center text-sm opacity-75">
          © 2026 Karton. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
