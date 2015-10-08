/*
Bertifier, crafting tabular visualizations, v1
(c) 2014-2015, Inria
Authors: PERIN Charles, DRAGICEVIC Pierre, FEKETE Jean-Daniel, PRIMET Romain.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

import CellEncoding from './CellEncoding.js';
import {CHANGE_ENCODING, COL, DRAG_LOCK_THRESHOLD, ENCODING, ENCODING_ORIENTATION, FIELDS, FORCE_ALL_CELLS, HEADER, ON_BUTTONS, ROW, TEXT, TRANSLATE_ENCODING, UPDATE_DURATION, UPDATE_ENCODING, UPDATE_GLUE, UPDATE_ROWCOL_SIZE_PREVIEW, UPDATE_SEPARATOR, UPDATE_TRANSLATE} from './Settings.js';
import {Utils} from './Utils.js';

export default function Matrix(params,bertin){
  this.bertin = bertin;
  for(var key in params) this[key] = params[key];
  this.init();
};

Matrix.prototype.init = function(){
  var $this = this;

  this.cellEncoding = new CellEncoding(this.bertin);

  //---------------------------------------------------------------//
  //------------------------Drag behavior--------------------------//
  //---------------------------------------------------------------//
  var dragData = {};
  var dragBehavior = d3.behavior.drag()//.origin(Object)
      .origin(function(cell){
        var res = {};
        dragData.draggableElements = [];
        dragData.draggedElement = [];
        [ROW,COL].forEach(function(target){
          dragData.draggableElements[target] = $this.bertin.getAllDraggableElements(target);
          var draggedElement = dragData.draggableElements[target].filter(function(d){return d.elements.indexOf(cell[FIELDS[target]]) != -1});
          if(draggedElement.length != 1) console.error("need exactly 1 element",draggedElement);
          dragData.draggedElement[target] = draggedElement[0];
          if(target == COL) res.x = dragData.x = dragData.draggedElement[target].middle();
          else res.y = dragData.y = dragData.draggedElement[target].middle();
        });
        dragData.dir = undefined;
        return res;
      })
      .on("dragstart", function(d){dragCellStart(d)})
      .on("dragend", function(d){dragCellEnd(d)})
      .on("drag", function(d){dragCell(d3.event,d)});

  function dragCellStart(cell){
  }
  function dragCellEnd(cell){
    if(dragData.dir != undefined){
      cell[$this.bertin.getFieldTitle(dragData.dir)].removeDragHighlight();
      $this.bertin.releaseDragRowCol(dragData.draggedElement[dragData.dir].elements);
      dragData = {};
    }
    //$this.highlightCells({target: dragData.dir, elements: dragData.draggedElement[dragData.dir].elements, type: "default"});
  }

  function dragCell(event,cell){
    //if lock drag
    if(dragData.dir == undefined){
      var moveCol;
      if((moveCol = Math.abs(event.x-dragData.x) > DRAG_LOCK_THRESHOLD) || Math.abs(event.y-dragData.y) > DRAG_LOCK_THRESHOLD){
        dragData.dir = moveCol ? COL : ROW;
        dragData.minMax = $this.bertin.getMinMaxCoords(dragData.dir);
        dragData.start = dragData.dir == COL ? dragData.x : dragData.y;
        $this.moveCellsToFront(dragData.draggedElement[dragData.dir].elements);
        cell[$this.bertin.getFieldTitle(dragData.dir)].createDragHighlight();//TODO - highlight glued elements if glue
        //$this.highlightCells({target: dragData.dir, elements: dragData.draggedElement[dragData.dir].elements, type: "drag"});
      }
    }
    //if already dragging
    else {
      $this.bertin.dragRowCols(
        dragData,
        dragData.dir == COL ? event.x : event.y
      );
      cell[$this.bertin.getFieldTitle(dragData.dir)].updateDragHighlight();
    }

  }


  //---------------------------------------------------------------//
  //------------------------SVG------------------------------------//
  //---------------------------------------------------------------//
  this.root = this.bertin.svg.append("g")
      .attr("class","root")
      .attr("transform", "translate("+[this.x,this.y]+")");

  var cells = this.root.append("g")
      .attr("class","matrix")
      .selectAll(".cell")
      .data(this.bertin.data)
      .enter().append("g")
      .attr("class", "cell")
      .on("click",function(d){d3.event.preventDefault();d3.event.stopPropagation()});

  cells.append("svg:clipPath")
      .attr("id", function(d){return "clipper-"+ d.l+"-"+ d.c})
      .append("svg:rect")
      .attr('id', function(d){return "clip-rect-"+ d.l+"-"+ d.c});

  cells.attr("clip-path", function(d){return "url(#clipper-"+ d.l +"-"+ d.c +")"})
      .each(function(d){$this.updateCellTextSizes(d)})
      .call(dragBehavior);
};

Matrix.prototype.moveCellsToFront = function(rowCols){
  this.root.selectAll(".cell").filter(function(cell){
    return rowCols.indexOf(cell.col) != -1 || rowCols.indexOf(cell.row) != -1;
  }).moveToFront();
};

Matrix.prototype.highlightCells = function(params){
  this.root.selectAll(".cell").filter(function(cell){
    return params.elements.indexOf(cell[FIELDS[params.target]]) != -1;
  })
      .select("rect.background")
      .style("fill",this.getCellBackgroundColor(params.type));
};

Matrix.prototype.getCellBackgroundColor = function(type){
  return CELL_BACKGROUND_COLOR[type];
};

/*
 To call when the font changes
 */
