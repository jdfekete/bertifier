/*
Bertifier, crafting tabular visualizations, v1
(c) 2014-2014, Inria
Authors: PERIN Charles, DRAGICEVIC Pierre, FEKETE Jean-Daniel

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */



function Bertin(params){
  var $this = this;
  this.x = params.x;
  this.y = params.y;
  this.datasetId = params.datasetId;
  this.datasetVersion = parseInt(params.datasetVersion);
  this.csv = params.csv;
  this.matrixParams = params.matrixParams;
  this.menuParams = params.menuParams;
  this.descriptionAreaParams = params.descriptionAreaParams;
  this.exportSVGParams = params.exportSVGParams;
  this.annotatorParams = params.annotatorParams;

  if(SHOW_BUG_BUTTONS) this.createDebugTrigger("resize_rowcol");

  var clientSize = {
    width: (window.innerWidth || document.body.clientWidth || params.width) - 45 - this.x,
    height: (window.innerHeight || document.body.clientHeight || params.height) - 25 - this.y
  };
  this.width = clientSize.width;
  this.height = clientSize.height;

  this.offset = [this.matrixParams.settings.dimensionsInit.left,this.matrixParams.settings.dimensionsInit.top];

  this.loadData(this.csv, this.datasetId, this.datasetVersion, function(){
    var raw_data = this;
    $this.init(raw_data, function(){
      hideLoadingPage();
    });
    if(params.load) $this.saver.loadFromUrl();
  });

}

Bertin.prototype.createDebugTrigger = function(debug){
  var span = d3.select("body").append("span").attr("id","debug"+debug);
  switch(debug){
    case "resize_rowcol":
        span.append("button").html("Demo Layout").style({
          position: "absolute",
          bottom: "10px"
        }).on("click", function(d){RESIZE_ROWCOL_BUG = !RESIZE_ROWCOL_BUG});
      break;
    default:
      console.error("invalud debug identifier",debug);
  }
};

Bertin.prototype.loadData = function(csv, dataId, dataVersion, callback){
  var url = undefined;

  //load CSV
  if(csv){
    callback.call(JSON.parse(localStorage["CSV_DATA"]));
  }

  //load GS
  else{
    switch(dataVersion){
      case 1:
        url = 'https://docs.google.com/spreadsheet/pub?key=' + dataId + '&output=csv';
        break;
      case 2:
        url = 'https://docs.google.com/spreadsheets/d/' + dataId + '/export?format=csv&id=' + dataId;
        //https://docs.google.com/spreadsheets/d/19IK_RYC_hDEegUnluQL1eT-6o0GsXAKc7ND7dbHZuho/export?format=csv&id=19IK_RYC_hDEegUnluQL1eT-6o0GsXAKc7ND7dbHZuho
        break;
      default: console.error("invalid data version",dataVersion);
    }

    $.get(url, function(data,status){
      if(status != "success") {
        createErrorPage("cannot load the CSV dataset: "+status);
      }
      else {
        data = $.csv.toArrays(data);

        if(callback) callback.call(data);
      }
    });
  }





};

