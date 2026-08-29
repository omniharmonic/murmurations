// Display shader - renders fluid with vibrant, lasting colors

precision highp float;

uniform sampler2D uTexture;
uniform vec3 backgroundColor;
uniform float brightness;

varying vec2 vUv;

void main() {
  vec3 dye = texture2D(uTexture, vUv).rgb;
  
  // Apply brightness
  dye *= brightness;
  
  // Calculate intensity for alpha blending
  float intensity = max(max(dye.r, dye.g), dye.b);
  
  // Smooth alpha - colors stay vibrant even at low intensity
  float alpha = smoothstep(0.0, 0.5, intensity);
  
  // Normalize color to maintain saturation
  vec3 color = dye;
  if (intensity > 0.01) {
    // Keep colors vibrant by not letting them get too dark
    color = dye / intensity * min(intensity, 1.0);
    color = mix(color, dye, 0.5); // Blend to keep some variation
  }
  
  // Blend with background
  vec3 result = mix(backgroundColor, color, alpha);
  
  gl_FragColor = vec4(result, 1.0);
}
