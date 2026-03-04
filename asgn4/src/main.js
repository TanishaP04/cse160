let gl;
let lightingOn = true;
let normalVis = false;
let spotOn = true;

let lightPos = [2,2,2];
let cameraAngle = 45;

function main() {
    const canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl');

    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    const cube = createCube();
    initBuffers(cube);

    document.getElementById("lightingBtn").onclick = () => lightingOn = !lightingOn;
    document.getElementById("normalBtn").onclick = () => normalVis = !normalVis;
    document.getElementById("spotBtn").onclick = () => spotOn = !spotOn;

    document.getElementById("lightX").oninput = e => lightPos[0] = parseFloat(e.target.value);
    document.getElementById("cameraAngle").oninput = e => cameraAngle = parseFloat(e.target.value);

    tick();

    loadOBJ("model.obj", function(objData) {
        initBuffers(objData);
        render();
    });
}

function initBuffers(obj) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.vertices), gl.STATIC_DRAW);

    const a_Position = gl.getAttribLocation(gl.program, "a_Position");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.normals), gl.STATIC_DRAW);

    const a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);
}

function tick() {
    lightPos[2] = 2*Math.sin(Date.now()*0.001);
    render();
    requestAnimationFrame(tick);
}

function render() {
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const modelMatrix = new Matrix4();
    const viewMatrix = new Matrix4();
    const projMatrix = new Matrix4();
    const normalMatrix = new Matrix4();

    viewMatrix.setLookAt(
        5*Math.cos(cameraAngle*Math.PI/180), 3, 
        5*Math.sin(cameraAngle*Math.PI/180),
        0,0,0, 0,1,0
    );

    projMatrix.setPerspective(60, 800/600, 1, 100);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program,"u_ModelMatrix"), false, modelMatrix.elements);
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program,"u_ViewMatrix"), false, viewMatrix.elements);
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program,"u_ProjMatrix"), false, projMatrix.elements);
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program,"u_NormalMatrix"), false, normalMatrix.elements);

    gl.uniform3fv(gl.getUniformLocation(gl.program,"u_LightPos"), lightPos);
    gl.uniform3fv(gl.getUniformLocation(gl.program,"u_ViewPos"), [0,3,5]);
    gl.uniform3fv(gl.getUniformLocation(gl.program,"u_LightColor"), [1,1,1]);

    gl.uniform1i(gl.getUniformLocation(gl.program,"u_LightingOn"), lightingOn);
    gl.uniform1i(gl.getUniformLocation(gl.program,"u_NormalVis"), normalVis);
    gl.uniform1i(gl.getUniformLocation(gl.program,"u_SpotOn"), spotOn);

    gl.uniform3fv(gl.getUniformLocation(gl.program,"u_SpotDirection"), [0,-1,0]);
    gl.uniform1f(gl.getUniformLocation(gl.program,"u_SpotCutoff"), 0.8);

    objVertexCount = objData.vertices.length / 3; 
    gl.drawArrays(gl.TRIANGLES, 0, objVertexCount);}


main();
