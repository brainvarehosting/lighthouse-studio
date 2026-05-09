"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Check,
  CreditCard,
  Mic,
  Video,
  Camera,
  Users,
  ShieldCheck
} from 'lucide-react';
import { SERVICES, PODCAST_PACKAGES, STUDIO_CONFIG } from '@/lib/data';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, title: 'Service', icon: <Mic /> },
  { id: 2, title: 'Details', icon: <Users /> },
  { id: 3, title: 'Schedule', icon: <CalendarIcon /> },
  { id: 4, title: 'Review', icon: <ShieldCheck /> }
];

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState('podcast');
  const [selectedPackage, setSelectedPackage] = useState('2-camera');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);

  if (!isOpen) return null;

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#05070A]/90 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-[#0B0F14] border border-[#222B38] rounded-[var(--radius-lg)] overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[850px] shadow-2xl"
        >
          {/* Sidebar / Progress */}
          <div className="w-full md:w-80 bg-[#12171E] border-r border-[#222B38] p-8 hidden md:flex flex-col">
            <div className="mb-12">
              <h2 className="text-2xl font-head font-bold text-white mb-2">Book Studio</h2>
              <p className="text-sm text-[#64748B]">Complete the steps to secure your production slot.</p>
            </div>

            <div className="flex flex-col gap-8">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-4 group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    currentStep === step.id 
                      ? 'bg-[#EAB308] text-[#05070A] shadow-lg shadow-yellow-500/20 scale-110' 
                      : currentStep > step.id 
                        ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                        : 'bg-[#05070A] text-[#64748B] border border-[#222B38]'
                  }`}>
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                      currentStep === step.id ? 'text-[#EAB308]' : 'text-[#64748B]'
                    }`}>Step 0{step.id}</span>
                    <span className={`font-head font-bold ${
                      currentStep === step.id ? 'text-white' : 'text-[#64748B]'
                    }`}>{step.title}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-[#222B38]">
              <div className="flex items-center gap-3 text-[#64748B] text-xs">
                <ShieldCheck className="w-4 h-4 text-[#EAB308]" />
                Secure Checkout by Brainvare
              </div>
            </div>
          </div>

          {/* Main Form Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#05070A]">
            {/* Header (Mobile) */}
            <div className="p-6 md:hidden flex items-center justify-between border-b border-[#222B38]">
              <span className="font-head font-bold text-white">Step {currentStep} of 4</span>
              <button onClick={onClose} className="text-[#64748B]"><X /></button>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 1 && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-3xl font-head font-bold text-white mb-2">Select Production Type</h3>
                        <p className="text-[#64748B]">Choose the service you would like to book today.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {SERVICES.map((svc) => (
                          <button
                            key={svc.id}
                            onClick={() => setSelectedService(svc.id)}
                            className={`p-6 rounded-2xl border text-left transition-all group ${
                              selectedService === svc.id 
                                ? 'bg-[#EAB308]/5 border-[#EAB308] ring-1 ring-[#EAB308]' 
                                : 'bg-[#12171E] border-[#222B38] hover:border-[#64748B]'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                              selectedService === svc.id ? 'bg-[#EAB308] text-[#05070A]' : 'bg-[#05070A] text-[#64748B]'
                            }`}>
                              {svc.id === 'podcast' ? <Mic /> : <Video />}
                            </div>
                            <h4 className="font-head font-bold text-lg text-white mb-1">{svc.name}</h4>
                            <p className="text-xs text-[#64748B] leading-relaxed">{svc.startingLabel}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-3xl font-head font-bold text-white mb-2">Configure Package</h3>
                        <p className="text-[#64748B]">Fine-tune your setup for the best results.</p>
                      </div>
                      
                      {selectedService === 'podcast' ? (
                        <div className="grid grid-cols-1 gap-3">
                          {PODCAST_PACKAGES.map((pkg) => (
                            <button
                              key={pkg.id}
                              onClick={() => setSelectedPackage(pkg.id)}
                              className={`p-5 rounded-xl border flex items-center justify-between transition-all ${
                                selectedPackage === pkg.id 
                                  ? 'bg-[#EAB308]/5 border-[#EAB308]' 
                                  : 'bg-[#12171E] border-[#222B38]'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${selectedPackage === pkg.id ? 'bg-[#EAB308]' : 'bg-transparent'}`} />
                                <div className="text-left">
                                  <div className="font-head font-bold text-white">{pkg.name}</div>
                                  <div className="text-[10px] text-[#64748B] uppercase tracking-wider">{pkg.bestFor}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[#EAB308] font-bold">₹{pkg.firstHourPrice}</div>
                                <div className="text-[10px] text-[#64748B]">First Hour</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 bg-[#12171E] border border-[#222B38] rounded-2xl text-center">
                          <p className="text-[#64748B]">Custom quote will be provided after submission for this service.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-3xl font-head font-bold text-white mb-2">Pick your Slot</h3>
                        <p className="text-[#64748B]">Select your preferred date and session duration.</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Simple Date Picker Placeholder */}
                        <div className="space-y-4">
                          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Select Date</label>
                          <input 
                            type="date" 
                            className="w-full bg-[#12171E] border border-[#222B38] rounded-xl p-4 text-white outline-none focus:border-[#EAB308] transition-colors"
                            onChange={(e) => setSelectedDate(e.target.value)}
                          />
                        </div>

                        {/* Duration Slider */}
                        <div className="space-y-4">
                          <label className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Duration: {duration} Hours</label>
                          <input 
                            type="range" 
                            min="1" 
                            max="8" 
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="w-full accent-[#EAB308]"
                          />
                          <div className="flex justify-between text-[10px] text-[#64748B] font-bold">
                            <span>1 HR</span>
                            <span>8 HRS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 md:p-8 bg-[#12171E] border-t border-[#222B38] flex items-center justify-between">
              <button 
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 text-sm font-bold text-[#64748B] hover:text-white transition-colors disabled:opacity-0"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] text-[#64748B] font-bold uppercase">Estimated Total</span>
                  <span className="text-xl font-head font-bold text-[#EAB308]">₹{selectedService === 'podcast' ? '4,500' : 'TBD'}</span>
                </div>
                
                {currentStep < 4 ? (
                  <button onClick={nextStep} className="btn-gold !py-3 !px-8 group">
                    Continue
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button className="btn-gold !py-3 !px-8 bg-[#22C55E] hover:bg-[#16a34a] shadow-green-500/20">
                    Confirm Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
