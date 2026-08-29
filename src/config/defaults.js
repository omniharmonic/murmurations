// Default simulation parameters based on biological research
export const defaults = {
  // === GLOBAL SETTINGS ===
  mode: 'murmuration',        // Current mode: 'murmuration' or 'fluid'
  backgroundColor: '#0a0a0f', // Global background color
  
  // === MURMURATION (BOIDS) SETTINGS ===
  // Flocking behavior
  visualRange: 40,          // Neighbor detection radius
  protectedRange: 8,        // Personal space radius
  centeringFactor: 0.0005,  // Cohesion strength
  avoidFactor: 0.05,        // Separation strength
  matchingFactor: 0.05,     // Alignment strength
  
  // Movement constraints
  maxSpeed: 6,              // Maximum velocity
  minSpeed: 3,              // Minimum velocity
  turnFactor: 0.2,          // Boundary avoidance strength
  margin: 50,               // Distance from boundary to start turning
  
  // Simulation size
  birdCount: 1000,          // Initial number of birds
  bounds: 150,              // Half-size of the simulation cube
  
  // Visualization
  particleSize: 3.0,        // Size of each bird particle
  maxDistance: 200,         // Max distance for color mapping
  
  // Performance
  targetFPS: 60,
  minFPS: 30,
  
  // === HAND/FACE TRACKING (shared) ===
  trackingEnabled: false,      // Enable webcam tracking
  showPreview: true,           // Show tracking preview window
  attractionStrength: 0.15,    // How strongly boids are attracted to hands/face
  attractionRange: 200,        // Range within which attraction works
  handAttractionStrength: 1.0, // Multiplier for hand attraction
  faceAttractionStrength: 0.5, // Multiplier for face attraction (less than hands)
  orbitEnabled: true,          // Enable swirling orbit behavior
  orbitStrength: 0.08,         // Strength of orbit/swirl effect
  trackingScale: 200,          // Scale factor for mapping camera to simulation
  depthScale: 100,             // Z-axis depth scale for tracking
  
  // === FLUID DYNAMICS SETTINGS ===
  fluidResolution: 512,        // Simulation grid resolution
  velocityDissipation: 0.995,  // Velocity decay - how long motion persists
  dyeDissipation: 1.0,         // Color decay - 1.0 means NO fade at all
  pressureIterations: 20,      // Pressure solver iterations
  vorticity: 25,               // Swirl/curl strength - creates organic motion
  splatRadius: 0.015,          // Size of velocity splats
  fluidBrightness: 1.0,        // Display brightness
  
  // Droplet settings
  dropletCount: 5,             // Number of ink droplets
  dropletSize: 0.1,            // Base droplet size
  dropletSoftness: 0.4,        // Edge softness
  dropletColor1: '#1a5fb4',    // Blue
  dropletColor2: '#26a269',    // Green  
  dropletColor3: '#e66100',    // Orange
  
  // Fluid background
  fluidBackgroundColor: '#f5f7fa',
  
  // Tracking interaction - these control how your hands push the fluid
  trackingForce: 0.5,          // How strongly hands push fluid
  trackingRadius: 0.12         // Size of the push area
};

