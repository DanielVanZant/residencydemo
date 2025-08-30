import Script from 'next/script'

export const metadata = {
  title: 'Edit Weekly Update Draft',
}

interface PageProps {
  params: Promise<{ draftId: string }>
}

export default async function DraftEditPage({ params }: PageProps) {
  const { draftId } = await params;
  
  return (
    <>
      {/* Load external Editor.js scripts */}
      <Script src="https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@editorjs/list@latest" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@editorjs/checklist@latest" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@editorjs/header@latest" strategy="beforeInteractive" />

      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="container">
          <div className="nav-brand">
            <a href="http://localhost:3001" className="brand-title" style={{textDecoration: 'none', color: 'inherit'}}>Weekly Updates</a>
          </div>
          <div className="nav-account">
            <div className="nav-links">
              <a href="/weekly-update" className="nav-link">New Update</a>
              <a href="/dashboard" className="nav-link">Dashboard</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="header">
            <h1><em>editing</em> draft</h1>
            <p>review and refine your <em>weekly update</em></p>
          </div>
        </div>
      </section>

      {/* Draft ID for JavaScript */}
      <div id="draftId" data-draft-id={draftId} style={{display: 'none'}}></div>

      {/* Loading State */}
      <section id="loadingSection" className="content-wrapper">
        <div className="container">
          <div className="simple-loading active">
            <div className="spinner"></div>
            <p>Loading your draft...</p>
          </div>
        </div>
      </section>

      {/* Error State */}
      <section id="errorSection" className="content-wrapper" style={{display: 'none'}}>
        <div className="container">
          <div className="error-message active">
            <h3>Error Loading Draft</h3>
            <p id="errorMessage">Failed to load draft. Please try again.</p>
            <div className="button-group">
              <button type="button" className="btn btn-secondary" id="tryAgainBtn">Try Again</button>
              <a href="/weekly-update" className="btn btn-primary">Start New Update</a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="mainContent" className="content-wrapper" style={{display: 'none'}}>
        <div className="container">
          <div className="update-form">
            {/* Draft Info Header */}
            <div className="draft-info">
              <h2>Draft Information</h2>
              <div className="draft-details">
                <span><strong>User:</strong> <span id="draftUsername">-</span></span>
                <span><strong>Date:</strong> <span id="draftDate">-</span></span>
                <span><strong>Created:</strong> <span id="draftCreated">-</span></span>
              </div>
            </div>

            {/* Question Responses Summary */}
            <div className="questions-summary">
              <h3>Your Responses</h3>
              <div id="questionsSummary">
                {/* Will be populated by JavaScript */}
              </div>
            </div>

            {/* Bullets Section */}
            <div className="bullets-section" id="bulletsSection">
              <div className="bullets-header-controls">
                <h2 className="bullets-header"><span className="italic">extracted</span> bullet points</h2>
                <div className="edit-controls">
                  <button type="button" className="btn btn-secondary btn-small" id="regenerateBullets">Regenerate Bullets</button>
                </div>
              </div>
              
              <div id="bulletsContainer" className="bullets-container">
                {/* Extracted bullets will be displayed here */}
              </div>
              
              <div id="editorjs" className="roam-editor"></div>
              
              <div className="editor-help">
                <strong>Tips:</strong> Click anywhere to edit • Enter for new bullet • Tab to indent • Shift+Tab to outdent • Drag to reorder
                <br />
                <small>Check/uncheck items to control what gets included in your published update</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formatted Updates Section */}
      <section id="formattedUpdatesSection" className="formatted-updates-section">
        <div className="container">
          <div className="updates-header">
            <div className="updates-header-controls">
              <div className="updates-header-text">
                <h2 className="updates-title"><span className="italic">formatted</span> updates</h2>
                <p className="updates-subtitle">Published update and internal notes based on your selections</p>
              </div>
              <div className="updates-controls">
                <button type="button" className="btn btn-primary btn-small" id="regenerateUpdates">Regenerate Updates</button>
              </div>
            </div>
          </div>
          
          <div id="formattedUpdates" className="formatted-updates-container">
            {/* Updates will be dynamically inserted here */}
          </div>
          
          <div id="updatesLoading" className="simple-loading">
            <div className="spinner"></div>
            <p>Generating formatted updates...</p>
          </div>
          
          <div id="updatesError" className="error-message">
            <p>Failed to generate formatted updates. Please try again.</p>
          </div>
        </div>
      </section>

      {/* Final Submit Section */}
      <section className="submit-section" id="submitSection">
        <div className="container">
          <div className="submit-container">
            <div className="submit-actions">
              <button type="button" className="btn btn-secondary" id="saveDraft">Save Draft</button>
              <button type="button" className="btn btn-success btn-large" id="submitUpdate">Submit Weekly Update</button>
              <button type="button" className="btn btn-danger btn-small" id="deleteDraft">Delete Draft</button>
            </div>
            <p className="submit-help">Save your draft to continue later, or submit to finalize your weekly update.</p>
          </div>
        </div>
      </section>

      {/* Load the main weekly update system and draft editor */}
      <link rel="stylesheet" href="/styles/css/main.css" />
      <link rel="stylesheet" href="/styles/css/forms/weekly-update-form.css" />
      <link rel="stylesheet" href="/styles/css/pages/updates.css" />
      
      <Script src="/js/core/user-session.js" strategy="afterInteractive" />
      <Script src="/js/core/api-client.js" strategy="afterInteractive" />
      <Script src="/js/pages/editor-utils.js" strategy="afterInteractive" />
      <Script src="/js/pages/update-generator.js?v=2.1" strategy="afterInteractive" />
      <Script src="/js/core/ui-utils.js" strategy="afterInteractive" />
      <Script src="/js/forms/weekly-update-system.js?v=2.5" strategy="afterInteractive" />
      <Script src="/js/pages/draft-editor.js" strategy="afterInteractive" />
    </>
  )
}