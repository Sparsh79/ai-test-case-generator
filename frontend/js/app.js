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
    initializeElements();
    setupEventListeners();
    checkBackendConnection();
    initializeUI();
});

function initializeElements() {
    // Connection elements
    Elements.connectionIndicator = document.getElementById('connectionIndicator');
    Elements.connectionText = document.getElementById('connectionText');
    
    // Input elements
    Elements.promptInput = document.getElementById('promptInput');
    Elements.charCount = document.getElementById('charCount');
    Elements.generateBtn = document.getElementById('generateBtn');
    Elements.exampleButtons = document.querySelectorAll('.example-btn');
    
    // Output elements
    Elements.placeholder = document.getElementById('placeholder');
    Elements.loading = document.getElementById('loading');
    Elements.testCases = document.getElementById('testCases');
    Elements.testCasesContent = document.getElementById('testCasesContent');
    
    // Action buttons
    Elements.copyBtn = document.getElementById('copyBtn');
    Elements.downloadBtn = document.getElementById('downloadBtn');
    Elements.clearBtn = document.getElementById('clearBtn');
    
    // Status elements
    Elements.statusBar = document.getElementById('statusBar');
    Elements.statusText = document.getElementById('statusText');
    Elements.toastContainer = document.getElementById('toastContainer');
    
    // Stats elements
    Elements.generationTime = document.getElementById('generationTime');
    Elements.testCaseCount = document.getElementById('testCaseCount');
}

function setupEventListeners() {
    // Generate button
    Elements.generateBtn.addEventListener('click', generateTestCases);
    
    // Example buttons
    Elements.exampleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const example = this.getAttribute('data-example');
            setExample(example);
        });
    });
    
    // Input character counter
    Elements.promptInput.addEventListener('input', updateCharCount);
    
    // Keyboard shortcuts
    Elements.promptInput.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            generateTestCases();
        }
    });
    
    // Copy button
    Elements.copyBtn.addEventListener('click', copyTestCases);
    
    // Download button
    Elements.downloadBtn.addEventListener('click', downloadTestCases);
    
    // Clear button
    Elements.clearBtn.addEventListener('click', clearOutput);
    
    // Auto-resize textarea
    Elements.promptInput.addEventListener('input', autoResizeTextarea);
}

function initializeUI() {
    updateCharCount();
    showPlaceholder();
    updateStatus('Ready to generate test cases', 'default');
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
    Elements.connectionIndicator.className = `connection-indicator ${status}`;
    Elements.connectionText.textContent = message;
}

// ===== TEST CASE GENERATION =====
async function generateTestCases() {
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
    const btnIcon = Elements.generateBtn.querySelector('.btn-icon');
    const btnText = Elements.generateBtn.querySelector('.btn-text');
    
    if (isGenerating) {
        btnIcon.textContent = '⏳';
        btnText.textContent = 'Generating...';
        showLoading();
        startLoadingAnimation();
    } else {
        btnIcon.textContent = '⚡';
        btnText.textContent = 'Generate Test Cases';
        stopLoadingAnimation();
    }
    
    // Disable/enable input elements
    Elements.promptInput.disabled = isGenerating;
    Elements.exampleButtons.forEach(btn => btn.disabled = isGenerating);
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
    Elements.placeholder.style.display = 'flex';
    Elements.copyBtn.style.display = 'none';
    Elements.downloadBtn.style.display = 'none';
    Elements.clearBtn.style.display = 'none';
}

function showLoading() {
    hideAllOutputStates();
    Elements.loading.classList.add('show');
}

function hideAllOutputStates() {
    Elements.placeholder.style.display = 'none';
    Elements.loading.classList.remove('show');
    Elements.testCases.classList.remove('show');
}

function displayTestCases(testCasesText, duration) {
    hideAllOutputStates();
    
    // Update content
    Elements.testCasesContent.textContent = testCasesText;
    Elements.testCases.classList.add('show');
    
    // Update stats
    if (Elements.generationTime) {
        Elements.generationTime.textContent = `Generated in ${duration}s`;
    }
    if (Elements.testCaseCount) {
        const lineCount = testCasesText.split('\n').length;
        Elements.testCaseCount.textContent = `${lineCount} lines`;
    }
    
    // Show action buttons
    Elements.copyBtn.style.display = 'flex';
    Elements.downloadBtn.style.display = 'flex';
    Elements.clearBtn.style.display = 'block';
    
    // Scroll to top of test cases
    Elements.testCases.scrollTop = 0;
}

// ===== UTILITY FUNCTIONS =====
function setExample(text) {
    Elements.promptInput.value = text;
    updateCharCount();
    autoResizeTextarea();
    
    // Add visual feedback
    Elements.promptInput.style.background = '#e8f5e8';
    setTimeout(() => {
        Elements.promptInput.style.background = '';
    }, 500);
    
    showToast('📝 Example loaded - Click Generate to create test cases', 'success');
}

function updateCharCount() {
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

function autoResizeTextarea() {
    Elements.promptInput.style.height = 'auto';
    Elements.promptInput.style.height = Elements.promptInput.scrollHeight + 'px';
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
        const originalText = Elements.copyBtn.textContent;
        Elements.copyBtn.textContent = 'Copied!';
        Elements.copyBtn.style.background = '#28a745';
        
        setTimeout(() => {
            Elements.copyBtn.textContent = originalText;
            Elements.copyBtn.style.background = '';
        }, 2000);
        
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
    Elements.statusText.textContent = message;
    Elements.statusBar.className = `status-bar ${type}`;
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
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

// ===== DEVELOPMENT HELPERS =====
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.AppState = AppState;
    window.CONFIG = CONFIG;
    console.log('AI Test Case Generator Frontend Loaded');
    console.log('Development mode enabled - AppState and CONFIG available in console');
}