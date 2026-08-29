import * as THREE from 'three';

// Import shaders
import baseVertexShader from './shaders/base-vertex.glsl';
import advectionShader from './shaders/advection.glsl';
import divergenceShader from './shaders/divergence.glsl';
import pressureShader from './shaders/pressure.glsl';
import gradientShader from './shaders/gradient.glsl';
import splatShader from './shaders/splat.glsl';
import curlShader from './shaders/curl.glsl';
import vorticityShader from './shaders/vorticity.glsl';
import clearShader from './shaders/clear.glsl';
import displayShader from './shaders/display.glsl';

/**
 * GPU Fluid Simulator
 */
export class FluidSimulator {
  constructor(renderer, params) {
    this.renderer = renderer;
    this.params = params;
    
    this.simWidth = 512;
    this.simHeight = 512;
    
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspectRatio = this.width / this.height;
    
    this.texelSize = new THREE.Vector2(1.0 / this.simWidth, 1.0 / this.simHeight);
    this.time = 0;
    
    // Scene for rendering
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    this.scene.add(this.quad);
    
    // Tracking state - store last positions for velocity calculation
    this.lastPos = new Map();
    
    this.initRenderTargets();
    this.initMaterials();
    this.initializeScene();
    
    console.log('FluidSimulator ready');
  }
  
  initRenderTargets() {
    const opts = {
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false
    };
    
    this.velocity = {
      read: new THREE.WebGLRenderTarget(this.simWidth, this.simHeight, opts),
      write: new THREE.WebGLRenderTarget(this.simWidth, this.simHeight, opts),
      swap() { [this.read, this.write] = [this.write, this.read]; }
    };
    
    this.dye = {
      read: new THREE.WebGLRenderTarget(this.simWidth, this.simHeight, opts),
      write: new THREE.WebGLRenderTarget(this.simWidth, this.simHeight, opts),
      swap() { [this.read, this.write] = [this.write, this.read]; }
    };
    
    this.pressure = {
      read: new THREE.WebGLRenderTarget(this.simWidth, this.simHeight, opts),
      write: new THREE.WebGLRenderTarget(this.simWidth, this.simHeight, opts),
      swap() { [this.read, this.write] = [this.write, this.read]; }
    };
    
    this.divergence = new THREE.WebGLRenderTarget(this.simWidth, this.simHeight, opts);
    this.curl = new THREE.WebGLRenderTarget(this.simWidth, this.simHeight, opts);
  }
  
