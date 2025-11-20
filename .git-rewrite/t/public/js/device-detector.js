// File: device-detector.js
// Version: 5.3 (Enhanced Final)
// Description: A professional-grade, two-phase device detector.
// It provides both an event-driven API (`deviceDetectionFinalized`) and an
// explicit `await detector.init()` method for maximum flexibility.
// This allows for fast initial rendering and high-accuracy final optimizations.
// For testing: Mock navigator.userAgentData and window.screen in a test environment.

class DeviceDetector {
    /**
     * @param {object} [options={}] - Configuration options.
     * @param {boolean} [options.debug=false] - Enable detailed console logging.
     */
    constructor(options = { debug: false }) {
        this.deviceInfo = {
            type: 'unknown',
            formFactor: 'unknown',
            confidence: 0,
            isFinal: false,
            capabilities: {
                touch: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || matchMedia('(pointer:coarse)').matches,
                mouse: matchMedia('(pointer:fine)').matches,
                keyboard: !!navigator.keyboard || matchMedia('(hover:hover)').matches,
                stylus: false,
                casting: !!navigator.presentation,
            },
            metrics: {},
            rawData: {},
            reasoning: [],
            timestamp: Date.now(),
        };

        this.debug = options.debug;
        this.finalizationTimeout = null;
        this.isDestroyed = false;
        // A promise that resolves when the initial detection cycle is complete.
        this.initializationPromise = null;

        // Bind 'this' for event listeners that will be added/removed.
        this._debouncedResize = this._debounce(this.monitorDisplayChanges.bind(this), 300);

        // The constructor kicks off the initialization process.
        this._initializeDetectionFlow();
    }

    /**
     * **IMPROVEMENT:** Public async method to explicitly wait for initialization.
     * This provides a predictable, synchronous-like way to get the initial device info.
     * @returns {Promise<object>} A promise that resolves with the initial, low-confidence deviceInfo.
     */
    async init() {
        return this.initializationPromise;
    }

    /**
     * Internal method to manage the two-phase detection flow.
     */
    _initializeDetectionFlow() {
        this.initializationPromise = new Promise(async (resolve) => {
            // PHASE 1: IMMEDIATE DETECTION
            await this.runDetectionCycle('initial');
            document.dispatchEvent(new CustomEvent('deviceDetectionInitial', { detail: this.getDeviceInfo() }));
            resolve(this.getDeviceInfo()); // Resolve the init() promise

            // PHASE 2: SETUP FINALIZATION TRIGGERS
            if (!this.deviceInfo.isFinal) {
                this._setupFinalizationTriggers();
            }
        });
    }
    
