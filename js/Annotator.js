/*
Bertifier, crafting tabular visualizations, v1
(c) 2014-2014, Inria
Authors: PERIN Charles, DRAGICEVIC Pierre, FEKETE Jean-Daniel

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


 Some inspiration from https://code.google.com/p/svg-edit/ Creative Commons 3.0 BY-SA
 */

import {ANNOTATION_COMMANDS, KEY_CODES_INPUT_TEXT, KEY_CODES_MAP, MENU_BUTTONS_SIZE} from './Settings.js';

export default function Annotator(bertin, params){
  this.bertin = bertin;
  this.params = params;
  this.init();
}

Annotator.prototype.init = function(){
  var $this = this;
  this.annotations = [];
  this.commands = ANNOTATION_COMMANDS.map(function(command){
    return new Command($this,command)
  });
  this.annotationLayer = this.bertin.svg.select(".root").insert("g",".settings-group").attr("id","annotations");
  this.annotationsMenu = d3.select("body")
      .append("div")
      .attr("class","annotationArea")
      .style({
        left: (this.params.x+this.params.margin.left)+"px",
        top: (this.params.y+this.params.margin.top)+"px",
        width: (this.params.width-this.params.margin.right)+"px",
        height: (this.params.margin.top + 5 + this.params.margin.bottom + MENU_BUTTONS_SIZE)+"px",
        "background-color": this.params.annotationArea.fill,
        opacity: 0
      })
      .on({
        mouseenter: function(){$this.bertin.showTopMenu(true)},
        mouseleave: function(){$this.bertin.showTopMenu(false)}
      });

  this.annotationsMenu.selectAll(".annotationCommand")
      .data(this.commands)
      .enter()
      .append("div")
      .attr("class","annotationCommand")
      .style("width", MENU_BUTTONS_SIZE+"px")
      .style("height", MENU_BUTTONS_SIZE+"px")
      .style("margin-top",5+"px")
      .style("margin-left",function(d,i){return (5+i*(5+MENU_BUTTONS_SIZE))+"px"})
      .style("font-size", "9px")
      .style("line-height", "1.4em")
      .on("mouseenter", function(d){
        $this.bertin.descriptionArea.showButtonDescription(d.command);
        if(!d.active)d3.select(this).style($this.params.hoverStyle);
      })
      .on("mouseleave", function(d){
        $this.bertin.descriptionArea.hideDescription();
        if(!d.active)d3.select(this).style($this.params.unactiveStyle);
      })
      .on("click", function(d) {
        d3.event.preventDefault();
        d.clickCommand();
      })
      .each(function(d){
        d.button = d3.select(this);

        d.button.append("img")
            .attr({
              src: function(d){return $this.bertin.getIcon("annotation_"+d.command.action)}
            })
            .style("margin-left", 2+"px")
            .style("margin-top", 2+"px")
            .style("width", (MENU_BUTTONS_SIZE-4)+"px")
            .style("height", (MENU_BUTTONS_SIZE-4)+"px");
      });
  //.text(function(d){return "Download "+ d.name})

};

Annotator.prototype.showAnnotationArea = function(show){
  var mode = show ? "show" : "hide";
  if(!show && this.oneCommandActive()) return;
  this.annotationsMenu.transition()
        .duration(this.params.annotationArea[mode].duration)
        .delay(this.params.annotationArea[mode].delay)
        .style("opacity", show ? 1 : 0);
};

Annotator.prototype.deactivateCommands = function(){
  this.commands.forEach(function(d){d.deactivateCommand()})
};

Annotator.prototype.purgeAnnotations = function(){
  this.annotations.forEach(function(annotation){
    annotation.endEdit();
  });
};

Annotator.prototype.deactivateListen = function(){
  this.annotations.forEach(function(annotation){
    annotation.deactivateListen();
  });
};

Annotator.prototype.oneCommandActive = function(){
  var oneActive = false;
  for(var c in this.commands){
    //noinspection JSUnfilteredForInLoop
    if(this.commands[c].active){
      oneActive = true;
      break;
    }
  }
  return oneActive;
};

/*
Called when expand/collapse commands
 */
Annotator.prototype.updateAnnotationsPos = function(duration){
  var matCoords = this.bertin.getMatrixCoordinates();
  this.annotationLayer.selectAll(".annotation").transition().duration(duration).attr("transform",function(d){
    d.x = matCoords.x1 + d.relTr[0];
    d.y = matCoords.y1 + d.relTr[1];
    return "translate("+[d.x, d.y]+") rotate("+ d.r+")"
  });
};




