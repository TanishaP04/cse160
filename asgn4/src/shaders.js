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
    vec4 worldPos  = u_ModelMatrix * a_Position;
    v_WorldPos     = worldPos.xyz;
    v_Normal       = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);
    gl_Position    = u_ProjMatrix * u_ViewMatrix * worldPos;
}
`;

const FSHADER_SOURCE = `
precision mediump float;

uniform vec3  u_LightPos;
uniform vec3  u_ViewPos;
uniform vec3  u_LightColor;
uniform vec3  u_ObjectColor;

uniform bool  u_LightingOn;
uniform bool  u_NormalVis;

uniform vec3  u_SpotDirection;
uniform float u_SpotCutoff;
uniform bool  u_SpotOn;

varying vec3 v_Normal;
varying vec3 v_WorldPos;

void main() {

    // --- Normal visualisation mode ---
    if (u_NormalVis) {
        gl_FragColor = vec4(normalize(v_Normal) * 0.5 + 0.5, 1.0);
        return;
    }

    // --- Lighting off: flat object colour ---
    if (!u_LightingOn) {
        gl_FragColor = vec4(u_ObjectColor, 1.0);
        return;
    }

    // --- Phong shading ---
    vec3 norm     = normalize(v_Normal);
    vec3 lightDir = normalize(u_LightPos - v_WorldPos);
    vec3 viewDir  = normalize(u_ViewPos  - v_WorldPos);
    vec3 reflDir  = reflect(-lightDir, norm);

    float diff = max(dot(norm, lightDir), 0.0);
    float spec = pow(max(dot(viewDir, reflDir), 0.0), 32.0);

    vec3 ambient  = 0.2  * u_LightColor;
    vec3 diffuse  = diff * u_LightColor;
    vec3 specular = 0.5  * spec * u_LightColor;

    // --- Spotlight attenuation ---
    if (u_SpotOn) {
        float theta = dot(lightDir, -normalize(u_SpotDirection));
        if (theta < u_SpotCutoff) {
            diffuse  = vec3(0.0);
            specular = vec3(0.0);
        }
    }

    vec3 result = (ambient + diffuse + specular) * u_ObjectColor;
    gl_FragColor = vec4(result, 1.0);
}
`;