Bertin.prototype.init = function(raw_data, callback){
  var $this = this;
  //---------------------------------------------------------------//
  //----------------------Data preparation-------------------------//
  //---------------------------------------------------------------//

  //console.log("raw", raw_data)

  //scaleMinMax = array of [min,max] FORCED by SCALE_CUSTOM_RANGE_MIN and/or SCALE_CUSTOM_RANGE_MAX
  var customMinIndex = raw_data[0].indexOf(SCALE_CUSTOM_RANGE_MIN),
      customMaxIndex = raw_data[0].indexOf(SCALE_CUSTOM_RANGE_MAX),
      customBaselineIndex = raw_data[0].indexOf(SCALE_CUSTOM_RANGE_BASELINE);

  var customBaseline = undefined;
  if(customBaselineIndex != -1){
    customBaseline = raw_data.map(function(line){
      return parseFloat(line[customBaselineIndex]);
    });
  }


  var scaleMinMax = raw_data.map(function(line){
    var min = undefined, max = undefined;
    if(customMinIndex != -1){
      min = parseFloat(line[customMinIndex]);
    }
    if(customMaxIndex != -1){
      max = parseFloat(line[customMaxIndex]);
    }
    return [min,max];
  });

  //filter the data to remove undisplayed columns
  raw_data = raw_data.map(function(line,l){
    return line.filter(function(col,c){
      if(customMinIndex != -1 && c == customMinIndex || customMaxIndex != -1 && c == customMaxIndex) return false;
      if(customBaselineIndex != -1 && c == customBaselineIndex) return false;
      return true;
    });
  });

  this.data = [];
  raw_data.forEach(function(line,l){
    line.forEach(function(col,c){
      $this.data.push({c: c*2+1, l: l*2+1, value: col});
    });
  });

  this.formatValues(this.data);

  //console.log("data", this.data)

  this.nbCols = raw_data[0].length;
  this.nbRows = raw_data.length;

  this.elements = [];
  this.elements[ROW] = [];
  this.elements[COL] = [];
  for(var i = 0; i< this.nbCols*2+1; i++){
    if(i%2 == 0) this.elements[COL].push(new Element({
      bertin: $this,
      index: i,
      target: COL,
      type: BETWEEN
    }));
    else this.elements[COL].push(new Element({
      bertin: $this,
      index: i,
      cells: $this.data.filter(function(cell){//noinspection JSReferencingMutableVariableFromClosure
        return cell.c == i}),
      target: COL,
      type: COL
    }));
  }
  for(i = 0; i< this.nbRows*2+1; i++){
    if(i%2 == 0) this.elements[ROW].push(new Element({
      bertin: $this,
      index: i,
      target: ROW,
      type: BETWEEN
    }));
    else this.elements[ROW].push(new Element({
      bertin: $this,
      index: i,
      cells: $this.data.filter(function(cell){//noinspection JSReferencingMutableVariableFromClosure
        return cell.l == i}),
      target: ROW,
      type: ROW
    }));
  }

  this.elements[ROW].forEach(function(e){
    if(e.type == ROW) {
      e.createScale(scaleMinMax[(e.index-1)/2], customBaseline != undefined ? customBaseline[(e.index-1)/2] : undefined);
      e.scale.changeCustomRange();
    }});


  this.glues = new Glues(this);

  //---------------------------------------------------------------//
  //----------------------SVG--------------------------------------//
  //---------------------------------------------------------------//
  this.svg = d3.select("body").append("svg")
      .attr({
        width: this.width,
        height: this.height
      });

  //the defs
  var defs = this.svg.append("defs");

  //fonts
  var style = defs.append("style").attr("type","text/css");
  style.html(fonts);

  defs.append("pattern")//separators hatch
      .attr('id', 'horizonHatchVertical')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 4)
      .attr('height', 4)
      .attr("patternTransform", "scale(1,1)")
      .append('path')
      .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
      .attr('stroke', 'black')
      .attr('stroke-width', 1);

  defs.append("pattern")//separators hatch
      .attr('id', 'horizonHatchHorizontal')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 4)
      .attr('height', 4)
      .attr("patternTransform", "scale(3,3)")// rotate(90) - change it or not??
      .append('path')
      .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
      .attr('stroke', 'black')
      .attr('stroke-width', 1);

  //bluer filter
  defs.append("filter")
      .attr("id","bluer")
      .append("feColorMatrix")
      .attr("in", "SourceGraphic")
      .attr("type","matrix")
      .attr("values",
          ".6 0 0 0 0 " +//red
              "0 .8 0 0 0 " +//green
              ".3 .3 1 0 0 " +//blue
              "0 0 0 1 0");//alpha

  defs.append("filter")
      .attr("id","reder")
      .append("feColorMatrix")
      .attr("in", "SourceGraphic")
      .attr("type","matrix")
      .attr("values",
          ".5 1 .5 0 0 " +//red
              "0 .8 0 0 0 " +//green
              "0 0 .8 0 0 " +//blue
              "0 0 0 1 0");//alpha

  this.matrixParams.width = this.width;
  this.matrixParams.height = this.height-this.matrixParams.y;
  this.matrix = new Matrix(this.matrixParams,this);
  this.descriptionAreaParams.width = this.width - this.exportSVGParams.width - this.descriptionAreaParams.margin.left;
  this.descriptionArea = new DescriptionArea(this, this.descriptionAreaParams);
  this.annotator = new Annotator(this, this.annotatorParams);
  this.exportSVG = new ExportSVG(this, this.exportSVGParams);
  this.saver = new Saver(this);

  this.matrix.updateAttributes({
    elementsSizes: {type: "text"},
    posAbs: {target: undefined}
  }, function(){
    //init the commands
    $this.commands = new Commands($this);
    $this.commands.createAll();

    //init the separators
    $this.getAllBetweens().forEach(function(between){between.separator.initSeparator()});
    $this.getAllBetweens().forEach(function(between){between.separator.moveBlackToFront()});

    //update the matrix view
    var updateView = [];
    updateView[UPDATE_DURATION] = undefined;
    updateView[UPDATE_TRANSLATE] = {};
    updateView[CHANGE_ENCODING] = {};
    $this.matrix.updateView(updateView, function(){
      $this.updateSVGSize();
      callback.call();
    });
  });
};

