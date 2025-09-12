// ===== CONFIGURATION =====
const CONFIG = {
    API_BASE_URL: 'http://localhost:8080/api',
    ENDPOINTS: {
        HEALTH: '/health',
        GENERATE: '/generate-testcases'
    },
    TIMEOUTS: {
        CONNECTION_CHECK: 5000,
        GENERATION: 30000
    },
    ANIMATION_DELAYS: {
        LOADING_STEPS: 2000,
        TOAST_DURATION: 5000
    }
};

// ===== STATE MANAGEMENT =====
const AppState = {
    isGenerating: false,
    isConnected: false,
    lastGenerationTime: null,
    generatedTestCases: null,
    currentLoadingStep: 0
};

// ===== DOM ELEMENTS =====
const Elements = {
    // Connection status
    connectionIndicator: null,
    connectionText: null,
    
    // Input elements
    promptInput: null,
    charCount: null,
    generateBtn: null,
    exampleButtons: null,
    
    // Output elements
    placeholder: null,
    loading: null,
    testCases: null,
    testCasesContent: null,
    
    // Action buttons
    copyBtn: null,
    downloadBtn: null,
    clearBtn: null,
    
    // Status elements
    statusBar: null,
    statusText: null,
    toastContainer: null,
    
    // Stats elements
    generationTime: null,
    testCaseCount: null
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AI Test Case Generator - Initializing...');
    
    try {
        initializeElements();
        setupEventListeners();
        checkBackendConnection();
        initializeUI();
        console.log('✅ Initialization complete');
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        showToast('Application initialization failed. Please refresh the page.', 'error');
    }
});

function initializeElements() {
    console.log('🔧 Initializing DOM elements...');
    
    // Connection elements
    Elements.connectionIndicator = document.getElementById('connectionStatus');
    Elements.connectionText = document.getElementById('connectionText');
    
    // Input elements
    Elements.promptInput = document.getElementById('promptInput');
    Elements.charCount = document.getElementById('charCount');
    Elements.generateBtn = document.getElementById('generateBtn');
    Elements.exampleButtons = document.querySelectorAll('.example-card');
    
    // Output elements
    Elements.placeholder = document.getElementById('placeholderState');
    Elements.loading = document.getElementById('loadingState');
    Elements.testCases = document.getElementById('resultsState');
    Elements.testCasesContent = document.getElementById('testCasesContent');
    
    // Action buttons
    Elements.copyBtn = document.getElementById('copyBtn');
    Elements.downloadBtn = document.getElementById('downloadBtn');
    Elements.clearBtn = document.getElementById('clearBtn');
    
    // Status elements
    Elements.statusBar = document.querySelector('.status-footer');
    Elements.statusText = document.getElementById('statusText');
    Elements.toastContainer = document.getElementById('toastContainer');
    
    // Stats elements
    Elements.generationTime = document.getElementById('generationTime');
    Elements.testCaseCount = document.getElementById('testCaseCount');
    
    // Debug: Log missing elements
    const missingElements = [];
    Object.entries(Elements).forEach(([key, element]) => {
        if (!element || (element.length === 0)) {
            missingElements.push(key);
        }
    });
    
    if (missingElements.length > 0) {
        console.warn('⚠️ Missing DOM elements:', missingElements);
    } else {
        console.log('✅ All DOM elements found');
    }
}

function setupEventListeners() {
    // Generate button
    if (Elements.generateBtn) {
        Elements.generateBtn.addEventListener('click', generateTestCases);
    }
    
    // Example buttons
    if (Elements.exampleButtons) {
        Elements.exampleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const example = this.getAttribute('data-example');
                setExample(example);
            });
        });
    }
    
    // Input character counter and auto-resize
    if (Elements.promptInput) {
        Elements.promptInput.addEventListener('input', updateCharCount);
        Elements.promptInput.addEventListener('input', autoResizeTextarea);
        
        // Keyboard shortcuts
        Elements.promptInput.addEventListener('keydown', function(event) {
            if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                generateTestCases();
            }
        });
    }
    
    // Action buttons
    if (Elements.copyBtn) {
        Elements.copyBtn.addEventListener('click', copyTestCases);
    }
    
    if (Elements.downloadBtn) {
        Elements.downloadBtn.addEventListener('click', downloadTestCases);
    }
    
    if (Elements.clearBtn) {
        Elements.clearBtn.addEventListener('click', clearOutput);
    }
}

