class Cube {
    constructor() {
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = -1;
    }
    
    setColor(r, g, b, a) {
        this.color = [r, g, b, a];
    }
    
    setTexture(num) {
        this.textureNum = num;
    }
    
    translate(x, y, z) {
        this.matrix.translate(x, y, z);
    }
    
    rotate(angle, x, y, z) {
        this.matrix.rotate(angle, x, y, z);
    }
    
    scale(x, y, z) {
        this.matrix.scale(x, y, z);
    }
    
    render(gl, program, camera) {
        let u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
        let u_ViewMatrix = gl.getUniformLocation(program, 'u_ViewMatrix');
        let u_ProjectionMatrix = gl.getUniformLocation(program, 'u_ProjectionMatrix');
        let u_Color = gl.getUniformLocation(program, 'u_Color');
        let u_TexColorWeight = gl.getUniformLocation(program, 'u_TexColorWeight');
        let u_WhichTexture = gl.getUniformLocation(program, 'u_WhichTexture');
        
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
        gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
        gl.uniform4fv(u_Color, this.color);
        
        if (this.textureNum >= 0) {
            gl.uniform1f(u_TexColorWeight, 1.0);
            gl.uniform1i(u_WhichTexture, this.textureNum);
        } else {
            gl.uniform1f(u_TexColorWeight, 0.0);
            gl.uniform1i(u_WhichTexture, 0);
        }
        
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
    
    static vertices() {

        return new Float32Array([
            // Front
            -0.5, -0.5,  0.5,  0.0, 0.0,
             0.5, -0.5,  0.5,  1.0, 0.0,
             0.5,  0.5,  0.5,  1.0, 1.0,
            -0.5, -0.5,  0.5,  0.0, 0.0,
             0.5,  0.5,  0.5,  1.0, 1.0,
            -0.5,  0.5,  0.5,  0.0, 1.0,
            // Back
             0.5, -0.5, -0.5,  0.0, 0.0,
            -0.5, -0.5, -0.5,  1.0, 0.0,
            -0.5,  0.5, -0.5,  1.0, 1.0,
             0.5, -0.5, -0.5,  0.0, 0.0,
            -0.5,  0.5, -0.5,  1.0, 1.0,
             0.5,  0.5, -0.5,  0.0, 1.0,
            // Top
            -0.5,  0.5,  0.5,  0.0, 0.0,
             0.5,  0.5,  0.5,  1.0, 0.0,
             0.5,  0.5, -0.5,  1.0, 1.0,
            -0.5,  0.5,  0.5,  0.0, 0.0,
             0.5,  0.5, -0.5,  1.0, 1.0,
            -0.5,  0.5, -0.5,  0.0, 1.0,
            // Bottom
            -0.5, -0.5, -0.5,  0.0, 0.0,
             0.5, -0.5, -0.5,  1.0, 0.0,
             0.5, -0.5,  0.5,  1.0, 1.0,
            -0.5, -0.5, -0.5,  0.0, 0.0,
             0.5, -0.5,  0.5,  1.0, 1.0,
            -0.5, -0.5,  0.5,  0.0, 1.0,
            // Right
             0.5, -0.5,  0.5,  0.0, 0.0,
             0.5, -0.5, -0.5,  1.0, 0.0,
             0.5,  0.5, -0.5,  1.0, 1.0,
             0.5, -0.5,  0.5,  0.0, 0.0,
             0.5,  0.5, -0.5,  1.0, 1.0,
             0.5,  0.5,  0.5,  0.0, 1.0,
            // Left
            -0.5, -0.5, -0.5,  0.0, 0.0,
            -0.5, -0.5,  0.5,  1.0, 0.0,
            -0.5,  0.5,  0.5,  1.0, 1.0,
            -0.5, -0.5, -0.5,  0.0, 0.0,
            -0.5,  0.5,  0.5,  1.0, 1.0,
            -0.5,  0.5, -0.5,  0.0, 1.0
        ]);
    }
    
}
