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


RowScale = function(row, minMax, baseline){
  this.row = row;

  if(minMax instanceof Array && minMax.length == 2){
    this.customMin = !isNaN(minMax[0]) ? minMax[0] : undefined;
    this.customMax = !isNaN(minMax[1]) ? minMax[1] : undefined;
  }
  else{
    this.customMin = undefined;
    this.customMax = undefined;
  }

  if(baseline != undefined && Utils.isNumber(baseline)){
    this.baseline = baseline;
  }
  else{
    this.baseline = undefined;
  }

  this.statistics = [];

  this.transferFunctions = [];
  this.transferFunctions[SCALE_NORMALIZE] = new TransferNormalize(this);
  this.transferFunctions[SCALE_RANGE] = new TransferStretch(this);
  this.transferFunctions[SCALE_CONTRAST] = new TransferContrast(this);
  this.transferFunctions[SCALE_DISCRETIZE] = new TransferDiscretize(this);
};

/*
 inOut: in/out
 */
RowScale.prototype.getMinMax = function(transferFunction,inOut){
  return this.transferFunctions[transferFunction].getMinMax(inOut);
};

RowScale.prototype.updateStatistics = function(){
  var $this = this;
  var values = this.row.cells.filter(function(d){
    return !$this.row.bertin.isCell(d,HIDDEN) && !$this.row.bertin.isCell(d,HEADER) && Utils.isNumber(d.value);
  }).map(function(d){return d.transferedValue});

  this.statistics[STAT_MEAN] = d3.mean(values);
};

RowScale.prototype.getStatistic = function(stat){
  return this.statistics[stat];
};

RowScale.prototype.updateCellsTransferedValue = function(){
  var $this = this;
  this.row.cells.filter(function(d){
    return !$this.row.bertin.isCell(d,HIDDEN) && !$this.row.bertin.isCell(d,HEADER) && Utils.isNumber(d.value);
  }).forEach(function(cell){
        var trVal = $this.getTransferedValue(cell.value);
        cell.transferedValue = Math.max(0,Math.min(trVal,1));
        cell.transferedValueExtremumMin = trVal < 0;
        cell.transferedValueExtremumMax = trVal > 1;
        if(cell.ci_min != undefined && cell.ci_max != undefined){//TODO - handle ci_min and ci_max outliers
          cell.transferedCi_min = Math.max(0,Math.min($this.getTransferedValue(cell.ci_min),1));
          cell.transferedCi_max = Math.max(0,Math.min($this.getTransferedValue(cell.ci_max),1));
          if($this.row.bertin.isCell(cell,NEGATIVE)) {
            cell.transferedCi_min = 1-cell.transferedCi_min;
            cell.transferedCi_max = 1-cell.transferedCi_max;
          }
        }
        if($this.row.bertin.isCell(cell,NEGATIVE)) {
          cell.transferedValue = 1-cell.transferedValue;
        }
      });
  this.updateStatistics();
};

RowScale.prototype.changeCellValues = function(callback){
  var $this = this;
  var cellsNumber = this.row.cells.filter(function(d){
    return !$this.row.bertin.isCell(d,HIDDEN) && !$this.row.bertin.isCell(d,HEADER) && Utils.isNumber(d.value);
  });
  this.transferFunctions[SCALE_NORMALIZE].setValue(SCALE_IN,SLIDER_MIN,d3.min(cellsNumber, function(d){return d.value}));
  this.transferFunctions[SCALE_NORMALIZE].setValue(SCALE_IN,SLIDER_MAX,d3.max(cellsNumber, function(d){return d.value}));
  this.updateCellsTransferedValue();
  callback.call();
};

RowScale.prototype.getTransferedValue = function(value){
  //console.log("value",value)
  var norm = this.transferFunctions[SCALE_NORMALIZE].transfer(value);
  //console.log("normalized",norm);
  var stretch = this.transferFunctions[SCALE_RANGE].transfer(norm);
  //console.log("stretch",stretch)
  var contrasted = this.transferFunctions[SCALE_CONTRAST].transfer(stretch);
  //console.log("contrasted",contrasted)
  return this.transferFunctions[SCALE_DISCRETIZE].transfer(contrasted);
};

RowScale.prototype.applyChanges = function(transferFunction, params){
  var inOut = SCALE_IN;
  switch(params.event){
    case "set":
      this.transferFunctions[transferFunction].setValue(inOut,params.type,params.value);
      break;
    case "restore":
      this.transferFunctions[transferFunction].restoreValue(inOut,params.type);
      break;
    default: console.error("invalid event",params);
  }
  this.updateCellsTransferedValue();
};

RowScale.prototype.backupValue = function(transferFunction, inOut, type){
  this.transferFunctions[transferFunction].backupValue(inOut,type);
};