function initializeUI() {
    updateCharCount();
    showPlaceholder();
    updateStatus('Ready to generate test cases', 'default');
    
    // Ensure input is enabled on initialization
    if (Elements.promptInput) {
        Elements.promptInput.disabled = false;
        console.log('✅ Input field enabled');
    } else {
        console.warn('⚠️ Input field not found during initialization');
    }
}

// ===== CONNECTION MANAGEMENT =====
async function checkBackendConnection() {
    updateConnectionStatus('checking', 'Checking connection...');
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUTS.CONNECTION_CHECK);
        
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.HEALTH}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            AppState.isConnected = true;
            updateConnectionStatus('connected', 'Backend connected');
            showToast('Backend connection successful - Ready for demo!', 'success');
            updateStatus('Connected to AI backend - Ready to generate test cases', 'success');
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        AppState.isConnected = false;
        updateConnectionStatus('error', 'Connection failed');
        
        if (error.name === 'AbortError') {
            showToast('Connection timeout - Please check if backend is running', 'warning');
            updateStatus('Connection timeout - Please ensure Spring Boot is running on localhost:8080', 'warning');
        } else {
            showToast('Cannot connect to backend - Please start the application', 'error');
            updateStatus('Backend offline - Start with: cd backend && mvn spring-boot:run', 'error');
        }
    }
}

function updateConnectionStatus(status, message) {
    if (Elements.connectionIndicator) {
        Elements.connectionIndicator.className = `connection-card ${status}`;
    }
    if (Elements.connectionText) {
        Elements.connectionText.textContent = message;
    }
}

// ===== TEST CASE GENERATION =====
async function generateTestCases() {
    if (!Elements.promptInput) {
        showToast('Input element not found', 'error');
        return;
    }
    
    const prompt = Elements.promptInput.value.trim();
    
    if (!prompt) {
        showToast('Please enter test requirements first', 'warning');
        Elements.promptInput.focus();
        return;
    }
    
    if (!AppState.isConnected) {
        showToast('Backend not connected. Checking connection...', 'warning');
        await checkBackendConnection();
        if (!AppState.isConnected) {
            return;
        }
    }
    
    setGeneratingState(true);
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GENERATE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
            signal: AbortSignal.timeout(CONFIG.TIMEOUTS.GENERATION)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        
        if (data.success && data.testCases) {
            AppState.generatedTestCases = data.testCases;
            AppState.lastGenerationTime = duration;
            
            displayTestCases(data.testCases, duration);
            showToast(`Test cases generated successfully in ${duration}s!`, 'success');
            updateStatus(`Generated comprehensive test cases in ${duration} seconds`, 'success');
        } else {
            throw new Error(data.message || 'Failed to generate test cases');
        }
        
    } catch (error) {
        console.error('Generation error:', error);
        
        if (error.name === 'TimeoutError') {
            showToast('⏱️ Generation timeout - Try a simpler prompt', 'error');
            updateStatus('⏱️ Request timeout - The AI took too long to respond', 'error');
        } else if (error.message.includes('Failed to fetch')) {
            showToast('🔌 Connection lost - Checking backend status...', 'error');
            updateStatus('🔌 Connection error - Verifying backend status...', 'error');
            await checkBackendConnection();
        } else {
            showToast(`Generation failed: ${error.message}`, 'error');
            updateStatus(`Error: ${error.message}`, 'error');
        }
        
        showPlaceholder();
        
    } finally {
        setGeneratingState(false);
    }
}