Matrix.prototype.updateCellTextSizes = function(cell){
  var text = cell.value.toString();
  if(cell.ci_min != undefined && cell.ci_max != undefined){
    text = Utils.getCIText(cell);
  }
  cell.textSize = {
    header: d3.stringBox(this.root, text.toUpperCase(), this.cellEncoding.getFontString("header")),
    cell: d3.stringBox(this.root, text, this.cellEncoding.getFontString("cell"))
  };
};



/*
 Just update the translate position of the cell graphics
 */
Matrix.prototype.translateCellEncoding = function(cellObject, cellData, callback){
  //TODO - add each("end") and check all elements have been transformed
  var $this = this;

  var encodingParams = {
    width: cellData.col.getSize(),
    height: cellData.row.getSize(),
    graphicSize: Math.min(cellData.col.getSize(),cellData.row.getSize()),
    cellObject: cellObject,
    cellData: cellData,
    cellAttrs: $this.bertin.getCellAttributes(cellData),
    orientation: cellData.row.get(ENCODING_ORIENTATION),
    encoding: cellData.row.get(ENCODING),
    value: cellData.transferedValue,
    ci_min: cellData.transferedCi_min,
    ci_max: cellData.transferedCi_max,
    extremumMin: cellData.transferedValueExtremumMin,
    extremumMax: cellData.transferedValueExtremumMax,
    l: cellData.l,
    c: cellData.c
  };
  encodingParams.header = encodingParams.cellAttrs[COL][HEADER] || encodingParams.cellAttrs[ROW][HEADER];

  $this.cellEncoding.updateCellClipPath(encodingParams);
  $this.cellEncoding.updateCellBackground(encodingParams);
  $this.cellEncoding.updateNAEncoding(encodingParams);
  $this.cellEncoding.updateCellEncoding(encodingParams);

  callback.call();
};

/*
 This one is called when a cell does not change its encoding, but its z-value has changed
 */
Matrix.prototype.updateEncodeCell = function(cellObject, cellData, animate, callback){
  var $this = this;
  var cellAttrs = $this.bertin.getCellAttributes(cellData);

  if(cellAttrs[COL][HEADER] || cellAttrs[ROW][HEADER] || cellData.row.get(ENCODING) == TEXT || isNaN(cellData.transferedValue)){
    callback.call();
    return;
  }

  var encodingParams = {
    width: cellData.col.getSize(),
    height: cellData.row.getSize(),
    graphicSize: Math.min(cellData.col.getSize(),cellData.row.getSize()),
    cellObject: cellObject,
    cellData: cellData,
    cellAttrs: cellAttrs,
    orientation: cellData.row.get(ENCODING_ORIENTATION),
    encoding: cellData.row.get(ENCODING),
    value: cellData.transferedValue,
    ci_min: cellData.transferedCi_min,
    ci_max: cellData.transferedCi_max,
    extremumMin: cellData.transferedValueExtremumMin,
    extremumMax: cellData.transferedValueExtremumMax,
    l: cellData.l,
    c: cellData.c
  };
  encodingParams.header = encodingParams.cellAttrs[COL][HEADER] || encodingParams.cellAttrs[ROW][HEADER];

  if(animate){
    cellObject.transition().each(function(){
      $this.cellEncoding.updateCellClipPath(encodingParams);
      $this.cellEncoding.updateCellBackground(encodingParams);
      $this.cellEncoding.updateCellEncoding(encodingParams);
    });
  }
  else{
  cellObject.transition().duration(0).each(function(){
    $this.cellEncoding.updateCellClipPath(encodingParams);
    $this.cellEncoding.updateCellBackground(encodingParams);
    $this.cellEncoding.updateCellEncoding(encodingParams);
  });
  }

  //to debug
  callback.call();
};