function Command(annotator, command){
  this.annotator = annotator;
  this.command = command;
  this.active = false;
}

Command.prototype.clickCommand = function(){
  if(!this.active){
    this.activateCommand();
  }
  else{
    this.deactivateCommand();
  }
  if(this.annotator.oneCommandActive()){
    this.annotator.bertin.commands.setCommandsActivable(false);
  }
  else{
    this.annotator.bertin.commands.setCommandsActivable(true);
    this.annotator.deactivateListen();
  }
};


Command.prototype.activateCommand = function(){
  var $this = this;
  this.annotator.deactivateCommands();
  this.active = true;
  d3.selectAll("body,body svg").style("cursor", function(){
    if($this.command.action == "move") return $this.command.action;
    return $this.annotator.bertin.getCursor("annotation_"+$this.command.action, $this.command.hotspot)
  });
  this.button.style(this.annotator.params.activeStyle);
  this.activateEventHandler();
};

Command.prototype.deactivateCommand = function(){
  this.active = false;
  d3.selectAll("body,body svg").style("cursor","default");
  this.button.style(this.annotator.params.unactiveStyle);
  if(this.command.action == "create"){
    this.annotator.purgeAnnotations();
  }
  this.deactivateEventHandler();
};

Command.prototype.deactivateEventHandler = function(){
  switch(this.command.action){
    case "create":
      this.annotator.bertin.svg.on("click", null);
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenCreate(false);
      });
      break;
    case "remove":
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenRemove(false);
      });
      break;
    case "light":
    case "regular":
    case "bold":
    case "italic":
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenFontStyle(false);
      });
      break;
    case "larger":
    case "smaller":
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenFontSize(false);
      });
      break;
    case "rotate_clockwise":
    case "rotate_counterclockwise":
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenRotate(false);
      });
      break;
    case "move":
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenMove(false);
      });
      break;
    default: console.error("invalid action",this.command);
  }
};

Command.prototype.activateEventHandler = function(){
  var $this = this;
  switch(this.command.action){
    case "create":
      this.annotator.bertin.svg.on("click", function(){
        var coords = d3.mouse($this.annotator.annotationLayer.node());
        d3.event.preventDefault();
        d3.event.stopPropagation();
        //validate the annotations which were not explicetely done
        $this.annotator.purgeAnnotations();
        new Annotation($this.annotator, coords[0], coords[1]);
      });
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenCreate(true);
      });
      break;
    case "remove":
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenRemove(true);
      });
      break;
    case "light":
    case "regular":
    case "bold":
    case "italic":
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenFontStyle($this.command.action);
      });
      break;
    case "larger":
    case "smaller":
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenFontSize($this.command.action);
      });
      break;
    case "rotate_clockwise":
    case "rotate_counterclockwise":
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenRotate($this.command.action);
      });
      break;
    case "move":
      this.annotator.annotations.forEach(function(annotation){
        annotation.listenMove(true);
      });
      break;
    default: console.error("invalid action",this.command);
  }
};






function Annotation(annotator,x,y){
  this.annotator = annotator;
  this.x = x;
  this.y = y;
  this.annotator.annotations.push(this);
  this.charData = [];
  this.init();
  this.listenCreate(true);
  this.edit();
}

Annotation.prototype.init = function(){
  this.dragBehavior = d3.behavior.drag()
      .origin(Object);

  var matCoords = this.annotator.bertin.getMatrixCoordinates();
  this.group = this.annotator.annotationLayer.selectAll("#annotation-"+this.annotator.annotations.indexOf(this))
      .data([{x: this.x, y: this.y, r: 0, relTr: [this.x - matCoords.x1, this.y - matCoords.y1]}])
      .enter()
      .append("g")
      .attr("transform", function(d){return "translate("+[d.x, d.y]+")"})
      .attr("class","annotation")
      .attr("id","annotation-"+this.annotator.annotations.indexOf(this))
      .call(this.dragBehavior);

  var height = 20;

  this.fontSizes = [8,10,12,14,16,18,20,22,24,28,32,36,40,48,56,64,72,144];
  this.fontWeight = "Regular";
  this.fontSizeIndex = 4;
  this.fontRotate = 0;
  this.fontItalic = false;

  this.background = this.group.append("rect")
      .style({
        fill: this.annotator.params.hoverAnnotation.fill,
        opacity: this.annotator.params.hoverAnnotation.opacityOff,
        stroke: this.annotator.params.hoverAnnotation.stroke,
        strokeWidth: this.annotator.params.hoverAnnotation.strokeWidth
      })
      .attr("class","background");

  this.text = this.group.append("text")
      .style("font",this.getFont())
      .attr({
        "xml:space": "preserve"
      });

  this.caretData = {
    show: false,
    index: -1
  };

  this.caret = this.group.selectAll(".caret")
      .data([this.caretData])
      .enter()
      .append("line")
      .style("stroke","black")
      .attr({
        class: "caret",
        x1: 0,
        x2: 0,
        y1: - height,
        y2: 0
      })
      .style("opacity",0);
};

