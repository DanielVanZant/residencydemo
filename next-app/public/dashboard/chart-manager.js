// North Star chart management utility
class ChartManager {
    constructor() {
        this.chart = null;
        this.chartContainer = document.getElementById('northStarChartContainer');
        this.canvas = document.getElementById('northStarChart');
        this.chartTitle = this.chartContainer?.querySelector('.chart-title');
    }

    // Display chart for user updates with North Star data
    displayChart(updates) {
        // Filter updates with north star values and sort by date
        const updatesWithNorthStar = updates
            .filter(update => update.northStarValue !== null && update.northStarValue !== undefined)
            .sort((a, b) => new Date(a.weekDate) - new Date(b.weekDate));

        if (updatesWithNorthStar.length === 0) {
            this.hideChart();
            return;
        }

        // Get the metric name from the first update
        const metricName = updatesWithNorthStar[0].northStarMetric || 'North Star Metric';

        // Prepare data for the chart
        const labels = updatesWithNorthStar.map(update => {
            const date = new Date(update.weekDate);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const data = updatesWithNorthStar.map(update => parseFloat(update.northStarValue));

        // Show chart container
        if (this.chartContainer) {
            this.chartContainer.style.display = 'block';
        }

        // Update chart title with metric name
        if (this.chartTitle) {
            this.chartTitle.innerHTML = `<em>${metricName.toLowerCase()}</em> progress`;
        }

        // Get canvas context
        if (!this.canvas) {
            console.error('Chart canvas not found');
            return;
        }

        const ctx = this.canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Create new chart
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: metricName,
                    data: data,
                    borderColor: '#4A5568',
                    backgroundColor: 'rgba(74, 85, 104, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#4A5568',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 16
                        },
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                const date = new Date(updatesWithNorthStar[index].weekDate);
                                return date.toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                });
                            },
                            label: function(context) {
                                return `${metricName}: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            color: '#718096'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            borderDash: [3, 3],
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            color: '#718096',
                            callback: function(value) {
                                // Format based on metric type
                                if (metricName.toLowerCase().includes('yield') && value < 1) {
                                    return value.toFixed(3); // Show 3 decimals for small values
                                }
                                return value;
                            }
                        }
                    }
                }
            }
        });
    }

    // Hide the chart and destroy chart instance
    hideChart() {
        if (this.chartContainer) {
            this.chartContainer.style.display = 'none';
        }
        
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    // Clean up chart resources
    destroy() {
        this.hideChart();
    }
}

// Export for global use
window.ChartManager = ChartManager;