#version 330 compatibility

uniform sampler2D lightmap;
uniform sampler2D gtexture;
uniform vec4 entityColor;
uniform int entityId;

uniform float alphaTestRef = 0.1;

in vec2 lmcoord;
in vec2 texcoord;
in vec4 glcolor;
in vec3 normal;

/* DRAWBUFFERS: 01 */
layout(location = 0) out vec4 color;
layout(location = 1) out vec4 extra;

vec3 get_entity_color(int id) {
	// enemies
	if(id < 1000) {
		return vec3(float(id) / 16.0, 0.0, 0.0);
	}
	// friendly
	else if(id >= 1000 && id < 2000){
		return vec3(0, float(id - 1000) / 23.0, 0.0);
	}
	// players and such
	else {
		return vec3(0, 0.0, float(id - 2000) / 2.0);
	}
}

void main() {
	color = texture(gtexture, texcoord) * glcolor;
	color.rgb = mix(color.rgb, entityColor.rgb, entityColor.a);
	color *= texture(lightmap, lmcoord);

	extra = vec4(
		get_entity_color(entityId),
		1.0
	);
	if (color.a < alphaTestRef)
		discard;
}