#version 330 compatibility

const bool colortex0MipmapEnabled = false;
const bool colortex1MipmapEnabled = false;

uniform sampler2D colortex0;

uniform sampler2D colortex1;
uniform sampler2D colortex2;
uniform sampler2D colortex3;

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

vec4 get_rgb_buffer(vec2 uv){
	return texture(colortex0, uv);
}

vec4 get_entity_buffer(sampler2D sampler, vec2 uv){
	vec4 entities = vec4(1.0) - step(texture(sampler, uv), vec4(0.999999));
	entities.a = float(entities.r == 1.0 || entities.g == 1.0 || entities.b == 1.0);
	entities.rgb *= entities.a;
	return entities;
}

vec4 get_entity_buffer(vec2 uv){
	return get_entity_buffer(colortex1, uv);
}

void get_buffers(out vec4 rgb, out vec4 entities, vec2 uv, vec2 uv2) {
	rgb = get_rgb_buffer(uv);
	entities = get_entity_buffer(uv2);
}

void get_buffers(out vec4 rgb, out vec4 entities, vec2 uv) {
	get_buffers(rgb, entities, uv, uv);
}

void main() {
	if(hideGUI){
		// float distance = getDistance(vec2(texcoord.x * 2.0 - 1.0, texcoord.y * 2.0));
		// distance = pow(distance, 1.0 / 2.2);

		vec4 rgb = get_rgb_buffer(vec2(texcoord.x * 2.0, texcoord.y * 2.0 - 1.0)); // top left
		vec4 ent1 = get_entity_buffer(colortex1, vec2(texcoord.x * 2.0 - 1.0, texcoord.y * 2.0 - 1.0)); // top right
		vec4 ent2 = get_entity_buffer(colortex2, vec2(texcoord.x * 2.0, texcoord.y * 2.0)); // bottom left
		vec4 ent3 = get_entity_buffer(colortex3, vec2(texcoord.x * 2.0 - 1.0, texcoord.y * 2.0)); // bottom right?

		color = mix(
			mix(rgb, ent1, float(texcoord.x > 0.5)),
			mix(ent2, ent3, float(texcoord.x > 0.5)),
			texcoord.y < 0.5
		);
	}else{
		vec4 rgb; vec4 entities;
		get_buffers(rgb, entities, texcoord);

		color = (heldItemId == 1 || heldItemId2 == 1) ? vec4(entities.xyz, 1.0) : rgb;
	}
}