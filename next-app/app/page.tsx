'use client'

import { useEffect, useState } from 'react'
// Import new TypeScript core modules to ensure they work
import { getUserSession } from '../lib/core/user-session'
import { getUIUtils } from '../lib/core/ui-utils'
import { getApiClient } from '../lib/core/api-client'

interface User {
  username: string
  north_star_metric: string | null
  north_star_description: string | null
}

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Test that core modules are working
    const userSession = getUserSession()
    const uiUtils = getUIUtils()
    const apiClient = getApiClient()
    
    console.log('Core modules loaded:', {
      userSession: !!userSession,
      uiUtils: !!uiUtils,
      apiClient: !!apiClient
    })
    
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Loading all users...')
      const response = await fetch('http://localhost:3000/api/users')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const filteredUsers = data.users.filter((user: User) => user.north_star_metric) || []
      
      console.log(`Loaded ${filteredUsers.length} users`)
      setUsers(filteredUsers)
      
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Failed to load summaries. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <>
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="container">
          <div className="nav-brand">
            <span className="brand-title">Residency Updates</span>
          </div>
          <div className="nav-account">
            <div className="nav-links">
              <a href="/weekly-update" className="nav-link">New Update</a>
              <a href="/dashboard.html" className="nav-link">Dashboard</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="header">
            <h1><em>residency</em> progress</h1>
            <p>comprehensive summaries of our <em>builders</em> and their journey</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="content-wrapper">
        <div className="container">
          {loading && (
            <div className="simple-loading">
              <div className="spinner"></div>
              <p>Loading user summaries...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="empty-state">
              <h3>No Summaries Available</h3>
              <p>No user summaries have been generated yet.</p>
              <a href="/weekly-update" className="btn btn-primary">Create First Update</a>
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="summaries-container">
              {users.map((user, index) => (
                <div key={index} className="user-card">
                  <div className="user-header">
                    <div className="user-info">
                      <h2 className="username">{user.username}</h2>
                      <div className="user-metric">
                        <span className="metric-label">{user.north_star_metric?.toLowerCase() || ''}</span>
                        <span className="metric-description">{user.north_star_description || ''}</span>
                      </div>
                    </div>
                    <div className="user-actions">
                      <a href={`http://localhost:3000/dashboard.html?user=${encodeURIComponent(user.username)}`} className="btn btn-primary">View Dashboard</a>
                      <a href="/weekly-update" className="btn btn-secondary">New Update</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}