import { createBrowserRouter } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SolarPage from './pages/SolarPage'
import GravityPage from './pages/GravityPage'
import BlackholePage from './pages/BlackholePage'
import ExoplanetPage from './pages/ExoplanetPage'
import DataPage from './pages/DataPage'
import SignalPage from './pages/SignalPage'
import HuntPage from './pages/HuntPage'

export const router = createBrowserRouter([
  { path: '/',            element: <HomePage /> },
  { path: '/solar',       element: <SolarPage /> },
  { path: '/gravity',     element: <GravityPage /> },
  { path: '/blackhole',   element: <BlackholePage /> },
  { path: '/exoplanet',   element: <ExoplanetPage /> },
  { path: '/data',        element: <DataPage /> },
  { path: '/signal',      element: <SignalPage /> },
  { path: '/hunt',        element: <HuntPage /> },
])