function setGeneratingState(isGenerating) {
    AppState.isGenerating = isGenerating;
    
    // Update button state
    Elements.generateBtn.disabled = isGenerating;
    const btnIcon = Elements.generateBtn.querySelector('.button-icon');
    const btnText = Elements.generateBtn.querySelector('.main-text');
    
    if (isGenerating) {
        if (btnIcon) btnIcon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        if (btnText) btnText.textContent = 'Generating...';
        showLoading();
        startLoadingAnimation();
    } else {
        if (btnIcon) btnIcon.innerHTML = '<i class="fas fa-magic"></i>';
        if (btnText) btnText.textContent = 'Generate Test Cases';
        stopLoadingAnimation();
    }
    
    // Disable/enable input elements
    if (Elements.promptInput) Elements.promptInput.disabled = isGenerating;
    if (Elements.exampleButtons) {
        Elements.exampleButtons.forEach(btn => btn.disabled = isGenerating);
    }
}

// ===== LOADING ANIMATION =====
function startLoadingAnimation() {
    const steps = document.querySelectorAll('.progress-steps .step');
    AppState.currentLoadingStep = 0;
    
    function animateStep() {
        if (!AppState.isGenerating) return;
        
        // Remove active class from all steps
        steps.forEach(step => step.classList.remove('active'));
        
        // Add active class to current step
        if (steps[AppState.currentLoadingStep]) {
            steps[AppState.currentLoadingStep].classList.add('active');
        }
        
        AppState.currentLoadingStep = (AppState.currentLoadingStep + 1) % steps.length;
        
        // Continue animation
        setTimeout(animateStep, CONFIG.ANIMATION_DELAYS.LOADING_STEPS);
    }
    
    animateStep();
}

function stopLoadingAnimation() {
    AppState.currentLoadingStep = 0;
}

// ===== UI STATE MANAGEMENT =====
function showPlaceholder() {
    hideAllOutputStates();
    if (Elements.placeholder) Elements.placeholder.classList.add('active');
    if (Elements.copyBtn) Elements.copyBtn.style.display = 'none';
    if (Elements.downloadBtn) Elements.downloadBtn.style.display = 'none';
    if (Elements.clearBtn) Elements.clearBtn.style.display = 'none';
}

function showLoading() {
    hideAllOutputStates();
    if (Elements.loading) Elements.loading.classList.add('active');
}

function hideAllOutputStates() {
    if (Elements.placeholder) Elements.placeholder.classList.remove('active');
    if (Elements.loading) Elements.loading.classList.remove('active');
    if (Elements.testCases) Elements.testCases.classList.remove('active');
}

function displayTestCases(testCasesText, duration) {
    hideAllOutputStates();
    
    // Parse and format test cases professionally
    const formattedHTML = parseTestCasesForDisplay(testCasesText);
    if (Elements.testCasesContent) {
        Elements.testCasesContent.innerHTML = formattedHTML;
    }
    if (Elements.testCases) {
        Elements.testCases.classList.add('active');
    }
    
    // Update stats
    if (Elements.generationTime) {
        Elements.generationTime.textContent = `Generated in ${duration}s`;
    }
    if (Elements.testCaseCount) {
        const lineCount = testCasesText.split('\n').length;
        Elements.testCaseCount.textContent = `${lineCount} lines`;
    }
    
    // Show action buttons
    if (Elements.copyBtn) Elements.copyBtn.style.display = 'flex';
    if (Elements.downloadBtn) Elements.downloadBtn.style.display = 'flex';
    if (Elements.clearBtn) Elements.clearBtn.style.display = 'block';
    
    // Scroll to top of test cases
    if (Elements.testCases) Elements.testCases.scrollTop = 0;
}

// ===== UTILITY FUNCTIONS =====
function setExample(text) {
    if (Elements.promptInput) {
        Elements.promptInput.value = text;
        updateCharCount();
        autoResizeTextarea();
        
        // Add visual feedback
        Elements.promptInput.style.background = '#e8f5e8';
        setTimeout(() => {
            Elements.promptInput.style.background = '';
        }, 500);
    }
    
    showToast('📝 Example loaded - Click Generate to create test cases', 'success');
}

function updateCharCount() {
    if (Elements.promptInput && Elements.charCount) {
        const count = Elements.promptInput.value.length;
        Elements.charCount.textContent = count;
        
        // Color coding for character count
        if (count > 500) {
            Elements.charCount.style.color = '#dc3545';
        } else if (count > 300) {
            Elements.charCount.style.color = '#ffc107';
        } else {
            Elements.charCount.style.color = '';
        }
    }
}