Matrix.prototype.encodeCell = function(cellObject, cellData, callback){
  var $this = this;

  var encodingParams = {
    width: cellData.col.getSize(),
    height: cellData.row.getSize(),
    graphicSize: Math.min(cellData.col.getSize(),cellData.row.getSize()),
    cellObject: cellObject,
    cellData: cellData,
    cellAttrs: $this.bertin.getCellAttributes(cellData),
    orientation: cellData.row.get(ENCODING_ORIENTATION),
    encoding: cellData.row.get(ENCODING),
    value: cellData.transferedValue,
    ci_min: cellData.transferedCi_min,
    ci_max: cellData.transferedCi_max,
    extremumMin: cellData.transferedValueExtremumMin,
    extremumMax: cellData.transferedValueExtremumMax,
    l: cellData.l,
    c: cellData.c
  };
  encodingParams.header = encodingParams.cellAttrs[COL][HEADER] || encodingParams.cellAttrs[ROW][HEADER];

  /*
   if(encodingParams.encoding != TEXT){
   cellData.transferedValue = cellData.row.scale.getTransferedValue(cellData.value);
   if(encodingParams.cellAttrs[COL][NEGATIVE] || encodingParams.cellAttrs[ROW][NEGATIVE]) cellData.transferedValue = 1-cellData.transferedValue;
   encodingParams.value = cellData.transferedValue;
   }
   */

  //if first call, need to create the cell background
  if(cellObject.selectAll("rect.background")[0][0] == null) $this.cellEncoding.createBackground(encodingParams);
  if(cellObject.selectAll("rect.background")[0][0] == null) console.error("NO BACKGROUND");

  $this.cellEncoding.updateCellClipPath(encodingParams);
  $this.cellEncoding.updateCellBackground(encodingParams);


  //------------------if text to text---------------//
  if(encodingParams.encoding == TEXT && cellObject.select("text.graphic")[0][0]!= null){
    $this.cellEncoding.updateCellEncoding(encodingParams);
  }

  else{
    var toCheck = {
      removeGraphic: false,
      showGraphic: false
    };

    function checkObject(){
      if(Utils.checkTrueArray(toCheck)) callback.call();
    }

    //------------------if NOT text to text---------------//
    cellObject.selectAll(".graphic:not(.extremum)").transition().style("opacity",0).remove();
    toCheck.removeGraphic = true;
    checkObject();

    $this.cellEncoding.createCellEncoding(encodingParams);

    //----------------Finally, make the graphic elements appear---------------//
    cellObject.selectAll(".graphic").transition().style("opacity",1).each("end", function(){
      toCheck.showGraphic = true;
      checkObject();
    });
  }
};

/*
 The global update attributes function.
 In params the parameters to optimize the update
 */
