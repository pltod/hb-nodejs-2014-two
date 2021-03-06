// LIBS
var _ = require("underscore");
var csp = require("js-csp");
var start = csp.go;
var storage = require("./storage");
var producers = require("./producers");
var cutil = require("./canvas-util");

var selectFile = document.getElementById("selectFile");
var colorPicker = document.getElementById("colorPicker");

// STATE
var fileNameToSave = document.getElementById("fname");
var fileNameToOpen = ""


// START CONSUMER CHANNELS
start(canvasClickHandler);
start(selectOnChangeHandler);
start(resetButtonHandler);
start(storeButtonHandler);
start(openButtonHandler);
start(colorPickerHandler);



// INITIALIZATION
initSelectBox();
initColorPicker();

function initColorPicker() {
  var defaultColor = "#62a2fc";
  colorPicker.value = defaultColor;
}

function initSelectBox() {
  var drawingNames = storage.getAllDrawingNames();
  if (!_.isEmpty(drawingNames)) {
    var html = _.reduce(drawingNames, function (memo, name, index) {
      if (index == 0) {
        //Sets the current selection to the first file in the list after each reinitialisation
        console.log(name);
        fileNameToOpen = name;
      }
      return memo.concat("<option value=" + name + ">" + name + "</option>");
    }, "");
    selectFile.innerHTML = html;
  }  
}

// LOGIC
function *colorPickerHandler() {
  while (true) {
    var event = yield csp.take(producers.channelColorPicker);
    event.srcElement ? colorPicker.value = event.srcElement.value : colorPicker.value = event.target.value
  }
}

function *openButtonHandler() {
  while (true) {
    var event = yield csp.take(producers.channelOpenButton);
    var drawing = storage.find(fileNameToOpen);
    if (null !== drawing) {
      cutil.visualiseDrawing(drawing);
    }
  }
}

function *storeButtonHandler() {
  while (true) {
    var event = yield csp.take(producers.channelStoreButton);
    if (hasWhiteSpace(fileNameToSave.innerHTML)) {
      alert('Please do not use spaces in your file names! Letters and numbers are ok!')
    } else {
      storage.save(fileNameToSave.innerHTML, canvas.toDataURL());
      fileNameToSave.innerHTML = "";
      initSelectBox();
    }
  }
}

function *resetButtonHandler() {
  while (true) {
    var event = yield csp.take(producers.channelResetButton);
    cutil.clearCanvas();
  }
}

function *selectOnChangeHandler() {
  while (true) {
    var event = yield csp.take(producers.channelSelectFile);
    event.srcElement ? fileNameToOpen = event.srcElement.value : fileNameToOpen = event.target.value;
  }
}

function *canvasClickHandler() {
  var counter = 1;
  var points = [];
  while (true) {
    var event = yield csp.take(producers.channelCanvas);
    
    if (counter < 3) { 
      points.push(cutil.getCoordinates(event)); 
      counter++;
    } else {
      points.push(cutil.getCoordinates(event)); 
      cutil.drawTriangle(points, colorPicker.value);
      counter = 1;
      points = [];
    }
  }
}

// UTIL

function hasWhiteSpace(s) {
  return s.indexOf(' ') >= 0;
}
