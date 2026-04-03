import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, useGameStore } from './context/store'
import { nakamaService } from './services/nakama.service'
import { buildDisplayUsername } from './lib/client-utils'
import AppErrorBoundary from './components/AppErrorBoundary'
import StatusScreen from './components/StatusScreen'
import { usePreferences } from './hooks/usePreferences'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const LobbyPage = lazy(() => import('./pages/LobbyPage'))
const GamePage = lazy(() => import('./pages/GamePage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const ReplayPage = lazy(() => import('./pages/ReplayPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))

function App() {
  usePreferences()
  const { user, login, logout } = useAuthStore()
  const { reset } = useGameStore()
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    let isMounted = true

    const restoreAuthSession = async () => {
      const restoredSession = nakamaService.restoreSession()
      if (!restoredSession) {
        if (isMounted) {
          setIsBootstrapping(false)
        }
        return
      }

      try {
        nakamaService.setSession(restoredSession)
        const activeSession = await nakamaService.refreshSession()
        if (!activeSession) {
          throw new Error('Unable to restore session')
        }

        if (isMounted) {
          login({
            userId: activeSession.user_id || '',
            username: buildDisplayUsername(activeSession.user_id, activeSession.username),
            token: activeSession.token,
          })
        }
      } catch (error) {
        console.error('Failed to restore session:', error)
        await nakamaService.signOut()
        if (isMounted) {
          logout()
          reset()
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      }
    }

    restoreAuthSession()

    return () => {
      isMounted = false
    }
  }, [login, logout, reset])

  if (isBootstrapping) {
    return <StatusScreen title="Restoring Session" message="Checking for an existing login and reconnecting you to the server." isLoading />
  }

  return (
    <div className="app-stage">
      <AppErrorBoundary>
        <Suspense fallback={<StatusScreen title="Loading" message="Preparing the experience..." isLoading />}>
          <Routes>
            <Route
              path="/"
              element={user ? <Navigate to="/lobby" replace /> : <LoginPage />}
            />
            <Route
              path="/login"
              element={user ? <Navigate to="/lobby" replace /> : <LoginPage />}
            />
            <Route
              path="/lobby"
              element={user ? <LobbyPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/game/:matchId"
              element={user ? <GamePage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/leaderboard"
              element={user ? <LeaderboardPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/analytics"
              element={user ? <AnalyticsPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/replay/:matchId"
              element={user ? <ReplayPage /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </div>
  )
}

export default App
