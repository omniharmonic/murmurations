/**
 * ModeManager - Handles switching between simulation modes
 * Supports: 'murmuration' and 'fluid' modes
 */
export class ModeManager {
  constructor() {
    this.currentMode = 'murmuration';
    this.modes = new Map();
    this.onModeChange = null;
  }
  
  /**
   * Register a mode with its setup and cleanup functions
   */
  registerMode(name, { setup, cleanup, update, render }) {
    this.modes.set(name, {
      setup: setup || (() => {}),
      cleanup: cleanup || (() => {}),
      update: update || (() => {}),
      render: render || (() => {}),
      isActive: false
    });
  }
  
  /**
   * Switch to a different mode
   */
  switchMode(newMode) {
    if (!this.modes.has(newMode)) {
      console.error(`Mode "${newMode}" not registered`);
      return false;
    }
    
    if (newMode === this.currentMode) {
      return true;
    }
    
    console.log(`Switching mode: ${this.currentMode} → ${newMode}`);
    
    // Cleanup current mode
    const current = this.modes.get(this.currentMode);
    if (current && current.isActive) {
      current.cleanup();
      current.isActive = false;
    }
    
    // Setup new mode
    const next = this.modes.get(newMode);
    next.setup();
    next.isActive = true;
    
    this.currentMode = newMode;
    
    // Callback
    this.onModeChange?.(newMode);
    
    return true;
  }
  
  /**
   * Get current mode name
   */
  getMode() {
    return this.currentMode;
  }
  
  /**
   * Update current mode
   */
  update(...args) {
    const mode = this.modes.get(this.currentMode);
    if (mode && mode.isActive) {
      mode.update(...args);
    }
  }
  
  /**
   * Render current mode
   */
  render(...args) {
    const mode = this.modes.get(this.currentMode);
    if (mode && mode.isActive) {
      mode.render(...args);
    }
  }
  
  /**
   * Check if a mode is active
   */
  isMode(name) {
    return this.currentMode === name;
  }
  
  /**
   * Get list of available modes
   */
  getModes() {
    return Array.from(this.modes.keys());
  }
  
  /**
   * Dispose all modes
   */
  dispose() {
    for (const [name, mode] of this.modes) {
      if (mode.isActive) {
        mode.cleanup();
      }
    }
    this.modes.clear();
  }
}

