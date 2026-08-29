import GUI from 'lil-gui';
import { presets } from '../config/defaults.js';

export class GUIControls {
  constructor(params, callbacks) {
    this.params = params;
    this.callbacks = callbacks;
    this.gui = new GUI({ title: 'Simulation Controls' });
    
    // Store folder references for mode switching
    this.folders = {};
    
    this.initControls();
    this.updateModeVisibility();
  }
  
  initControls() {
    // === MODE SELECTION (at top) ===
    const modeFolder = this.gui.addFolder('🎨 Mode');
    modeFolder.add(this.params, 'mode', ['murmuration', 'fluid'])
      .name('Simulation Mode')
      .onChange(mode => {
        this.callbacks.onModeChange?.(mode);
        this.updateModeVisibility();
      });
    modeFolder.open();
    
    // === GLOBAL SETTINGS ===
    const globalFolder = this.gui.addFolder('🌐 Global');
    globalFolder.addColor(this.params, 'backgroundColor')
      .name('Background Color')
      .onChange(() => this.callbacks.onBackgroundChange?.());
    globalFolder.open();
    this.folders.global = globalFolder;
    
    // === MURMURATION CONTROLS ===
    this.initMurmurationControls();
    
    // === FLUID CONTROLS ===
    this.initFluidControls();
    
    // === HAND/FACE TRACKING (shared) ===
    this.initTrackingControls();
    
    // === PRESETS ===
    const presetsFolder = this.gui.addFolder('📚 Presets');
    const presetOptions = { preset: 'default' };
    presetsFolder.add(presetOptions, 'preset', Object.keys(presets))
      .name('Load Preset')
      .onChange(name => this.loadPreset(name));
    this.folders.presets = presetsFolder;
    
    // === ACTIONS ===
    const actionsFolder = this.gui.addFolder('⚡ Actions');
    actionsFolder.add({ reset: () => this.callbacks.onReset?.() }, 'reset')
      .name('Reset');
    actionsFolder.add({ pause: () => this.callbacks.onTogglePause?.() }, 'pause')
      .name('Pause / Play');
    actionsFolder.add({ screenshot: () => this.callbacks.onScreenshot?.() }, 'screenshot')
      .name('Screenshot');
    actionsFolder.add({ fullscreen: () => this.callbacks.onFullscreen?.() }, 'fullscreen')
      .name('Fullscreen');
    this.folders.actions = actionsFolder;
  }
  
  /**
   * Initialize murmuration-specific controls
   */
  initMurmurationControls() {
    // Flock folder
    const flockFolder = this.gui.addFolder('🐦 Flock');
    flockFolder.add(this.params, 'birdCount', 100, 10000, 100)
      .name('Bird Count')
      .onChange(value => this.callbacks.onBirdCountChange?.(value));
    flockFolder.open();
    this.folders.flock = flockFolder;
    
    // Behavior folder
    const behaviorFolder = this.gui.addFolder('🧠 Behavior');
    behaviorFolder.add(this.params, 'visualRange', 10, 100, 1).name('Visual Range');
    behaviorFolder.add(this.params, 'protectedRange', 2, 30, 1).name('Protected Range');
    behaviorFolder.add(this.params, 'centeringFactor', 0.0001, 0.002, 0.0001).name('Cohesion');
    behaviorFolder.add(this.params, 'avoidFactor', 0.01, 0.2, 0.01).name('Separation');
    behaviorFolder.add(this.params, 'matchingFactor', 0.01, 0.2, 0.01).name('Alignment');
    behaviorFolder.open();
    this.folders.behavior = behaviorFolder;
    
    // Movement folder
    const movementFolder = this.gui.addFolder('💨 Movement');
    movementFolder.add(this.params, 'minSpeed', 1, 10, 0.5).name('Min Speed');
    movementFolder.add(this.params, 'maxSpeed', 2, 15, 0.5).name('Max Speed');
    movementFolder.add(this.params, 'turnFactor', 0.05, 0.5, 0.01).name('Turn Factor');
    movementFolder.add(this.params, 'margin', 20, 100, 5).name('Margin');
    this.folders.movement = movementFolder;
    
    // Boid Visual folder
    const boidVisualFolder = this.gui.addFolder('✨ Boid Visual');
    boidVisualFolder.add(this.params, 'particleSize', 1, 10, 0.5).name('Particle Size');
    boidVisualFolder.add(this.params, 'maxDistance', 100, 400, 10).name('Color Distance');
    this.folders.boidVisual = boidVisualFolder;
  }
  
