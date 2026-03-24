import React from 'react';
import { MapPin, Phone, Instagram, MessageCircle } from 'lucide-react';

export default function Map() {
  return (
    <section id="map" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-deep-pink/5 border border-accent-pink/10 grid lg:grid-cols-2">
        <div className="p-12 md:p-16 flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold text-gray-900 mb-8">Как нас найти</h2>
          <p className="text-lg text-gray-600 mb-12 leading-relaxed">
            Мы находимся в самом центре города. Удобная парковка и близость к метро сделают ваш визит максимально комфортным.
          </p>
          
          <div className="space-y-8">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-soft-pink flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-deep-pink" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Адрес</p>
                <p className="text-xl font-medium text-gray-800">г. Томск, пр. Ленина, 49</p>
              </div>
            </div>
            
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-soft-pink flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-deep-pink" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Телефон</p>
                <p className="text-xl font-medium text-gray-800">+7 (923) 414-40-30</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-8 border-t border-accent-pink/10">
              <a href="https://t.me/megakiller221105" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 rounded-full bg-soft-pink text-deep-pink hover:bg-deep-pink hover:text-white transition-all active:scale-90 font-medium">
                <MessageCircle className="w-5 h-5" />
                <span>Telegram</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="h-[400px] lg:h-auto min-h-[400px] relative">
          <iframe 
            src="https://yandex.ru/map-widget/v1/?text=Томск%20Ленина%2049&z=16" 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allowFullScreen={true}
            className="absolute inset-0 grayscale-[0.2] contrast-[1.1]"
          />
        </div>
      </div>
    </section>
  );
}
