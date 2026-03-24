import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfDay, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Clock, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  LogIn
} from 'lucide-react';
import { SERVICES } from '../constants';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { toast } from 'sonner';

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'schedule'>('bookings');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [bookings, setBookings] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Schedule state
  const [scheduleDate, setScheduleDate] = useState<Date>(startOfDay(new Date()));
  const [workingHours, setWorkingHours] = useState<{ start: string, end: string }[]>([]); // Current working hours for selected date
  const [isOffDay, setIsOffDay] = useState(false);
  const [allScheduleSettings, setAllScheduleSettings] = useState<any>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const q = query(
      collection(db, 'bookings'), 
      where('date', '==', dateStr),
      orderBy('time', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    return () => unsubscribe();
  }, [user, selectedDate]);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'schedule');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAllScheduleSettings(data);
          updateLocalSchedule(data, scheduleDate);
        } else {
          const defaultHours = [{ start: '09:00', end: '18:00' }];
          setWorkingHours(defaultHours);
          setAllScheduleSettings({ defaultWorkingHours: defaultHours });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/schedule');
      }
    };
    fetchSettings();
  }, [user]);

  const updateLocalSchedule = (data: any, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateSettings = data.dateSettings?.[dateStr];
    
    if (dateSettings) {
      setWorkingHours(dateSettings.workingHours || []);
      setIsOffDay(!!dateSettings.isOffDay);
    } else {
      // Fallback to legacy or default
      const legacyOffDays = data.offDays || [];
      const isLegacyOff = legacyOffDays.includes(dateStr);
      setIsOffDay(isLegacyOff);
      
      const defaultHours = data.defaultWorkingHours || data.workingHours || [{ start: '09:00', end: '18:00' }];
      setWorkingHours(Array.isArray(defaultHours) ? defaultHours : [defaultHours]);
    }
  };

  useEffect(() => {
    if (allScheduleSettings) {
      updateLocalSchedule(allScheduleSettings, scheduleDate);
    }
  }, [scheduleDate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    
    try {
      const adminPassword = (import.meta as any).env.VITE_ADMIN_PASSWORD || 'admin123';
      if (password === adminPassword) {
        const userCredential = await signInAnonymously(auth);
        // Set admin role in users collection
        await setDoc(doc(db, 'users', userCredential.user.uid), { 
          role: 'admin',
          email: 'anonymous@admin.local',
          updatedAt: new Date().toISOString()
        });
        toast.success('Добро пожаловать, мастер!');
      } else {
        setLoginError('Неверный пароль');
        toast.error('Неверный пароль');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.code === 'auth/operation-not-allowed' 
      ? 'Метод "Anonymous Auth" не включен в консоли Firebase.'
      : `Ошибка: ${error.message}`;
      setLoginError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if this is the authorized email
      if (userCredential.user.email === 'Egoromanov2005@gmail.com') {
        await setDoc(doc(db, 'users', userCredential.user.uid), { 
          role: 'admin',
          email: userCredential.user.email,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        toast.success('Добро пожаловать, мастер!');
      } else {
        // Not the admin email
        await signOut(auth);
        setLoginError('Доступ запрещен: этот email не является администратором');
        toast.error('Доступ запрещен');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      setLoginError(`Ошибка при входе через Google: ${error.message}`);
      toast.error('Ошибка при входе через Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info('Вы вышли из системы');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleBookingStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await setDoc(doc(db, 'bookings', id), { status: newStatus }, { merge: true });
      toast.success(newStatus === 'completed' ? 'Запись отмечена как выполненная' : 'Запись возвращена в работу');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bookings', id));
      toast.success('Запись удалена');
      setConfirmDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bookings/${id}`);
    }
  };

  const saveSchedule = async () => {
    try {
      const dateStr = format(scheduleDate, 'yyyy-MM-dd');
      const newSettings = {
        ...allScheduleSettings,
        dateSettings: {
          ...(allScheduleSettings.dateSettings || {}),
          [dateStr]: {
            workingHours,
            isOffDay
          }
        }
      };
      
      await setDoc(doc(db, 'settings', 'schedule'), newSettings);
      setAllScheduleSettings(newSettings);
      toast.success('Расписание сохранено');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/schedule');
    }
  };

  const saveAsDefault = async () => {
    try {
      const newSettings = {
        ...allScheduleSettings,
        defaultWorkingHours: workingHours
      };
      await setDoc(doc(db, 'settings', 'schedule'), newSettings);
      setAllScheduleSettings(newSettings);
      toast.success('Расписание установлено как стандартное');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/schedule');
    }
  };

  const clearDateSettings = async () => {
    try {
      const dateStr = format(scheduleDate, 'yyyy-MM-dd');
      const newDateSettings = { ...(allScheduleSettings.dateSettings || {}) };
      delete newDateSettings[dateStr];
      
      const newSettings = {
        ...allScheduleSettings,
        dateSettings: newDateSettings
      };
      
      await setDoc(doc(db, 'settings', 'schedule'), newSettings);
      setAllScheduleSettings(newSettings);
      toast.success('Настройки для даты сброшены к стандартным');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/schedule');
    }
  };

  const addInterval = () => {
    setWorkingHours([...workingHours, { start: '09:00', end: '18:00' }]);
  };

  const removeInterval = (index: number) => {
    setWorkingHours(workingHours.filter((_, i) => i !== index));
  };

  const updateInterval = (index: number, field: 'start' | 'end', value: string) => {
    const newIntervals = [...workingHours];
    newIntervals[index] = { ...newIntervals[index], [field]: value };
    setWorkingHours(newIntervals);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-soft-pink flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-deep-pink animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-soft-pink flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] p-10 shadow-2xl shadow-deep-pink/10 border border-accent-pink/20 w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-soft-pink rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Settings className="w-8 h-8 text-deep-pink" />
            </div>
            <h1 className="text-3xl font-serif font-semibold text-gray-900 mb-2">Вход в админку</h1>
            <p className="text-gray-500 text-sm">Введите пароль для управления студией</p>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-6 py-4 rounded-2xl border border-accent-pink/20 focus:border-deep-pink focus:ring-2 focus:ring-deep-pink/10 outline-none transition-all"
                  required
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-4 rounded-2xl border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoggingIn}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-6 h-6" />
                    Войти в систему
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-accent-pink/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Или</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full bg-white border border-accent-pink/20 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Войти через Google
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-pink flex">
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-10 shadow-2xl w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-4">Отменить запись?</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">Это действие нельзя будет отменить. Клиент не получит уведомление автоматически.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                >
                  Назад
                </button>
                <button 
                  onClick={() => deleteBooking(confirmDelete)}
                  className="flex-1 py-4 rounded-2xl bg-red-400 text-white font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-400/20"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-accent-pink/10 p-8 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-deep-pink rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight">Admin Panel</span>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-medium transition-all ${
              activeTab === 'bookings' ? 'bg-soft-pink text-deep-pink' : 'text-gray-500 hover:bg-soft-pink/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Записи
          </button>
          <button 
            onClick={() => setActiveTab('schedule')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-medium transition-all ${
              activeTab === 'schedule' ? 'bg-soft-pink text-deep-pink' : 'text-gray-500 hover:bg-soft-pink/50'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            Расписание
          </button>
        </nav>
        
        <div className="space-y-2 pt-8 border-t border-accent-pink/10">
          <a 
            href="/"
            className="flex items-center gap-4 px-6 py-4 rounded-2xl font-medium text-gray-500 hover:bg-soft-pink/50 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            На сайт
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-medium text-red-400 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-12 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-gray-900">
              {activeTab === 'bookings' ? 'Текущие записи' : 'Настройка расписания'}
            </h2>
            <p className="text-gray-500 mt-2">
              {activeTab === 'bookings' ? 'Управление бронированиями клиентов' : 'Установите рабочее время и выходные'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-2xl px-6 py-3 shadow-sm border border-accent-pink/10 hidden sm:flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-deep-pink" />
              <span className="font-bold text-gray-700">
                {format(new Date(), 'd MMMM yyyy', { locale: ru })}
              </span>
            </div>
            <div className="flex lg:hidden gap-2">
              <a 
                href="/"
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-accent-pink/10 text-gray-500"
              >
                <CheckCircle2 className="w-5 h-5" />
              </a>
              <button 
                onClick={handleLogout}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-accent-pink/10 text-red-400"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {activeTab === 'bookings' ? (
          <div className="space-y-8">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i)).map(date => (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all border ${
                    isSameDay(selectedDate, date)
                      ? 'bg-deep-pink text-white border-deep-pink shadow-lg shadow-deep-pink/20'
                      : 'bg-white text-gray-600 border-accent-pink/20 hover:bg-soft-pink/50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-70 mb-1">
                    {format(date, 'EEEEEE', { locale: ru })}
                  </span>
                  <span className="text-xl font-bold">
                    {format(date, 'd')}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              {bookings.length > 0 ? (
                bookings.map(booking => (
                  <motion.div 
                    layout
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-[2rem] p-6 md:p-8 shadow-xl shadow-deep-pink/5 border border-accent-pink/10 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                      booking.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 transition-colors ${
                        booking.status === 'completed' ? 'bg-green-50 text-green-500' : 'bg-soft-pink text-deep-pink'
                      }`}>
                        <Clock className="w-5 h-5 mb-1" />
                        <span className="text-lg font-bold leading-none">{booking.time}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-bold text-gray-900">{booking.clientName}</h4>
                          {booking.status === 'completed' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-bold uppercase rounded-md">
                              Выполнено
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 font-medium">{booking.clientPhone}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-3 py-1 bg-accent-pink/20 text-deep-pink text-[10px] font-bold uppercase rounded-full">
                            {SERVICES.find(s => s.id === booking.serviceId)?.title}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleBookingStatus(booking.id, booking.status)}
                        className={`p-4 rounded-2xl transition-all active:scale-90 ${
                          booking.status === 'completed' 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                            : 'bg-soft-pink text-deep-pink hover:bg-deep-pink hover:text-white'
                        }`}
                        title={booking.status === 'completed' ? 'Вернуть в работу' : 'Отметить как выполнено'}
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(booking.id)}
                        className="p-4 rounded-2xl bg-red-50 text-red-400 hover:bg-red-400 hover:text-white transition-all active:scale-90"
                        title="Удалить запись"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-white/50 rounded-[2rem] border-2 border-dashed border-accent-pink/20 p-16 md:p-24 text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <AlertCircle className="w-10 h-10 text-accent-pink" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-gray-400">На этот день записей нет</h3>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {Array.from({ length: 30 }, (_, i) => addDays(startOfDay(new Date()), i)).map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const hasCustom = !!allScheduleSettings.dateSettings?.[dateStr];
                const isSelected = isSameDay(scheduleDate, date);
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setScheduleDate(date)}
                    className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all border relative ${
                      isSelected
                        ? 'bg-deep-pink text-white border-deep-pink shadow-lg shadow-deep-pink/20'
                        : 'bg-white text-gray-600 border-accent-pink/20 hover:bg-soft-pink/50'
                    }`}
                  >
                    {hasCustom && !isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-deep-pink rounded-full" />
                    )}
                    <span className="text-[10px] uppercase font-bold opacity-70 mb-1">
                      {format(date, 'EEEEEE', { locale: ru })}
                    </span>
                    <span className="text-xl font-bold">
                      {format(date, 'd')}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-deep-pink/5 border border-accent-pink/10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-serif font-semibold flex items-center gap-3">
                      <Clock className="w-6 h-6 text-deep-pink" />
                      Рабочие часы
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(scheduleDate, 'd MMMM', { locale: ru })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsOffDay(!isOffDay)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isOffDay 
                          ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' 
                          : 'bg-soft-pink text-deep-pink border-accent-pink/10 hover:bg-deep-pink hover:text-white'
                      }`}
                    >
                      {isOffDay ? 'Выходной' : 'Рабочий день'}
                    </button>
                    {!isOffDay && (
                      <button 
                        onClick={addInterval}
                        className="p-2 bg-soft-pink text-deep-pink rounded-xl hover:bg-deep-pink hover:text-white transition-all"
                        title="Добавить интервал"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {!isOffDay ? (
                  <div className="space-y-6">
                    {workingHours.map((interval, index) => (
                      <div key={index} className="relative p-6 bg-soft-pink/20 rounded-3xl border border-accent-pink/10">
                        {workingHours.length > 1 && (
                          <button 
                            onClick={() => removeInterval(index)}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-red-100 text-red-400 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Начало</label>
                            <input 
                              type="time" 
                              value={interval.start}
                              onChange={e => updateInterval(index, 'start', e.target.value)}
                              className="w-full bg-white border border-accent-pink/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-deep-pink/20 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Конец</label>
                            <input 
                              type="time" 
                              value={interval.end}
                              onChange={e => updateInterval(index, 'end', e.target.value)}
                              className="w-full bg-white border border-accent-pink/20 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-deep-pink/20 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex gap-3">
                      <button onClick={saveSchedule} className="btn-primary flex-1 py-4">Сохранить для этой даты</button>
                      <button 
                        onClick={clearDateSettings} 
                        className="btn-secondary px-6 py-4" 
                        title="Сбросить к стандартным"
                        disabled={!allScheduleSettings.dateSettings?.[format(scheduleDate, 'yyyy-MM-dd')]}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button onClick={saveAsDefault} className="btn-secondary px-6 py-4" title="Сделать стандартным">
                        <Sparkles className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Этот день отмечен как выходной</p>
                    <div className="flex gap-3 mt-6">
                      <button onClick={saveSchedule} className="btn-primary flex-1 py-3">Подтвердить выходной</button>
                      <button 
                        onClick={clearDateSettings} 
                        className="btn-secondary px-6 py-3" 
                        title="Сбросить к стандартным"
                        disabled={!allScheduleSettings.dateSettings?.[format(scheduleDate, 'yyyy-MM-dd')]}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-deep-pink/5 border border-accent-pink/10">
                <h3 className="text-2xl font-serif font-semibold mb-6 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-deep-pink" />
                  Информация
                </h3>
                <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
                  <p>
                    <span className="font-bold text-deep-pink block mb-1">Гибкое расписание:</span>
                    Теперь вы можете настраивать рабочие часы для каждой даты индивидуально. Выберите дату в календаре выше и установите нужные интервалы.
                  </p>
                  <p>
                    <span className="font-bold text-deep-pink block mb-1">Стандартное расписание:</span>
                    Нажмите на иконку ✨, чтобы сохранить текущие часы как стандартные. Они будут применяться ко всем дням, для которых не задано индивидуальное расписание.
                  </p>
                  <p>
                    <span className="font-bold text-deep-pink block mb-1">Выходные:</span>
                    Переключатель "Рабочий день / Выходной" позволяет быстро закрыть запись на выбранную дату.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