// Preset configurations
export const presets = {
  default: { ...defaults },
  
  tightSwarm: {
    ...defaults,
    visualRange: 30,
    protectedRange: 5,
    centeringFactor: 0.001,
    avoidFactor: 0.08,
    matchingFactor: 0.08,
    birdCount: 2000
  },
  
  looseFlock: {
    ...defaults,
    visualRange: 60,
    protectedRange: 12,
    centeringFactor: 0.0003,
    avoidFactor: 0.03,
    matchingFactor: 0.03,
    birdCount: 500
  },
  
  chaotic: {
    ...defaults,
    visualRange: 25,
    protectedRange: 10,
    centeringFactor: 0.0002,
    avoidFactor: 0.1,
    matchingFactor: 0.02,
    maxSpeed: 10,
    minSpeed: 5,
    birdCount: 1500
  },
  
  massive: {
    ...defaults,
    visualRange: 35,
    protectedRange: 6,
    centeringFactor: 0.0004,
    avoidFactor: 0.04,
    matchingFactor: 0.04,
    birdCount: 5000
  },
  
  // Tracking-optimized presets
  handFollow: {
    ...defaults,
    birdCount: 1500,
    trackingEnabled: true,
    attractionStrength: 0.2,
    attractionRange: 250,
    orbitEnabled: true,
    orbitStrength: 0.1,
    visualRange: 35,
    centeringFactor: 0.0003
  },
  
  gentleOrbit: {
    ...defaults,
    birdCount: 2000,
    trackingEnabled: true,
    attractionStrength: 0.08,
    attractionRange: 300,
    orbitEnabled: true,
    orbitStrength: 0.15,
    visualRange: 45,
    maxSpeed: 4,
    minSpeed: 2
  },
  
  intenseSwarm: {
    ...defaults,
    birdCount: 3000,
    trackingEnabled: true,
    attractionStrength: 0.3,
    attractionRange: 200,
    orbitEnabled: false,
    visualRange: 25,
    protectedRange: 5,
    maxSpeed: 8,
    minSpeed: 4
  },
  
  // === FLUID MODE PRESETS ===
  fluidDefault: {
    ...defaults,
    mode: 'fluid',
    trackingEnabled: true,
    dropletCount: 5,
    dropletSize: 0.1,
    dropletColor1: '#1a5fb4',
    dropletColor2: '#26a269',
    dropletColor3: '#e66100',
    fluidBackgroundColor: '#f5f7fa',
    velocityDissipation: 0.995,
    dyeDissipation: 1.0,
    vorticity: 25,
    trackingForce: 0.5
  },
  
  eternalDance: {
    ...defaults,
    mode: 'fluid',
    trackingEnabled: true,
    dropletCount: 4,
    dropletSize: 0.12,
    dropletColor1: '#0077b6',
    dropletColor2: '#00b4d8',
    dropletColor3: '#90e0ef',
    fluidBackgroundColor: '#f0f8ff',
    velocityDissipation: 0.997,
    dyeDissipation: 1.0,
    vorticity: 20,
    trackingForce: 0.4
  },
  
  vibrantSwirl: {
    ...defaults,
    mode: 'fluid',
    trackingEnabled: true,
    dropletCount: 6,
    dropletSize: 0.08,
    dropletColor1: '#e63946',
    dropletColor2: '#f4a261',
    dropletColor3: '#2a9d8f',
    fluidBackgroundColor: '#fffaf0',
    velocityDissipation: 0.99,
    dyeDissipation: 1.0,
    vorticity: 35,
    trackingForce: 0.6
  },
  
  cosmicNight: {
    ...defaults,
    mode: 'fluid',
    trackingEnabled: true,
    dropletCount: 5,
    dropletSize: 0.1,
    dropletColor1: '#7209b7',
    dropletColor2: '#3a0ca3',
    dropletColor3: '#f72585',
    fluidBackgroundColor: '#0a0a14',
    velocityDissipation: 0.996,
    dyeDissipation: 1.0,
    vorticity: 28,
    fluidBrightness: 1.2,
    trackingForce: 0.5
  },
  
  gentleWaves: {
    ...defaults,
    mode: 'fluid',
    trackingEnabled: true,
    dropletCount: 4,
    dropletSize: 0.14,
    dropletSoftness: 0.6,
    dropletColor1: '#2d6a4f',
    dropletColor2: '#40916c',
    dropletColor3: '#95d5b2',
    fluidBackgroundColor: '#f0fff4',
    velocityDissipation: 0.998,
    dyeDissipation: 1.0,
    vorticity: 15,
    trackingForce: 0.3
  }
};




