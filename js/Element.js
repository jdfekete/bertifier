/*
Bertifier, crafting tabular visualizations, v1
(c) 2014-2015, Inria
Authors: PERIN Charles, DRAGICEVIC Pierre, FEKETE Jean-Daniel, PRIMET Romain

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

import {BETWEEN, BETWEEN_TARGETS, COL, DEFAULT_ENCODING, DEFAULT_ENCODING_ORIENTATION, DISCRETE_SLIDERS_VALUES, ENCODING, ENCODING_ORIENTATION, ENCODING_ORIENTATION_HORIZONTAL, ENCODING_ORIENTATION_VERTICAL, ENCODING_TYPES, FIELDS, GLUE, HEADER, HIGHLIGHT, INDEX, INVERT, NEGATIVE, NORMALIZED_SIZE, ON_TARGET, REORDER, ROW, POS_ABS, SCALE_CUSTOM_RANGE, SCALE_CUSTOM_RANGE_BASELINE, SCALE_CONTRAST, SCALE_DISCRETIZE, SCALE_GLOBAL, SCALE_NORMALIZE, SCALE_RANGE, SEPARATOR_MARGIN, SEPARATOR_SIZE, TEXT} from './Settings.js';
import RowScale from './RowScale.js';
import Separator from './Separator.js';

/*
 params:
 -bertin: bertin
 -type: ROW, COL, BETWEEN
 -target: ROW/COL
 -index
 -for Row/Col: cells
 */
export default function Element(params){
  var $this = this;
  this.bertin = params.bertin;
  this.index = params.index;
  this.type = params.type;
  this.target = params.target;
  this.mode = this.type == BETWEEN ? BETWEEN_TARGETS : ON_TARGET;

  this.deactivated = false;
  this.negative = false;
  this.header = false;
  this.posAbs = undefined;
  this.highlight = false;
  this.standardSize = this.bertin.matrixParams.row_standard_size;

  switch(params.type){
    case ROW:
      this.cells = params.cells;
      this[FIELDS[ENCODING]] = DEFAULT_ENCODING;
      this[FIELDS[ENCODING_ORIENTATION]] = DEFAULT_ENCODING_ORIENTATION;
      this.cells.forEach(function(cell){cell.row = $this});
      this.createScaleSize();
      break;
    case COL:
      this.cells = params.cells;
      this.cells.forEach(function(cell){cell.col = $this});
      this.createScaleSize();
      break;
    case BETWEEN:
      this.separator = new Separator(this);
      this.glue = false;
      break;
  }
};

Element.prototype.getOffset = function(){
  return this.target == ROW ? this.bertin.offset[1] : this.bertin.offset[0];
};

Element.prototype.createScaleSize = function(){
  this.scaleSizeDomain = DISCRETE_SLIDERS_VALUES[NORMALIZED_SIZE].map(function(d,i){
    return i / (DISCRETE_SLIDERS_VALUES[NORMALIZED_SIZE].length - 1);
  });
  this.scaleSize = d3.scale.ordinal()
      .domain(this.scaleSizeDomain)
      .range(DISCRETE_SLIDERS_VALUES[NORMALIZED_SIZE]);
  this.scaleSizeContinuous = d3.scale.linear()
      .domain([0,1])
      .range([this.bertin.matrixParams.rowCol_min_size,this.bertin.matrixParams.rowCol_max_size])
      .clamp(true);

  var normalizedSize = this.scaleSizeDomain[DISCRETE_SLIDERS_VALUES[NORMALIZED_SIZE].indexOf(this.standardSize)];
  this.setNormalizedSize(normalizedSize);
  this.backupSize();
};

Element.prototype.is = function(attr,value){
  if(value && attr == ENCODING) return this[FIELDS[attr]] == value;
  return this[FIELDS[attr]];
};
Element.prototype.set = function(attr,is){
  this[FIELDS[attr]] = is;
};
Element.prototype.get = function(attr){
  return this[FIELDS[attr]];
};

