'use client'

import { useEffect } from 'react'

export default function HomePage() {
  useEffect(() => {
    // Initialize homepage functionality (will be added later)
    console.log('Homepage loaded')
  }, [])

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
              <a href="/weekly-update.html" className="nav-link">New Update</a>
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
          <div id="homeLoading" className="simple-loading">
            <div className="spinner"></div>
            <p>Loading user summaries...</p>
          </div>

          <div id="homeError" className="error-message">
            <p>Failed to load summaries. Please try again.</p>
          </div>

          <div id="homeEmpty" className="empty-state">
            <h3>No Summaries Available</h3>
            <p>No user summaries have been generated yet.</p>
            <a href="/weekly-update.html" className="btn btn-primary">Create First Update</a>
          </div>

          <div id="summariesContainer" className="summaries-container" style={{display: 'none'}}>
            {/* User summaries will be populated here */}
          </div>
        </div>
      </section>
    </>
  )
}