RowScale.prototype.getValue = function(transferFunction, inOut, type){
  return this.transferFunctions[transferFunction].getValue(inOut,type);
};

RowScale.prototype.changeCustomRange = function(){
  this.transferFunctions[SCALE_NORMALIZE].updateTransfer();
};

RowScale.prototype.changeBaseline = function(){
  this.transferFunctions[SCALE_NORMALIZE].updateTransfer();
};

RowScale.prototype.getNormalizedBaseline = function(){
  if(this.baseline != undefined){
    return this.getTransferedValue(this.baseline);
  }
  else {
    return this.getStatistic(STAT_MEAN);
  }
};

TransferFunction = function(rowScale){
  var $this = this;
  this.rowScale = rowScale;

  this.values = [];
  this.backupValues = [];
  this.ranges = [];
  //create all values
  [SCALE_IN,SCALE_OUT].forEach(function(inOut){
    $this.values[inOut] = [];
    $this.backupValues[inOut] = [];
    [SLIDER_VALUE,SLIDER_MIN,SLIDER_MAX].forEach(function(type){
      $this.backupValue(inOut,type);
    });
  });

  this.init();

  //backup all values
  [SCALE_IN,SCALE_OUT].forEach(function(inOut){
    [SLIDER_VALUE,SLIDER_MIN,SLIDER_MAX].forEach(function(type){
      $this.backupValue(inOut,type);
    });
  });
};
TransferFunction.prototype.init = function(){console.log("TODO init")};//To override
TransferFunction.prototype.toString = function(){
  return "in:["+this.values[SCALE_IN][SLIDER_MIN]+","+this.values[SCALE_IN][SLIDER_MAX]+"], out:["+this.values[SCALE_OUT][SLIDER_MIN]+","+this.values[SCALE_OUT][SLIDER_MAX]+"]";
};
TransferFunction.prototype.getMinMax = function(inOut){
  return [this.values[inOut][SLIDER_MIN],this.values[inOut][SLIDER_MAX]]
};
//params: type: min max value or all
TransferFunction.prototype.backupValue = function(inOut,type){
  this.backupValues[inOut][type] = this.values[inOut][type];
};
//params: type: min max or value, value: the new value
TransferFunction.prototype.setValue = function(inOut,type,value){
  switch(type){
    case SLIDER_MIN://TODO - bug here: if set then unset header the min or max value of the row
      if(value < this.ranges[inOut][0] || value > this.values[inOut][SLIDER_MAX]) console.error("invalid value",value);
      this.values[inOut][type] = value;
      break;
    case SLIDER_MAX:
      if(value < this.values[inOut][SLIDER_MIN] || value > this.ranges[inOut][1]) console.error("invalid value",value);
      this.values[inOut][type] = value;
      break;
    case SLIDER_VALUE:
      if(value < this.ranges[inOut][0] || value > this.ranges[inOut][1]) console.error("invalid value",value);
      this.changeInValue(value);
      break;
    default: console.error("invalid type",type);
  }
  this.updateTransfer();
};

//params: type: min max or value
TransferFunction.prototype.restoreValue = function(inOut,type){
  this.setValue(inOut,type,this.backupValues[inOut][type]);
};

TransferFunction.prototype.getValue = function(inOut,type){
  return this.values[inOut][type];
};
TransferFunction.prototype.changeInValue = function(value){};//To Override


