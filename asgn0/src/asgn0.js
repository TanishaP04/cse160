let ctx; //make ctx global
function main(){
    //Retrieve <canvas> element 
    var canvas = document.getElementById('example');
    if(!canvas){
        console.log('Failed to retrieve the <canvas> element');
        return false;
    }
    //Get the rendering context for 2DCG
    var ctx = canvas.getContext("2d");

    //Draw a blue rectangle
    //ctx.fillStyle = 'rgba(0,0,255,1.0)'; //set blue color
    //ctx.fillRect(120,10,150,150); //fill a rectangle with the color

    //red line
    let v1 = new Vector3[(2.25,2.25,0)];
    drawVector(v1,"red");
}

function drawVector(v,color){
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(200,200)
    ctx.lineTo(
        200 + v.elements[0] * 20,
        200 - v.elements[1] * 20
    );
    ctx.stroke();
}
