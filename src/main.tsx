import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import App from './App.tsx';
import { Orbs, TopBar } from './components/Shell';
import './index.css';

const pages = {
  book: () => import('./pages/Book.tsx'),
  calculator: () => import('./pages/Calculator.tsx'),
  studio: () => import('./pages/Studio.tsx'),
  collab: () => import('./pages/Collab.tsx'),
};
const Book = lazy(pages.book);
const Calculator = lazy(pages.calculator);
const Studio = lazy(pages.studio);
const Collab = lazy(pages.collab);

// Download the other pages in the background so menu taps open instantly.
const preload = () => Object.values(pages).forEach(load => load().catch(() => {}));
if ('requestIdleCallback' in window) requestIdleCallback(preload, { timeout: 3000 }); else setTimeout(preload, 1500);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Orbs />
      <TopBar />
      <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/book" element={<Book />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/collab" element={<Collab />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