Element.prototype.setAttr = function(attr, isOn){
  switch(attr){
    /*--------------------Between attributes----------------------*/
    case SEPARATOR_MARGIN:
    case SEPARATOR_SIZE:
      if(this.type != BETWEEN) console.error("invalid attribute for Row/Col",this.bertin.getFieldTitle(attr));
      this.separator.applyChanges(attr,isOn);
      break;

    case GLUE:
      this.set(attr,isOn);
      break;

    /*--------------------Row/Col attributes-----------------------*/
    case HEADER:
      if(this.type == BETWEEN) console.error("invalid attribute for Between",this.bertin.getFieldTitle(attr));
      if(isOn){//if set header
        this[FIELDS[ENCODING]] = TEXT;
        this[FIELDS[NEGATIVE]] = false;
        this[FIELDS[REORDER]] = false;
        this[FIELDS[HEADER]] = true;
        this.changeNegativeFeedback();
      }
      else{
        this[FIELDS[HEADER]] = false;
      }
      break;

    case NEGATIVE:
      if(this.type == BETWEEN) console.error("invalid attribute for Between",this.bertin.getFieldTitle(attr));
      this[FIELDS[attr]] = isOn;
      this.changeNegativeFeedback();
      break;

    case REORDER:
    case SCALE_GLOBAL:
    case HIGHLIGHT:
    case INVERT:
      if(this.type == BETWEEN) console.error("invalid attribute for Between",this.bertin.getFieldTitle(attr));
      this[FIELDS[attr]] = isOn;
      break;

    case ENCODING_ORIENTATION_VERTICAL:
    case ENCODING_ORIENTATION_HORIZONTAL:
      this.changeEncodingOrientation(attr,isOn);
      this[FIELDS[ENCODING_ORIENTATION]] = isOn ? attr : DEFAULT_ENCODING_ORIENTATION;
      break;

    /*----------------------Row only attributes-----------------------
     in this case, isOn is an object:
     -event: "set" or "restore"
     -type: SLIDER_MIN or SLIDER_MAX
     -value: the normalizedValue that is updated
     */
    case SCALE_RANGE:
    case SCALE_NORMALIZE:
    case SCALE_CONTRAST:
    case SCALE_DISCRETIZE:
      if(this.type != ROW) console.error("invalid attribute for Between/Col",this.bertin.getFieldTitle(attr));
      this.scale.applyChanges(attr,isOn);
      break;

    case SCALE_CUSTOM_RANGE:
      this[FIELDS[SCALE_CUSTOM_RANGE]] = isOn;
      this.scale.changeCustomRange();
      break;

    case SCALE_CUSTOM_RANGE_BASELINE:
      this[FIELDS[SCALE_CUSTOM_RANGE_BASELINE]] = isOn;
      this.scale.changeBaseline();
      break;

    case NORMALIZED_SIZE:
      this.applyNormalizedSize(isOn);
      break;

    default:
      if(this.type != ROW) console.error("invalid attribute for Between/Col",this.bertin.getFieldTitle(attr));
      if(ENCODING_TYPES.indexOf(attr) != -1) {
        this.changeEncoding(attr,isOn);
        /*
         this[FIELDS[ENCODING]] = isOn ? attr : DEFAULT_ENCODING;
         if(this[FIELDS[ENCODING]] == TEXT && this[FIELDS[NEGATIVE]] == true){
         this.setAttr(NEGATIVE,false);
         }
         */
      }
      else console.error("invalid attribute",attr);
  }
};

Element.prototype.changeEncodingOrientation = function(attr,params){
  //this[FIELDS[ENCODING_ORIENTATION]] = isOn ? attr : DEFAULT_ENCODING_ORIENTATION;
  if(params.event == "set"){
    this.bkpEncodingOrientation = this[FIELDS[ENCODING_ORIENTATION]];
    this[FIELDS[ENCODING_ORIENTATION]] = attr;
  }
  else if(params.event == "restore"){
    this[FIELDS[ENCODING_ORIENTATION]] = this.bkpEncodingOrientation;
  }
  else console.error("invalid event",params);
};

