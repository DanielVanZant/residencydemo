import Script from 'next/script'

export const metadata = {
  title: 'Weekly Updates Dashboard',
}

export default function DashboardPage() {
  return (
    <>
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
          <div className="nav-account">
            <div className="account-selector">
              <label htmlFor="dashboardUser">Account:</label>
              <select className="account-select" id="dashboardUser">
                <option value="">Select account...</option>
              </select>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="header">
            <h1>weekly updates <em>dashboard</em></h1>
            <p>view your <em>progress</em> and <em>achievements</em> over time</p>
          </div>
          <div className="dashboard-actions">
            <a href="/weekly-update" className="btn btn-primary">New Weekly Update</a>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="dashboard-content">
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
            <a href="/weekly-update" className="btn btn-primary">Create First Update</a>
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
            <button className="tab-button active" data-tab="updates">Weekly Updates</button>
            <button className="tab-button" data-tab="summary">Summary</button>
          </div>

          {/* Updates Tab Content */}
          <div id="updatesTab" className="tab-content active">
            <div id="dashboardUpdates" className="dashboard-updates">
              {/* Updates will be populated here */}
            </div>
          </div>

          {/* Summary Tab Content */}
          <div id="summaryTab" className="tab-content">
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
      <Script src="/js/dashboard/dashboard.js" strategy="afterInteractive" />
      
      {/* Initialize dashboard components that may not have initialized due to DOMContentLoaded */}
      <Script id="init-dashboard" strategy="afterInteractive">
        {`
          setTimeout(() => {
            // Initialize dashboard if not already done
            if (!window.dashboardApp && window.Dashboard) {
              try {
                window.dashboardApp = new window.Dashboard();
                console.log('Dashboard initialized');
              } catch (e) {
                console.error('Failed to initialize Dashboard:', e);
              }
            }
          }, 1000);
        `}
      </Script>
    </>
  )
}