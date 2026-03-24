import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Menu, X } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = React.useState(false);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl glass rounded-full px-6 py-3 flex items-center justify-between premium-shadow">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Heart className="w-5 h-5 text-deep-pink fill-deep-pink" />
          <span className="font-serif font-semibold text-lg tracking-tight">Nail Studio</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600 uppercase tracking-widest">
          <button onClick={() => scrollTo('services')} className="hover:text-deep-pink transition-colors">Услуги</button>
          <button onClick={() => scrollTo('booking')} className="hover:text-deep-pink transition-colors">Запись</button>
          <button onClick={() => scrollTo('map')} className="hover:text-deep-pink transition-colors">Контакты</button>
        </nav>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center text-deep-pink"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 top-20 z-40 glass rounded-[2rem] p-8 md:hidden premium-shadow"
          >
            <nav className="flex flex-col gap-6 text-center text-lg font-bold text-gray-700 uppercase tracking-widest">
              <button onClick={() => scrollTo('services')}>Услуги</button>
              <button onClick={() => scrollTo('booking')}>Запись</button>
              <button onClick={() => scrollTo('map')}>Контакты</button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