Annotation.prototype.getFont = function(){
  return this.fontSizes[this.fontSizeIndex]+"px RobotoCondensed-"+this.fontWeight+(this.fontItalic ? "-Italic" : "");
};

Annotation.prototype.updateAnnotation = function(type){
  var $this = this;
  if(type == "text"){
    updateText();
    updateCaret();
  }
  else if(type == "caret"){
    updateCaret();
  }
  else if(type == "font"){
    updateFont();
    updateCaret();
  }
  else if(type == "rotate"){
    updateRotate();
  }
  else console.error("invalid type",type);

  function updateRotate(){
    var bbox = $this.getAnnotationBBox();
    $this.group.attr("transform", function(d){
      d.r = $this.fontRotate;
      return "translate("+[d.x,d.y]+") rotate("+d.r+" "+(bbox.width/2)+" "+(-bbox.height/2)+")";
    });
  }
  function updateFont(){
    $this.text.style("font",$this.getFont());
  }
  function updateText(){
    $this.text.text($this.charData.join(""));
  }
  function updateCaret(){//update the carret position according to its index
    var trX = 0;
    if($this.caretData.index >= 0){
      trX = $this.text[0][0].getEndPositionOfChar($this.caretData.index).x;
    }
    $this.caret.attr("transform", "translate("+[trX,0]+")");
  }
  this.background.attr(this.getAnnotationBBox());
};

Annotation.prototype.setKeyboardFocus = function(isFocus){
  var $this = this;
  if(isFocus) d3.select("body").on("keydown", function(){$this.keyPressed()});
  else d3.select("body").on("keydown",null);
};

Annotation.prototype.keyPressed = function(){
  var keyCode = d3.event.keyCode;
  if(KEY_CODES_INPUT_TEXT.indexOf(keyCode) != -1){//just input text
    d3.event.preventDefault();
    d3.event.stopPropagation();
    var char = KEY_CODES_MAP[keyCode];
    if(d3.event.shiftKey) char = char.toUpperCase();
    this.charData.splice(this.caretData.index+1,0,char);
    this.caretData.index++;
    this.updateAnnotation("text");
  }
  else switch(KEY_CODES_MAP[keyCode]){
    case "enter":
      d3.event.preventDefault();
      this.endEdit();
      break;
    case "end":
      d3.event.preventDefault();
      this.caretData.index=this.charData.length-1;
      this.updateAnnotation("caret");
      break;
    case "home":
      d3.event.preventDefault();
      this.caretData.index=-1;
      this.updateAnnotation("caret");
      break;
    case "left arrow":
      d3.event.preventDefault();
      if(this.caretData.index >= 0){
        this.caretData.index--;
        this.updateAnnotation("caret");
      }
      break;
    case "right arrow":
      d3.event.preventDefault();
      if(this.caretData.index < this.charData.length-1){
        this.caretData.index++;
        this.updateAnnotation("caret");
      }
      break;
    case "delete":
      d3.event.preventDefault();
      if(this.caretData.index < this.charData.length-1){
        this.charData.splice(this.caretData.index+1,1);
        this.updateAnnotation("text");
      }
      break;
    case "backspace":
      d3.event.preventDefault();
      if(this.charData.length > 0){
        this.charData.splice(this.caretData.index,1);
        this.caretData.index--;
        this.updateAnnotation("text");
      }
      break;
    case "escape":
      d3.event.preventDefault();
      this.annotator.commands.forEach(function(d){d.deactivateCommand()});
      break;
  }
};

Annotation.prototype.endEdit = function(){
  this.setKeyboardFocus(false);
  this.caret.style("opacity",0);
  if(this.blinker){
    clearInterval(this.blinker);
    this.blinker = null;
  }

  if(this.charData.length == 0){
    this.remove();
  }
  else{
    this.background.attr(this.getAnnotationBBox());
  }
};

Annotation.prototype.getAnnotationBBox = function(){
  return this.group.node().getBBox();
};


Annotation.prototype.drag = function(){
  this.group.attr("transform", function(d){
    d.x = d3.event.x;
    d.y = d3.event.y;
    return "translate("+[d.x,d.y]+") rotate("+d.r+")";
  });
};