function autoResizeTextarea() {
    if (Elements.promptInput) {
        Elements.promptInput.style.height = 'auto';
        Elements.promptInput.style.height = Elements.promptInput.scrollHeight + 'px';
    }
}

async function copyTestCases() {
    if (!AppState.generatedTestCases) {
        showToast('No test cases to copy', 'warning');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(AppState.generatedTestCases);
        showToast('📋 Test cases copied to clipboard!', 'success');
        
        // Visual feedback on button
        if (Elements.copyBtn) {
            const originalText = Elements.copyBtn.textContent;
            Elements.copyBtn.textContent = 'Copied!';
            Elements.copyBtn.style.background = '#28a745';
            
            setTimeout(() => {
                Elements.copyBtn.textContent = originalText;
                Elements.copyBtn.style.background = '';
            }, 2000);
        }
        
    } catch (err) {
        console.error('Copy failed:', err);
        showToast('Failed to copy to clipboard', 'error');
    }
}

function downloadTestCases() {
    if (!AppState.generatedTestCases) {
        showToast('No test cases to download', 'warning');
        return;
    }
    
    try {
        const blob = new Blob([AppState.generatedTestCases], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `test-cases-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('💾 Test cases downloaded successfully!', 'success');
        
    } catch (err) {
        console.error('Download failed:', err);
        showToast('Failed to download file', 'error');
    }
}

function clearOutput() {
    AppState.generatedTestCases = null;
    AppState.lastGenerationTime = null;
    showPlaceholder();
    updateStatus('Output cleared - Ready to generate new test cases', 'default');
    showToast('🗑️ Output cleared', 'success');
}

function updateStatus(message, type = 'default') {
    if (Elements.statusText) {
        Elements.statusText.textContent = message;
    }
    if (Elements.statusBar) {
        Elements.statusBar.className = `status-footer ${type}`;
    }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
    if (!Elements.toastContainer) {
        console.log(`Toast: ${message}`);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-message">${message}</div>`;
    
    Elements.toastContainer.appendChild(toast);
    
    // Auto remove after delay
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    Elements.toastContainer.removeChild(toast);
                }
            }, 300);
        }
    }, CONFIG.ANIMATION_DELAYS.TOAST_DURATION);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    Elements.toastContainer.removeChild(toast);
                }
            }, 300);
        }
    });
}

// ===== ERROR HANDLING =====
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('An unexpected error occurred', 'error');
    event.preventDefault();
});

// ===== PERFORMANCE MONITORING =====
window.addEventListener('load', function() {
    const loadTime = performance.now();
    console.log(`Frontend loaded in ${loadTime.toFixed(2)}ms`);
    
    // Check for performance issues
    if (loadTime > 3000) {
        showToast('⚠️ Slow loading detected - Consider optimizing', 'warning');
    }
});

// ===== TEST CASE PARSING =====
function parseTestCasesForDisplay(testCasesText) {
    // Split by TEST CASE markers
    const sections = testCasesText.split(/===\s*TEST CASE\s+(\d+)\s*===/i);
    let html = '<div class="professional-test-cases">';
    
    // Handle content before first test case
    if (sections[0] && sections[0].trim()) {
        const introText = sections[0].trim();
        // Check if it contains category headers
        if (introText.includes('**') || introText.includes('*')) {
            html += formatIntroductionSection(introText);
        }
    }
    
    // Process test cases
    for (let i = 1; i < sections.length; i += 2) {
        const testCaseNumber = sections[i];
        const testCaseContent = sections[i + 1];
        
        if (testCaseContent && testCaseContent.trim()) {
            html += formatTestCase(testCaseNumber, testCaseContent.trim());
        }
    }
    
    html += '</div>';
    return html;
}