Bertin.prototype.updateSVGSize = function(){
  var clientSize = {
    width: (window.innerWidth || document.body.clientWidth) - 45 - this.x,
    height: (window.innerHeight || document.body.clientHeight) - 25 - this.y
  };
  var commandsBBox = this.commands.commandsBBox;
  //TODO - check annotations
  this.svg.attr({
    width: Math.max(commandsBBox.x1 + commandsBBox.x2, clientSize.width),
    height: Math.max(commandsBBox.y1 + commandsBBox.y2, clientSize.height) + 300
  });
  this.descriptionArea.setWidth(clientSize.width - this.exportSVGParams.width);
};

//noinspection JSUnusedGlobalSymbols
Bertin.prototype.getBetweens = function(target){
  return this.elements[target].filter(function(e){return e.type == BETWEEN});
};

Bertin.prototype.getAllBetweens = function(){
  var res = [];
  this.elements.forEach(function(elements){
    res = res.concat(elements.filter(function(e){return e.type == BETWEEN}));
  });
  return res;
};

Bertin.prototype.getAllElements = function(target,mode){
  return this.elements[target].filter(function(e){
    return e.mode == mode;
  });
};

Bertin.prototype.isCell = function(cell, attr){
  return cell.row.is(attr) || cell.col.is(attr);
};
Bertin.prototype.getCellAttributes = function(cell){
  var res = [];
  [ROW,COL].forEach(function(target){
    var rowColField = target == ROW ? "row" : "col";
    res[target] = [];
    [HIDDEN,HEADER,NEGATIVE].forEach(function(attr){
      res[target][attr] = cell[rowColField].is(attr);
    })
  });
  return res;
};

Bertin.prototype.formatValues = function(matrix){
  matrix.forEach(function(d){
    var number = Utils.getNumber(d.value);
    var array = Utils.getArray(d.value);
    if(number != null) d.value = number;
    else if(array != null && array.length > 0) {//check for confidence interval format
      if(array.length != 3) d.value = array[0];
      else{
        d.value = array[1];
        d.ci_min = array[0];
        d.ci_max = array[2];
      }
    }
    else if(d.value == null || d.value == undefined) d.value = "";
  });
};

Bertin.prototype.getMatrixCoordinates = function(){
  return {
    x1:this.elements[COL][0].getCoords().x1,
    y1:this.elements[ROW][0].getCoords().x1,
    x2:this.elements[COL][this.elements[COL].length-1].getCoords().x2,
    y2:this.elements[ROW][this.elements[ROW].length-1].getCoords().x2
  };
};

Bertin.prototype.getMatrixDimensions = function(){
  var matCoords = this.getMatrixCoordinates();
  return {width: matCoords.x2 - matCoords.x1, height: matCoords.y2 - matCoords.y1};
};

Bertin.prototype.getMinMaxCoords = function(type){
  var elems = this.getAllElements(type,ON_TARGET);
  return {
    min: d3.min(elems, function(d){return d.getCoords().x1}),
    max: d3.max(elems, function(d){return d.getCoords().x2})
  }
};


