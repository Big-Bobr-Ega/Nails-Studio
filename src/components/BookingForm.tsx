import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfDay, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { SERVICES } from '../constants';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';

export default function BookingForm() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState(SERVICES[0].id);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [scheduleData, setScheduleData] = useState<any>(null);

  const dates = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i));

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'schedule');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setScheduleData(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const q = query(
          collection(db, 'bookings'), 
          where('date', '==', dateStr),
          limit(100)
        );
        const querySnapshot = await getDocs(q);
        const slots = querySnapshot.docs.map(doc => doc.data().time);
        setBookedSlots(slots);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      }
    };
    fetchBookings();
  }, [selectedDate]);

  const generateTimeSlots = () => {
    if (!scheduleData) return [];
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dateSettings = scheduleData.dateSettings?.[dateStr];
    
    let workingHours = [];
    if (dateSettings) {
      if (dateSettings.isOffDay) return [];
      workingHours = dateSettings.workingHours || [];
    } else {
      // Fallback
      if (scheduleData.offDays?.includes(dateStr)) return [];
      workingHours = scheduleData.defaultWorkingHours || scheduleData.workingHours || [{ start: '09:00', end: '18:00' }];
    }
    
    const intervals = Array.isArray(workingHours) ? workingHours : [workingHours];
    const slots: string[] = [];
    
    const now = new Date();
    const isToday = isSameDay(selectedDate, now);
    const currentHour = now.getHours();

    intervals.forEach(interval => {
      const startH = parseInt(interval.start.split(':')[0]);
      const endH = parseInt(interval.end.split(':')[0]);
      
      for (let i = startH; i < endH; i++) {
        if (isToday && i <= currentHour) continue;
        slots.push(`${i.toString().padStart(2, '0')}:00`);
      }
    });
    
    return [...new Set(slots)].sort();
  };

  const timeSlots = generateTimeSlots();
  
  const getIsOffDay = (date: Date) => {
    if (!scheduleData) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateSettings = scheduleData.dateSettings?.[dateStr];
    if (dateSettings) return !!dateSettings.isOffDay;
    return !!scheduleData.offDays?.includes(dateStr);
  };

  const isOffDay = getIsOffDay(selectedDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime || !name || !phone) return;

    setIsSubmitting(true);
    try {
      const bookingData = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        clientName: name,
        clientPhone: phone,
        serviceId: selectedService,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'bookings'), bookingData);
      setIsSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section id="booking" className="py-24 px-6 max-w-4xl mx-auto text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-deep-pink/10 border border-accent-pink/20"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-4xl font-serif font-semibold text-gray-900 mb-4">Запись подтверждена!</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            Мы ждем вас {format(selectedDate, 'd MMMM', { locale: ru })} в {selectedTime}. <br />
            <span className="text-sm text-gray-400 mt-4 block italic">Напоминаем, что отмена записи возможна не позднее чем за 24 часа.</span>
          </p>
          <button 
            onClick={() => setIsSuccess(false)}
            className="btn-primary"
          >
            Записаться еще раз
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="booking" className="py-24 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-serif font-semibold text-gray-900 mb-6">Записаться на процедуру</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Выберите удобное время и услугу. Мы свяжемся с вами для подтверждения деталей.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-deep-pink/5 border border-accent-pink/10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-deep-pink" />
                Выберите услугу
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICES.map(service => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedService(service.id)}
                    className={`px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left border ${
                      selectedService === service.id 
                        ? 'bg-deep-pink text-white border-deep-pink shadow-md' 
                        : 'bg-soft-pink/50 text-gray-600 border-accent-pink/20 hover:bg-white'
                    }`}
                  >
                    {service.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-deep-pink" />
                Выберите дату
              </label>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {dates.map(date => {
                  const isDayOff = getIsOffDay(date);
                  const isSelected = isSameDay(selectedDate, date);
                  
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all border relative ${
                        isSelected
                          ? 'bg-deep-pink text-white border-deep-pink shadow-md'
                          : isDayOff
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-soft-pink/50 text-gray-600 border-accent-pink/20 hover:bg-white'
                      }`}
                    >
                      {isDayOff && !isSelected && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
                      )}
                      <span className="text-[10px] uppercase font-bold opacity-70 mb-1">
                        {format(date, 'EEEEEE', { locale: ru })}
                      </span>
                      <span className="text-lg font-bold">
                        {format(date, 'd')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-deep-pink" />
                Доступное время
              </label>
              {isOffDay ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                  <p className="text-red-400 font-medium">К сожалению, этот день — выходной.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {timeSlots.filter(time => !bookedSlots.includes(time)).map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                        selectedTime === time
                          ? 'bg-deep-pink text-white border-deep-pink shadow-md'
                          : 'bg-soft-pink/50 text-gray-600 border-accent-pink/20 hover:bg-white'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Ваше имя</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-pink" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Александра"
                    className="w-full bg-soft-pink/30 border border-accent-pink/20 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-deep-pink/20 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Телефон</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-pink" />
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full bg-soft-pink/30 border border-accent-pink/20 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-deep-pink/20 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                disabled={isSubmitting || !selectedTime}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Оформляем запись...' : 'Подтвердить запись'}
              </button>
              <div className="flex items-center justify-center gap-2 mt-6 text-gray-400 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Отмена записи возможна только за 24 часа</span>
              </div>
            </div>
          </form>
        </div>

        <div className="hidden lg:block sticky top-32">
          <div className="bg-deep-pink text-white rounded-[2.5rem] p-10 shadow-2xl shadow-deep-pink/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h3 className="text-3xl font-serif font-semibold mb-8">Почему выбирают нас?</h3>
              <ul className="space-y-6">
                {[
                  'Стерильные инструменты по ГОСТу',
                  'Материалы премиум-класса',
                  'Уютная атмосфера и вкусный кофе',
                  'Гарантия на покрытие 14 дней'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-lg font-medium opacity-90">{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-12 pt-12 border-t border-white/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 overflow-hidden">
                    <img src="https://picsum.photos/seed/master/100/100" alt="Master" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold">Елена Иванова</p>
                    <p className="text-xs opacity-70">Топ-мастер с опытом 5+ лет</p>
                  </div>
                </div>
                <p className="text-sm italic opacity-80 leading-relaxed">
                  "Я верю, что маникюр — это не просто процедура, а способ выразить свою любовь к себе. Жду вас в своей студии!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
