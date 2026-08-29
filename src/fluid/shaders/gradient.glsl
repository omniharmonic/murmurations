// Gradient subtraction shader
// Subtracts pressure gradient from velocity to make it divergence-free

precision highp float;

uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 texelSize;

varying vec2 vUv;

void main() {
  float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
  
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  
  // Subtract pressure gradient
  velocity.x -= 0.5 * (R - L);
  velocity.y -= 0.5 * (T - B);
  
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}