Element.prototype.changeEncoding = function(attr,params){
  if(params.event == "set"){
    this.bkpEncoding = this[FIELDS[ENCODING]];
    this[FIELDS[ENCODING]] = attr;
  }
  else if(params.event == "restore"){
    this[FIELDS[ENCODING]] = this.bkpEncoding;
  }
  else console.error("invalid event",params);

  if(this[FIELDS[ENCODING]] == TEXT && this[FIELDS[NEGATIVE]] == true){
    this.setAttr(NEGATIVE,false);
  }
};

Element.prototype.changeNegativeFeedback = function(){
  if(this[FIELDS[NEGATIVE]] && !this.negativeFeedback){
    this.negativeFeedback = this.bertin.matrix.root.append("rect")
        .attr(this.getNegativeFeedbackAttributes())
        .style({
          opacity: 0,
          fill: "black",
          stroke: "none",
          "pointer-events": "none"
        });

    this.negativeFeedback.transition().duration(this.bertin.matrixParams.transitions.crossingSettings.negative.create).style("opacity",1);
  }
  else if(!this[FIELDS[NEGATIVE]] && this.negativeFeedback){
    this.negativeFeedback.transition().duration(this.bertin.matrixParams.transitions.crossingSettings.negative.create).style("opacity",0).remove();
    this.negativeFeedback = undefined;
  }
};

Element.prototype.getNegativeFeedbackAttributes = function(){
  var size = this.bertin.matrixParams.negative.size;
  var matrixCoords = this.bertin.getMatrixCoordinates();
  return {
    x: this.type == ROW ? matrixCoords.x1 - size : this.getPosAbs() - size/2,
    y: this.type == ROW ? this.getPosAbs() - size/2 : matrixCoords.y1 - size,
    width: size,
    height: size
  }
};

Element.prototype.updateNegativeFeedbackPos = function(duration){
  if(this.negativeFeedback)
    this.negativeFeedback.transition().duration(duration || 0)
        .attr(this.getNegativeFeedbackAttributes());
};

Element.prototype.canSetCustomScaleRange = function(){
  return this.scale.customMin != undefined || this.scale.customMax != undefined;
};

Element.prototype.canSetBaseline = function(){
  return this.scale.baseline != undefined;
};


Element.prototype.createDragHighlight = function(){
  if(this.type == BETWEEN) console.error("cannot be between");
  this.dragHighlight = this.bertin.matrix.root.append("rect")
      .attr({class: "dragHighlight"})
      .style({
        "pointer-events": "none",
        opacity: this.bertin.matrixParams.dragHighlight.opacityOn,
        fill: this.bertin.matrixParams.dragHighlight.fill,
        stroke: this.bertin.matrixParams.dragHighlight.stroke,
        "stroke-width": this.bertin.matrixParams.dragHighlight.strokeWidth
      });

  this.updateDragHighlight();
};
Element.prototype.updateDragHighlight = function(){
  if(this.type == BETWEEN) console.error("cannot be between");
  var matrixCoords = this.bertin.getMatrixCoordinates();
  var x, y,width,height;
  var x1Coord, size;

  var glue = this.bertin.glues.getGlueWith(this.target,this);
  if(glue){
    var glueCoords = glue.getCoords();
    x1Coord = glueCoords.x1;
    size = glueCoords.x2 - glueCoords.x1;
  }
  else{
    x1Coord = this.getX1Coord();
    size = this.getSize();
  }

  if(this.target == ROW){
    y = x1Coord;
    height = size;
    x = matrixCoords.x1;
    width = matrixCoords.x2 - x;
  }
  else{
    x = x1Coord;
    width = size;
    y = matrixCoords.y1;
    height = matrixCoords.y2 - y;
  }

  this.dragHighlight.attr({
    x: x,
    y: y,
    width: width,
    height: height
  });
};
Element.prototype.removeDragHighlight = function(){
  if(this.type == BETWEEN) console.error("cannot be between");
  d3.selectAll(".dragHighlight").remove();
  this.dragHighlight = undefined;
};


