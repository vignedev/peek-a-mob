#version 330 compatibility

const bool colortex0MipmapEnabled = false;
const bool colortex1MipmapEnabled = false;

uniform sampler2D colortex0;

uniform sampler2D colortex1;
uniform sampler2D colortex2;
uniform sampler2D colortex3;
uniform sampler2D colortex4;

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

float get_depth(vec2 uv){
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

void main() {
	if(hideGUI){
		vec4 rgb = get_rgb_buffer(vec2(texcoord.x * 2.0, texcoord.y * 2.0 - 1.0)); // top left
		vec4 ent1 = get_entity_buffer(colortex2, vec2(texcoord.x * 2.0 - 1.0, texcoord.y * 2.0 - 1.0)); // top right
		vec4 ent2 = get_entity_buffer(colortex3, vec2(texcoord.x * 2.0, texcoord.y * 2.0)); // bottom left
		vec4 ent3 = get_entity_buffer(colortex4, vec2(texcoord.x * 2.0 - 1.0, texcoord.y * 2.0)); // bottom right?

		color = mix(
			mix(rgb, ent1, float(texcoord.x > 0.5)),
			mix(ent2, ent3, float(texcoord.x > 0.5)),
			float(texcoord.y < 0.5)
		);
	}else{
		float distance = get_depth(texcoord);
		distance = pow(distance, 1.0 / 2.2); //delinearize

		vec4 rgb = get_rgb_buffer(texcoord);
		vec4 ent1 = get_entity_buffer(colortex2, texcoord);
		vec4 ent2 = get_entity_buffer(colortex3, texcoord);
		vec4 ent3 = get_entity_buffer(colortex4, texcoord);

		color = (heldItemId == 1 || heldItemId2 == 1) ? vec4(
			(ent1.rgb / 3.0 + ent2.rgb / 3.0 + ent3.rgb / 3.0) + vec3(distance),
			1.0
		) : rgb;
	}
}