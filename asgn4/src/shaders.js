const VSHADER_SOURCE = `
precision mediump float;

attribute vec4 a_Position;
attribute vec3 a_Normal;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;
uniform mat4 u_NormalMatrix;

varying vec3 v_Normal;
varying vec3 v_WorldPos;

void main() {
    vec4 worldPos = u_ModelMatrix * a_Position;
    v_WorldPos = worldPos.xyz;

    v_Normal = normalize((u_NormalMatrix * vec4(a_Normal,0.0)).xyz);

    gl_Position = u_ProjMatrix * u_ViewMatrix * worldPos;
}
`;

const FSHADER_SOURCE = `
precision mediump float;

uniform vec3 u_LightPos;
uniform vec3 u_ViewPos;
uniform vec3 u_LightColor;

uniform bool u_LightingOn;
uniform bool u_NormalVis;

uniform vec3 u_SpotDirection;
uniform float u_SpotCutoff;
uniform bool u_SpotOn;

varying vec3 v_Normal;
varying vec3 v_WorldPos;

void main() {

    if (u_NormalVis) {
        gl_FragColor = vec4(normalize(v_Normal)*0.5+0.5,1.0);
        return;
    }

    vec3 objectColor = vec3(0.8,0.4,0.2);

    if (!u_LightingOn) {
        gl_FragColor = vec4(objectColor,1.0);
        return;
    }

    vec3 norm = normalize(v_Normal);
    vec3 lightDir = normalize(u_LightPos - v_WorldPos);

    float diff = max(dot(norm, lightDir), 0.0);

    vec3 viewDir = normalize(u_ViewPos - v_WorldPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

    float ambientStrength = 0.2;
    vec3 ambient = ambientStrength * u_LightColor;
    vec3 diffuse = diff * u_LightColor;
    vec3 specular = 0.5 * spec * u_LightColor;

    if (u_SpotOn) {
        vec3 spotDir = normalize(u_SpotDirection);
        float theta = dot(lightDir, -spotDir);
        if (theta < u_SpotCutoff) {
            diffuse *= 0.0;
            specular *= 0.0;
        }
    }

    vec3 result = (ambient + diffuse + specular) * objectColor;

    gl_FragColor = vec4(result,1.0);
}
`;
