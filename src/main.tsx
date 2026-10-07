import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import App from './App.tsx';
import { Orbs, TopBar } from './components/Shell';
import './index.css';

const pages = {
  book: () => import('./pages/Book.tsx'),
  calculator: () => import('./pages/Calculator.tsx'),
  gallery: () => import('./pages/Gallery.tsx'),
  equipment: () => import('./pages/Equipment.tsx'),
  rules: () => import('./pages/Rules.tsx'),
  packages: () => import('./pages/Packages.tsx'),
  collab: () => import('./pages/Collab.tsx'),
};
const Book = lazy(pages.book);
const Calculator = lazy(pages.calculator);
const Gallery = lazy(pages.gallery);
const Equipment = lazy(pages.equipment);
const Rules = lazy(pages.rules);
const Packages = lazy(pages.packages);
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
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/studio" element={<Navigate to="/gallery" replace />} />
          <Route path="/collab" element={<Collab />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