Annotation.prototype.dragEnd = function(){
  var matCoords = this.annotator.bertin.getMatrixCoordinates();
  this.group.each(function(d){
    d.relTr = [d.x - matCoords.x1, d.y - matCoords.y1];
  });
};

Annotation.prototype.edit = function(coords){
  d3.event.stopPropagation();
  var $this = this;
  if(!this.blinker)
    this.blinker = setInterval(function() {
      $this.caretData.show = !$this.caretData.show;
      $this.caret.style("opacity", function(d){
        return d.show ? 1 : 0;
      });
    }, 600);

  this.setKeyboardFocus(true);

  if(!coords){//if create
  }
  else{//if edit existing annotation
    //this.caretData.index = this.getCharIndexFromPoint(coords);
    this.caretData.index = this.charData.length - 1;
    this.updateAnnotation("caret");
  }


};

Annotation.prototype.getCharIndexFromPoint = function(coords) {//TODO - does not work well
  // No content, so return 0
  if(this.charData.length == 0) return -1;
  // Determine if cursor should be on left or right of character

  var pt = this.annotator.bertin.svg[0][0].createSVGPoint();
  pt.x = coords.x;
  pt.y = coords.y;

  // No content, so return 0: cannot happen
  if(this.charData.length == 0) return -1;
  // Determine if cursor should be on left or right of character
  var charpos = this.text[0][0].getCharNumAtPosition(pt);

  if(coords.x < this.text[0][0].getEndPositionOfChar(0).x){
    charpos = -1;
  }
  else if(coords.x > this.text[0][0].getEndPositionOfChar(this.charData[this.charData.length-1]).x){
    charpos = this.charData.length - 1;
  }

return charpos;
};



Annotation.prototype.remove = function(){
  this.group.remove();
  this.annotator.annotations.splice(this.annotator.annotations.indexOf(this),1);
};

/*
type: light, regular, bold, italic
 */
Annotation.prototype.applyStyle = function(type){
  switch(type){
    case "light":
    case "regular":
    case "bold":
        this.fontWeight = type.capitalizeFirst();
      break;
    case "italic":
        this.fontItalic = !this.fontItalic;
      break;
    default: console.error("invalid type",type);
  }
  this.updateAnnotation("font");
};

/*
type: larger, smaller
 */
Annotation.prototype.applyFontSize = function(type){
  if(type == "smaller"){
    this.fontSizeIndex = Math.max(this.fontSizeIndex-1,0)
  }
  else if(type == "larger"){
    this.fontSizeIndex = Math.min(this.fontSizeIndex+1,this.fontSizes.length-1);
  }
  else console.error("invalid type",type);
  this.updateAnnotation("font");
};

/*
type: rotate_clockwise, rotate_counterclockwise
 */
Annotation.prototype.applyRotate = function(type){
  if(type == "rotate_clockwise") this.fontRotate += 45;
  else if(type == "rotate_counterclockwise") this.fontRotate -= 45;
  else console.error("invalid type",type);
  this.fontRotate %= 360;
  this.updateAnnotation("rotate");
};


Annotation.prototype.listenFontStyle = function(type){
  var $this = this;
  if(type){
    this.listenHoverBackground();
    this.group.on("click", function(){$this.applyStyle(type);});
  }
  else this.deactivateListen();
};

Annotation.prototype.listenFontSize = function(type){
  var $this = this;
  if(type){
    this.listenHoverBackground();
    this.group.on("click", function(){$this.applyFontSize(type);});
  }
  else this.deactivateListen();
};

Annotation.prototype.listenRotate = function(type){
  var $this = this;
  if(type){
    this.listenHoverBackground();
    this.group.on("click", function(){$this.applyRotate(type);});
  }
  else this.deactivateListen();
};

Annotation.prototype.listenRemove = function(listen){
  var $this = this;
  if(listen){
    this.listenHoverBackground();
    this.group.on("click", function(){$this.remove();});
  }
  else this.deactivateListen();
};

Annotation.prototype.listenCreate = function(listen){
  var $this = this;
  if(listen){
    this.listenHoverBackground();
    this.group.on("click", function(){$this.edit({x: d3.event.x,y: d3.event.y});});
  }
  else this.deactivateListen();
};

Annotation.prototype.listenMove = function(listen){
  var $this = this;
  if(listen){
    this.listenHoverBackground();
    this.dragBehavior
        .on("drag", function(){$this.drag()})
        //.on("dragstart", function(){d3.select(this).style("cursor","move");})
        .on("dragend", function(){$this.dragEnd()});
  }
  else this.deactivateListen();
};