  /**
   * Initialize fluid-specific controls
   */
  initFluidControls() {
    // Droplet Settings folder
    const dropletFolder = this.gui.addFolder('💧 Droplets');
    dropletFolder.add(this.params, 'dropletCount', 1, 20, 1)
      .name('Number of Droplets')
      .onChange(() => this.callbacks.onFluidReset?.());
    dropletFolder.add(this.params, 'dropletSize', 0.03, 0.15, 0.01)
      .name('Droplet Size');
    dropletFolder.add(this.params, 'dropletSoftness', 0.2, 0.8, 0.1)
      .name('Edge Softness');
    dropletFolder.open();
    this.folders.droplet = dropletFolder;
    
    // Droplet Colors folder
    const dropletColorsFolder = this.gui.addFolder('🎨 Droplet Colors');
    dropletColorsFolder.addColor(this.params, 'dropletColor1')
      .name('Color 1');
    dropletColorsFolder.addColor(this.params, 'dropletColor2')
      .name('Color 2');
    dropletColorsFolder.addColor(this.params, 'dropletColor3')
      .name('Color 3');
    dropletColorsFolder.addColor(this.params, 'fluidBackgroundColor')
      .name('Background');
    dropletColorsFolder.open();
    this.folders.dropletColors = dropletColorsFolder;
    
    // Fluid Physics folder
    const fluidPhysicsFolder = this.gui.addFolder('🌊 Fluid Physics');
    fluidPhysicsFolder.add(this.params, 'vorticity', 5, 50, 1)
      .name('Swirl/Curl');
    fluidPhysicsFolder.add(this.params, 'velocityDissipation', 0.98, 0.999, 0.001)
      .name('Motion Duration');
    fluidPhysicsFolder.add(this.params, 'dyeDissipation', 0.999, 1.0, 0.0001)
      .name('Color Fade (1=never)');
    fluidPhysicsFolder.add(this.params, 'fluidBrightness', 0.8, 1.5, 0.1)
      .name('Brightness');
    this.folders.fluidPhysics = fluidPhysicsFolder;
    
    // Tracking folder
    const fluidTrackingFolder = this.gui.addFolder('👋 Motion Control');
    fluidTrackingFolder.add(this.params, 'trackingForce', 0.1, 0.8, 0.05)
      .name('Push Strength');
    fluidTrackingFolder.add(this.params, 'trackingRadius', 0.03, 0.15, 0.01)
      .name('Push Size');
    this.folders.fluidTracking = fluidTrackingFolder;
  }
  
  /**
   * Initialize tracking controls (shared between modes)
   */
  initTrackingControls() {
    const trackingFolder = this.gui.addFolder('🖐️ Hand/Face Tracking');
    
    trackingFolder.add(this.params, 'trackingEnabled')
      .name('Enable Tracking')
      .onChange(enabled => {
        this.callbacks.onTrackingToggle?.(enabled);
      });
    
    trackingFolder.add(this.params, 'showPreview')
      .name('Show Preview')
      .onChange(visible => this.callbacks.onPreviewToggle?.(visible));
    
    // Murmuration-specific tracking options (will be hidden in fluid mode)
    this.folders.trackingMurmuration = trackingFolder.addFolder('Murmuration Options');
    this.folders.trackingMurmuration.add(this.params, 'attractionStrength', 0.01, 0.5, 0.01)
      .name('Attraction Force');
    this.folders.trackingMurmuration.add(this.params, 'attractionRange', 50, 400, 10)
      .name('Attraction Range');
    this.folders.trackingMurmuration.add(this.params, 'handAttractionStrength', 0.1, 2.0, 0.1)
      .name('Hand Strength');
    this.folders.trackingMurmuration.add(this.params, 'faceAttractionStrength', 0.1, 2.0, 0.1)
      .name('Face Strength');
    this.folders.trackingMurmuration.add(this.params, 'orbitEnabled')
      .name('Enable Orbit');
    this.folders.trackingMurmuration.add(this.params, 'orbitStrength', 0.01, 0.3, 0.01)
      .name('Orbit Strength');
    
    trackingFolder.open();
    this.folders.tracking = trackingFolder;
  }
  
  /**
   * Show/hide controls based on current mode
   */
  updateModeVisibility() {
    const isMurmuration = this.params.mode === 'murmuration';
    const isFluid = this.params.mode === 'fluid';
    
    // Murmuration folders
    if (this.folders.flock) this.folders.flock.domElement.style.display = isMurmuration ? '' : 'none';
    if (this.folders.behavior) this.folders.behavior.domElement.style.display = isMurmuration ? '' : 'none';
    if (this.folders.movement) this.folders.movement.domElement.style.display = isMurmuration ? '' : 'none';
    if (this.folders.boidVisual) this.folders.boidVisual.domElement.style.display = isMurmuration ? '' : 'none';
    if (this.folders.trackingMurmuration) {
      this.folders.trackingMurmuration.domElement.style.display = isMurmuration ? '' : 'none';
    }
    
    // Fluid folders
    if (this.folders.droplet) this.folders.droplet.domElement.style.display = isFluid ? '' : 'none';
    if (this.folders.dropletColors) this.folders.dropletColors.domElement.style.display = isFluid ? '' : 'none';
    if (this.folders.fluidPhysics) this.folders.fluidPhysics.domElement.style.display = isFluid ? '' : 'none';
    if (this.folders.fluidTracking) this.folders.fluidTracking.domElement.style.display = isFluid ? '' : 'none';
  }
  
  /**
   * Load a preset configuration
   */
  loadPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    
    // Check if mode is changing
    const modeChanging = preset.mode && preset.mode !== this.params.mode;
    
    // Update params object
    Object.keys(preset).forEach(key => {
      if (key in this.params) {
        this.params[key] = preset[key];
      }
    });
    
    // Update GUI controllers
    this.gui.controllersRecursive().forEach(controller => {
      controller.updateDisplay();
    });
    
    // Handle mode change
    if (modeChanging) {
      this.callbacks.onModeChange?.(this.params.mode);
      this.updateModeVisibility();
    }
    
    // Trigger bird count change if needed (murmuration mode)
    if (preset.birdCount && this.callbacks.onBirdCountChange) {
      this.callbacks.onBirdCountChange(preset.birdCount);
    }
    
    // Trigger tracking change if needed
    if ('trackingEnabled' in preset && this.callbacks.onTrackingToggle) {
      this.callbacks.onTrackingToggle(preset.trackingEnabled);
    }
  }
  
  /**
   * Update pause button text
   */
  setPauseState(isPaused) {
    this.isPaused = isPaused;
  }
  
  /**
   * Show or hide the GUI
   */
  toggle() {
    if (this.gui._hidden) {
      this.gui.show();
    } else {
      this.gui.hide();
    }
  }
  
  /**
   * Clean up
   */
  dispose() {
    this.gui.destroy();
  }
}
