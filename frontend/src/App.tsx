import { Route, Routes } from 'react-router'
import { CareerUploadPage } from './pages/CareerUploadPage'
import { HomePage } from './pages/HomePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cargar-carrera" element={<CareerUploadPage />} />
    </Routes>
  )
}