Annotation.prototype.deactivateListen = function(){
  this.group.on({
    click: null,
    mouseenter: null,
    mouseleave: null
  });
  this.dragBehavior
      .on("drag", null)
      .on("dragstart", null)
      .on("dragend", null);
};

Annotation.prototype.listenHoverBackground = function(){
  var $this = this;
  this.group.on({
    mouseenter: function(){
      d3.select(this).select(".background").style("opacity", $this.annotator.params.hoverAnnotation.opacityOn);
    },
    mouseleave: function(){
      d3.select(this).select(".background").style("opacity", $this.annotator.params.hoverAnnotation.opacityOff);
    }
  });
};





/*
 From https://code.google.com/p/svg-edit/
 Creative Commons 3.0 BY-SA
 */


/*
// Group: Text edit functions
// Functions relating to editing text elements
var textActions = canvas.textActions = function() {
  var curtext;
  var textinput;
  var cursor;
  var selblock;
  var blinker;
  var chardata = [];
  var textbb, transbb;
  var matrix;
  var last_x, last_y;
  var allow_dbl;

  function setCursor(index) {
    var empty = (textinput.value === "");
    $(textinput).focus();

    if(!arguments.length) {
      if(empty) {
        index = 0;
      } else {
        if(textinput.selectionEnd !== textinput.selectionStart) return;
        index = textinput.selectionEnd;
      }
    }

    var charbb;
    charbb = chardata[index];
    if(!empty) {
      textinput.setSelectionRange(index, index);
    }
    cursor = getElem("text_cursor");
    if (!cursor) {
      cursor = document.createElementNS(svgns, "line");
      assignAttributes(cursor, {
        'id': "text_cursor",
        'stroke': "#333",
        'stroke-width': 1
      });
      cursor = getElem("selectorParentGroup").appendChild(cursor);
    }

    if(!blinker) {
      blinker = setInterval(function() {
        var show = (cursor.getAttribute('display') === 'none');
        cursor.setAttribute('display', show?'inline':'none');
      }, 600);
    }


    var start_pt = ptToScreen(charbb.x, textbb.y);
    var end_pt = ptToScreen(charbb.x, (textbb.y + textbb.height));

    assignAttributes(cursor, {
      x1: start_pt.x,
      y1: start_pt.y,
      x2: end_pt.x,
      y2: end_pt.y,
      visibility: 'visible',
      display: 'inline'
    });

    if(selblock) selblock.setAttribute('d', '');
  }

  function setSelection(start, end, skipInput) {
    if(start === end) {
      setCursor(end);
      return;
    }

    if(!skipInput) {
      textinput.setSelectionRange(start, end);
    }

    selblock = getElem("text_selectblock");
    if (!selblock) {

      selblock = document.createElementNS(svgns, "path");
      assignAttributes(selblock, {
        'id': "text_selectblock",
        'fill': "green",
        'opacity': .5,
        'style': "pointer-events:none"
      });
      getElem("selectorParentGroup").appendChild(selblock);
    }


    var startbb = chardata[start];

    var endbb = chardata[end];

    cursor.setAttribute('visibility', 'hidden');

    var tl = ptToScreen(startbb.x, textbb.y),
        tr = ptToScreen(startbb.x + (endbb.x - startbb.x), textbb.y),
        bl = ptToScreen(startbb.x, textbb.y + textbb.height),
        br = ptToScreen(startbb.x + (endbb.x - startbb.x), textbb.y + textbb.height);


    var dstr = "M" + tl.x + "," + tl.y
        + " L" + tr.x + "," + tr.y
        + " " + br.x + "," + br.y
        + " " + bl.x + "," + bl.y + "z";

    assignAttributes(selblock, {
      d: dstr,
      'display': 'inline'
    });
  }

  function getIndexFromPoint(mouse_x, mouse_y) {
    // Position cursor here
    var pt = svgroot.createSVGPoint();
    pt.x = mouse_x;
    pt.y = mouse_y;

    // No content, so return 0
    if(chardata.length == 1) return 0;
    // Determine if cursor should be on left or right of character
    var charpos = curtext.getCharNumAtPosition(pt);
    if(charpos < 0) {
      // Out of text range, look at mouse coords
      charpos = chardata.length - 2;
      if(mouse_x <= chardata[0].x) {
        charpos = 0;
      }
    } else if(charpos >= chardata.length - 2) {
      charpos = chardata.length - 2;
    }
    var charbb = chardata[charpos];
    var mid = charbb.x + (charbb.width/2);
    if(mouse_x > mid) {
      charpos++;
    }
    return charpos;
  }

  function setCursorFromPoint(mouse_x, mouse_y) {
    setCursor(getIndexFromPoint(mouse_x, mouse_y));
  }

  function setEndSelectionFromPoint(x, y, apply) {
    var i1 = textinput.selectionStart;
    var i2 = getIndexFromPoint(x, y);

    var start = Math.min(i1, i2);
    var end = Math.max(i1, i2);
    setSelection(start, end, !apply);
  }

  function screenToPt(x_in, y_in) {
    var out = {
      x: x_in,
      y: y_in
    }

    out.x /= current_zoom;
    out.y /= current_zoom;

    if(matrix) {
      var pt = transformPoint(out.x, out.y, matrix.inverse());
      out.x = pt.x;
      out.y = pt.y;
    }

    return out;
  }

  function ptToScreen(x_in, y_in) {
    var out = {
      x: x_in,
      y: y_in
    }

    if(matrix) {
      var pt = transformPoint(out.x, out.y, matrix);
      out.x = pt.x;
      out.y = pt.y;
    }

    out.x *= current_zoom;
    out.y *= current_zoom;

    return out;
  }

  function hideCursor() {
    if(cursor) {
      cursor.setAttribute('visibility', 'hidden');
    }
  }

  function selectAll(evt) {
    setSelection(0, curtext.textContent.length);
    $(this).unbind(evt);
  }

  function selectWord(evt) {
    if(!allow_dbl || !curtext) return;

    var ept = transformPoint( evt.pageX, evt.pageY, root_sctm ),
        mouse_x = ept.x * current_zoom,
        mouse_y = ept.y * current_zoom;
    var pt = screenToPt(mouse_x, mouse_y);

    var index = getIndexFromPoint(pt.x, pt.y);
    var str = curtext.textContent;
    var first = str.substr(0, index).replace(/[a-z0-9]+$/i, '').length;
    var m = str.substr(index).match(/^[a-z0-9]+/i);
    var last = (m?m[0].length:0) + index;
    setSelection(first, last);

    // Set tripleclick
    $(evt.target).click(selectAll);
    setTimeout(function() {
      $(evt.target).unbind('click', selectAll);
    }, 300);

  }

  return {
    select: function(target, x, y) {
      curtext = target;
      textActions.toEditMode(x, y);
    },
    start: function(elem) {
      curtext = elem;
      textActions.toEditMode();
    },
    mouseDown: function(evt, mouse_target, start_x, start_y) {
      var pt = screenToPt(start_x, start_y);

      textinput.focus();
      setCursorFromPoint(pt.x, pt.y);
      last_x = start_x;
      last_y = start_y;

      // TODO: Find way to block native selection
    },
    mouseMove: function(mouse_x, mouse_y) {
      var pt = screenToPt(mouse_x, mouse_y);
      setEndSelectionFromPoint(pt.x, pt.y);
    },
    mouseUp: function(evt, mouse_x, mouse_y) {
      var pt = screenToPt(mouse_x, mouse_y);

      setEndSelectionFromPoint(pt.x, pt.y, true);

      // TODO: Find a way to make this work: Use transformed BBox instead of evt.target
// 				if(last_x === mouse_x && last_y === mouse_y
// 					&& !svgedit.math.rectsIntersect(transbb, {x: pt.x, y: pt.y, width:0, height:0})) {
// 					textActions.toSelectMode(true);
// 				}

      if(
          evt.target !== curtext
              &&	mouse_x < last_x + 2
              && mouse_x > last_x - 2
              &&	mouse_y < last_y + 2
              && mouse_y > last_y - 2) {

        textActions.toSelectMode(true);
      }

    },
    setCursor: setCursor,
    toEditMode: function(x, y) {
      allow_dbl = false;
      current_mode = "textedit";
      selectorManager.requestSelector(curtext).showGrips(false);
      // Make selector group accept clicks
      var sel = selectorManager.requestSelector(curtext).selectorRect;

      textActions.init();

      $(curtext).css('cursor', 'text');

// 				if(svgedit.browser.supportsEditableText()) {
// 					curtext.setAttribute('editable', 'simple');
// 					return;
// 				}

      if(!arguments.length) {
        setCursor();
      } else {
        var pt = screenToPt(x, y);
        setCursorFromPoint(pt.x, pt.y);
      }

      setTimeout(function() {
        allow_dbl = true;
      }, 300);
    },
    toSelectMode: function(selectElem) {
      current_mode = "select";
      clearInterval(blinker);
      blinker = null;
      if(selblock) $(selblock).attr('display','none');
      if(cursor) $(cursor).attr('visibility','hidden');
      $(curtext).css('cursor', 'move');

      if(selectElem) {
        clearSelection();
        $(curtext).css('cursor', 'move');

        call("selected", [curtext]);
        addToSelection([curtext], true);
      }
      if(curtext && !curtext.textContent.length) {
        // No content, so delete
        canvas.deleteSelectedElements();
      }

      $(textinput).blur();

      curtext = false;

// 				if(svgedit.browser.supportsEditableText()) {
// 					curtext.removeAttribute('editable');
// 				}
    },
    setInputElem: function(elem) {
      textinput = elem;
// 			$(textinput).blur(hideCursor);
    },
    clear: function() {
      if(current_mode == "textedit") {
        textActions.toSelectMode();
      }
    },
    init: function(inputElem) {
      if(!curtext) return;

// 				if(svgedit.browser.supportsEditableText()) {
// 					curtext.select();
// 					return;
// 				}

      if(!curtext.parentNode) {
        // Result of the ffClone, need to get correct element
        curtext = selectedElements[0];
        selectorManager.requestSelector(curtext).showGrips(false);
      }

      var str = curtext.textContent;
      var len = str.length;

      var xform = curtext.getAttribute('transform');

      textbb = svgedit.utilities.getBBox(curtext);

      matrix = xform?getMatrix(curtext):null;

      chardata = Array(len);
      textinput.focus();

      $(curtext).unbind('dblclick', selectWord).dblclick(selectWord);

      if(!len) {
        var end = {x: textbb.x + (textbb.width/2), width: 0};
      }

      for(var i=0; i<len; i++) {
        var start = curtext.getStartPositionOfChar(i);
        var end = curtext.getEndPositionOfChar(i);

        if(!svgedit.browser.supportsGoodTextCharPos()) {
          var offset = canvas.contentW * current_zoom;
          start.x -= offset;
          end.x -= offset;

          start.x /= current_zoom;
          end.x /= current_zoom;
        }

        // Get a "bbox" equivalent for each character. Uses the
        // bbox data of the actual text for y, height purposes

        // TODO: Decide if y, width and height are actually necessary
        chardata[i] = {
          x: start.x,
          y: textbb.y, // start.y?
          width: end.x - start.x,
          height: textbb.height
        };
      }

      // Add a last bbox for cursor at end of text
      chardata.push({
        x: end.x,
        width: 0
      });
      setSelection(textinput.selectionStart, textinput.selectionEnd, true);
    }
  }
}();
*/






