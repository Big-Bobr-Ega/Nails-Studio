import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import BookingForm from './components/BookingForm';
import Map from './components/Map';
import Admin from './pages/Admin';

function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Services />
      <BookingForm />
      <Map />
      <footer className="py-12 text-center text-gray-400 text-sm font-medium flex flex-col items-center gap-4">
        <p>© {new Date().getFullYear()} Nail Studio. Все права защищены.</p>
        <a href="/admin" className="text-gray-300 hover:text-deep-pink transition-colors">Вход для мастера</a>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
