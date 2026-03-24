import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Hero() {
  const scrollToBooking = () => {
    const element = document.getElementById('booking');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 px-6 text-center overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-accent-pink/40 blur-3xl rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-muted-pink/30 blur-3xl rounded-full -z-10 animate-pulse delay-700" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 border border-accent-pink text-deep-pink text-xs font-semibold tracking-wider uppercase mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ваша красота в надежных руках</span>
        </div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-serif font-semibold text-gray-900 leading-[1.1] mb-8"
        >
          Идеальный маникюр <br />
          <span className="italic text-deep-pink">для самых нежных</span>
        </motion.h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-xl mx-auto leading-relaxed">
          Минимализм, чистота и безупречное качество. Создаем не просто дизайн, а ваше настроение на несколько недель вперед.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={scrollToBooking} className="btn-primary w-full sm:w-auto">
            Записаться сейчас
          </button>
          <button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary w-full sm:w-auto">
            Посмотреть услуги
          </button>
        </div>
      </motion.div>
      
      {/* Floating elements */}
      <motion.div 
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 right-[10%] hidden lg:block"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/20 shadow-lg shadow-deep-pink/5 rotate-12" />
      </motion.div>
      
      <motion.div 
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/3 left-[10%] hidden lg:block"
      >
        <div className="w-20 h-20 rounded-full bg-white/40 backdrop-blur-sm border border-white/20 shadow-lg shadow-deep-pink/5 -rotate-12" />
      </motion.div>
    </section>
  );
}
