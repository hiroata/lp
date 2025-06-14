// Debug script for streaming display v2

// Force initialize streaming display
function forceInitStreaming() {
    console.log('🔧 Force initializing streaming display...');
    
    // Show generating section first
    const generatingSection = document.getElementById('generatingSection');
    if (generatingSection) {
        generatingSection.style.display = 'block';
    }
    
    // Initialize streaming
    if (window.lpApp?.uiController) {
        window.lpApp.uiController.initStreamingDisplay();
        
        // Test with mock data
        setTimeout(() => {
            const testChunks = [
                "# テストストリーミング\n\n",
                "これはストリーミング表示の",
                "テストメッセージです。\n\n",
                "リアルタイムで表示されているか",
                "確認してください。"
            ];
            
            let fullContent = "";
            testChunks.forEach((chunk, index) => {
                setTimeout(() => {
                    fullContent += chunk;
                    window.lpApp.uiController.updateStreamingDisplay(chunk, fullContent);
                }, index * 1000);
            });
        }, 500);
    }
}

// Check streaming display status
function checkStreamingStatus() {
    const display = document.getElementById('streamingDisplay');
    const section = document.getElementById('generatingSection');
    
    console.group('🔍 Streaming Display Status');
    console.log('Display element exists:', !!display);
    if (display) {
        console.log('Display styles:', {
            display: display.style.display,
            opacity: display.style.opacity,
            visibility: display.style.visibility,
            position: display.style.position,
            zIndex: display.style.zIndex
        });
        console.log('Parent element:', display.parentElement?.id);
        console.log('Computed styles:', {
            display: getComputedStyle(display).display,
            opacity: getComputedStyle(display).opacity,
            visibility: getComputedStyle(display).visibility
        });
    }
    console.log('Generating section visible:', section?.style.display);
    console.groupEnd();
}

// Monitor streaming display
function monitorStreaming() {
    console.log('👁️ Starting streaming display monitor...');
    let lastState = null;
    
    setInterval(() => {
        const display = document.getElementById('streamingDisplay');
        const currentState = display ? {
            exists: true,
            display: display.style.display,
            opacity: display.style.opacity,
            visibility: display.style.visibility,
            parent: display.parentElement?.id
        } : { exists: false };
        
        if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
            console.log('📊 Streaming display state changed:', currentState);
            lastState = currentState;
        }
    }, 1000);
}

// Fix streaming display CSS
function fixStreamingCSS() {
    const style = document.createElement('style');
    style.id = 'streaming-fix-css';
    style.textContent = `
        #streamingDisplay {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            position: relative !important;
            z-index: 9999 !important;
            margin: 2rem auto !important;
            max-width: 1200px !important;
            width: 95% !important;
            background: white !important;
            border: 2px solid #4CAF50 !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
        }
        
        #generatingSection {
            min-height: 800px !important;
            padding-bottom: 100px !important;
        }
        
        .generation-container {
            margin-bottom: 50px !important;
        }
    `;
    
    // Remove old style if exists
    const oldStyle = document.getElementById('streaming-fix-css');
    if (oldStyle) oldStyle.remove();
    
    document.head.appendChild(style);
    console.log('✅ Streaming CSS fixes applied');
}

// Test real API call with streaming
async function testRealStreaming() {
    console.log('🚀 Testing real streaming with API...');
    
    // Set test LP
    if (!window.lpApp?.core?.generatedLP) {
        window.lpApp.core.generatedLP = {
            code: {
                html: '<h1>Test LP</h1>',
                css: 'body { font-family: sans-serif; }',
                js: ''
            }
        };
    }
    
    // Set test prompts
    window.selectedPrompts = ['テストプロンプト：より魅力的なコピーに変更してください'];
    
    // Apply CSS fixes first
    fixStreamingCSS();
    
    // Call improvement request
    if (typeof sendImprovementRequest === 'function') {
        await sendImprovementRequest();
    }
}

// Debug utilities
window.streamDebug = {
    forceInit: forceInitStreaming,
    checkStatus: checkStreamingStatus,
    monitor: monitorStreaming,
    fixCSS: fixStreamingCSS,
    testReal: testRealStreaming,
    
    // Run all diagnostics
    diagnose: function() {
        console.log('🏥 Running streaming diagnostics...');
        this.checkStatus();
        this.fixCSS();
        this.forceInit();
        console.log('✅ Diagnostics complete. Use streamDebug.testReal() to test with real API');
    }
};

console.log('✅ Streaming debug v2 loaded');
console.log('Commands:');
console.log('- streamDebug.diagnose() : Run all diagnostics');
console.log('- streamDebug.testReal() : Test with real API call');
console.log('- streamDebug.monitor() : Start monitoring display changes');