Matrix.prototype.updateAttributes = function(params, callback){
  var $this = this;

  //console.log(params)
  if(params.separator) console.error("invalid param separator",params);

  if(params.elementsSizes) doElementsSizes(function(){elementsSizesDone()});
  else elementsSizesDone();

  function elementsSizesDone(){
    if(params.posAbs) doPosAbs(function(){posAbsDone()});
    else posAbsDone();
  }
  function posAbsDone(){
    if(params.encodingScales) doEncodingScales(function(){encodingScalesDone()});
    else encodingScalesDone();
  }
  function encodingScalesDone(){//last update function called
    if(callback)callback.call();
  }

  function doPosAbs(callback){
    var value = params.posAbs;
    if(value.target != undefined) value.target = parseInt(value.target);
    if(value.target == undefined){
      var toCheckPosAbs = Utils.getFalseArray($this.bertin.elements);
      $this.bertin.elements.forEach(function(rowCols,target){
        updatePosAbs(target,value.startModified, function(){
          toCheckPosAbs[target] = true;
          if(Utils.checkTrueArray(toCheckPosAbs)) callback.call();
        });
      });
    }
    else updatePosAbs(value.target,value.startModified, function(){
      callback.call();
    });
  }

  function doElementsSizes(callback){
    var value = params.elementsSizes;
    if(value.target != undefined) value.target = parseInt(value.target);
    if(value.target == undefined){
      var toCheckSizes = Utils.getFalseArray($this.bertin.elements);
      $this.bertin.elements.forEach(function(elements,target){
        updateElementsSizes(target, value.type, undefined, function(){
          toCheckSizes[target] = true;
          if(Utils.checkTrueArray(toCheckSizes))callback.call();
        });
      });
    }
    else {
      updateElementsSizes(value.target, value.type, value.modified, function(){
        callback.call();
      });
    }
  }

  function doEncodingScales(callback){
    var value = params.encodingScales;
    if(value.target != undefined) value.target = parseInt(value.target);
    updateRowEncodingScales(value.modified, function(){
      callback.call();
    });
  }

  //update the abs position of row/col from startIndex to the end
  function updatePosAbs(target,startIndex, callback){
    if(startIndex == undefined) startIndex = 0;
    for(var i=startIndex; i<$this.bertin.elements[target].length; i++){
      var e = $this.bertin.elements[target][i];
      e.setPosAbs((i==0) ? e.getOffset() : $this.bertin.elements[target][i-1].getCoords().x2 + e.getSize()/2);
    }
    callback.call();
  }

  //update the size of each row/col in modified or all sizes if no target
  //type = init or update
  function updateElementsSizes(target, type, modified, callback){
    var _modified = modified ? modified : $this.bertin.elements[target];
    var toCheckSizes = Utils.getFalseArray(_modified);
    _modified.forEach(function(e,i){
      e.updateSize(type, function(){
        toCheckSizes[i] = true;
        if(Utils.checkTrueArray(toCheckSizes)) callback.call();
      });
    });
  }

  //update each row encoding in modified or all rows if no modified
  function updateRowEncodingScales(modified, callback){
    //console.log("updateRowEncodingScales")
    var _modified = modified ? modified : $this.bertin.elements[ROW].filter(function(e){return e.type == ROW});
    var toCheckScales = Utils.getFalseArray(_modified);
    _modified.forEach(function(rowCol,i){
      rowCol.scale.changeCellValues(function(){
        toCheckScales[i] = true;
        if(Utils.checkTrueArray(toCheckScales)) callback.call();
      });
    });
  }
};

/*
 The global update view function.
 In params the parameters to optimize the update
 */
