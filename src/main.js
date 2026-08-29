import * as THREE from 'three';
import Stats from 'stats.js';
import { SceneManager } from './scene/SceneManager.js';
import { Flock } from './boids/Flock.js';
import { FlockRenderer } from './boids/FlockRenderer.js';
import { FluidSimulator } from './fluid/FluidSimulator.js';
import { ModeManager } from './modes/ModeManager.js';
import { GUIControls } from './controls/GUIControls.js';
import { HandFaceTracker } from './tracking/HandFaceTracker.js';
import { defaults } from './config/defaults.js';

class Simulator {
  constructor() {
    // Copy defaults to mutable params object
    this.params = { ...defaults };
    
    // State
    this.isPaused = false;
    this.time = 0;
    this.lastTime = 0;
    this.deltaTime = 0;
    
    // Tracking (shared between modes)
    this.tracker = null;
    this.attractionPoints = [];
    this.trackingInitializing = false;
    
    // Mode manager
    this.modeManager = new ModeManager();
    
    // Components (initialized per mode)
    this.sceneManager = null;
    this.flock = null;
    this.flockRenderer = null;
    this.fluidSimulator = null;
    
    // Initialize
    this.initRenderer();
    this.initModes();
    this.initGUI();
    this.initStats();
    this.initKeyboard();
    this.initResize();
    
    // Start with the default mode
    this.modeManager.switchMode(this.params.mode);
    
    // Start animation loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }
  
  /**
   * Initialize the WebGL renderer
   */
  initRenderer() {
    const container = document.getElementById('canvas-container');
    
    // Create renderer directly for fluid mode
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true // For screenshots
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    
    // Create scene manager for murmuration mode
    this.sceneManager = new SceneManager(container, this.renderer);
  }
  
  /**
   * Register simulation modes
   */
  initModes() {
    // Murmuration mode
    this.modeManager.registerMode('murmuration', {
      setup: () => this.setupMurmurationMode(),
      cleanup: () => this.cleanupMurmurationMode(),
      update: (dt) => this.updateMurmurationMode(dt),
      render: () => this.renderMurmurationMode()
    });
    
    // Fluid mode
    this.modeManager.registerMode('fluid', {
      setup: () => this.setupFluidMode(),
      cleanup: () => this.cleanupFluidMode(),
      update: (dt) => this.updateFluidMode(dt),
      render: () => this.renderFluidMode()
    });
  }
  
  // ========== MURMURATION MODE ==========
  
  setupMurmurationMode() {
    console.log('Setting up murmuration mode...');
    
    // Update background color
    this.updateBackgroundColor();
    
    // Create flock if not exists
    if (!this.flock) {
      this.flock = new Flock(
        this.params.birdCount,
        this.params.bounds,
        this.params
      );
      
      this.flockRenderer = new FlockRenderer(
        this.sceneManager.scene,
        this.flock,
        this.params
      );
    }
    
    // Show flock
    if (this.flockRenderer && this.flockRenderer.points) {
      this.flockRenderer.points.visible = true;
    }
  }
  
  cleanupMurmurationMode() {
    console.log('Cleaning up murmuration mode...');
    
    // Hide flock (don't dispose - we may switch back)
    if (this.flockRenderer && this.flockRenderer.points) {
      this.flockRenderer.points.visible = false;
    }
  }
  
  updateMurmurationMode(dt) {
    const points = this.params.trackingEnabled ? this.attractionPoints : null;
    this.flock.update(this.params, points);
    this.flockRenderer.update(this.time);
    this.sceneManager.update();
  }
  
  renderMurmurationMode() {
    this.sceneManager.render();
  }
  
  // ========== FLUID MODE ==========
  
  setupFluidMode() {
    console.log('Setting up fluid mode...');
    
    // Create fluid simulator if not exists
    if (!this.fluidSimulator) {
      this.fluidSimulator = new FluidSimulator(this.renderer, this.params);
    }
  }
  
  cleanupFluidMode() {
    console.log('Cleaning up fluid mode...');
    // Clear fluid but don't dispose
    if (this.fluidSimulator) {
      this.fluidSimulator.clear();
    }
  }
  
  updateFluidMode(dt) {
    const points = this.params.trackingEnabled ? this.attractionPoints : null;
    this.fluidSimulator.update(dt, points);
  }
  
  renderFluidMode() {
    this.fluidSimulator.render();
  }
  
  // ========== GUI ==========
  
  initGUI() {
    this.gui = new GUIControls(this.params, {
      onModeChange: (mode) => this.switchMode(mode),
      onBackgroundChange: () => this.updateBackgroundColor(),
      onBirdCountChange: (count) => this.setBirdCount(count),
      onReset: () => this.reset(),
      onFluidReset: () => this.resetFluid(),
      onTogglePause: () => this.togglePause(),
      onScreenshot: () => this.takeScreenshot(),
      onFullscreen: () => this.toggleFullscreen(),
      onTrackingToggle: (enabled) => this.toggleTracking(enabled),
      onPreviewToggle: (visible) => this.toggleTrackingPreview(visible)
    });
  }
  
  /**
   * Switch simulation mode
   */
  switchMode(mode) {
    this.modeManager.switchMode(mode);
    this.showStatus(`Switched to ${mode} mode`, false, 2000);
  }
  
  /**
   * Update background color based on params
   */
  updateBackgroundColor() {
    const color = new THREE.Color(this.params.backgroundColor);
    
    // Update scene background
    if (this.sceneManager && this.sceneManager.scene) {
      this.sceneManager.scene.background = color;
      this.sceneManager.scene.fog.color = color;
    }
  }
  
  // ========== TRACKING ==========
  
  async initTracker() {
    if (this.tracker || this.trackingInitializing) return;
    
    this.trackingInitializing = true;
    this.showStatus('Loading AI models...');
    
    try {
      this.tracker = new HandFaceTracker(this.params);
      
      this.tracker.onTrackingUpdate = (points) => {
        this.attractionPoints = points;
      };
      
      this.tracker.onError = (message) => {
        this.showStatus(message, true);
        this.params.trackingEnabled = false;
        this.gui.gui.controllersRecursive().forEach(c => c.updateDisplay());
        this.trackingInitializing = false;
      };
      
      const success = await this.tracker.start();
      
      if (success) {
        this.showStatus('🖐️ Tracking active! Move your hands.', false, 3000);
      } else {
        this.showStatus('Failed to start tracking', true);
        this.params.trackingEnabled = false;
        this.gui.gui.controllersRecursive().forEach(c => c.updateDisplay());
      }
    } catch (error) {
      console.error('Failed to initialize tracker:', error);
      this.showStatus('Tracking initialization failed', true);
      this.params.trackingEnabled = false;
      this.gui.gui.controllersRecursive().forEach(c => c.updateDisplay());
    }
    
    this.trackingInitializing = false;
  }
  
  async toggleTracking(enabled) {
    if (enabled) {
      await this.initTracker();
    } else {
      if (this.tracker) {
        this.tracker.stop();
        this.attractionPoints = [];
      }
      this.hideStatus();
    }
  }
  
  toggleTrackingPreview(visible) {
    if (this.tracker) {
      this.tracker.setPreviewVisible(visible);
    }
  }
  
  // ========== ACTIONS ==========
  
  setBirdCount(count) {
    if (this.flockRenderer) {
      this.flockRenderer.resize(count);
    }
  }
  
  reset() {
    if (this.modeManager.isMode('murmuration')) {
      this.flock.reset();
      this.sceneManager.resetCamera();
    } else if (this.modeManager.isMode('fluid')) {
      this.resetFluid();
    }
  }
  
  resetFluid() {
    if (this.fluidSimulator) {
      this.fluidSimulator.clear();
      this.showStatus('Droplets reset', false, 1500);
    }
  }
  
  togglePause() {
    this.isPaused = !this.isPaused;
    this.gui.setPauseState(this.isPaused);
    
    const indicator = document.getElementById('pause-indicator');
    if (indicator) {
      indicator.classList.toggle('visible', this.isPaused);
    }
  }
  
  takeScreenshot() {
    // Render current frame
    if (this.modeManager.isMode('murmuration')) {
      this.sceneManager.render();
    } else {
      this.fluidSimulator.render();
    }
    
    const canvas = this.renderer.domElement;
    const dataURL = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = `${this.params.mode}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }
  
  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }
  
  // ========== STATUS DISPLAY ==========
  
  showStatus(message, isError = false, autoHide = 0) {
    let statusEl = document.getElementById('tracking-status');
    
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'tracking-status';
      statusEl.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 14px;
        z-index: 1001;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(statusEl);
    }
    
    statusEl.textContent = message;
    statusEl.style.background = isError ? 'rgba(255, 80, 80, 0.9)' : 'rgba(0, 200, 150, 0.9)';
    statusEl.style.color = 'white';
    statusEl.style.opacity = '1';
    
    if (autoHide > 0) {
      setTimeout(() => {
        statusEl.style.opacity = '0';
      }, autoHide);
    }
  }
  
  hideStatus() {
    const statusEl = document.getElementById('tracking-status');
    if (statusEl) {
      statusEl.style.opacity = '0';
    }
  }
  
  // ========== SETUP ==========
  
  initStats() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.style.left = 'auto';
    this.stats.dom.style.right = '0';
    document.body.appendChild(this.stats.dom);
  }
  
  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.togglePause();
          break;
        case 'KeyR':
          this.reset();
          break;
        case 'KeyF':
          this.toggleFullscreen();
          break;
        case 'KeyS':
          this.takeScreenshot();
          break;
        case 'KeyH':
          this.gui.toggle();
          break;
        case 'KeyT':
          this.params.trackingEnabled = !this.params.trackingEnabled;
          this.toggleTracking(this.params.trackingEnabled);
          this.gui.gui.controllersRecursive().forEach(c => c.updateDisplay());
          break;
        case 'KeyP':
          if (this.tracker) {
            this.params.showPreview = !this.params.showPreview;
            this.toggleTrackingPreview(this.params.showPreview);
            this.gui.gui.controllersRecursive().forEach(c => c.updateDisplay());
          }
          break;
        case 'KeyM':
          // Toggle mode with M key
          const newMode = this.params.mode === 'murmuration' ? 'fluid' : 'murmuration';
          this.params.mode = newMode;
          this.switchMode(newMode);
          this.gui.gui.controllersRecursive().forEach(c => c.updateDisplay());
          this.gui.updateModeVisibility();
          break;
      }
    });
  }
  
  initResize() {
    window.addEventListener('resize', () => {
      if (this.fluidSimulator) {
        this.fluidSimulator.resize();
      }
    });
  }
  
  // ========== ANIMATION LOOP ==========
  
  animate(timestamp) {
    requestAnimationFrame(this.animate);
    
    this.stats.begin();
    
    // Calculate delta time
    this.time = timestamp * 0.001;
    this.deltaTime = this.time - this.lastTime;
    this.lastTime = this.time;
    
    // Cap delta time
    if (this.deltaTime > 0.1) this.deltaTime = 0.016;
    
    // Update and render if not paused
    if (!this.isPaused) {
      this.modeManager.update(this.deltaTime);
    }
    
    this.modeManager.render();
    
    this.stats.end();
  }
  
  // ========== CLEANUP ==========
  
  dispose() {
    if (this.tracker) {
      this.tracker.dispose();
    }
    if (this.fluidSimulator) {
      this.fluidSimulator.dispose();
    }
    if (this.flockRenderer) {
      this.flockRenderer.dispose();
    }
    this.modeManager.dispose();
  }
}

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.simulator) {
    window.simulator.dispose();
  }
});

// Start the simulator when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.simulator = new Simulator();
  });
} else {
  window.simulator = new Simulator();
}
