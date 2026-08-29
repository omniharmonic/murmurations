// Flow shader - creates broad, swaying velocity fields
// For beautiful dancing motion from tracking input

precision highp float;

uniform sampler2D uVelocity;
uniform vec2 center;        // Center of motion influence
uniform vec2 direction;     // Direction of motion
uniform float strength;     // How strong the flow is
uniform float radius;       // How far the influence extends
uniform float time;         // For organic variation

varying vec2 vUv;

void main() {
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  
  // Distance from influence center
  vec2 delta = vUv - center;
  float dist = length(delta);
  
  // Smooth, broad influence that fades with distance
  float influence = exp(-dist * dist / (radius * radius));
  
  // Add organic swirling based on distance
  float angle = dist * 3.14159 * 2.0 + time * 0.5;
  vec2 swirl = vec2(cos(angle), sin(angle)) * 0.3;
  
  // Combine directed motion with swirl
  vec2 flow = direction + swirl * influence;
  
  // Apply the flow with smooth falloff
  velocity += flow * strength * influence;
  
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}