TransferNormalize = function(rowScale){
  this.__proto__.__proto__.constructor.apply(this,[rowScale]);
};
TransferNormalize.prototype = Object.create((Object)(TransferFunction.prototype));
TransferNormalize.prototype.init = function(){
  var $this = this;

  if(this.rowScale.customMin != undefined) {
    this.customMin = this.rowScale.customMin;
  }
  if(this.rowScale.customMax != undefined){
    this.customMax = this.rowScale.customMax;
  }

  if(this.rowScale.row[FIELDS[SCALE_CUSTOM_RANGE]]) {
    this.ranges[SCALE_IN] = this.getRowMinMax();
  }
  else{
    this.ranges[SCALE_IN] = this.getCellsMinMax();
  }

  this.values[SCALE_IN][SLIDER_MIN] = this.ranges[SCALE_IN][0];
  this.values[SCALE_IN][SLIDER_MAX] = this.ranges[SCALE_IN][1];
  this.ranges[SCALE_OUT] = [0,1];
  this.values[SCALE_OUT][SLIDER_MIN] = this.ranges[SCALE_OUT][0];
  this.values[SCALE_OUT][SLIDER_MAX] = this.ranges[SCALE_OUT][1];
  this.transfer = d3.scale.linear().domain([this.values[SCALE_IN][SLIDER_MIN],this.values[SCALE_IN][SLIDER_MAX]]).range([this.values[SCALE_OUT][SLIDER_MIN],this.values[SCALE_OUT][SLIDER_MAX]]);
};
TransferNormalize.prototype.updateTransfer = function(){
  if(this.rowScale.row[FIELDS[SCALE_CUSTOM_RANGE]]) {
    this.ranges[SCALE_IN] = this.getRowMinMax();
  }
  else{
    this.ranges[SCALE_IN] = this.getCellsMinMax();
  }
  this.values[SCALE_IN][SLIDER_MIN] = this.ranges[SCALE_IN][0];
  this.values[SCALE_IN][SLIDER_MAX] = this.ranges[SCALE_IN][1];
  this.transfer.domain([this.values[SCALE_IN][SLIDER_MIN],this.values[SCALE_IN][SLIDER_MAX]]).range([this.values[SCALE_OUT][SLIDER_MIN],this.values[SCALE_OUT][SLIDER_MAX]]);
};
TransferNormalize.prototype.getRowMinMax = function(){
  var $this = this;
  var min = this.customMin, max = this.customMax;
  if(this.customMin == undefined || this.customMax == undefined){
    var cellsMinMax = $this.getCellsMinMax();
    if(min == undefined) min = cellsMinMax[0];
    if(max == undefined) max = cellsMinMax[1];
  }
  return [min,max];
};
TransferNormalize.prototype.getCellsMinMax = function(){
  var $this = this;
  var cellsNumber = this.rowScale.row.cells.filter(function(d){
    return !$this.rowScale.row.bertin.isCell(d,HIDDEN) && !$this.rowScale.row.bertin.isCell(d,HEADER) && Utils.isNumber(d.value);
  });
  return [d3.min(cellsNumber, function(d){return d.value}), d3.max(cellsNumber, function(d){return d.value})];
};


TransferStretch = function(rowScale){
  this.__proto__.__proto__.constructor.apply(this,[rowScale]);
};
TransferStretch.prototype = Object.create((Object)(TransferFunction.prototype));
TransferStretch.prototype.init = function(){
  this.ranges[SCALE_IN] = [0,1];
  this.values[SCALE_IN][SLIDER_MIN] = this.ranges[SCALE_IN][0];
  this.values[SCALE_IN][SLIDER_MAX] = this.ranges[SCALE_IN][1];
  this.ranges[SCALE_OUT] = [0,1];
  this.values[SCALE_OUT][SLIDER_MIN] = this.ranges[SCALE_OUT][0];
  this.values[SCALE_OUT][SLIDER_MAX] = this.ranges[SCALE_OUT][1];
  this.transfer = d3.scale.linear().domain([this.values[SCALE_IN][SLIDER_MIN],this.values[SCALE_IN][SLIDER_MAX]]).range([this.values[SCALE_OUT][SLIDER_MIN],this.values[SCALE_OUT][SLIDER_MAX]])//.clamp(true);
};
TransferStretch.prototype.updateTransfer = function(){
  this.transfer.domain([this.values[SCALE_IN][SLIDER_MIN],this.values[SCALE_IN][SLIDER_MAX]]).range([this.values[SCALE_OUT][SLIDER_MIN],this.values[SCALE_OUT][SLIDER_MAX]]);
};



/* OLD VERSION: contrast min -> all values are the mean
 TransferContrast = function(row){
 this.__proto__.__proto__.constructor.apply(this,[row]);
 };
 TransferContrast.prototype = Object.create((Object)(TransferFunction.prototype));
 TransferContrast.prototype.init = function(){
 this.ranges[SCALE_IN] = [0,1];
 this.values[SCALE_IN][SLIDER_MIN] = this.ranges[SCALE_IN][0];
 this.values[SCALE_IN][SLIDER_MAX] = this.ranges[SCALE_IN][1];
 this.values[SCALE_IN][SLIDER_VALUE] = this.values[SCALE_IN][SLIDER_MAX];
 this.ranges[SCALE_OUT] = [0,1];
 this.values[SCALE_OUT][SLIDER_MIN] = this.values[SCALE_IN][SLIDER_MIN] + (.5 - this.values[SCALE_IN][SLIDER_VALUE]/2);
 this.values[SCALE_OUT][SLIDER_MAX] = this.values[SCALE_IN][SLIDER_MAX] - (.5 - this.values[SCALE_IN][SLIDER_VALUE]/2);

 this.transfer = d3.scale.linear().domain([this.values[SCALE_IN][SLIDER_MIN],this.values[SCALE_IN][SLIDER_MAX]]).range([this.values[SCALE_OUT][SLIDER_MIN],this.values[SCALE_OUT][SLIDER_MAX]]);
 };
 TransferContrast.prototype.changeInValue = function(value){
 this.values[SCALE_IN][SLIDER_VALUE] = value;
 this.values[SCALE_OUT][SLIDER_MIN] = this.values[SCALE_IN][SLIDER_MIN] + (.5 - this.values[SCALE_IN][SLIDER_VALUE]/2);
 this.values[SCALE_OUT][SLIDER_MAX] = this.values[SCALE_IN][SLIDER_MAX] - (.5 - this.values[SCALE_IN][SLIDER_VALUE]/2);
 };
 TransferContrast.prototype.updateTransfer = function(){
 this.transfer.domain([this.values[SCALE_IN][SLIDER_MIN],this.values[SCALE_IN][SLIDER_MAX]]).range([this.values[SCALE_OUT][SLIDER_MIN],this.values[SCALE_OUT][SLIDER_MAX]]);
 };
 */