function formatIntroductionSection(text) {
    let html = '';
    const lines = text.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('**') && line.endsWith('**')) {
            // Section header
            if (currentSection) {
                html += '</div>';
            }
            const sectionTitle = line.replace(/\*\*/g, '').trim();
            html += `<div class="test-category-section">
                        <h3 class="category-title">${sectionTitle}</h3>`;
            currentSection = sectionTitle;
        } else if (line.startsWith('*') && !line.startsWith('**')) {
            // Bullet point
            const bulletText = line.replace(/^\*\s*/, '').trim();
            html += `<p class="category-description">${bulletText}</p>`;
        } else if (line && !line.match(/^===.*===/)) {
            // Regular text
            html += `<p class="intro-text">${line}</p>`;
        }
    });
    
    if (currentSection) {
        html += '</div>';
    }
    
    return html;
}

function formatTestCase(number, content) {
    const testCase = parseTestCaseFields(content);
    
    let html = `
        <div class="test-case-item">
            <div class="test-case-number">TEST CASE ${number}</div>
            <div class="test-case-content">`;
    
    if (testCase.title) {
        html += `<h4 class="test-title">${testCase.title}</h4>`;
    }
    
    if (testCase.description) {
        html += `<div class="test-field">
                    <span class="field-label">Description:</span>
                    <span class="field-value">${testCase.description}</span>
                 </div>`;
    }
    
    if (testCase.preconditions) {
        html += `<div class="test-field">
                    <span class="field-label">Preconditions:</span>
                    <span class="field-value">${testCase.preconditions}</span>
                 </div>`;
    }
    
    if (testCase.testSteps && testCase.testSteps.length > 0) {
        html += `<div class="test-field">
                    <span class="field-label">Test Steps:</span>
                    <ol class="test-steps">`;
        testCase.testSteps.forEach(step => {
            html += `<li>${step}</li>`;
        });
        html += `   </ol>
                 </div>`;
    }
    
    if (testCase.expectedResults) {
        html += `<div class="test-field">
                    <span class="field-label">Expected Results:</span>
                    <span class="field-value">${testCase.expectedResults}</span>
                 </div>`;
    }
    
    const metadata = [];
    if (testCase.priority) metadata.push(`Priority: ${testCase.priority}`);
    if (testCase.category) metadata.push(`Category: ${testCase.category}`);
    
    if (metadata.length > 0) {
        html += `<div class="test-metadata">
                    <span class="metadata-items">${metadata.join(' • ')}</span>
                 </div>`;
    }
    
    html += `   </div>
        </div>`;
    
    return html;
}

function parseTestCaseFields(content) {
    const testCase = {};
    
    // Extract title
    const titleMatch = content.match(/Title:\s*(.+)/i);
    if (titleMatch) testCase.title = titleMatch[1].trim();
    
    // Extract description
    const descMatch = content.match(/Description:\s*(.+?)(?=\nTitle:|$)/is);
    if (descMatch) testCase.description = descMatch[1].trim();
    
    // Extract preconditions
    const precondMatch = content.match(/Preconditions:\s*(.+?)(?=\nTest Steps:|$)/is);
    if (precondMatch) testCase.preconditions = precondMatch[1].trim();
    
    // Extract test steps
    const stepsMatch = content.match(/Test Steps:\s*(.+?)(?=\nExpected Results:|$)/is);
    if (stepsMatch) {
        const stepsText = stepsMatch[1].trim();
        testCase.testSteps = stepsText.split(/\n(?=\d+\.|\d+\)|\d+\s)/)
            .map(step => step.replace(/^\d+[\.\)]\s*/, '').trim())
            .filter(step => step.length > 0);
    }
    
    // Extract expected results
    const resultsMatch = content.match(/Expected Results:\s*(.+?)(?=\nPriority:|$)/is);
    if (resultsMatch) testCase.expectedResults = resultsMatch[1].trim();
    
    // Extract priority
    const priorityMatch = content.match(/Priority:\s*(.+?)(?=\nCategory:|$)/is);
    if (priorityMatch) testCase.priority = priorityMatch[1].trim();
    
    // Extract category
    const categoryMatch = content.match(/Category:\s*(.+?)$/is);
    if (categoryMatch) testCase.category = categoryMatch[1].trim();
    
    return testCase;
}

// ===== DEVELOPMENT HELPERS =====
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.AppState = AppState;
    window.CONFIG = CONFIG;
    console.log('AI Test Case Generator Frontend Loaded');
    console.log('Development mode enabled - AppState and CONFIG available in console');
}