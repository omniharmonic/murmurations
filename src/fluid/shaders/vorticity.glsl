// Vorticity confinement shader
// Adds rotational force to enhance fluid details

precision highp float;

uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 texelSize;
uniform float curl;
uniform float dt;

varying vec2 vUv;

void main() {
  float L = texture2D(uCurl, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture2D(uCurl, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture2D(uCurl, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture2D(uCurl, vUv - vec2(0.0, texelSize.y)).x;
  float C = texture2D(uCurl, vUv).x;
  
  // Gradient of curl magnitude
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  float lengthSquared = max(1e-5, dot(force, force));
  force *= inversesqrt(lengthSquared) * curl * C;
  
  // Rotate 90 degrees
  force = vec2(force.y, -force.x);
  
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * dt;
  
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}

