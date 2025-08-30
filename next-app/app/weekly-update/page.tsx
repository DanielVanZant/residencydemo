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
                <h2><span className="italic">Week</span> of:</h2>
                <input type="date" className="date-input" id="weekDate" />
              </div>
            </div>

            <form id="updateForm">
              {/* North Star Section */}
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

              <div className="question-section">
                <label className="question-label">what did you <span className="emphasis">accomplish</span> this week?</label>
                <div className="question-hint">list your key achievements, completed tasks, and milestones reached</div>
                <textarea className="answer-input" name="accomplishments" placeholder="Example: Completed MVP features, onboarded 3 new customers, fixed critical bug in payment system..."></textarea>
              </div>

              <div className="question-section">
                <label className="question-label">what are your <span className="emphasis">priorities</span> for next week?</label>
                <div className="question-hint">outline your top 3-5 goals and tasks for the upcoming week</div>
                <textarea className="answer-input" name="priorities" placeholder="Example: Launch beta version, conduct user interviews, optimize database queries..."></textarea>
              </div>

              <div className="question-section">
                <label className="question-label">what <span className="emphasis">challenges</span> are you facing?</label>
                <div className="question-hint">describe any blockers, difficulties, or areas where you need help</div>
                <textarea className="answer-input" name="challenges" placeholder="Example: Integration issues with third-party API, need design feedback, struggling with time management..."></textarea>
              </div>

              <div className="question-section">
                <label className="question-label">key <span className="emphasis">metrics</span> and data points</label>
                <div className="question-hint">share important numbers: users, revenue, engagement, experiments, etc.</div>
                <textarea className="answer-input" name="metrics" placeholder="Example: 150 active users (+25%), $5K MRR, 68% retention rate, A/B test showed 15% improvement..."></textarea>
              </div>

              <div className="question-section">
                <label className="question-label"><span className="emphasis">learnings</span> and insights</label>
                <div className="question-hint">what did you learn? any surprising discoveries or pivotal realizations?</div>
                <textarea className="answer-input" name="learnings" placeholder="Example: Users prefer mobile experience, pricing model needs adjustment, automation saved 10 hours/week..."></textarea>
              </div>

              <div className="question-section">
                <label className="question-label"><span className="emphasis">wins</span> and celebrations</label>
                <div className="question-hint">highlight positive moments, team achievements, or personal victories</div>
                <textarea className="answer-input" name="wins" placeholder="Example: First paying customer, team member's great contribution, positive user feedback..."></textarea>
              </div>

              <div className="question-section">
                <label className="question-label"><span className="emphasis">support</span> needed</label>
                <div className="question-hint">what resources, introductions, or assistance would help you move faster?</div>
                <textarea className="answer-input" name="support" placeholder="Example: Introduction to potential advisor, feedback on pitch deck, technical expertise in ML..."></textarea>
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
      <Script src="/js/forms/weekly-update-system.js?v=2.1" strategy="afterInteractive" />
      
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