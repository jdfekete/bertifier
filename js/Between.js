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


Between = function(bertin, target, left, right){

  this.left = left;
  this.right = right;
  this.mode = BETWEEN_TARGETS;

  /*
  this.bertin = bertin;
  this.target = target;
  this.separator = new Separator(this);
  this[FIELDS[GLUE]] = false;
  */
};

/*
 attr = GLUE,SEPARATOR,BORDER
 */
/*
Between.prototype.is = function(attr){
  return this[FIELDS[attr]];
};
Between.prototype.set = function(attr,is){
  this[FIELDS[attr]] = is;
};
Between.prototype.get = function(attr){
  return this[FIELDS[attr]];
};

Between.prototype.setAttr = function(attr, isOn){
  switch(attr){
    case SEPARATOR_WIDTH:
    case SEPARATOR_OPACITY:
      this.separator.applyChanges(attr,isOn);
      break;

    case GLUE:
      this.set(attr,isOn);
      break;


    default: console.error("invalid attribute",attr);
  }
};
*/

/*
//These functions are common to all Elements
Between.prototype.getCoords = function(){
  return {x1: this.left.getCoords().x2, x2: this.right.getCoords().x1};
};
Between.prototype.getSize = function(){
  return this.separator.width;
};
*/
Between.prototype.setLeft = function(rc){
  if(rc instanceof AbstractRowCol){
    this.left = rc;
  }
  else if(rc instanceof Glue){
    this.left = rc.lastBetween.right;
  }
  else console.error("rc must be a AbstractRowCol or Glue",rc);
};
Between.prototype.setRight = function(rc){
  if(rc instanceof AbstractRowCol){
    this.right = rc;
  }
  else if(rc instanceof Glue){
    this.right = rc.firstBetween.left;
  }
  else console.error("rc must be a AbstractRowCol or Glue",rc);
};
//Return the center between left and right x value if target==COL, y value if target==ROW
/*
Between.prototype.getMiddle = function(){
  var leftCoords = this.left.getCoords(),
      rightCoords = this.right.getCoords();

  return leftCoords.x2+(rightCoords.x1-leftCoords.x2)/2;
};
Between.prototype.toString = function(){
  return "[Bet "+this.left.index+","+this.right.index+"]";
};
*/