/*

 // Function: getText
 // Returns the current text (textContent) of the selected element
 this.getText = function() {
 var selected = selectedElements[0];
 if (selected == null) { return ""; }
 return selected.textContent;
 };

 // Function: setTextContent
 // Updates the text element with the given string
 //
 // Parameters:
 // val - String with the new text
 this.setTextContent = function(val) {
 changeSelectedAttribute("#text", val);
 textActions.init(val);
 textActions.setCursor();
 };


 // Function: getFontSize
 // Returns the current font size
 this.getFontSize = function() {
 return cur_text.font_size;
 };

 // Function: setFontSize
 // Applies the given font size to the selected element
 //
 // Parameters:
 // val - Float with the new font size
 this.setFontSize = function(val) {
 cur_text.font_size = val;
 changeSelectedAttribute("font-size", val);
 if(!selectedElements[0].textContent) {
 textActions.setCursor();
 }
 };



 // Function: getBold
 // Check whether selected element is bold or not
 //
 // Returns:
 // Boolean indicating whether or not element is bold
 this.getBold = function() {
 // should only have one element selected
 var selected = selectedElements[0];
 if (selected != null && selected.tagName  == "text" &&
 selectedElements[1] == null)
 {
 return (selected.getAttribute("font-weight") == "bold");
 }
 return false;
 };

 // Function: setBold
 // Make the selected element bold or normal
 //
 // Parameters:
 // b - Boolean indicating bold (true) or normal (false)
 this.setBold = function(b) {
 var selected = selectedElements[0];
 if (selected != null && selected.tagName  == "text" &&
 selectedElements[1] == null)
 {
 changeSelectedAttribute("font-weight", b ? "bold" : "normal");
 }
 if(!selectedElements[0].textContent) {
 textActions.setCursor();
 }
 };

 // Function: getItalic
 // Check whether selected element is italic or not
 //
 // Returns:
 // Boolean indicating whether or not element is italic
 this.getItalic = function() {
 var selected = selectedElements[0];
 if (selected != null && selected.tagName  == "text" &&
 selectedElements[1] == null)
 {
 return (selected.getAttribute("font-style") == "italic");
 }
 return false;
 };

 // Function: setItalic
 // Make the selected element italic or normal
 //
 // Parameters:
 // b - Boolean indicating italic (true) or normal (false)
 this.setItalic = function(i) {
 var selected = selectedElements[0];
 if (selected != null && selected.tagName  == "text" &&
 selectedElements[1] == null)
 {
 changeSelectedAttribute("font-style", i ? "italic" : "normal");
 }
 if(!selectedElements[0].textContent) {
 textActions.setCursor();
 }
 };

 */





