Bertin.prototype.dragRowCols = function(dragData,dragPos){
  var $this = this;
  var target = dragData.dir;
  var draggedElement = dragData.draggedElement[target];
  if(draggedElement.elements.length == 0) console.error("need at least one element in dragggedElement",draggedElement);
  if(draggedElement.elements[0].type != ROW && draggedElement.elements[0].type != COL) console.error("invalid elements",draggedElement,draggedElement.elements[0].type);

  var firstElem = draggedElement.elements[0],
      lastElem = draggedElement.elements[draggedElement.elements.length-1];

  var draggableElements = dragData.draggableElements[target];
  var allElements = this.elements[target];
  var leftPosOrig = dragPos - draggedElement.totalSize / 2,
      rightPosOrig = dragPos + draggedElement.totalSize / 2;

  if(leftPosOrig < dragData.minMax.min){
    leftPosOrig = dragData.minMax.min;
    rightPosOrig = leftPosOrig + draggedElement.totalSize;
  }
  else if(rightPosOrig > dragData.minMax.max){
    rightPosOrig = dragData.minMax.max;
    leftPosOrig = rightPosOrig - draggedElement.totalSize;
  }

  //the dragged elements follows the mouse
  //console.log(firstElem.getX1Coord(),leftPosOrig)
  var shift = firstElem.getX1Coord() - leftPosOrig;
  draggedElement.elements.forEach(function(d){
    d.setX1Coord(d.getX1Coord() - shift);
  });

  var modifiedElements = [], sep, dest;
  //if go right
  if(dragPos > dragData.start){
    while(draggedElement.index < draggableElements.length-1){
      sep = allElements[lastElem.index+1];
      dest = draggableElements[draggedElement.index+1];
      if(rightPosOrig > dest.middle()){
        dest.index -= 1;
        draggedElement.index += 1;
        draggableElements.sort(function(a,b){return d3.ascending(a.index, b.index)});

        dest.elements.forEach(function(e){e.index -= draggedElement.elements.length + 1});
        draggedElement.elements.forEach(function(e){e.index += dest.elements.length + 1});
        sep.index -= draggedElement.elements.length - dest.elements.length;

        $this.sortElements(target);

        dest.elements.forEach(function(e){e.setX1Coord($this.elements[target][e.index-1].getX2Coord())});
        sep.setX1Coord(dest.elements[dest.elements.length-1].getX2Coord());

        dest.elements.forEach(function(e){modifiedElements.push(e)});
        modifiedElements.push(sep);

        dragData.start = firstElem.getX1Coord() + draggedElement.totalSize / 2;
      }
      else break;
    }
  }
  //if go left
  else{
    while(draggedElement.index > 0){
      sep = allElements[firstElem.index-1];
      dest = draggableElements[draggedElement.index-1];
      if(leftPosOrig < dest.middle()){
        dest.index += 1;
        draggedElement.index -= 1;
        draggableElements.sort(function(a,b){return d3.ascending(a.index, b.index)});

        dest.elements.forEach(function(e){e.index += draggedElement.elements.length + 1});
        draggedElement.elements.forEach(function(e){e.index -= dest.elements.length + 1});
        sep.index += draggedElement.elements.length - dest.elements.length;

        $this.sortElements(target);

        dest.elements.slice(0).reverse().forEach(function(e){e.setX2Coord($this.elements[target][e.index+1].getX1Coord())});
        sep.setX2Coord(dest.elements[0].getX1Coord());

        dest.elements.forEach(function(e){modifiedElements.push(e)});
        modifiedElements.push(sep);

        dragData.start = firstElem.getX1Coord() + draggedElement.totalSize / 2;
      }
      else break;
    }
  }

  //2 updateView, 1 for dragged element with no animation, one for others
  var updateViewDragged = [];
  updateViewDragged[UPDATE_TRANSLATE] = {target: target, modified: draggedElement.elements};
  updateViewDragged[UPDATE_SEPARATOR] = {target: target, modified: draggedElement.elements.filter(function(d){return d.type == BETWEEN})};
  updateViewDragged[UPDATE_GLUE] = {target: target, mode:ON_MATRIX, effect: "update"};
  $this.matrix.updateView(updateViewDragged);

  var updateView = [];
  updateView[UPDATE_DURATION] = this.matrix.transitions.order.duration;
  updateView[UPDATE_TRANSLATE] = {target: target, modified: modifiedElements};
  updateView[UPDATE_SEPARATOR] = {target: target, modified: modifiedElements.filter(function(d){return d.type == BETWEEN})};
  //updateView[UPDATE_GLUE] = {target: target, mode:ON_MATRIX, effect: "update"};
  $this.matrix.updateView(updateView);

  $this.commands.updateCommandsTransform(target,modifiedElements.concat(draggedElement.elements));
  $this.commands.applyCommandsTransform(target,modifiedElements.concat(draggedElement.elements));

};