Element.prototype.createScale = function(minMax, baseline){
  if(this.type != ROW) console.error("Element must be of type ROW");
  this.scale = new RowScale(this, minMax, baseline);
  //update the row attribute
  this[FIELDS[SCALE_CUSTOM_RANGE]] = this.canSetCustomScaleRange();
  this[FIELDS[SCALE_CUSTOM_RANGE_BASELINE]] = this.canSetBaseline();
};

Element.prototype.getPosAbs = function(){
  return this.get(POS_ABS);
};
Element.prototype.setPosAbs = function(pos){
  this.set(POS_ABS,pos);
};
Element.prototype.setX1Coord = function(pos){
  this.setPosAbs(pos + this.getSize()/2);
};
Element.prototype.setX2Coord = function(pos){
  this.setPosAbs(pos - this.getSize()/2);
};
Element.prototype.getX1Coord = function(){
  return this.getPosAbs()-this.getSize()/2;
};
Element.prototype.getX2Coord = function(){
  return this.getPosAbs()+this.getSize()/2;
};
Element.prototype.getMiddle = function(){
  return this.getPosAbs();
};

Element.prototype.setIndex = function(_index){
  this.set(INDEX,_index);
};

Element.prototype.toString = function(){
  return "[" + (this.target==ROW ? "row " : this.target == COL ? "col " : "Between ") + this.index + "]";
};

Element.prototype.getCoords = function(){
  return {x1: this.getPosAbs()-this.getSize()/2, x2: this.getPosAbs()+this.getSize()/2};
};

Element.prototype.applyNormalizedSize = function(params){
  /*
   in this case, isOn is an object:
   -event: "set" or "restore"
   -value: the normalizedValue that is updated
   */
  switch(params.event){
    case "set":
      this.setNormalizedSize(params.value);
      break;
    case "restore":
      this.restoreBackupSize();
      break;
    default: console.error("invalid param event",action,params);
  }
};

Element.prototype.getSizeHighlight = function(){
  return Math.max(this.getSize(),this.bertin.matrixParams.settings.highlight.minSize);
};

Element.prototype.getX1Highlight = function(){
  var size = this.getSizeHighlight();
  return this.getPosAbs() - this.getSizeHighlight() / 2;
};

Element.prototype.getSize = function(){
  if(this.type == BETWEEN) return this.separator.getSeparatorWidth();
  else return this.size;
};

Element.prototype.getNormalizedSize = function(){
  return this.normalizedSize;
};

Element.prototype.setSizeContinuous = function(size){
  if(this.type == BETWEEN) console.error("no setSize for Between");
  this.size = size;
  this.normalizedSize = this.scaleSizeContinuous.invert(size);
};

Element.prototype.setSizeFromClosest = function(size){
  var sizeIndex = this.getSmallestSizeIndex(size);
  this.setNormalizedSize(this.scaleSizeDomain[sizeIndex]);
};

Element.prototype.getSmallestSizeIndex = function(size){
  var index;
  var v = 0;
  while(v < DISCRETE_SLIDERS_VALUES[NORMALIZED_SIZE].length){
    if(DISCRETE_SLIDERS_VALUES[NORMALIZED_SIZE][v] >= size){
      index = v;
      break;
    }
    else v++;
  }
  if(index == undefined) index = DISCRETE_SLIDERS_VALUES[NORMALIZED_SIZE].length-1;
  return index;
};

//width param between 0 and 1
Element.prototype.setNormalizedSize = function(size){
  this.normalizedSize = size;
  this.size = this.scaleSize(size);
};
Element.prototype.backupSize = function(){
  this.sizeBkp = this.size;
  this.normalizedSizeBkp = this.normalizedSize;
};
Element.prototype.restoreBackupSize = function(){
  this.size = this.sizeBkp;
  this.normalizedSize = this.normalizedSizeBkp;
};

