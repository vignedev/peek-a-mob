#version 330 compatibility

uniform mat4 gbufferModelViewInverse;

out vec2 lmcoord;
out vec2 texcoord;
out vec4 glcolor;
out vec3 normal;

void main() {
	gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex; // ftransform();
	texcoord = (gl_TextureMatrix[0] * gl_MultiTexCoord0).xy;
	lmcoord = (gl_TextureMatrix[1] * gl_MultiTexCoord1).xy;
	normal = mat3(gbufferModelViewInverse) * gl_NormalMatrix * gl_Normal;
	glcolor = gl_Color;
	return;
}