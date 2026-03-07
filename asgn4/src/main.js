let gl;
let lightingOn = true;
let normalVis = false;
let spotOn = true;

let lightPos = [2, 2, 2];
let cameraAngle = 45;

// --- Renderable objects stored globally ---
let cubeObj   = null;   // { vertexBuffer, normalBuffer, count }
let sphereObj = null;
let lightCube = null;   // small cube rendered at light position
let objModel  = null;   // loaded .obj

function main() {
    const canvas = document.getElementById('webgl');
    canvas.width  = 800;
    canvas.height = 600;

    gl = canvas.getContext('webgl');
    if (!gl) { alert('WebGL not supported'); return; }

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        alert('Shader init failed'); return;
    }

    gl.enable(gl.DEPTH_TEST);

    // Build geometry
    cubeObj   = buildBuffers(createCube());
    sphereObj = buildBuffers(createSphere(0.8, 30, 30));
    lightCube = buildBuffers(createCube());

    // Wire up controls
    document.getElementById("lightingBtn").onclick  = () => { lightingOn = !lightingOn; };
    document.getElementById("normalBtn").onclick    = () => { normalVis  = !normalVis;  };
    document.getElementById("spotBtn").onclick      = () => { spotOn     = !spotOn;     };
    document.getElementById("lightX").oninput       = e  => { lightPos[0] = parseFloat(e.target.value); };
    document.getElementById("cameraAngle").oninput  = e  => { cameraAngle = parseFloat(e.target.value); };

    // Try to load OBJ (optional – won't break if file missing)
    loadOBJ("Untitled.obj", function(data) {
        objModel = buildBuffers(data);
    });

    tick();
}

// -------------------------------------------------------
// Build a pair of GPU buffers from a {vertices, normals} object.
// Returns { vertexBuffer, normalBuffer, count } for later use in drawObject().
// -------------------------------------------------------
function buildBuffers(obj) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.vertices), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.normals), gl.STATIC_DRAW);

    return {
        vertexBuffer,
        normalBuffer,
        count: obj.vertices.length / 3
    };
}

// -------------------------------------------------------
// Bind the buffers for one object and draw it.
// -------------------------------------------------------
function drawObject(obj) {
    const a_Position = gl.getAttribLocation(gl.program, "a_Position");
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    const a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, obj.count);
}

// -------------------------------------------------------
// Animation loop
// -------------------------------------------------------
function tick() {
    // Animate light in a circle on XZ plane
    lightPos[0] = 3 * Math.cos(Date.now() * 0.001);
    lightPos[2] = 3 * Math.sin(Date.now() * 0.001);
    // lightPos[0] is still overridden by the slider when the user drags it,
    // but the animation gives a nice default.  Comment out if you only want the slider.
    render();
    requestAnimationFrame(tick);
}

// -------------------------------------------------------
// Render everything
// -------------------------------------------------------
function render() {
    gl.clearColor(0.1, 0.1, 0.15, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // --- Matrices ---
    const viewMatrix = new Matrix4();
    const projMatrix = new Matrix4();

    viewMatrix.setLookAt(
        5 * Math.cos(cameraAngle * Math.PI / 180), 3,
        5 * Math.sin(cameraAngle * Math.PI / 180),
        0, 0, 0,
        0, 1, 0
    );
    projMatrix.setPerspective(60, 800 / 600, 0.1, 100);

    // Pass view-independent uniforms once
    gl.uniform3fv(gl.getUniformLocation(gl.program, "u_LightPos"),      new Float32Array(lightPos));
    gl.uniform3fv(gl.getUniformLocation(gl.program, "u_ViewPos"),       new Float32Array([
        5 * Math.cos(cameraAngle * Math.PI / 180), 3,
        5 * Math.sin(cameraAngle * Math.PI / 180)
    ]));
    gl.uniform3fv(gl.getUniformLocation(gl.program, "u_LightColor"),    new Float32Array([1, 1, 1]));
    gl.uniform1i (gl.getUniformLocation(gl.program, "u_LightingOn"),    lightingOn ? 1 : 0);
    gl.uniform1i (gl.getUniformLocation(gl.program, "u_NormalVis"),     normalVis  ? 1 : 0);
    gl.uniform1i (gl.getUniformLocation(gl.program, "u_SpotOn"),        spotOn     ? 1 : 0);
    gl.uniform3fv(gl.getUniformLocation(gl.program, "u_SpotDirection"), new Float32Array([0, -1, 0]));
    gl.uniform1f (gl.getUniformLocation(gl.program, "u_SpotCutoff"),    0.8);

    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "u_ViewMatrix"), false, viewMatrix.elements);
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "u_ProjMatrix"), false, projMatrix.elements);

    // --- Draw cube (centred at origin) ---
    setModelMatrix(new Matrix4(), gl);          // identity
    drawObject(cubeObj);

    // --- Draw sphere (offset to the right) ---
    const sphereModel = new Matrix4();
    sphereModel.setTranslate(2.5, 0, 0);
    setModelMatrix(sphereModel, gl);
    drawObject(sphereObj);

    // --- Draw small cube at light position (unlit, yellow) ---
    gl.uniform1i(gl.getUniformLocation(gl.program, "u_LightingOn"), 0);
    gl.uniform1i(gl.getUniformLocation(gl.program, "u_NormalVis"),  0);
    gl.uniform3fv(gl.getUniformLocation(gl.program, "u_ObjectColor"), new Float32Array([1, 1, 0]));
    const lightModel = new Matrix4();
    lightModel.setTranslate(lightPos[0], lightPos[1], lightPos[2]);
    lightModel.scale(0.15, 0.15, 0.15);
    setModelMatrix(lightModel, gl);
    drawObject(lightCube);

    // Restore lighting state for any subsequent draws
    gl.uniform1i(gl.getUniformLocation(gl.program, "u_LightingOn"), lightingOn ? 1 : 0);
    gl.uniform1i(gl.getUniformLocation(gl.program, "u_NormalVis"),  normalVis  ? 1 : 0);
    gl.uniform3fv(gl.getUniformLocation(gl.program, "u_ObjectColor"), new Float32Array([0.8, 0.4, 0.2]));

    // --- Draw OBJ model (offset to the left) if loaded ---
    if (objModel) {
        const objMat = new Matrix4();
        objMat.setTranslate(-2.5, 0, 0);
        setModelMatrix(objMat, gl);
        drawObject(objModel);
    }
}

// Helper: upload model matrix + derived normal matrix
function setModelMatrix(mat, gl) {
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "u_ModelMatrix"), false, mat.elements);

    const normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(mat);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, "u_NormalMatrix"), false, normalMatrix.elements);
}

main();
