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


Separator = function(between){
  var $this = this;
  this.between = between;

  //scaleWidth is the same for size and margin
  var scaleDomain = DISCRETE_SLIDERS_VALUES[SEPARATOR_SIZE].map(function(d,i){
    return i / (DISCRETE_SLIDERS_VALUES[SEPARATOR_SIZE].length - 1);
  });
  this.scaleWidth = d3.scale.ordinal()
      .domain(scaleDomain)
      .range(DISCRETE_SLIDERS_VALUES[SEPARATOR_SIZE]);

  this.widths = [];

  [SEPARATOR_MARGIN,SEPARATOR_SIZE].forEach(function(action){
    var normalizedWidth = scaleDomain[DISCRETE_SLIDERS_VALUES[action].indexOf(SEP_DEFAULT_WIDTH[action])],
        width = $this.scaleWidth(normalizedWidth);
    $this.widths[action] = {
      width: width,
      normalizedWidth: normalizedWidth
    };
    $this.backupWidth(action);
  });


};

Separator.prototype.getWidth = function(action){
  return this.widths[action].width;
};
Separator.prototype.getNormalizedWidth = function(action){
  return this.widths[action].normalizedWidth;
};
//width param between 0 and 1
Separator.prototype.setWidth = function(action,width){
  this.widths[action].normalizedWidth = width;
  this.widths[action].width = this.scaleWidth(width);
};
Separator.prototype.backupWidth = function(action){
  this.widths[action].widthBkp = this.widths[action].width;
  this.widths[action].normalizedWidthBkp = this.widths[action].normalizedWidth;
};
Separator.prototype.restoreBackupWidth = function(action){
  this.widths[action].width = this.widths[action].widthBkp;
  this.widths[action].normalizedWidth = this.widths[action].normalizedWidthBkp;
};

/*
 -action: SEPARATOR_SIZE or SEPARATOR_MARGIN
 params:
 -event: "set" or "restore"
 -value: the new normalizedValue
 */
Separator.prototype.applyChanges = function(action,params){
  /*
   in this case, isOn is an object:
   -event: "set" or "restore"
   -value: the normalizedValue that is updated
   */
  switch(params.event){
    case "set":
      this.setWidth(action,params.value);
      break;
    case "restore":
      this.restoreBackupWidth(action);
      break;
    default: console.error("invalid param event",action,params);
  }
};

Separator.prototype.initSeparator = function(){
  /*
  this.separatorSVG = this.between.bertin.matrix.root.append("g")
      .attr({
        tr:0,
        class: "separator"
      });*/
  //.call(dragBehavior);

  var id = "id-"+this.between.target+"-"+this.between.index;
  this.separatorSVG = this.between.bertin.matrix.root.selectAll(".sep-line."+id)
      .data([{action: SEPARATOR_MARGIN, color: "white"}, {action: SEPARATOR_SIZE, color: "black"}])
      .enter()
      .append("line")
      .style("stroke",function(d){return d.color})
      .attr("class","separator "+id);
      //.each(function(d){if(d.action == SEPARATOR_SIZE) d3.select(this).moveToFront()});

  this.update();
};

Separator.prototype.moveBlackToFront = function(){
  this.separatorSVG.filter(function(d){return d.action == SEPARATOR_SIZE}).moveToFront();
};

Separator.prototype.update = function(action,duration){
  var $this = this;
  var tLine = this.separatorSVG.transition().duration(duration || 0);

  switch(action){
    case SEPARATOR_SIZE:
    case SEPARATOR_MARGIN:
      updateWidth();
      break;

    case SEPARATOR_POSITION:
      updatePosition();
      break;

    case undefined:
      updatePosition();
      updateWidth();
      break;

    default: console.error("invalid action",action);
  }

  function updateWidth(){
    tLine.style("stroke-width",function(d){
      if(d.action == SEPARATOR_SIZE) return $this.widths[SEPARATOR_SIZE].width;
      else return $this.widths[SEPARATOR_SIZE].width + $this.widths[SEPARATOR_MARGIN].width * 2;
    });
  }

  function updatePosition(){
    var matrixCoords = $this.between.bertin.getMatrixCoordinates();
    var center = $this.between.getPosAbs();
    var target = $this.between.target;
    //console.error(matrixCoords,center,target)

    tLine.attr({
      x1: target == ROW ? matrixCoords.x1 : center,
      y1: target == ROW ? center : matrixCoords.y1,
      x2: target == ROW ? matrixCoords.x2 : center,
      y2: target == ROW ? center : matrixCoords.y2
    });
  }


};

Separator.prototype.getSeparatorWidth = function(){
  return this.widths[SEPARATOR_SIZE].width + this.widths[SEPARATOR_MARGIN].width * 2;
};