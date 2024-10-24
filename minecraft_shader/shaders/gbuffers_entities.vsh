#version 330 compatibility

uniform mat4 gbufferModelViewInverse;
uniform int entityId;

out vec2 lmcoord;
out vec2 texcoord;
out vec4 glcolor;
out vec3 normal;

#define MINECRAFT_LIGHT_POWER   (0.6)
#define MINECRAFT_AMBIENT_LIGHT (0.4)

// https://github.com/onnowhere/core_shaders/blob/e8934246588e7ea39f6d45bc0eda693947dd31d9/.shader_utils/vsh_util.glsl#L6
uniform vec3 Light0_Direction = vec3(0.2, 1.0, -0.7);
uniform vec3 Light1_Direction = vec3(-0.2, 1.0, 0.7);

// Ripped from the hearts of Minecraft
vec4 minecraft_mix_light(vec3 lightDir0, vec3 lightDir1, vec3 normal, vec4 color) {
	lightDir0 = normalize(lightDir0);
	lightDir1 = normalize(lightDir1);
	float light0 = max(0.0, dot(lightDir0, normal));
	float light1 = max(0.0, dot(lightDir1, normal));
	float lightAccum = min(1.0, (light0 + light1) * MINECRAFT_LIGHT_POWER + MINECRAFT_AMBIENT_LIGHT);
	return vec4(color.rgb * lightAccum, color.a);
}

void main() {
	gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex; // ftransform();
	texcoord = (gl_TextureMatrix[0] * gl_MultiTexCoord0).xy;
	lmcoord = (gl_TextureMatrix[1] * gl_MultiTexCoord1).xy;
	normal = mat3(gbufferModelViewInverse) * gl_NormalMatrix * gl_Normal;
	glcolor = entityId == 511 ? gl_Color : minecraft_mix_light(Light0_Direction, Light1_Direction, normal, gl_Color);
	return;
}