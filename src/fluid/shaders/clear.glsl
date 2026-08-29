// Clear/decay shader

precision highp float;

uniform sampler2D uTexture;
uniform float value;

varying vec2 vUv;

void main() {
  gl_FragColor = value * texture2D(uTexture, vUv);
}

