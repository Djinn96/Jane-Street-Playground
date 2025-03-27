//add listeners
//document.getElementById("grid-container").addEventListener("click", clickGrid);


const gridsize = 50;

const letters = getLetters();

const row = 5;
const col = 5;

const Direction = {
    Up:    [ 0,-1],
    Down:  [ 0, 1],
    Left:  [-1, 0],
    Right: [ 1, 0],
};

const LaserPos = ["top","bot","left","right"];

function createGrid(){
    let node = document.getElementById("grid")
    if (node) {node.remove()}
    node = document.createElement("div")
    node.setAttribute("id","grid")
    node.addEventListener("click", clickGrid);
    node.style.width  = (col*gridsize+1) + "px";
    node.style.height = (row*gridsize+1) + "px";
    document.getElementById("grid-container").appendChild(node);
    addGridLetters(node);
    addLaserCanvas(node,row,col);
    // add laser sliders
    for (let posStr of LaserPos) { addLaserSlide(node,posStr); }
    calcAndDrawLasers();
}

createGrid();

function getLetters() {
    return [
        ['A','R','P','M','E'],
        ['M','Y','A','E','P'],
        ['U','L','O','L','N'],
        ['L','E','M','O','K'],
        ['P','N','A','D','N'],
    ]
}

function getHint() {
    return "Fruits"
}

function addGridLetters(node) {
    for (let i=0;i<col;i++){
        for (let j=0;j<row;j++){
            const letter = document.createElement("div");
            letter.innerHTML = letters[i][j];
            letter.setAttribute("id","letter-"+i+"-"+j);
            letter.classList.add("letter");
            letter.style.top    = j*gridsize+"px";
            letter.style.left   = i*gridsize+"px";
            node.appendChild(letter);
        }
    }
}

function addLaserCanvas(node,row,col){
    const canvas = document.createElement("canvas");
    canvas.setAttribute("id","laser-canvas");
    canvas.height = (row+1)*gridsize;
    canvas.width  = (col+1)*gridsize;
    canvas.style.position = "absolute";
    canvas.style.top  = -(gridsize/2)+"px";
    canvas.style.left = -(gridsize/2)+"px";
    node.appendChild(canvas);
}

function clickGrid(event){
    const node = document.getElementById('grid');
    if (!node) { return }
    var offsets = node.getBoundingClientRect();
    //console.log('Mouse X:', event.clientX, 'Mouse Y:', event.clientY);
    const posX = event.clientX - offsets.left;
    const posY = event.clientY - offsets.top ;
    const boxX = parseInt(node.style.width.replace( "px",""));
    const boxY = parseInt(node.style.height.replace("px",""));
    if (posX < 0 || posX > boxX || posY < 0 || posY > boxY) { return }

    const gridX = Math.floor(posX/gridsize);
    const gridY = Math.floor(posY/gridsize);
    //const col = Math.floor(parseInt(node.style.width.replace( "px",""))/gridsize);
    //const row = Math.floor(parseInt(node.style.height.replace("px",""))/gridsize);
    //if (gridX < 0 || gridX > 9 || gridY < 0 || gridY > 9) { return }
    addMirror(gridX,gridY)
    calcAndDrawLasers();
}

function addMirror(x,y){
    const thisID = "mirr-"+x+"-"+y;
    const letterID = "letter-"+x+"-"+y;
    const checkNode = document.getElementById(thisID)
    const letterNode = document.getElementById(letterID)
    if (checkNode) {
        if (checkNode.classList.contains("mirror-bac")) {
            checkNode.classList.remove("mirror-bac")
            checkNode.classList.add("mirror-for")
        }
        else if (checkNode.classList.contains("mirror-for")) {
            checkNode.remove()
            letterNode.classList.toggle("hide-letter")
        }
    }
    else {
        const node = document.createElement("div");
        node.setAttribute("id",thisID)
        node.classList.add("mirror-bac");
        node.style.position = "absolute";
        node.style.left = (gridsize*x+5)+"px";
        node.style.top  = (gridsize*y+5)+"px";
        document.getElementById("grid").appendChild(node);
        letterNode.classList.toggle("hide-letter")
    }
}

