#version 330 compatibility

const bool colortex0MipmapEnabled = false;
const bool colortex1MipmapEnabled = false;

uniform sampler2D colortex0;
uniform sampler2D colortex1;
uniform sampler2D depthtex0;
uniform bool hideGUI;
uniform mat4 gbufferProjectionInverse;
uniform float far;
uniform int heldItemId;
uniform int heldItemId2;

uniform float viewWidth;
uniform float viewHeight;

in vec2 texcoord;

out vec4 color;

float getDistance(vec2 uv){
  vec4 homPos = gbufferProjectionInverse * vec4(vec3(uv.xy, texture(depthtex0, uv).r), 1.0);
  return length(homPos.xyz / homPos.w) / far;
}

vec4 get_entity_buffer(vec2 uv){
	vec4 entities = vec4(1.0) - step(texture(colortex1, uv), vec4(0.99));
// #if MC_GL_VENDOR_NVIDIA
// 	entities.a = float(tex.r == 1.0 || tex.g == 1.0);
// #else
// 	entities.a = float(dot(entities.rgb, vec3(1.0)) == 1.0);
// #endif
	entities.a = 1.0 - float((entities.r == 0.0 || entities.g == 0.0) && entities.b == 1.0);
	entities.rgb *= entities.a;
	return entities;
}

void get_buffers(out vec4 albedo, out vec4 entities, vec2 uv, vec2 uv2) {
	albedo = texture(colortex0, uv);
	entities = get_entity_buffer(uv2);
}

void get_buffers(out vec4 albedo, out vec4 entities, vec2 uv) {
	get_buffers(albedo, entities, uv, uv);
}

float snap(float value, float grid){
	return floor(value * grid) / grid;
}

void main() {
	// vec4 tex = texture(colortex1, texcoord);
	// color = vec4(float((tex.r == 1.0 || tex.g == 1.0) && tex.b == 0.0));
	// return;

	if(hideGUI){
		float distance = getDistance(vec2(texcoord.x * 2.0 - 1.0, texcoord.y));
		distance = pow(distance, 1.0 / 2.2);

		vec4 albedo; vec4 entities;
		get_buffers(albedo, entities,
			vec2(texcoord.x * 2.0, texcoord.y),
			vec2(snap(texcoord.x * 2.0 - 1.0, viewWidth/2.0), texcoord.y)
		);
		// color = mix(albedo, mix(entities * entities.a, vec4(0.0), distance), float(texcoord.x > 0.5));
		color = mix(albedo, entities + vec4(0.0, 0.0, distance, 0.0), float(texcoord.x > 0.5));
	}else{
		vec4 albedo; vec4 entities;
		get_buffers(albedo, entities, texcoord);

		color = (heldItemId == 1 || heldItemId2 == 1) ? mix(albedo, entities, entities.a) : albedo;
	}
}