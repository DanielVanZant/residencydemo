// Recommendations management for dashboard
class RecommendationsManager {
    constructor() {
        this.recommendations = [];
        this.container = document.getElementById('recommendationsContainer');
        this.loading = false;
    }

    // Load user recommendations from API
    async loadUserRecommendations(username, includePrivate = false) {
        if (this.loading) return;
        
        this.loading = true;
        this.showLoading();
        
        try {
            console.log(`Loading recommendations for user: ${username} (private: ${includePrivate})`);
            const response = await fetch(`/api/user-recommendations/${username}?includePrivate=${includePrivate}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.recommendations = data.recommendations || [];
            
            console.log('User recommendations loaded:', data);
            this.displayRecommendations();
            
        } catch (error) {
            console.error('Error loading user recommendations:', error);
            this.displayRecommendationError();
        } finally {
            this.loading = false;
        }
    }

    // Display loaded recommendations
    displayRecommendations() {
        if (!this.container) {
            console.error('Recommendations container not found');
            return;
        }

        this.container.innerHTML = '';

        if (!this.recommendations || this.recommendations.length === 0) {
            this.displayEmptyRecommendations();
            return;
        }

        // Create recommendations grid
        const recommendationsGrid = document.createElement('div');
        recommendationsGrid.className = 'recommendations-grid';

        this.recommendations.forEach((rec, index) => {
            const recCard = this.createRecommendationCard(rec, index);
            recommendationsGrid.appendChild(recCard);
        });

        this.container.appendChild(recommendationsGrid);
    }

    // Create individual recommendation card
    createRecommendationCard(recommendation, index) {
        const card = document.createElement('div');
        card.className = 'recommendation-card featured-recommendation';
        
        const recommendationId = `recommendation-content-${index}`;
        
        card.innerHTML = `
            <div class="recommendation-header">
                <h3 class="recommended-user">Recommended Connection</h3>
            </div>
            <div class="recommendation-content">
                <div class="recommendation-markdown" id="${recommendationId}">
                    <!-- Markdown content will be rendered here -->
                </div>
                <div class="recommendation-footer">
                    <a href="/viewer/${encodeURIComponent(recommendation.username)}?user=me" 
                       class="btn btn-primary btn-large">View ${recommendation.username}'s Profile →</a>
                </div>
            </div>
        `;
        
        // Render markdown content after adding to DOM
        setTimeout(() => {
            this.renderRecommendationMarkdown(recommendation, recommendationId);
        }, 0);
        
        return card;
    }

    // Render recommendation as markdown
    renderRecommendationMarkdown(recommendation, elementId) {
        const container = document.getElementById(elementId);
        if (!container) return;

        // Create markdown content with username as header and detailed recommendation
        const markdownContent = `## ${recommendation.username}\n\n${recommendation.detailedRecommendation}`;
        
        // Always use ContentRenderer for consistency
        if (!window.ContentRenderer) {
            console.error('ContentRenderer not available');
            container.innerHTML = `<h2>${recommendation.username}</h2><p>${recommendation.detailedRecommendation}</p>`;
            return;
        }
        
        // Use the same markdown rendering as summaries
        const renderer = new ContentRenderer();
        
        // Process markdown - matching the exact order from content-renderer.js
        let html = markdownContent
            // Headers (process these first)
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Bold (must come before italic to avoid conflicts)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic (after bold)
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Line breaks and paragraphs
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        // Wrap in paragraphs
        html = '<p>' + html + '</p>';
        
        // Clean up empty paragraphs and fix header placement
        html = html
            .replace(/<p><\/p>/g, '')
            .replace(/<p><br>/g, '<p>')
            .replace(/<p>(<h[1-3]>)/g, '$1')  // Remove <p> before headers
            .replace(/(<\/h[1-3]>)<\/p>/g, '$1'); // Remove </p> after headers
        
        container.innerHTML = html;
    }

    // Show loading state
    showLoading() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="recommendations-loading">
                <div class="spinner"></div>
                <p>Analyzing user profiles and finding your ideal connection...</p>
                <p class="loading-subtext">Our AI is reviewing all users to find the perfect match for collaboration.</p>
            </div>
        `;
    }

    // Display error when recommendations can't be loaded
    displayRecommendationError() {
        if (!this.container) {
            console.error('Recommendations container not found');
            return;
        }

        this.container.innerHTML = `
            <div class="recommendation-card error-card">
                <div class="recommendation-header">
                    <h3 class="recommendation-type-title">Unable to Generate Recommendations</h3>
                </div>
                <div class="recommendation-content">
                    <p>We couldn't generate personalized recommendations at this time. This could be due to:</p>
                    <ul>
                        <li>Insufficient user data for analysis</li>
                        <li>Temporary service unavailability</li>
                        <li>Network connectivity issues</li>
                    </ul>
                    <p>Please try again later or ensure you have completed your profile summaries.</p>
                </div>
            </div>
        `;
    }

    // Display empty state
    displayEmptyRecommendations() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="recommendation-card empty-card">
                <div class="recommendation-header">
                    <h3 class="recommendation-type-title">No Connection Recommendations Available</h3>
                </div>
                <div class="recommendation-content">
                    <p>We don't have enough information to generate a personalized connection recommendation for you yet.</p>
                    <p>Recommendations are based on analyzing your profile alongside other users' summaries and interests. Make sure you and other users have completed their profile summaries to get matched with ideal connections.</p>
                </div>
            </div>
        `;
    }

    // Clear recommendations container
    clearRecommendations() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.recommendations = [];
    }

    // Get current recommendations data
    getCurrentRecommendations() {
        return this.recommendations;
    }
}

// Export for global use
window.RecommendationsManager = RecommendationsManager;