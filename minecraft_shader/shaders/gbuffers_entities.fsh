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

/* DRAWBUFFERS: 01234 */
layout(location = 0) out vec4 color;
layout(location = 1) out vec4 _dummy;
layout(location = 2) out vec4 extra1;
layout(location = 3) out vec4 extra2;
layout(location = 4) out vec4 extra3;

float get_bit(int id, int bit){
	return float((id & (1 << bit)) != 0);
}

void get_entity_color(int id, out vec4 triple1, out vec4 triple2, out vec4 triple3) {
	triple1 = vec4(get_bit(id, 8), get_bit(id, 7), get_bit(id, 6), 1.0);
	triple2 = vec4(get_bit(id, 5), get_bit(id, 4), get_bit(id, 3), 1.0);
	triple3 = vec4(get_bit(id, 2), get_bit(id, 1), get_bit(id, 0), 1.0);
}

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

	// extra1 = vec4(
	//	get_entity_color(entityId),
	//	1.0
	//);
	_dummy = vec4(0.0, 0.0, 0.0, 1.0);
	get_entity_color(entityId, extra1, extra2, extra3);

	if (color.a < alphaTestRef)
		discard;
}