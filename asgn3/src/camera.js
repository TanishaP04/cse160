// Camera class
class Camera {
    constructor(canvas) {
        this.fov = 60;
        this.canvas = canvas;
        this.speed = 0.2;
        this.rotationSpeed = 5;
        
        this.eye = new Vector3([0, 1.5, 5]);
        this.at = new Vector3([0, 1.5, 4]);
        this.up = new Vector3([0, 1, 0]);
        
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }
    
    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }
    
    updateProjectionMatrix() {
        this.projectionMatrix.setPerspective(
            this.fov,
            this.canvas.width / this.canvas.height,
            0.1,
            1000
        );
    }
    
    moveForward() {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.elements[1] = 0;
        f.normalize();
        f.mul(this.speed);
        
        this.eye.elements[0] += f.elements[0];
        this.eye.elements[2] += f.elements[2];
        this.at.elements[0] += f.elements[0];
        this.at.elements[2] += f.elements[2];
        
        this.updateViewMatrix();
    }
    
    moveBackwards() {
        let b = new Vector3();
        b.set(this.eye);
        b.sub(this.at);
        b.elements[1] = 0;
        b.normalize();
        b.mul(this.speed);
        
        this.eye.elements[0] += b.elements[0];
        this.eye.elements[2] += b.elements[2];
        this.at.elements[0] += b.elements[0];
        this.at.elements[2] += b.elements[2];
        
        this.updateViewMatrix();
    }
    
    moveLeft() {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.elements[1] = 0;
        f.normalize();
        
        let s = Vector3.cross(this.up, f);
        s.normalize();
        s.mul(this.speed);
        
        this.eye.elements[0] += s.elements[0];
        this.eye.elements[2] += s.elements[2];
        this.at.elements[0] += s.elements[0];
        this.at.elements[2] += s.elements[2];
        
        this.updateViewMatrix();
    }
    
    moveRight() {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.elements[1] = 0;
        f.normalize();
        
        let s = Vector3.cross(f, this.up);
        s.normalize();
        s.mul(this.speed);
        
        this.eye.elements[0] += s.elements[0];
        this.eye.elements[2] += s.elements[2];
        this.at.elements[0] += s.elements[0];
        this.at.elements[2] += s.elements[2];
        
        this.updateViewMatrix();
    }
    
    panLeft() {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(this.rotationSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        
        this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
        this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
        this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
        
        this.updateViewMatrix();
    }
    
    panRight() {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(-this.rotationSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        
        this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
        this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
        this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
        
        this.updateViewMatrix();
    }
}
