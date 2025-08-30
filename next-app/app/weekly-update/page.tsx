import Script from 'next/script'

export const metadata = {
  title: 'Weekly Update Dashboard',
}

export default function WeeklyUpdatePage() {
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
            <div className="account-selector">
              <label htmlFor="username">Account:</label>
              <select className="account-select" id="username">
                <option value="">Select account...</option>
              </select>
            </div>
            <div className="nav-links">
              <a href="/dashboard" className="nav-link">Dashboard</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="header">
            <h1><em>weekly</em> update</h1>
            <p>share your <em>progress</em>, <em>challenges</em>, and wins</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="content-wrapper">
        <div className="container">
          <div className="update-form">
            <div className="date-header">
              <div className="date-section">
                <h2><span className="italic">Update</span> date:</h2>
                <input type="date" className="date-input" id="weekDate" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <form id="updateForm">
              {/* Question Navigation */}
              <div className="question-navigation">
                <div className="question-progress">
                  <span className="current-question">1</span> of <span className="total-questions">5</span>
                </div>
                <div className="nav-buttons">
                  <button type="button" className="btn btn-secondary" id="prevQuestion" disabled>Previous</button>
                  <button type="button" className="btn btn-secondary" id="nextQuestion">Next</button>
                </div>
              </div>

              {/* Question 1: North Star Section */}
              <div className="question-container active" id="question-1">
                <div className="north-star-section">
                  <h3 className="north-star-title">your <em>north star</em> metric</h3>
                  <div className="north-star-hint" id="northStarHint">track the single most important number that represents your core focus and progress during the residency</div>
                  <div className="north-star-inputs">
                    <div className="north-star-value">
                      <label htmlFor="northStarValue" id="northStarValueLabel">current value</label>
                      <input type="number" step="any" className="north-star-input" id="northStarValue" name="northStarValue" placeholder="0.0" />
                    </div>
                    <div className="north-star-note">
                      <label htmlFor="northStarNote">context & reflection</label>
                      <textarea className="north-star-textarea" id="northStarNote" name="northStarNote" placeholder="Brief note about this week's change, what influenced it, and what it means for your progress..."></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question 2: Accomplishments */}
              <div className="question-container" id="question-2">
                <div className="question-section">
                  <label className="question-label">what did you <span className="emphasis">accomplish</span> this week?</label>
                  <div className="question-hint">list your key achievements, completed tasks, and milestones reached</div>
                  <textarea className="answer-input" name="accomplishments" placeholder="Example: Completed MVP features, onboarded 3 new customers, fixed critical bug in payment system..."></textarea>
                </div>
              </div>

              {/* Question 3: Challenges & Next Steps */}
              <div className="question-container" id="question-3">
                <div className="question-section">
                  <label className="question-label">what's <span className="emphasis">blocking</span> you right now, and what will you <span className="emphasis">focus on</span> next week to move forward?</label>
                  <div className="question-hint">share your current obstacles and how you plan to address them – your priorities should connect to overcoming these challenges</div>
                  <textarea className="answer-input" name="challenges-priorities" placeholder="Current blockers: API integration failing due to auth issues, waiting on design feedback for UI...&#10;&#10;Next week I'll focus on: Implementing OAuth workaround, proceeding with placeholder designs, scheduling design review for Wednesday..."></textarea>
                </div>
              </div>

              {/* Question 4: Dynamic followup for richer details (generated on the fly) */}
              <div className="question-container" id="question-4">
                <div className="dynamic-question-loading">
                  <div className="spinner"></div>
                  <p>Analyzing your responses to generate a personalized followup question...</p>
                </div>
                <div className="question-section dynamic-question" style={{display: 'none'}}>
                  <label className="question-label" id="dynamic-question-4-label"></label>
                  <div className="question-hint" id="dynamic-question-4-hint"></div>
                  <textarea className="answer-input" name="dynamic-followup-detail" id="dynamic-question-4-input" placeholder=""></textarea>
                </div>
              </div>

              {/* Question 5: Dynamic followup from previous summaries (generated on the fly) */}
              <div className="question-container" id="question-5">
                <div className="dynamic-question-loading">
                  <div className="spinner"></div>
                  <p>Analyzing your previous updates to identify important threads to follow up on...</p>
                </div>
                <div className="question-section dynamic-question" style={{display: 'none'}}>
                  <label className="question-label" id="dynamic-question-5-label"></label>
                  <div className="question-hint" id="dynamic-question-5-hint"></div>
                  <textarea className="answer-input" name="dynamic-followup-previous" id="dynamic-question-5-input" placeholder=""></textarea>
                </div>
              </div>

              <div className="button-group">
                <button type="button" className="btn btn-primary" id="extractBullets">Extract Bullet Points</button>
              </div>
            </form>

            <div className="loading-spinner" id="loadingSpinner"></div>
            <div className="error-message" id="errorMessage"></div>

            <div className="bullets-section" id="bulletsSection">
              <div className="bullets-header-controls">
                <h2 className="bullets-header"><span className="italic">extracted</span> bullet points</h2>
                <div className="edit-controls">
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
            <button type="button" className="btn btn-success btn-large" id="saveChanges">Submit Weekly Update</button>
            <p className="submit-help">Review everything above, then submit to save your weekly update to the database.</p>
          </div>
        </div>
      </section>

      {/* Load existing JavaScript modules */}
      <Script src="/js/core/user-session.js" strategy="afterInteractive" />
      <Script src="/js/core/api-client.js" strategy="afterInteractive" />
      <Script src="/js/pages/editor-utils.js" strategy="afterInteractive" />
      <Script src="/js/pages/update-generator.js?v=2.1" strategy="afterInteractive" />
      <Script src="/js/core/ui-utils.js" strategy="afterInteractive" />
      <Script src="/js/forms/weekly-update-system.js?v=2.5" strategy="afterInteractive" />
      
      {/* Initialize components that may not have initialized due to DOMContentLoaded */}
      <Script id="init-components" strategy="afterInteractive">
        {`
          setTimeout(() => {
            // Initialize WeeklyUpdateApp if not already done
            if (!window.weeklyUpdateApp && window.WeeklyUpdateApp) {
              try {
                window.weeklyUpdateApp = new window.WeeklyUpdateApp();
                console.log('WeeklyUpdateApp initialized');
              } catch (e) {
                console.error('Failed to initialize WeeklyUpdateApp:', e);
              }
            }
            
            // Initialize UpdateGenerator if not already done
            if (!window.updateGenerator && window.UpdateGenerator) {
              try {
                window.updateGenerator = new window.UpdateGenerator();
                console.log('UpdateGenerator initialized');
              } catch (e) {
                console.error('Failed to initialize UpdateGenerator:', e);
              }
            }
          }, 1000);
        `}
      </Script>
    </>
  )
}