/*

 // Function: alignSelectedElements
 // Aligns selected elements
 //
 // Parameters:
 // type - String with single character indicating the alignment type
 // relative_to - String that must be one of the following:
 // "selected", "largest", "smallest", "page"
 this.alignSelectedElements = function(type, relative_to) {
 var bboxes = [], angles = [];
 var minx = Number.MAX_VALUE, maxx = Number.MIN_VALUE, miny = Number.MAX_VALUE, maxy = Number.MIN_VALUE;
 var curwidth = Number.MIN_VALUE, curheight = Number.MIN_VALUE;
 var len = selectedElements.length;
 if (!len) return;
 for (var i = 0; i < len; ++i) {
 if (selectedElements[i] == null) break;
 var elem = selectedElements[i];
 bboxes[i] = getStrokedBBox([elem]);

 // now bbox is axis-aligned and handles rotation
 switch (relative_to) {
 case 'smallest':
 if ( (type == 'l' || type == 'c' || type == 'r') && (curwidth == Number.MIN_VALUE || curwidth > bboxes[i].width) ||
 (type == 't' || type == 'm' || type == 'b') && (curheight == Number.MIN_VALUE || curheight > bboxes[i].height) ) {
 minx = bboxes[i].x;
 miny = bboxes[i].y;
 maxx = bboxes[i].x + bboxes[i].width;
 maxy = bboxes[i].y + bboxes[i].height;
 curwidth = bboxes[i].width;
 curheight = bboxes[i].height;
 }
 break;
 case 'largest':
 if ( (type == 'l' || type == 'c' || type == 'r') && (curwidth == Number.MIN_VALUE || curwidth < bboxes[i].width) ||
 (type == 't' || type == 'm' || type == 'b') && (curheight == Number.MIN_VALUE || curheight < bboxes[i].height) ) {
 minx = bboxes[i].x;
 miny = bboxes[i].y;
 maxx = bboxes[i].x + bboxes[i].width;
 maxy = bboxes[i].y + bboxes[i].height;
 curwidth = bboxes[i].width;
 curheight = bboxes[i].height;
 }
 break;
 default: // 'selected'
 if (bboxes[i].x < minx) minx = bboxes[i].x;
 if (bboxes[i].y < miny) miny = bboxes[i].y;
 if (bboxes[i].x + bboxes[i].width > maxx) maxx = bboxes[i].x + bboxes[i].width;
 if (bboxes[i].y + bboxes[i].height > maxy) maxy = bboxes[i].y + bboxes[i].height;
 break;
 }
 } // loop for each element to find the bbox and adjust min/max

 if (relative_to == 'page') {
 minx = 0;
 miny = 0;
 maxx = canvas.contentW;
 maxy = canvas.contentH;
 }

 var dx = new Array(len);
 var dy = new Array(len);
 for (var i = 0; i < len; ++i) {
 if (selectedElements[i] == null) break;
 var elem = selectedElements[i];
 var bbox = bboxes[i];
 dx[i] = 0;
 dy[i] = 0;
 switch (type) {
 case 'l': // left (horizontal)
 dx[i] = minx - bbox.x;
 break;
 case 'c': // center (horizontal)
 dx[i] = (minx+maxx)/2 - (bbox.x + bbox.width/2);
 break;
 case 'r': // right (horizontal)
 dx[i] = maxx - (bbox.x + bbox.width);
 break;
 case 't': // top (vertical)
 dy[i] = miny - bbox.y;
 break;
 case 'm': // middle (vertical)
 dy[i] = (miny+maxy)/2 - (bbox.y + bbox.height/2);
 break;
 case 'b': // bottom (vertical)
 dy[i] = maxy - (bbox.y + bbox.height);
 break;
 }
 }
 this.moveSelectedElements(dx,dy);
 };
 */
