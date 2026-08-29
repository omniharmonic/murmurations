// Semi-Lagrangian advection - the core of fluid simulation
// Traces particles backwards in time to find where they came from

precision highp float;

uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;

varying vec2 vUv;

void main() {
  // Sample velocity at current position
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  
  // Trace backwards in time - velocity is in pixels/second
  // Scale factor converts velocity to UV space movement
  vec2 pastCoord = vUv - velocity * texelSize * dt;
  
  // Sample what was there (bilinear filtering)
  vec4 result = texture2D(uSource, pastCoord);
  
  // Apply dissipation - 1.0 means NO decay
  // Values very close to 1.0 (like 0.9999) decay extremely slowly
  gl_FragColor = result * dissipation;
}
