import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { SERVICES } from '../constants';
import { ChevronLeft, ChevronRight, Clock, Wallet } from 'lucide-react';

export default function Services() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section id="services" className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
      <div className="flex items-end justify-between mb-12">
        <div className="max-w-xl">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold text-gray-900 mb-6">Наши услуги</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Мы подобрали самые популярные и востребованные виды маникюра, чтобы вы могли найти именно то, что подходит вашему стилю.
          </p>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={scrollPrev}
            className="w-12 h-12 rounded-full border border-accent-pink flex items-center justify-center text-deep-pink hover:bg-white transition-all active:scale-90"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={scrollNext}
            className="w-12 h-12 rounded-full border border-accent-pink flex items-center justify-center text-deep-pink hover:bg-white transition-all active:scale-90"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex gap-6">
          {SERVICES.map((service, index) => (
            <motion.div 
              key={service.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="embla__slide flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0"
            >
              <div className="group bg-white rounded-3xl overflow-hidden shadow-xl shadow-deep-pink/5 border border-accent-pink/20 h-full flex flex-col transition-all hover:-translate-y-2">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={service.imageUrl} 
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-full text-xs font-bold text-deep-pink">
                    {service.price} ₽
                  </div>
                </div>
                
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-4 group-hover:text-deep-pink transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-accent-pink/10 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <Clock className="w-4 h-4 text-muted-pink" />
                      <span>{service.duration} мин</span>
                    </div>
                    <button 
                      onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-soft-pink/50 text-deep-pink text-xs font-bold transition-all hover:bg-deep-pink hover:text-white group/btn"
                    >
                      Записаться
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
