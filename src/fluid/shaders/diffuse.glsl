// Diffusion shader - spreads color while preserving intensity
// Creates creamy, organic ink spreading

precision highp float;

uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float diffusion;

varying vec2 vUv;

void main() {
  // Sample center and neighbors
  vec3 center = texture2D(uSource, vUv).rgb;
  vec3 left = texture2D(uSource, vUv - vec2(texelSize.x, 0.0)).rgb;
  vec3 right = texture2D(uSource, vUv + vec2(texelSize.x, 0.0)).rgb;
  vec3 top = texture2D(uSource, vUv + vec2(0.0, texelSize.y)).rgb;
  vec3 bottom = texture2D(uSource, vUv - vec2(0.0, texelSize.y)).rgb;
  
  // Average of neighbors
  vec3 neighbors = (left + right + top + bottom) * 0.25;
  
  // Blend center with neighbors - this spreads color without losing it
  vec3 result = mix(center, neighbors, diffusion);
  
  // Preserve the maximum intensity to prevent fading
  float centerMax = max(max(center.r, center.g), center.b);
  float resultMax = max(max(result.r, result.g), result.b);
  
  // If we're losing intensity, boost it back
  if (resultMax > 0.001 && resultMax < centerMax) {
    result *= centerMax / resultMax * 0.98; // Slight decay is natural
  }
  
  gl_FragColor = vec4(result, 1.0);
}
