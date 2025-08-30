import Script from 'next/script'

export const metadata = {
  title: 'User Dashboard Viewer',
}

export default function ViewerPage() {
  return (
    <div className="viewer-mode">
      {/* Load external Editor.js and Chart.js scripts */}
      <Script src="https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@editorjs/list@latest" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@editorjs/header@latest" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />

      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="container">
          <div className="nav-brand">
            <a href="http://localhost:3001" className="brand-title" style={{textDecoration: 'none', color: 'inherit'}}>Weekly Updates</a>
          </div>
          <div className="nav-links">
            <a href="/weekly-update" className="nav-link">New Update</a>
            <a href="/dashboard" className="nav-link">My Dashboard</a>
            <a href="/users" className="nav-link">Team Directory</a>
          </div>
          <div className="nav-account">
            <div className="viewer-info">
              <span id="viewerUsername" className="viewer-label">Viewing: <span id="targetUsername"></span></span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="header">
            <h1>weekly updates <em>dashboard</em></h1>
            <p>viewing <em id="heroTargetUsername"></em>'s progress and achievements</p>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="dashboard-content viewer-mode">
        <div className="container">
          <div id="dashboardLoading" className="simple-loading">
            <div className="spinner"></div>
            <p>Loading updates...</p>
          </div>
          
          <div id="dashboardError" className="error-message">
            <p>Failed to load updates. Please try again.</p>
          </div>

          <div id="dashboardEmpty" className="empty-state">
            <h3>No Updates Found</h3>
            <p>This user hasn't created any weekly updates yet.</p>
          </div>

          {/* North Star Metric Chart - Always visible at top */}
          <div id="northStarChartContainer" className="chart-container" style={{display: 'none'}}>
            <h3 className="chart-title">North Star Progress</h3>
            <div className="chart-wrapper">
              <canvas id="northStarChart"></canvas>
            </div>
          </div>

          {/* Dashboard Tabs */}
          <div id="dashboardTabs" className="dashboard-tabs" style={{display: 'none'}}>
            <button className="tab-button" data-tab="updates">Weekly Updates</button>
            <button className="tab-button active" data-tab="summary">Summary</button>
          </div>

          {/* Updates Tab Content */}
          <div id="updatesTab" className="tab-content">
            <div id="dashboardUpdates" className="dashboard-updates">
              {/* Updates will be populated here */}
            </div>
          </div>

          {/* Summary Tab Content */}
          <div id="summaryTab" className="tab-content active">
            <div id="userSummaryContainer" className="user-summary-container">
              {/* User summaries will be populated here */}
            </div>
          </div>

        </div>
      </section>

      {/* Load existing JavaScript modules */}
      <Script src="/js/core/user-session.js" strategy="afterInteractive" />
      <Script src="/js/core/ui-utils.js" strategy="afterInteractive" />
      <Script src="/js/dashboard/chart-manager.js" strategy="afterInteractive" />
      <Script src="/js/dashboard/content-renderer.js" strategy="afterInteractive" />
      <Script src="/js/dashboard/dashboard-summary-manager.js" strategy="afterInteractive" />
      <Script src="/js/dashboard/recommendations-manager.js" strategy="afterInteractive" />
      <Script src="/js/viewer/viewer.js" strategy="afterInteractive" />
      
      {/* Initialize viewer components */}
      <Script id="init-viewer" strategy="afterInteractive">
        {`
          setTimeout(() => {
            // Initialize viewer if not already done
            if (!window.viewerApp && window.Viewer) {
              try {
                window.viewerApp = new window.Viewer();
                console.log('Viewer initialized');
              } catch (e) {
                console.error('Failed to initialize Viewer:', e);
              }
            }
          }, 1000);
        `}
      </Script>
    </div>
  )
}