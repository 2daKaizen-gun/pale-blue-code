import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'

/**
 * Pale Blue Code — 라우터
 *
 * ─── sub-phase 2-7 [L6] 코드 분할 ───────────────────
 *   문제: 모든 페이지를 정적 import 하면 SolarPage → Scene → three.js/r3f/drei/leva
 *   가 *메인 청크에 통째로* 들어가, 랜딩('/')만 보려는 방문자도 three 전부 다운로드.
 *   (베이스라인: 단일 청크 1.40MB / 403KB gzip — Lighthouse 모바일의 주범)
 *
 *   해결: 무거운 Phase 페이지를 React.lazy 로 분리. 각 페이지가 *자기 청크*로 떨어져
 *   해당 라우트 진입 시에만 로드된다. three.js 는 이제 /solar 갈 때만 받음.
 *
 *   HomePage 만 eager: 첫 화면이라 *즉시* 떠야 하고, three 를 쓰지 않아 가벼움.
 *   lazy 로 하면 첫 진입에 불필요한 로딩 깜빡임만 생김.
 *
 *   비유: 우주선이 전 구간 연료를 *한 번에* 싣고 발사하던 걸, *단계 분리(staging)*
 *   로 바꾼 것. 필요한 단을 필요할 때만 점화 — 발사 질량(초기 번들)이 가벼워진다.
 *
 *   Suspense 경계는 AppLayout 의 <Outlet /> 을 감싼다 (단일 fallback).
 */
const SolarPage = lazy(() => import('./pages/SolarPage'))
const GravityPage = lazy(() => import('./pages/GravityPage'))
const BlackholePage = lazy(() => import('./pages/BlackholePage'))
const ExoplanetPage = lazy(() => import('./pages/ExoplanetPage'))
const DataPage = lazy(() => import('./pages/DataPage'))
const SignalPage = lazy(() => import('./pages/SignalPage'))
const HuntPage = lazy(() => import('./pages/HuntPage'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true,       element: <HomePage /> },
      { path: 'solar',     element: <SolarPage /> },
      { path: 'gravity',   element: <GravityPage /> },
      { path: 'blackhole', element: <BlackholePage /> },
      { path: 'exoplanet', element: <ExoplanetPage /> },
      { path: 'data',      element: <DataPage /> },
      { path: 'signal',    element: <SignalPage /> },
      { path: 'hunt',      element: <HuntPage /> },
    ],
  },
])
