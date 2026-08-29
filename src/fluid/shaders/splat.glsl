// Droplet shader - creates organic circular droplets with soft edges

precision highp float;

uniform sampler2D uTarget;
uniform vec2 point;
uniform vec3 color;
uniform float radius;
uniform float aspectRatio;
uniform float softness; // Controls edge falloff (0.5 = soft, 0.1 = hard)

varying vec2 vUv;

void main() {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  
  float dist = length(p);
  
  // Soft circular droplet with organic falloff
  float droplet = 1.0 - smoothstep(radius * (1.0 - softness), radius, dist);
  
  // Add some organic variation
  droplet *= droplet; // Square for more concentrated center
  
  vec3 base = texture2D(uTarget, vUv).rgb;
  
  // Blend droplet color with existing (not additive)
  vec3 result = mix(base, color, droplet * 0.8);
  
  gl_FragColor = vec4(result, 1.0);
}