Matrix.prototype.updateView = function(params, callback){
  var $this = this;

  //get the indexes of all cells which should be modified in any way
  var modified = [];
  modified[ROW] = [];
  modified[COL] = [];

  for(var key in params){
    if(params[key] instanceof Object && params[key].modified){
      modified[params[key].target] = modified[params[key].target].concat(params[key].modified);
    }
  }
  modified.forEach(function(d){Utils.removeDuplicateValues(d)});

  var allCells = modified[ROW].length == 0 && modified[COL].length == 0;

  //because bug otherwise when endCrossing on Row header (cells don't move)
  if(params[FORCE_ALL_CELLS]) allCells = true;

  var tCells = $this.root.selectAll(".cell").filter(function(cell){
    if(allCells) return true;
    return modified[ROW].indexOf(cell.row) != -1 || modified[COL].indexOf(cell.col) != -1;//if row or col
    //|| modified[ROW].indexOf(cell.row.left) != -1 || modified[ROW].indexOf(cell.row.right) != -1 || modified[COL].indexOf(cell.col.left) != -1 || modified[COL].indexOf(cell.col.right) != -1 //if between
  })
      .transition()
      .duration(params[UPDATE_DURATION] || 0);


  var callbackCalled = false;
  var paramsToCheck = [];
  [UPDATE_TRANSLATE,TRANSLATE_ENCODING,CHANGE_ENCODING,UPDATE_ENCODING,UPDATE_GLUE,UPDATE_ROWCOL_SIZE_PREVIEW].forEach(function(id){
    if(params[id]) paramsToCheck[id] = false;
  });
  function checkCallBack(){
    if(Utils.checkTrueArray(paramsToCheck) && callback && !callbackCalled) {
      callbackCalled = true;
      callback.call();
    }
  }
  if(params[UPDATE_SEPARATOR]) {
    doSeparator();
  }
  if(params[UPDATE_ROWCOL_SIZE_PREVIEW]){
    doPreviewRowColSize();
  }
  if(params[UPDATE_TRANSLATE]) doTranslate(function(){paramsToCheck[UPDATE_TRANSLATE] = true; checkCallBack();});
  if(params[TRANSLATE_ENCODING]) doTranslateEncoding(function(){paramsToCheck[TRANSLATE_ENCODING] = true; checkCallBack();});
  if(params[CHANGE_ENCODING]) doChangeEncoding(function(){paramsToCheck[CHANGE_ENCODING] = true; checkCallBack();});
  if(params[UPDATE_ENCODING]) doUpdateEncoding(function(){paramsToCheck[UPDATE_ENCODING] = true; checkCallBack();});

  if(params[UPDATE_GLUE]) doGlue(function(){paramsToCheck[UPDATE_GLUE] = true; checkCallBack();});

  function doTranslate(_callback){
    //update the negative feedback point
    $this.bertin.elements.forEach(function(elemArray){elemArray.forEach(function(elem){elem.updateNegativeFeedbackPos(params[UPDATE_DURATION])})});

    //update the cells
    var checkArray = Utils.getFalseArray(tCells[0]);
    tCells.attr("transform", function(cell,i){
      checkArray[i] = true;
      if(Utils.checkTrueArray(checkArray) && _callback) _callback.call();
      return "translate("+[cell.col.getPosAbs(),cell.row.getPosAbs()]+")";
    });
  }

  function doTranslateEncoding(_callback){
    var checkArray = Utils.getFalseArray(tCells[0]);
    tCells.each(function(cell,i){
      $this.translateCellEncoding(d3.select(this),cell, function(){
        checkArray[i] = true;
        if(Utils.checkTrueArray(checkArray) && _callback) _callback.call();
      });
    });
  }

  function doChangeEncoding(_callback){
    var value = params[CHANGE_ENCODING];
    var _cells = tCells.filter(function(cell){
      return !(value.target == COL && value.modified.indexOf(cell.col) == -1
          || value.target == ROW && value.modified.indexOf(cell.row) == -1);
    });
    var checkArray = Utils.getFalseArray(_cells[0]);
    _cells.each(function(cell,i){
      $this.encodeCell(d3.select(this),cell, function(){
        checkArray[i] = true;
        if(Utils.checkTrueArray(checkArray) && _callback) _callback.call();
      });
    });
  }

  function doUpdateEncoding(_callback){
    var value = params[UPDATE_ENCODING];
    var _cells = tCells.filter(function(cell){
      return !(value.target == COL && value.modified.indexOf(cell.col) == -1
          || value.target == ROW && value.modified.indexOf(cell.row) == -1);
    });
    var checkArray = Utils.getFalseArray(_cells[0]);
    _cells.each(function(cell,i){
      $this.updateEncodeCell(d3.select(this),cell,value.animate, function(){
        checkArray[i] = true;
        if(Utils.checkTrueArray(checkArray) && _callback) _callback.call();
      });
    });
  }

  function doPreviewRowColSize(){
    var value = params[UPDATE_ROWCOL_SIZE_PREVIEW];
    value.modified.forEach(function(rowCol){
      rowCol.updateSizePreview();
    });
  }


  function doSeparator(){
    var value = params[UPDATE_SEPARATOR];
    var type = value.type;
    var modified = value.modified || $this.bertin.getAllBetweens();
    modified.forEach(function(between){
      between.separator.update(type,value.animate ? params[UPDATE_DURATION] : 0);
    });
  }

  function doGlue(_callback){
    var value = params[UPDATE_GLUE];
    switch(value.effect){
      case "create":
        $this.bertin.glues.createGlue(value.target, value.action, value.modified, function(){
          if(_callback)_callback.call();
        });
        break;
      case "remove":
        $this.bertin.glues.removeGlue(value.target, value.action, value.modified, function(){
          $this.bertin.glues.updateGluesPath(ON_BUTTONS,value.target,undefined,params[UPDATE_DURATION], function(){
            if(_callback)_callback.call();
          });
        });
        //be careful: do not call any function with a transition here, otherwise a bug occurs
        break;
      case "update":
        if(value.mode == undefined) console.error("need mode parameter in value",value);
        $this.bertin.glues.updateGluesPath(value.mode,value.target,undefined,params[UPDATE_DURATION], function(){
          if(_callback)_callback.call();
        });
        break;
      default:
        console.error("invalid effect",value.effect);
    }
  }
};