  initMaterials() {
    this.advectionMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: advectionShader,
      uniforms: {
        uVelocity: { value: null },
        uSource: { value: null },
        texelSize: { value: this.texelSize },
        dt: { value: 0.016 },
        dissipation: { value: 1.0 }
      }
    });
    
    this.divergenceMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: divergenceShader,
      uniforms: {
        uVelocity: { value: null },
        texelSize: { value: this.texelSize }
      }
    });
    
    this.pressureMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: pressureShader,
      uniforms: {
        uPressure: { value: null },
        uDivergence: { value: null },
        texelSize: { value: this.texelSize }
      }
    });
    
    this.gradientMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: gradientShader,
      uniforms: {
        uPressure: { value: null },
        uVelocity: { value: null },
        texelSize: { value: this.texelSize }
      }
    });
    
    this.splatMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: splatShader,
      uniforms: {
        uTarget: { value: null },
        point: { value: new THREE.Vector2(0.5, 0.5) },
        color: { value: new THREE.Vector3(1, 0, 0) },
        radius: { value: 0.05 },
        aspectRatio: { value: this.aspectRatio },
        softness: { value: 0.5 }
      }
    });
    
    this.curlMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: curlShader,
      uniforms: {
        uVelocity: { value: null },
        texelSize: { value: this.texelSize }
      }
    });
    
    this.vorticityMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: vorticityShader,
      uniforms: {
        uVelocity: { value: null },
        uCurl: { value: null },
        texelSize: { value: this.texelSize },
        curl: { value: 20 },
        dt: { value: 0.016 }
      }
    });
    
    this.clearMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: clearShader,
      uniforms: {
        uTexture: { value: null },
        value: { value: 0 }
      }
    });
    
    this.displayMat = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: displayShader,
      uniforms: {
        uTexture: { value: null },
        backgroundColor: { value: new THREE.Vector3(0.96, 0.97, 0.98) },
        brightness: { value: 1.0 }
      }
    });
  }
  
  blit(target, material) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Add a splat of velocity or color
   */
  splat(target, x, y, r, g, b, radius) {
    this.splatMat.uniforms.uTarget.value = target.read.texture;
    this.splatMat.uniforms.point.value.set(x, y);
    this.splatMat.uniforms.color.value.set(r, g, b);
    this.splatMat.uniforms.radius.value = radius;
    this.blit(target.write, this.splatMat);
    target.swap();
  }
  
  /**
   * Initialize with colored droplets
   */
  initializeScene() {
    // Clear everything first
    this.clearMat.uniforms.value.value = 0;
    
    this.clearMat.uniforms.uTexture.value = this.velocity.read.texture;
    this.blit(this.velocity.write, this.clearMat);
    this.velocity.swap();
    
    this.clearMat.uniforms.uTexture.value = this.dye.read.texture;
    this.blit(this.dye.write, this.clearMat);
    this.dye.swap();
    
    this.clearMat.uniforms.uTexture.value = this.pressure.read.texture;
    this.blit(this.pressure.write, this.clearMat);
    this.pressure.swap();
    
    // Add droplets with VERY bright colors (values > 1.0)
    const count = this.params.dropletCount || 5;
    const colors = [
      this.hexToRgb(this.params.dropletColor1 || '#1a5fb4'),
      this.hexToRgb(this.params.dropletColor2 || '#26a269'),
      this.hexToRgb(this.params.dropletColor3 || '#e66100'),
    ];
    
    const colorBoost = 3.0; // Make colors very bright
    const size = this.params.dropletSize || 0.08;
    
    for (let i = 0; i < count; i++) {
      const x = 0.2 + Math.random() * 0.6;
      const y = 0.2 + Math.random() * 0.6;
      const c = colors[i % colors.length];
      
      this.splatMat.uniforms.softness.value = this.params.dropletSoftness || 0.4;
      this.splat(this.dye, x, y, c.r * colorBoost, c.g * colorBoost, c.b * colorBoost, size);
    }
    
    // Add initial swirling motion - creates the dancing effect
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const cx = 0.5 + Math.cos(angle) * 0.3;
      const cy = 0.5 + Math.sin(angle) * 0.3;
      // Tangential velocity creates circular flow
      const vx = Math.cos(angle + Math.PI/2) * 150;
      const vy = Math.sin(angle + Math.PI/2) * 150;
      this.splat(this.velocity, cx, cy, vx, vy, 0, 0.2);
    }
    
    this.lastPos.clear();
    console.log('Scene initialized with', count, 'droplets');
  }
  
  /**
   * Add ambient swirling motion to keep things dancing
   */
  addAmbientMotion() {
    const t = this.time * 0.2;
    
    // Create several moving vortex points that push the fluid around
    for (let i = 0; i < 4; i++) {
      const angle = t + (i * Math.PI * 0.5);
      const radius = 0.3 + Math.sin(t * 0.3 + i * 1.5) * 0.15;
      const cx = 0.5 + Math.cos(angle) * radius;
      const cy = 0.5 + Math.sin(angle * 0.7) * radius;
      
      // Tangential velocity creates organic swirling
      const vx = -Math.sin(angle) * 80 * (1 + Math.sin(t * 2 + i));
      const vy = Math.cos(angle) * 80 * (1 + Math.cos(t * 1.5 + i));
      
      this.splat(this.velocity, cx, cy, vx, vy, 0, 0.18);
    }
  }
  
  /**
   * Handle tracking input - this creates the dancing motion
   */
  handleTracking(points) {
    if (!points || points.length === 0) return;
    
    let hasValidInput = false;
    
    for (const point of points) {
      if (point.type === 'fingertip') continue;
      
      const id = point.type + (point.handedness || '');
      
      // Convert from simulation space to UV (0-1)
      // Simulation space is roughly -200 to 200
      const scale = this.params.trackingScale || 200;
      const x = point.position.x / (scale * 2) + 0.5;
      const y = -point.position.y / (scale * 2) + 0.5;
      
      // Clamp to valid range
      const ux = Math.max(0.05, Math.min(0.95, x));
      const uy = Math.max(0.05, Math.min(0.95, y));
      
      // Calculate velocity from motion
      let vx = 0, vy = 0;
      if (this.lastPos.has(id)) {
        const last = this.lastPos.get(id);
        const dx = ux - last.x;
        const dy = uy - last.y;
        
        // Apply smoothing to reduce jitter
        const smooth = 0.7;
        vx = dx * 8000 * smooth;  // Large multiplier for visible effect
        vy = dy * 8000 * smooth;
      }
      this.lastPos.set(id, { x: ux, y: uy, time: this.time });
      
      // Apply force - track motion creates visible push on fluid
      const force = this.params.trackingForce || 0.5;
      const radius = this.params.trackingRadius || 0.12;
      
      // Always apply some force when hand is detected
      if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
        // Motion detected - push fluid in that direction
        this.splat(this.velocity, ux, uy, vx * force, vy * force, 0, radius);
        hasValidInput = true;
      } else {
        // Stationary hand creates swirling vortex around it
        const swirl = Math.sin(this.time * 3) * 60;
        const swirlY = Math.cos(this.time * 3) * 60;
        this.splat(this.velocity, ux, uy, swirl, swirlY, 0, radius * 0.8);
      }
    }
    
    return hasValidInput;
  }
  
  /**
   * Main simulation step
   */
  update(dt, trackingPoints = null) {
    this.time += dt;
    const simDt = Math.min(dt, 0.02);
    
    // Handle tracking - this pushes the fluid around
    const hasTracking = this.handleTracking(trackingPoints);
    
    // Add ambient motion to keep things dancing
    // Always add some motion for organic feel
    if (Math.random() < 0.5) {
      this.addAmbientMotion();
    }
    
    // === ADVECT VELOCITY ===
    this.advectionMat.uniforms.dt.value = simDt;
    this.advectionMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectionMat.uniforms.uSource.value = this.velocity.read.texture;
    // Velocity can decay faster - this is the "friction"
    this.advectionMat.uniforms.dissipation.value = this.params.velocityDissipation || 0.99;
    this.blit(this.velocity.write, this.advectionMat);
    this.velocity.swap();
    
    // === VORTICITY CONFINEMENT (creates swirling) ===
    this.curlMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.blit(this.curl, this.curlMat);
    
    this.vorticityMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.vorticityMat.uniforms.uCurl.value = this.curl.texture;
    this.vorticityMat.uniforms.curl.value = this.params.vorticity || 20;
    this.vorticityMat.uniforms.dt.value = simDt;
    this.blit(this.velocity.write, this.vorticityMat);
    this.velocity.swap();
    
    // === PRESSURE PROJECTION (keeps fluid incompressible) ===
    this.divergenceMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.blit(this.divergence, this.divergenceMat);
    
    this.clearMat.uniforms.uTexture.value = this.pressure.read.texture;
    this.clearMat.uniforms.value.value = 0.8;
    this.blit(this.pressure.write, this.clearMat);
    this.pressure.swap();
    
    this.pressureMat.uniforms.uDivergence.value = this.divergence.texture;
    for (let i = 0; i < 20; i++) {
      this.pressureMat.uniforms.uPressure.value = this.pressure.read.texture;
      this.blit(this.pressure.write, this.pressureMat);
      this.pressure.swap();
    }
    
    this.gradientMat.uniforms.uPressure.value = this.pressure.read.texture;
    this.gradientMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.blit(this.velocity.write, this.gradientMat);
    this.velocity.swap();
    
    // === ADVECT DYE (move the colors) ===
    // This is where colors are moved by velocity
    // Dissipation very close to 1.0 means colors barely fade
    this.advectionMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectionMat.uniforms.uSource.value = this.dye.read.texture;
    this.advectionMat.uniforms.dissipation.value = this.params.dyeDissipation || 0.9999;
    this.blit(this.dye.write, this.advectionMat);
    this.dye.swap();
  }
  
  /**
   * Render to screen
   */
  render() {
    const bg = this.hexToRgb(this.params.fluidBackgroundColor || '#f8f9fa');
    this.displayMat.uniforms.backgroundColor.value.set(bg.r, bg.g, bg.b);
    this.displayMat.uniforms.brightness.value = this.params.fluidBrightness || 1.0;
    this.displayMat.uniforms.uTexture.value = this.dye.read.texture;
    
    this.quad.material = this.displayMat;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0.5, g: 0.5, b: 0.5 };
  }
  
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspectRatio = this.width / this.height;
    this.splatMat.uniforms.aspectRatio.value = this.aspectRatio;
  }
  
  clear() {
    this.initializeScene();
  }
  
  dispose() {
    [this.velocity, this.dye, this.pressure].forEach(fbo => {
      fbo.read.dispose();
      fbo.write.dispose();
    });
    this.divergence.dispose();
    this.curl.dispose();
  }
}
