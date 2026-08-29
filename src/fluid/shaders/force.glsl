// Force application shader - adds velocity without adding color
// Used for hand/face tracking to push liquid around

precision highp float;

uniform sampler2D uVelocity;
uniform vec2 point;
uniform vec2 force;
uniform float radius;
uniform float aspectRatio;

varying vec2 vUv;

void main() {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  
  float dist = length(p);
  
  // Soft force falloff
  float influence = exp(-dist * dist / radius);
  
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * influence;
  
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}