Bertin.prototype.releaseDragRowCol = function(rowCols){
  var $this = this;
  var target = rowCols[0].target;
  for(var r in rowCols){
    //noinspection JSUnfilteredForInLoop
    var rc = rowCols[r];
    rc.setX1Coord($this.elements[target][rc.index-1].getX2Coord());
  }
  var updateView = [];
  updateView[UPDATE_DURATION] = this.matrix.transitions.order.duration;
  updateView[UPDATE_TRANSLATE] = {target: target, modified: rowCols};
  updateView[UPDATE_SEPARATOR] = {target: target, modified: rowCols.filter(function(d){return d.type == BETWEEN})};
  updateView[UPDATE_GLUE] = {target: target, mode:ON_MATRIX, effect: "update"};
  this.matrix.updateView(updateView);
  this.commands.updateCommandsTransform(target,rowCols);
  this.commands.applyCommandsTransform(target,rowCols);
};

Bertin.prototype.getAllDraggableElements = function(target){
  var res = [];
  var i = 0;
  var j = 0;
  while(i < this.elements[target].length){
    var elem = this.elements[target][i];
    if(elem.type == BETWEEN){
      i++;
      continue;
    }
    var resElem = {},
        coords;
    var glue = this.glues.getGlueWith(target,elem);
    if(glue){
      resElem.type = "glue";
      resElem.elements = glue.getAllElements();
      coords = glue.getCoords();
      resElem.glueOrElem = glue;
      resElem.middle = function(){return this.glueOrElem.getMiddle()};
    }
    else{
      resElem.type = "rowCol";
      resElem.elements = [elem];
      coords = elem.getCoords();
      resElem.glueOrElem = elem;
      resElem.middle = function(){return this.glueOrElem.getMiddle()};
    }
    resElem.totalSize = coords.x2 - coords.x1;
    resElem.index = j;
    res.push(resElem);
    i += resElem.elements.length;
    j++;
  }
  return res;
};



Bertin.prototype.sortElements = function(target){
  this.elements[target].sort(function(a,b){return d3.ascending(a.index,b.index)});
};

Bertin.prototype.getFieldTitle = function(field){
  var _field = undefined;
  if(field instanceof RowScale) _field = SCALE;
  else if(field instanceof Separator) _field = SEPARATOR;
  else _field = field;

  if(FIELDS[_field] == undefined) console.error("undefined field",_field);
  return FIELDS[_field];
};

//noinspection JSUnusedGlobalSymbols
Bertin.prototype.printOrder = function(target){
  return "["+this.elements[target].map(function(d){return d.index}).join(",")+"]";
};
//noinspection JSUnusedGlobalSymbols
Bertin.prototype.printAttr = function(target,attr){
  return "["+this.elements[target].map(function(d){return d[attr]}).join(",")+"]";
};

Bertin.prototype.getIcon = function(iconName){
  return "./img/icon/"+iconName+".svg";
};

Bertin.prototype.getCursor = function(cursorName, hotspot){
  return "url(./img/cursor/"+cursorName+".cur) "+hotspot+", auto";
};

Bertin.prototype.showTopMenu = function(show){
  var mode = show ? "show" : "hide";
  if(!show && this.annotator.oneCommandActive()) return;
  this.annotator.annotationsMenu.transition()
      .duration(this.annotator.params.annotationArea[mode].duration)
      .delay(this.annotator.params.annotationArea[mode].delay)
      .style("opacity", show ? 1 : 0);
  this.exportSVG.svgExportArea.transition()
      .duration(this.exportSVG.params.svgExportArea[mode].duration)
      .delay(this.exportSVG.params.svgExportArea[mode].delay)
      .style("opacity", show ? 1 : 0);
};

