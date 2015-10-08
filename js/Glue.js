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

import {BETWEEN, ON_BUTTONS, ON_MATRIX, ROW} from './Settings.js';
import {Utils} from './Utils.js';

export default function Glues(bertin){
  this.bertin = bertin;
  this.glues = [];
  this.transitions = this.bertin.matrixParams.transitions.crossingSettings.glue;
  this.matrixMargin = this.bertin.matrixParams.settings.buttons.margin;
};

/*
 Create a new glue and return it
 */
Glues.prototype.createGlue = function(target, action, betweens, callback){
  //if some betweens already in a glue, or if 2 glues are adjacent, merge the glues
  var startIndex = d3.min(betweens, function(d){return d.index})-1,
      endIndex = d3.max(betweens, function(d){return d.index})+1;
  //get the glues containing at least one of the new betweens
  var toMerge = this.glues.filter(function(glue){
    return glue.target == target && glue.intersects(startIndex,endIndex) || glue.adjacentTo(startIndex,endIndex);
  });

  //if create a new glue from existing ones, merge and remove all existing glues
  if(toMerge.length > 0){
    startIndex = Math.min(startIndex, d3.min(toMerge, function(d){return d.first.index}));
    endIndex = Math.max(endIndex, d3.max(toMerge, function(d){return d.last.index}));
    toMerge.forEach(function(glue){
      glue.remove();
    });
    //remove the existing glues
    this.removeNullGlues();
  }

  //finally, create the glue
  var the_glue = new Glue(this,target, action, startIndex, endIndex);
  this.glues.push(the_glue);

  //if a new glue created, then create its SVG
  the_glue.create();

  callback.call();
};

Glues.prototype.removeGlue = function(target,action,betweens, callback){
  var $this = this;
  var startIndex = d3.min(betweens, function(d){return d.index})-1,
      endIndex = d3.max(betweens, function(d){return d.index})+1;
  var newGlues = [];
  this.glues.filter(function(glue){return glue.target == target}).forEach(function(glue){
    //split if all indexes contained into current glue
    if(glue.contains(startIndex,endIndex)){
      var startLeft = glue.first.index,
          endRight = glue.last.index;

      glue.remove();//ready for glue suppression

      var glueLeft = new Glue($this, target, action, startLeft, startIndex),
          glueRight = new Glue($this, target, action, endIndex, endRight);

      //check if created glues are not null
      if(glueLeft.first != null){
        newGlues.push(glueLeft);
        glueLeft.create();
      }
      if(glueRight.first != null){
        newGlues.push(glueRight);
        glueRight.create();
      }
    }
    else if(glue.intersects(startIndex, endIndex)){
      glue.removeIndexes(startIndex, endIndex);
    }
  });

  this.glues = this.glues.concat(newGlues);

  this.removeNullGlues();

  callback.call();
};

Glues.prototype.removeNullGlues = function(){
  var tmp = this.glues.slice(0);
  this.glues.forEach(function(glue){
    if(glue.first == null){
      tmp.splice(tmp.indexOf(glue),1);
    }
  });
  this.glues = tmp;
};

Glues.prototype.getGlueWith = function(target, rowCol){
  for(var g in this.glues){
    var glue = this.glues[g];
    if(glue.target == target && glue.containsElement(rowCol)) return glue;
  }
  return null;
};

/*
 t = current transition
 */
Glues.prototype.showDragLayer = function(show, hasTransition){
  this.glues.forEach(function(glue){
    if(show) glue.moveToButtons(hasTransition);
    else glue.moveToMatrixBorder(hasTransition);
  });
};

Glues.prototype.updateGluesPath = function(mode,target,glues,duration, callback){
  var _glues = this.glues.filter(function(d){
    if(target != undefined && d.target != target) return false;
    if(glues && glues.indexOf(d) == -1) return false;
    return true;
  });
  var toCheck = Utils.getFalseArray(_glues);
  _glues.forEach(function(glue,i){
    glue.updatePath(mode,duration);
    toCheck[i] = true;
    if(Utils.checkTrueArray(_glues)) callback.call();
  });
};

