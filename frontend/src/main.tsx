import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import { CargarPlan } from './pages/CargarPlan.js';
import { RevisionPlan } from './pages/RevisionPlan.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CargarPlan />} />
        <Route path="/revision" element={<RevisionPlan />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