    _setupFinalizationTriggers() {
        const finalize = (reason) => {
            if (this.isDestroyed) return;
            this.runDetectionCycle('final', reason);
        };

        const onFirstMouse = () => finalize('mouse-input');
        const onFirstTouch = () => finalize('touch-input');
        const onFirstKey = (e) => { if (e.key !== 'Tab') finalize('keyboard-input'); };
        const onFirstPen = (e) => {
            if (e.pointerType === 'pen') {
                this.deviceInfo.capabilities.stylus = true;
                finalize('stylus-input');
            }
        };

        document.addEventListener('mousemove', onFirstMouse, { once: true });
        document.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });
        document.addEventListener('keydown', onFirstKey, { once: true });
        document.addEventListener('pointerdown', onFirstPen, { once: true, passive: true });

        this.finalizationTimeout = setTimeout(() => finalize('fallback-timeout'), 1000);
    }
    
    async runDetectionCycle(mode, reason = '') {
        if (this.deviceInfo.isFinal && mode === 'final') return;

        // For initial detection, use stronger signals
        if (mode === 'initial') {
            // Quick, high-confidence detection for obvious cases
            const quickDetection = this.performQuickDetection();
            if (quickDetection.confidence > 0.8) {
                this.deviceInfo = { ...this.deviceInfo, ...quickDetection };
                return this.deviceInfo;
            }
        }
        
        if (mode === 'final') {
            this.deviceInfo.isFinal = true;
            this._cleanupFinalizationTriggers();
        }

        const clientHintsData = await this.getClientHints();
        const uaData = this.analyzeUserAgent();
        const physicalData = this.analyzePhysicalCharacteristics();
        const inputData = { capabilities: this.deviceInfo.capabilities, confidence: 0.5 };

        this.synthesizeDeviceType(clientHintsData, uaData, physicalData, inputData, reason);

        if (mode === 'final') {
            document.dispatchEvent(new CustomEvent('deviceDetectionFinalized', { detail: this.getDeviceInfo() }));
            this._setupMonitoring();
        }

        return this.deviceInfo;
    }

    async getClientHints() {
        if (!navigator.userAgentData) return { confidence: 0 };
        try {
            const highEntropyData = await navigator.userAgentData.getHighEntropyValues(['platform', 'platformVersion', 'model', 'mobile', 'formFactor', 'architecture']);
            if (highEntropyData.formFactor) this.deviceInfo.isFinal = true;
            return {
                mobile: navigator.userAgentData.mobile,
                platform: highEntropyData.platform,
                model: highEntropyData.model,
                formFactor: highEntropyData.formFactor,
                confidence: 0.95,
            };
        } catch (error) {
            return { mobile: navigator.userAgentData?.mobile ?? false, confidence: 0.7 };
        }
    }

    analyzeUserAgent() {
        const ua = navigator.userAgent;
        const patterns = {
            windows: /Windows NT/i, mac: /Mac OS X/i, linux: /Linux/i, chromeos: /CrOS/i,
            ios: /iPhone|iPad|iPod/i, android: /Android/i, ipad: /iPad/i, surface: /Windows NT.*Touch/i,
            lenovoYoga: /Yoga|ThinkPad.*Touch/i,
        };
        let type = 'unknown', confidence = 0.6;

        if (patterns.ipad.test(ua)) { type = 'tablet'; confidence = 0.85; }
        else if (patterns.surface.test(ua) || patterns.lenovoYoga.test(ua)) { type = 'tablet-hybrid'; confidence = 0.8; }
        else if (patterns.android.test(ua)) { type = /Mobile/i.test(ua) ? 'mobile' : 'tablet'; confidence = 0.7; }
        else if (patterns.ios.test(ua)) { type = 'mobile'; confidence = 0.8; }
        else if (patterns.windows.test(ua) || patterns.mac.test(ua) || patterns.linux.test(ua)) { type = 'desktop'; confidence = 0.75; }

        return { type, confidence, userAgent: ua, platform: navigator.platform, patterns: Object.keys(patterns).filter(key => patterns[key].test(ua)) };
    }

    analyzePhysicalCharacteristics() {
        const screen = window.screen;
        const width = Math.max(screen.width, screen.height);
        let sizeCategory = 'unknown';
        if (width >= 1920) sizeCategory = 'large';
        else if (width >= 1024) sizeCategory = 'medium';
        else sizeCategory = 'small';
        return {
            screen: { width: screen.width, height: screen.height },
            viewport: { width: window.innerWidth, height: window.innerHeight },
            pixelDensity: window.devicePixelRatio || 1,
            sizeCategory,
            confidence: 0.3,
        };
    }

    synthesizeDeviceType(clientHints, uaData, physicalData, inputData, reason) {
        let finalType = 'unknown', confidence = 0;
        this.deviceInfo.reasoning = reason ? [`Finalized by: ${reason}`] : [];

        const evidence = [];
        if (clientHints?.formFactor) evidence.push({ type: clientHints.formFactor, confidence: clientHints.confidence * 0.5, source: 'client-hints-formfactor' });
        else if (clientHints?.mobile !== undefined) evidence.push({ type: clientHints.mobile ? 'mobile' : 'desktop', confidence: clientHints.confidence * 0.4, source: 'client-hints-mobile' });
        if (uaData.type !== 'unknown') evidence.push({ type: uaData.type, confidence: uaData.confidence * 0.3, source: 'user-agent' });
        if (physicalData.sizeCategory !== 'unknown') {
            let physicalType = physicalData.sizeCategory === 'large' ? 'desktop' : physicalData.sizeCategory === 'medium' ? 'tablet' : 'mobile';
            evidence.push({ type: physicalType, confidence: physicalData.confidence * 0.15, source: 'physical-size' });
        }

        const typeScores = {};
        evidence.forEach(item => {
            typeScores[item.type] = (typeScores[item.type] || 0) + item.confidence;
            this.deviceInfo.reasoning.push(`${item.source}: ${item.type} (${(item.confidence * 100).toFixed(1)}%)`);
        });

        if (Object.keys(typeScores).length > 0) {
            finalType = Object.keys(typeScores).reduce((a, b) => typeScores[a] > typeScores[b] ? a : b);
            confidence = typeScores[finalType];
        } else {
            finalType = 'unknown'; confidence = 0;
        }

        finalType = this.applyLogicCorrections(finalType, uaData, physicalData, inputData);

        this.deviceInfo.type = finalType;
        this.deviceInfo.formFactor = this.mapToFormFactor(finalType);
        this.deviceInfo.confidence = Math.min(confidence, 1);
        this.deviceInfo.metrics = physicalData;
        this.deviceInfo.rawData = { clientHints, uaData, physicalData, inputData };
        this.deviceInfo.timestamp = Date.now();
    }

    applyLogicCorrections(type, uaData, physicalData, inputData) {
        if (uaData.patterns.includes('ipad')) return 'tablet';
        if (uaData.patterns.includes('surface') || uaData.patterns.includes('lenovoYoga')) return 'tablet-hybrid';
        if (inputData.capabilities.touch && (inputData.capabilities.mouse || inputData.capabilities.keyboard) && physicalData.sizeCategory === 'large') {
            this.deviceInfo.reasoning.push('Logic: Corrected to desktop (touch laptop)');
            return 'desktop';
        }
        return type;
    }

    mapToFormFactor(type) {
        const mapping = { 'mobile': 'mobile', 'tablet': 'tablet', 'tablet-hybrid': 'tablet', 'desktop': 'desktop' };
        return mapping[type] || 'unknown';
    }

    performQuickDetection() {
        const ua = navigator.userAgent;
        const hasTouch = this.deviceInfo.capabilities.touch;
        const hasMouse = this.deviceInfo.capabilities.mouse;
        const screenWidth = Math.max(screen.width, screen.height);
        
        // Desktop indicators
        if (hasMouse && screenWidth >= 1280 && !hasTouch) {
            return {
                type: 'desktop',
                formFactor: 'desktop',
                confidence: 0.95,
                reasoning: ['Has mouse, large screen, no touch']
            };
        }
        
        // Clear mobile indicators
        if (/iPhone|iPod|Android.*Mobile/i.test(ua) && hasTouch && screenWidth < 768) {
            return {
                type: 'mobile',
                formFactor: 'mobile',
                confidence: 0.9,
                reasoning: ['Mobile UA, has touch, small screen']
            };
        }
        
        // Default low confidence
        return {
            type: 'unknown',
            formFactor: 'unknown',
            confidence: 0.3
        };
    }

    _setupMonitoring() {
        window.addEventListener('resize', this._debouncedResize);
        if (navigator.presentation) {
            navigator.presentation.onconnectionavailable = () => {
                this.deviceInfo.capabilities.casting = true;
                // Enhanced casting detection: assume TV-like display for large screens
                if (window.screen.width >= 1920) {
                    this.deviceInfo.type = 'desktop';
                    this.deviceInfo.reasoning.push('Logic: Corrected to desktop (casting to large display)');
                }
                this.runDetectionCycle('final', 'casting-change');
            };
        }
    }
    
    monitorDisplayChanges() {
        this.runDetectionCycle('final', 'display-change');
    }

    _cleanupFinalizationTriggers() {
        clearTimeout(this.finalizationTimeout);
        this.finalizationTimeout = null;
    }
    
    _debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    destroy() {
        this.isDestroyed = true;
        this._cleanupFinalizationTriggers();
        window.removeEventListener('resize', this._debouncedResize);
        if (navigator.presentation) navigator.presentation.onconnectionavailable = null;
    }

    // --- Public API ---
    isDesktop() { return this.deviceInfo.formFactor === 'desktop'; }
    isMobile() { return this.deviceInfo.formFactor === 'mobile'; }
    isTablet() { return this.deviceInfo.formFactor === 'tablet'; }
    hasTouch() { return this.deviceInfo.capabilities.touch; }
    getDeviceInfo() { return { ...this.deviceInfo }; }
}

// Export for use in modules and global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeviceDetector;
} else if (typeof window !== 'undefined') {
    window.DeviceDetector = DeviceDetector;
    // DO NOT auto-instantiate - let the HTML control this
}