// TODO: Many hardcoded position values for slider, need to find way to generalize relative to gridsize
function addLaserSlide(node,posStr) {
    // add slider
    const laserSlide = document.createElement("input");
    laserSlide.classList.add("laser-slide");
    laserSlide.setAttribute("id","laser-"+posStr);
    laserSlide.type = "range"; laserSlide.min = 0; laserSlide.max = 4; laserSlide.step = 1;
    var posX = 0; var posY = 0; var offsetX = 0; var offsetY = 0;
    if (posStr=="left" || posStr=="right") {laserSlide.style.width = 20+"px";laserSlide.style.height= 225+"px";laserSlide.style.writingMode = "vertical-lr";}
    else                                   {laserSlide.style.height= 20+"px";laserSlide.style.width = 225+"px";}
    switch(posStr)
    {
        case "left" : posX += -35; posY +=  10; laserSlide.value = 1; offsetX += -110; offsetY += 110; break;
        case "right": posX += 265; posY +=  10; laserSlide.value = 3; offsetX +=   30; offsetY += 110; break;
        case "top"  : posX +=  10; posY += -35; laserSlide.value = 3; offsetX +=   60; offsetY += -30; break;
        case "bot"  : posX +=  10; posY += 265; laserSlide.value = 1; offsetX +=   60; offsetY +=  30; break;
    }
    laserSlide.style.left = posX+"px";
    laserSlide.style.top  = posY+"px";
    laserSlide.addEventListener("input",calcAndDrawLasers);
    node.appendChild(laserSlide);

    const label = document.createElement("div");
    label.style.left = posX+offsetX+"px";
    label.style.top  = posY+offsetY+"px";
    label.setAttribute("id","laser-"+posStr+"-label");
    label.classList.add("laser-label");
    label.innerHTML += 'LONGTEST';
    node.appendChild(label);
}

function resetPuzzle() {
    createGrid();
}

function showHint() {
    const hintBox = document.getElementById("hint-box");
    hintBox.innerHTML = getHint();
}

// ==============================================================================
// laser calculation for rendering
// ==============================================================================

function calcAndDrawLasers() {
    const canvas = document.getElementById("laser-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //start with first one
    const lasers = document.getElementsByClassName("laser-slide");
    for (let laser of lasers) { calcDrawUpdateSingleLaser(ctx,laser); }
}

function calcDrawUpdateSingleLaser(ctx,laser) {
    const id = laser.id;
    const posStr = id.split("-")[1];
    const sliderVal = Number(laser.value);
    const labelID = id+"-label";

    var laserPos = initLaserPos(posStr,sliderVal);
    var laserDir = initLaserDirection(posStr);
    var canvasPos = laserPos.map((n)=>((n+1)*gridsize));
    var laserSegments = [];
    // Start a new Path
    ctx.beginPath();
    ctx.moveTo(canvasPos[0], canvasPos[1]);
    // calculate path
    while (true) {
        laserPos = laserMoveForward(laserPos,laserDir);
        canvasPos = laserPos.map((n)=>((n+1)*gridsize));
        ctx.lineTo(canvasPos[0], canvasPos[1]);
        if (!checkLaserInGrid(laserPos)) {break;} // break before adding to segments

        const lastLaserDir = laserDir
        laserDir = laserChangeDirection(laserDir,checkMirror(laserPos));
        if (lastLaserDir[0] == laserDir[0] && lastLaserDir[1] == laserDir[1]) {
            const letter = letters[laserPos[0]][laserPos[1]];
            if (letter) {laserSegments.push(letter)}
        }
    }
    // update label
    updateLaserLabel(labelID,laserSegments);
    // Draw the Path
    switch(id.split("-")[1])
    {
        case "top":   ctx.strokeStyle = "rgba(244, 67, 54,0.5)"; break;
        case "bot":   ctx.strokeStyle = "rgba( 33,150,243,0.5)"; break;
        case "left":  ctx.strokeStyle = "rgba( 76,175, 80,0.5)"; break;
        case "right": ctx.strokeStyle = "rgba(255,235, 59,0.5)"; break;
    }
    ctx.lineWidth = 20;
    ctx.stroke();
}

function updateLaserLabel(id,valArray) {
    const label = document.getElementById(id);
    var value = valArray.join("");
    //console.log(valArray,value)
    label.innerHTML = value;
}

function initLaserPos(posStr,sliderVal) {
    switch (posStr) {
        case "left":  return [ -1,sliderVal];
        case "right": return [col,sliderVal];
        case "top":   return [sliderVal, -1];
        case "bot":   return [sliderVal,row];
    }
}

function initLaserDirection(posStr) {
    switch (posStr) {
        case "left":  return Direction.Right;
        case "right": return Direction.Left;
        case "top":   return Direction.Down;
        case "bot":   return Direction.Up;
    }
}

function checkMirror(posArr) {
    const mirrID = "mirr-"+posArr[0]+"-"+posArr[1];
    const mirr = document.getElementById(mirrID);
    if (mirr) { return mirr.classList[0] }
    return "none";
}

function laserChangeDirection(dirArr, mirrType) {
    var mirror = []
    switch (mirrType) {
        case "mirror-bac": mirror = [[0, 1],[ 1,0]]; break;
        case "mirror-for": mirror = [[0,-1],[-1,0]]; break;
        case "none":     return dirArr;
    }
    //console.log(dirArr,mirrType,mirror)

    return [
        dirArr.map((n, idx) => n * mirror[0][idx]).reduce((a, v) => a + v, 0),
        dirArr.map((n, idx) => n * mirror[1][idx]).reduce((a, v) => a + v, 0)
        ]

}

function checkLaserInGrid(posArr) {
    if (posArr[0] < 0 || posArr[0] >= col || posArr[1] < 0 || posArr[1] >= row) { return false; }
    return true;
}

function laserMoveForward(posArr,dirArr) { return posArr.map((n, idx) => n + dirArr[idx]); }