TransferContrast = function(rowScale){
  this.__proto__.__proto__.constructor.apply(this,[rowScale]);
};
TransferContrast.prototype = Object.create((Object)(TransferFunction.prototype));
TransferContrast.prototype.init = function(){
  this.ranges[SCALE_IN] = [0,1];
  this.values[SCALE_IN][SLIDER_MIN] = this.ranges[SCALE_IN][0];
  this.values[SCALE_IN][SLIDER_MAX] = this.ranges[SCALE_IN][1];
  this.values[SCALE_IN][SLIDER_VALUE] = this.values[SCALE_IN][SLIDER_MAX];
  this.ranges[SCALE_OUT] = [0,1];
  this.values[SCALE_OUT][SLIDER_MIN] = this.values[SCALE_IN][SLIDER_MIN];
  this.values[SCALE_OUT][SLIDER_MAX] = 1 - (this.values[SCALE_IN][SLIDER_MAX] - this.values[SCALE_IN][SLIDER_VALUE]);

  this.transfer = d3.scale.linear().domain([this.values[SCALE_IN][SLIDER_MIN],this.values[SCALE_IN][SLIDER_MAX]]).range([this.values[SCALE_OUT][SLIDER_MIN],this.values[SCALE_OUT][SLIDER_MAX]]);
};
TransferContrast.prototype.changeInValue = function(value){
  this.values[SCALE_IN][SLIDER_VALUE] = value;
  this.values[SCALE_OUT][SLIDER_MIN] = this.values[SCALE_IN][SLIDER_MIN];
  this.values[SCALE_OUT][SLIDER_MAX] = 1 - (this.values[SCALE_IN][SLIDER_MAX] - this.values[SCALE_IN][SLIDER_VALUE]);
};
TransferContrast.prototype.updateTransfer = function(){
  this.transfer.domain([this.values[SCALE_IN][SLIDER_MIN],this.values[SCALE_IN][SLIDER_MAX]]).range([this.values[SCALE_OUT][SLIDER_MIN],this.values[SCALE_OUT][SLIDER_MAX]]);
};



TransferDiscretize = function(rowScale){
  this.__proto__.__proto__.constructor.apply(this,[rowScale]);
};
TransferDiscretize.prototype = Object.create((Object)(TransferFunction.prototype));
TransferDiscretize.prototype.init = function(){
  this.ranges[SCALE_IN] = [0,1];
  this.values[SCALE_IN][SLIDER_MIN] = this.ranges[SCALE_IN][0];
  this.values[SCALE_IN][SLIDER_MAX] = this.ranges[SCALE_IN][1];
  this.values[SCALE_IN][SLIDER_VALUE] = this.values[SCALE_IN][SLIDER_MAX];

  this.ranges[SCALE_OUT] = [0,1];
  this.values[SCALE_OUT][SLIDER_MIN] = this.ranges[SCALE_OUT][0];
  this.values[SCALE_OUT][SLIDER_MAX] = this.ranges[SCALE_OUT][1];

  this.internalScale = d3.scale.linear().domain([0,0.95]).range([2,MAX_DISCRETIZE_VALUE]);
  this.nbSteps = MAX_DISCRETIZE_VALUE;
  this.transfer = d3.scale.linear().domain([0, 1]).range([0,1]);
};
TransferDiscretize.prototype.updateTransfer = function(){
  var $this = this;
  if(this.nbSteps < 10)
    this.transfer = d3.scale.quantile().domain([0, 1]).range(d3.range($this.nbSteps).map(function(d){return d/($this.nbSteps-1)}));
  else
    this.transfer = d3.scale.linear().domain([0, 1]).range([0,1]);
};
TransferDiscretize.prototype.changeInValue = function(value){
  this.values[SCALE_IN][SLIDER_VALUE] = value;
  this.nbSteps = parseInt(this.internalScale(value));
};