Bertin.prototype.allRowsAreEncoded = function(){
  var $this = this;
//if all cells of a col have an encoding other than text, then optimize the size of the col
  var nonTextRows = $this.elements[ROW].filter(function(e){
    return e.type == ROW && !e.is(HEADER);
  });
  var allRowsEncoded = true;
  for(var r in nonTextRows){
    //noinspection JSUnfilteredForInLoop
    var row = nonTextRows[r];
    if(row.get(ENCODING) == TEXT){
      allRowsEncoded = false;
      break;
    }
  }
  return allRowsEncoded;
};

Bertin.prototype.applyLocalOrder = function(target, startIndex, endIndex){
  var $this = this;
  var modifiedElems = $this.elements[target].filter(function(d){return d.index >= startIndex && d.index <= endIndex});
  var modifiedRowCols = modifiedElems.filter(function(d){return d.type != BETWEEN});

  var updateAttributes = {posAbs: {target: target, modified: modifiedElems}};

  var updateView = [];
  updateView[UPDATE_DURATION] = $this.matrix.transitions.order.duration;
  updateView[UPDATE_TRANSLATE] = {target: target, modified: modifiedRowCols};
  updateView[UPDATE_SEPARATOR] = {};//TODO - not optimal
  updateView[UPDATE_GLUE] = {target: ROW, mode:ON_MATRIX, effect: "update"};
  //update the glues index
  this.glues.refreshAllGlues();


  //TODO add delay parameter true for nice animation
  $this.matrix.updateAttributes(updateAttributes, function(){
    $this.commands.updateCommandsTransform(undefined, undefined);
    $this.commands.applyCommandsTransform(undefined, undefined);
    $this.matrix.updateView(updateView);
  });
  console.log(this.getAllElements(ROW,BETWEEN_TARGETS).map(function(d){return d.glue}))
};

Bertin.prototype.invertRowCols = function(target,modified){
  modified = modified.sort(function(a,b){return d3.ascending(a.index, b.index)});
  var minIndex = modified[0].index,
      maxIndex = modified[modified.length-1].index;
  var reversedIndexes = modified.map(function(d){return d.index}).reverse();
  modified.forEach(function(rowCol,i){
    rowCol.index = reversedIndexes[i];
  });
  this.sortElements(target);
  this.applyLocalOrder(target, minIndex, maxIndex);
};

/*
 reorder.order().distance(dist)(data): reorder all elements
 reorder.order().distance(dist)(data, i, j): reorder only the subset [i, j[ and takes into account the context
 reorder.order().distance(dist).orderExcept(data, i, j): reorder everything except the subset [i, j[ and takes into account the context. Also moves [i,j[ to its best position
 */

