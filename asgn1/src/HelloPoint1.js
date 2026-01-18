//HelloPoint1.js
//Vertex shader program

var VSHADER_SOURCE = 
    'void main() {\n' +
    '   gl_Position = vec4(0.0, 0.0, 0.0, 1.0); \n' + //coordinates 
    '   gl_PointSize = 10.0; \n' + // Set point size
    '}\n';

//Fragment shader program
var FSHADER_SOURCE = 
    'void main() {\n' + 
    ' gl_FragColor = vec4(1.0,0.0, 0.0, 1.0);\n' + //set the color
    '}\n';

function main(){
    //Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    //Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl){
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    //initialize shaders
    if(!initShader(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }

    //set the color for clearning <canvas>
    gl.clearColor(0.0, 0.0, 0,0, 1.0);

    //clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    //Draw a point
    gl.drawArrays(gl.POINTS, 0,1);
}