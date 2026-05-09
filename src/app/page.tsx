"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Video, 
  Camera, 
  Aperture, 
  Users, 
  Radio, 
  ChevronRight, 
  Star, 
  Clock, 
  Shield, 
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { SERVICES, STUDIO_CONFIG } from '@/lib/data';
import { BookingModal } from '@/components/BookingModal';
import { AuthButton } from '@/components/AuthButton';

const Navbar = ({ onOpenBooking }: { onOpenBooking: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${
      scrolled ? 'bg-[#05070A]/80 backdrop-blur-xl border-b border-[#222B38] py-3' : 'bg-transparent py-6'
    }`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#EAB308] to-[#CA8A04] rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Mic className="text-[#05070A] w-6 h-6" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-head font-bold text-lg text-white tracking-tight">
              LIGHTHOUSE <span className="text-[#EAB308]">STUDIOS</span>
            </span>
            <span className="text-[10px] text-[#64748B] font-medium tracking-widest uppercase">By Brainvare</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {['Services', 'Packages', 'Pricing', 'FAQ'].map((item) => (
            <Link 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-[#64748B] hover:text-white transition-colors"
            >
              {item}
            </Link>
          ))}
          <AuthButton />
          <button onClick={onOpenBooking} className="btn-gold !py-2.5 !px-6 text-sm">
            Book Session
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-[#0B0F14] border-b border-[#222B38] p-6 flex flex-col gap-4 md:hidden"
          >
            {['Services', 'Packages', 'Pricing', 'FAQ'].map((item) => (
              <Link 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-lg font-medium text-[#CBD5E1]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            <button className="btn-gold w-full mt-4">Book Session</button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ onOpenBooking }: { onOpenBooking: () => void }) => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 50, 0], 
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-20 w-[600px] h-[600px] bg-[#EAB308]/10 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0], 
            y: [0, 40, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-20 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full"
        />
        <div className="absolute inset-0 bg-[radial-gradient(#222B38_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.15] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 bg-[#EAB308]/10 border border-[#EAB308]/20 px-5 py-2 rounded-full mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-[#EAB308] animate-pulse" />
            <span className="text-[#EAB308] text-sm font-bold tracking-wide uppercase">Open for Bookings 2024</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-head font-extrabold text-white leading-[0.95] tracking-tighter mb-8"
          >
            THE NEW WAVE OF <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAB308] via-[#FDE047] to-[#CA8A04]">
              PODCAST PRODUCTION
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-[#CBD5E1] max-w-2xl mb-12 leading-relaxed"
          >
            Step into a cinema-grade studio environment designed for creators who demand perfection. 
            4K multi-cam setups, professional soundproofing, and expert production support.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-6"
          >
            <button onClick={onOpenBooking} className="btn-gold !py-4 !px-10 text-lg group">
              Start Booking
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border border-[#222B38] rounded-[var(--radius-sm)] font-head font-bold text-white hover:bg-[#EAB308]/5 hover:border-[#EAB308] transition-all">
              View Showreel
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-20 flex items-center gap-12 border-t border-[#222B38]/50 pt-12"
          >
            {[
              { label: 'Studio Floor', value: '2500 ft²' },
              { label: 'Production Gear', value: '4K Pro' },
              { label: 'Client Satisfaction', value: '100%' }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-2xl font-head font-extrabold text-[#EAB308]">{stat.value}</span>
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ServiceIcon = ({ name }: { name: string }) => {
  const icons: any = {
    Mic: <Mic />,
    Camera: <Camera />,
    Aperture: <Aperture />,
    Video: <Video />,
    Users: <Users />,
    Radio: <Radio />
  };
  return icons[name] || <Mic />;
};

const Services = ({ onOpenBooking }: { onOpenBooking: () => void }) => {
  return (
    <section id="services" className="section bg-[#0B0F14]">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-20">
          <span className="text-[#EAB308] text-sm font-bold uppercase tracking-[0.2em]">Our Services</span>
          <h2 className="text-4xl md:text-5xl font-head font-extrabold text-white mt-4 mb-6">
            Production Excellence <br /> For Every Creator
          </h2>
          <p className="text-[#CBD5E1] text-lg">
            From solo founders to global brands, we provide the infrastructure to turn your ideas into high-impact media.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="premium-card group"
            >
              <div className="w-16 h-16 bg-[#05070A] border border-[#222B38] rounded-2xl flex items-center justify-center text-[#EAB308] mb-8 group-hover:border-[#EAB308] group-hover:bg-[#EAB308]/10 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
                <ServiceIcon name={service.icon} />
              </div>
              <h3 className="text-2xl font-head font-bold text-white mb-4">{service.name}</h3>
              <p className="text-[#64748B] mb-8 line-clamp-3 leading-relaxed">{service.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {service.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] bg-[#05070A] px-3 py-1 rounded-full border border-[#222B38]">
                    {tag}
                  </span>
                ))}
              </div>

              <div 
                onClick={onOpenBooking}
                className="flex items-center justify-between mt-auto pt-6 border-t border-[#222B38] cursor-pointer group/link"
              >
                <span className="text-[#EAB308] font-bold text-sm">{service.startingLabel}</span>
                <ChevronRight className="text-[#64748B] w-5 h-5 group-hover/link:translate-x-1 group-hover/link:text-[#EAB308] transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#05070A]">
      <Navbar onOpenBooking={() => setIsBookingOpen(true)} />
      <Hero onOpenBooking={() => setIsBookingOpen(true)} />
      <Services onOpenBooking={() => setIsBookingOpen(true)} />
      
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      {/* Trust Ticker */}
      <div className="bg-[#12171E] py-4 border-y border-[#222B38] overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-12 mx-12">
              <span className="text-[10px] font-bold text-[#64748B] tracking-[0.3em] uppercase">Premium Production</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
              <span className="text-[10px] font-bold text-[#64748B] tracking-[0.3em] uppercase">Soundproof Studio</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
              <span className="text-[10px] font-bold text-[#64748B] tracking-[0.3em] uppercase">4K Cinematic Setups</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section className="section py-32">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: <Shield />, title: 'Premium Privacy', desc: 'Secure, soundproof environments for high-profile client sessions.' },
              { icon: <Clock />, title: '24/7 Availability', desc: 'Round-the-clock booking options for international time zones.' },
              { icon: <CheckCircle2 />, title: 'Certified Crew', desc: 'Expert operators and directors to ensure broadcast quality.' }
            ].map((feature, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-12 h-12 shrink-0 bg-[#EAB308]/10 rounded-xl flex items-center justify-center text-[#EAB308]">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-xl font-head font-bold text-white mb-2">{feature.title}</h4>
                  <p className="text-[#64748B] leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
