import Script from 'next/script'

export const metadata = {
  title: 'Users Directory',
}

export default function UsersPage() {
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
          <div className="nav-links">
            <a href="/weekly-update" className="nav-link">New Update</a>
            <a href="/dashboard" className="nav-link">Dashboard</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="header">
            <h1>team <em>directory</em></h1>
            <p>view <em>updates</em> and <em>progress</em> from fellow users</p>
          </div>
        </div>
      </section>

      {/* Users Content */}
      <section className="dashboard-content">
        <div className="container">
          <div id="usersLoading" className="simple-loading">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
          
          <div id="usersError" className="error-message">
            <p>Failed to load users. Please try again.</p>
          </div>

          <div id="usersEmpty" className="empty-state">
            <h3>No Users Found</h3>
            <p>No users have created weekly updates yet.</p>
          </div>

          {/* Users Grid */}
          <div id="usersGrid" className="dashboard-updates" style={{display: 'none'}}>
            {/* User cards will be populated here */}
          </div>
        </div>
      </section>

      {/* Load existing JavaScript modules */}
      <Script src="/js/core/user-session.js" strategy="afterInteractive" />
      <Script src="/js/core/ui-utils.js" strategy="afterInteractive" />
      <Script src="/js/dashboard/chart-manager.js" strategy="afterInteractive" />
      <Script src="/js/dashboard/content-renderer.js" strategy="afterInteractive" />
      <Script src="/js/dashboard/dashboard-summary-manager.js" strategy="afterInteractive" />
      <Script src="/js/users/users.js" strategy="afterInteractive" />
      
      {/* Initialize users components */}
      <Script id="init-users" strategy="afterInteractive">
        {`
          setTimeout(() => {
            // Initialize users view if not already done
            if (!window.usersApp && window.Users) {
              try {
                window.usersApp = new window.Users();
                console.log('Users initialized');
              } catch (e) {
                console.error('Failed to initialize Users:', e);
              }
            }
          }, 1000);
        `}
      </Script>
    </>
  )
}