//called when reorder algo is run, to update the glue indexes and the betweens glue value
Glues.prototype.refreshAllGlues = function(){
  var $this = this;
  var gluedBetweens = [];
  this.glues.forEach(function(glue){
    if(glue.first.index > glue.last.index){
      var tmp = glue.first;
      glue.first = glue.last;
      glue.last = tmp;
    }
    //now add the betweens as glued
    for(var i = glue.first.index - 1; i <= glue.last.index + 1; i += 2){
      if(i == 0 || i == $this.bertin.elements[glue.target].length-1) continue;
      if($this.bertin.elements[glue.target][i].type != BETWEEN) console.log("Error - element must be Between",$this.bertin.elements[glue.target][i]);
      if(gluedBetweens.indexOf($this.bertin.elements[glue.target][i]) == -1)gluedBetweens.push($this.bertin.elements[glue.target][i]);
    }
  });
  this.bertin.getAllBetweens().forEach(function(b){
    b.glue = gluedBetweens.indexOf(b) != -1;
  });
};


/*
 startIndex and endIndex are indexes of Row/Col
 first and last are Row/Col
 */
function Glue(glues, target, action, startIndex, endIndex){
  this.glues = glues;
  this.target = target;
  this.action = action;
  this.setIndexes(startIndex,endIndex);
};

Glue.prototype.create = function(){
  this.glueSVG = this.glues.bertin.matrix.root.append("path")
      .attr("d",this.getGluePath(ON_BUTTONS))
      .style("opacity",0)
      .style("fill","none")
      .style("stroke-width",this.getStrokeWidth(ON_BUTTONS))
      .style("stroke","black")
      .style("pointer-events", "none");

  //create the svg glue
  this.glueSVG.transition().duration(this.glues.transitions.create).style("opacity",1);
};

Glue.prototype.remove = function(){
  if(this.glueSVG)this.glueSVG.remove();
  this.glueSVG = null;
  this.target = null;
  this.action = null;
  this.glues = null;
  this.first = null;
  this.last = null;
};

Glue.prototype.intersects = function(startIndex, endIndex){
  return this.last.index >= startIndex && this.last.index <= endIndex
      || this.first.index <= endIndex && this.first.index >= startIndex;
};

Glue.prototype.adjacentTo = function(startIndex,endIndex){
  return startIndex == this.last.index || endIndex == this.first.index;
};

Glue.prototype.contains = function(startIndex, endIndex){
  return this.first.index <= startIndex && this.last.index >= endIndex;
};

Glue.prototype.containsElement = function(element){
  return element.index >= this.first.index && element.index <= this.last.index;
};

Glue.prototype.getAllElements = function(){
  var $this = this;
  return this.glues.bertin.elements[this.target].filter(function(d){return d.index >= $this.first.index && d.index <= $this.last.index});
};

Glue.prototype.getAllRowCols = function(){
  var $this = this;
  return this.glues.bertin.elements[this.target].filter(function(d){return d.type != BETWEEN && d.index >= $this.first.index && d.index <= $this.last.index});
};

Glue.prototype.getCoords = function(){
  return {x1: this.first.getX1Coord(), x2: this.last.getX2Coord()};
};

Glue.prototype.getMiddle = function(){
  return (this.first.getX1Coord() + this.last.getX2Coord())/2;
};


/*
 Remove some betweens from the glue, and remove the glue itself if no betweens anymore
 */
Glue.prototype.setIndexes = function(startIndex,endIndex){
  //console.log("for "+this.toString())
  this.first = this.glues.bertin.elements[this.target][startIndex];
  this.last = this.glues.bertin.elements[this.target][endIndex];

  //console.log(this.first.index,this.last.index)
  //if no between anymore
  if(this.first.index >= this.last.index){
    this.remove();
  }
};