Element.prototype.updateSize = function(type, callback){
  if(this.type == BETWEEN){
    this.size = this.separator.getSeparatorWidth();
    callback.call();
  }
  else{
    switch(type){
      case "text":
        this.updateSizeFromText(function(){callback.call();});
        break;
      case "slider":
        this.updateSizeFromSlider(function(){callback.call();});
        break;
      default: console.error("invalid type",type);
    }
  }
};

//when size driven by text size
Element.prototype.updateSizeFromText = function(callback){
  var size = this.standardSize;
  var rowHeaderSize = this.target == COL ? "height" : "width";
  var colAndTextHeaderSize = this.target == COL ? "width" : "height";

  for(var c in this.cells){
    var cell = this.cells[c];
    if(cell.row.is(HEADER)){
      size = Math.max(size, cell.textSize.header[rowHeaderSize]);
      this.setSizeContinuous(size);
    }
    else if(cell.col.is(HEADER)){
      size = Math.max(size, cell.textSize.header[colAndTextHeaderSize]);
      this.setSizeContinuous(size);
    }
    else if(cell.row.get(ENCODING) == TEXT){//if not a header, then just the text size
      size = Math.max(size, cell.textSize.cell[colAndTextHeaderSize]);
      this.setSizeFromClosest(size);
    }
  }

  callback.call();
};

//when size driven by slider
Element.prototype.updateSizeFromSlider = function(callback){
  //TODO - for nom it works without changing the text font size because size_min = 10.
  //TODO - if less than 10, then need to resize the texts
  //TODO - warning: crossing buttons have a size of 10...
  this.size = this.scaleSize(this.normalizedSize);
  /*
   var size = this.standardSize;
   var rowHeaderSize = this.target == COL ? "height" : "width";
   var colAndTextHeaderSize = this.target == COL ? "width" : "height";

   for(var c in this.cells){
   var cell = this.cells[c];
   if(cell.row.is(HEADER)){
   size = Math.max(size, cell.textSize.header[rowHeaderSize]);
   }
   else if(cell.col.is(HEADER)){
   size = Math.max(size, cell.textSize.header[colAndTextHeaderSize]);
   }
   else if(cell.row.get(ENCODING) == TEXT){//if not a header, then just the text size
   size = Math.max(size, cell.textSize.cell[colAndTextHeaderSize]);
   }
   }
   this.setSize(size);
   */
  callback.call();

};

Element.prototype.updateSizePreview = function(){
  if(!this.sizePreview) return;
  var matCoords = this.bertin.getMatrixCoordinates();
  this.sizePreview.attr({
    x: this.type == COL ? this.getPosAbs()-this.getSize()/2 : matCoords.x1,
    y: this.type == COL ? matCoords.y1 : this.getPosAbs()-this.getSize()/2,
    width: this.type == COL ? this.getSize() : matCoords.x2 - matCoords.x1,
    height: this.type == COL ? matCoords.y2 - matCoords.y1 : this.getSize()
  });
};

Element.prototype.createSizePreview = function(){
  if(this.sizePreview) return;
  var matCoords = this.bertin.getMatrixCoordinates();
  this.sizePreview = this.bertin.matrix.root.append("rect")
      .attr({
        class: "sizePreview",
        x: this.type == COL ? this.getPosAbs()-this.getSize()/2 : matCoords.x1,
        y: this.type == COL ? matCoords.y1 : this.getPosAbs()-this.getSize()/2,
        width: this.type == COL ? this.getSize() : matCoords.x2 - matCoords.x1,
        height: this.type == COL ? matCoords.y2 - matCoords.y1 : this.getSize()
      })
      .style(this.bertin.matrixParams.settings.sizePreview);
};

Element.prototype.removeSizePreview = function(duration){
  if(!this.sizePreview) return;
  this.sizePreview.transition().duration(duration || 0).remove();
  this.sizePreview = undefined;
};
