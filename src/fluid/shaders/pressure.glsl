// Jacobi pressure solver shader
// Iteratively solves for pressure using Jacobi iteration

precision highp float;

uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 texelSize;

varying vec2 vUv;

void main() {
  float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
  float divergence = texture2D(uDivergence, vUv).x;
  
  // Jacobi iteration
  float pressure = (L + R + B + T - divergence) * 0.25;
  
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}

