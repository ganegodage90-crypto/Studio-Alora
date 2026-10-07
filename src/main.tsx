import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const Book = lazy(() => import('./pages/Book.tsx'));
const Calculator = lazy(() => import('./pages/Calculator.tsx'));
const Studio = lazy(() => import('./pages/Studio.tsx'));
const Collab = lazy(() => import('./pages/Collab.tsx'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-[#080604]" />}>
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