Glue.prototype.removeIndexes = function(startIndex, endIndex){
  var newStart = this.first.index,
      newEnd = this.last.index;
  if(this.first.index <= endIndex && this.first.index >= startIndex){
    newStart = endIndex;
  }
  else if(this.last.index >= startIndex && this.last.index <= endIndex){
    newEnd = startIndex;
  }
  else console.error("indexes must intersect",startIndex,endIndex,this);
  this.setIndexes(newStart, newEnd);
};

Glue.prototype.updatePath = function(mode,duration){
  this.glueSVG.transition().duration(duration)
      .attr("d",this.getGluePath(mode))
      .style("stroke-width",this.getStrokeWidth(mode));
};

Glue.prototype.getStrokeWidth = function(mode){
  if(mode == ON_BUTTONS) return this.glues.bertin.matrixParams.glue.strokeWidth.onButtons;
  else if(mode == ON_MATRIX) return this.glues.bertin.matrixParams.glue.strokeWidth.onMatrix;
  else {
    console.error("invalid mode",mode);
    return null;
  }
};

Glue.prototype.moveToMatrixBorder = function(hasTransition){
  var $this = this;
  this.glueSVG.style("pointer-events", "auto");

  /*if(hasTransition) this.glueSVG.transition().attr("d",this.getGluePath(this.glues.ON_MATRIX));
   else */this.glueSVG.transition().duration(this.glues.transitions.animate)
      .attr("d",this.getGluePath(ON_MATRIX))
      .style("stroke-width",this.getStrokeWidth(ON_MATRIX));
  this.glueSVG.on("mouseover",function(){d3.select(this).style("cursor", $this.target == ROW ? "s-resize" : "w-resize")});
};

Glue.prototype.moveToButtons = function(hasTransition){
  var $this = this;
  /*if(hasTransition) this.glueSVG.transition().attr("d",this.getGluePath(this.glues.ON_BUTTONS));
   else*/ this.glueSVG.transition().duration(this.glues.transitions.animate)
      .attr("d",this.getGluePath(ON_BUTTONS))
      .style("stroke-width",this.getStrokeWidth(ON_BUTTONS));
  this.glueSVG.style("pointer-events", "none");
};

Glue.prototype.getGluePath = function(mode){
  var matrixCoords = this.glues.bertin.getMatrixCoordinates();
  var firstBetween = this.glues.bertin.elements[this.target][this.first.index+1],
      lastBetween = this.glues.bertin.elements[this.target][this.last.index-1],
      firstRowCol = this.first,
      lastRowCol = this.last;
  switch(mode){
    case ON_BUTTONS:
      //retrieve the corresponding first and last glue buttons
      var posButLeft = this.glues.bertin.commands.crossingHandler.getCrossingButtonAbsPos(firstBetween,this.action),
          posButRight = this.glues.bertin.commands.crossingHandler.getCrossingButtonAbsPos(lastBetween,this.action);

      return this.target == ROW ?
          "M "+posButLeft[0]+" "+posButLeft[1]+" "+
              "h "+0+" "+
              "v "+(posButRight[1]-posButLeft[1])+" "+
              "h "+0
          :
          "M "+posButLeft[0]+" "+posButLeft[1]+" "+
              "v "+0+" "+
              "h "+(posButRight[0]-posButLeft[0])+" "+
              "v "+0;
      break;
    case ON_MATRIX:
      var leftPos = firstRowCol.getCoords().x1 + this.getStrokeWidth(ON_BUTTONS)/2;
      var rightPos = lastRowCol.getCoords().x2 - this.getStrokeWidth(ON_BUTTONS)/2;
      return this.target == ROW ?
          "M "+matrixCoords.x2+" "+leftPos+" "+
              "h "+this.glues.matrixMargin+" "+
              "v "+(rightPos-leftPos)+" "+
              "h "+(-this.glues.matrixMargin)
          :
          "M "+leftPos+" "+matrixCoords.y2+" "+
              "v "+this.glues.matrixMargin+" "+
              "h "+(rightPos-leftPos)+" "+
              "v "+(-this.glues.matrixMargin);
      break;
    default: console.error("invalid mode "+mode); return null;
  }
};
