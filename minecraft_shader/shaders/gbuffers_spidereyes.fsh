#version 330 compatibility

uniform sampler2D gtexture;

in vec2 lmcoord;
in vec2 texcoord;
in vec4 glcolor;
in vec3 normal;

/* DRAWBUFFERS: 0 */
layout(location = 0) out vec4 color;

void main() {
  color = texture(gtexture, texcoord);
}