Bertin.prototype.autoSortMatrix = function(target, orderName, distanceName, modified){
  var $this = this;
  var opTargetField = target == ROW ? "col" : "row";
  modified = modified.sort(function(a,b){return d3.ascending(a.index, b.index)});
  var orderParams = this.getReorderParams(target,modified);

  if(orderParams == null) return;

  //get the elements and the -1 and +1 elements too, if exist
  var inputElems = this.getAllElements(target,ON_TARGET).filter(function(e){
    return e.index >= orderParams.from - 2 && e.index <= orderParams.to + 2;
  });
  var inputOrder = inputElems.map(function(e){return e.index});

  var limitStart = inputOrder.indexOf(orderParams.from),
      limitEnd = inputOrder.indexOf(orderParams.to)+1;

  var except = [];
  orderParams.except.forEach(function(interval){
    except.push(inputOrder.indexOf(interval[0]),inputOrder.indexOf(interval[1])+1);
  });

  var adjacency = inputElems.map(function(elem){
    return elem.cells.filter(function(cell){
      return !cell[opTargetField].is(HEADER);
    }).sort(function(cell1,cell2){return d3.ascending(cell1[opTargetField].index,cell2[opTargetField].index)})
        .map(function(cell){
          //TODO - here transferedValue value, but could be sum(pixel_i * pixel_i_intensity)
          if(cell.row.get(ENCODING) == TEXT || cell.transferedValue == undefined || isNaN(cell.transferedValue)){
            return NaN;
          }
          //just to be sure...
          if(cell.transferedValue == undefined || isNaN(cell.transferedValue)) console.error("need cell normalized value for cell",cell);
          return cell.transferedValue;
        });
  });

  console.log(orderParams,inputOrder,limitStart,limitEnd,except,adjacency);
  var orders = distance(adjacency,inputOrder,limitStart,limitEnd,except);
  console.log(orders);

  applyNewOrders(orders);


  function distance(adjacency,inputOrder,limitStart,limitEnd,except) {
    if(adjacency.length < 2) return null;
    //double check: all compared arrays must have same length
    adjacency.forEach(function(_array){if(_array.length != adjacency[0].length) console.error("all arrays must have same length",adjacency[0].length,_array.length,_array);});

    var leafOrder = reorder.order().limits(limitStart, limitEnd).except(except)(adjacency);
    var outputOrder = [];
    leafOrder.forEach(function(d,i){
      outputOrder.push(inputOrder[d]);
    });

    if(inputOrder.length != outputOrder.length) console.error("length error:",inputOrder,outputOrder);
    return {input: inputOrder, output: outputOrder};
  }

  //each order in orders is an object input: [inputIndexes], output: [outputIndexes]
  function applyNewOrders(orders){
    var startIndex = Number.MAX_VALUE,
        endIndex = 0;
    orders.input.forEach(function(oldIndex,i){
      if(oldIndex < startIndex) startIndex = oldIndex;
      if(oldIndex > endIndex) endIndex = oldIndex;
      var elem = $this.elements[target][oldIndex];
      if(elem.type == BETWEEN) console.error("cannot be a between",elem,oldIndex);
      elem.setIndex(orders.input[orders.output.indexOf(oldIndex)]);
    });
    $this.sortElements(target);
    $this.applyLocalOrder(target, startIndex, endIndex);
  }

};

/*
 if only elems within a glue, reorder them
 if selection contains one or several complete glues, reorder the glued groups
 if selection contains 1 or 2 partial glues, do not consider them

 return an object
 from: start index (included)
 to: end index (included)
 except: list of glue start/end indexes that must not be reordered but just move
 */
Bertin.prototype.getReorderParams = function(target,elements){
  var result = {};
  if(elements.length < 2) return null;

  var i = 0;
  var resElements = [];
  while(i < elements.length){
    var elem = elements[i];
    var glue = this.glues.getGlueWith(target,elem);
    var res = {};
    if(glue){
      res.glue = true;
      res.complete = true;
      res.elements = glue.getAllRowCols().filter(function(elem){
        if(elements.indexOf(elem) != -1){
          return true;
        }
        else{
          res.complete = false;
          return false;
        }
      });
      resElements.push(res);
      i += res.elements.length;
    }
    else{
      res.glue = false;
      res.elements = elem;
      resElements.push(elem);
      i++;
    }
  }

  var removedGlues = [];
  resElements.forEach(function(e,i){
    //if first or last is a glue, and only partial glue, do not consider this glue
    if((i==0 || i == resElements.length-1) && e.glue == true && e.complete == false){
      removedGlues.push(e);
    }
  });
  removedGlues.forEach(function(glue){resElements.splice(resElements.indexOf(glue),1)});

  if(resElements.length == 1 && resElements[0].glue == true){//if all elements in one unique glue
    result.from = d3.min(resElements[0].elements, function(d){return d.index});
    result.to = d3.max(resElements[0].elements, function(d){return d.index});
    result.except = [];
  }
  else{
    if(resElements.length < 2) return null;

    result.from = d3.min(resElements, function(e){
      if(e.glue == true) return d3.min(e.elements, function(d){return d.index});
      else return e.index;
    });
    result.to = d3.max(resElements, function(e){
      if(e.glue == true) return d3.max(e.elements, function(d){return d.index});
      else return e.index;
    });
    //here we have a list of elements or complete glues
    result.except = resElements.filter(function(e){return e.glue == true}).map(function(glue){
      return [d3.min(glue.elements, function(d){return d.index}), d3.max(glue.elements, function(d){return d.index})];
    });
  }

  return result;
};

