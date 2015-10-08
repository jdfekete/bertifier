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

const SETTING_CHANGE_WHEN_RELEASE = [HEADER,SEPARATOR_MARGIN,SEPARATOR_SIZE,GLUE,REORDER,INVERT,NORMALIZED_SIZE];

const COMMAND_GROUP_OPENED = 0;
const COMMAND_GROUP_CLOSED = 1;

var commandId = 0;

const COMMAND_GROUPS = [
  {id: commandId++, name: "Misc", crossing: true, group: true, feedbackIcon: false, mode: ON_TARGET, target: COL, action: MISC, index: 0, commands: MISC_COMMANDS},

  {id: commandId++, name: "Misc", crossing: true, group: true, feedbackIcon: false, mode: ON_TARGET, target: ROW, action: MISC, index: 0, commands: MISC_COMMANDS},
  {id: commandId++, name: "Shapes", crossing: true, group: true, feedbackIcon: false, mode: ON_TARGET, target: ROW, action: ENCODING, index: 1, commands: ENCODING_COMMANDS},
  {id: commandId++, name: "Adjust", crossing: true, group: true, feedbackIcon: false, mode: ON_TARGET, target: ROW, action: SCALE, index: 2, commands: SCALE_COMMANDS},


  {id: commandId++, name: "Glue", crossing: true, group: false, feedbackIcon: false, mode: BETWEEN_TARGETS, target: COL, action: GLUE, index: 0, commands: [GLUE]},
  {id: commandId++, name: "Separators", crossing: true, group: true, feedbackIcon: false, mode: BETWEEN_TARGETS, target: COL, action: SEPARATOR, index: 1, commands: SEPARATOR_COMMANDS},

  {id: commandId++, name: "Glue", crossing: true, group: false, feedbackIcon: false, mode: BETWEEN_TARGETS, target: ROW, action: GLUE, index: 0, commands: [GLUE]},
  {id: commandId++, name: "Separators", crossing: true, group: true, feedbackIcon: false, mode: BETWEEN_TARGETS, target: ROW, action: SEPARATOR, index: 1, commands: SEPARATOR_COMMANDS}
];


Commands = function(bertin){
  var $this = this;
  this.bertin = bertin;

  this.params = this.bertin.matrix.settings;
  this.transitions = this.bertin.matrix.transitions.crossingSettings;

  this.groups = [];

  this.dragLayer = this.bertin.matrix.root.append("g")
      .attr("class","settings-group")
      .attr("transform","translate("+[0,0]+")")
      .style("opacity",COMMANDS_LAYER_ALWAYS_VISIBLE ? 1 : 0)
      .on("mouseenter", function(){
        $this.showDragLayer(true);
      })
      .on("mouseleave", function(){
        if(COMMANDS_LAYER_ALWAYS_VISIBLE) return;
        $this.showDragLayer(false);
      });

  this.data = this.bertin.elements[ROW].concat(this.bertin.elements[COL]);

  this.crossingHandler = new CrossingHandler(this);
};

Commands.prototype.setCommandsActivable = function(activable){
  var $this = this;
  if(activable){
    this.dragLayer.style("pointer-events","auto")
        .style("visibility", "visible")
        .on({
          mouseenter: function(){$this.showDragLayer(true);},
          mouseleave: function(){if(COMMANDS_LAYER_ALWAYS_VISIBLE) return;
            $this.showDragLayer(false);}
        });

  }
  else{
    this.showDragLayer(false, true);
    this.dragLayer.style("pointer-events","none")
        .style("visibility", "hidden")
        .on({
          mouseenter: function(){d3.event.stopPropagation()},
          mouseleave: function(){d3.event.stopPropagation()}
        });
  }
};


Commands.prototype.createAll = function(){
  this.createDragLayer();
  this.createCommandGroups();
  this.updateCommandsTransform();
  this.applyCommandsTransform();
  this.crossingHandler.updateButtonsStyle();
  this.updateDragLayerSize();
};

Commands.prototype.getCommandDescription = function(action, target){
  var rowCol = target == ROW ? "rows" : "columns";
  var wh = target == ROW ? "height" : "width";
  switch(action){
    case MISC: return "<span class='title'>Misc: </span>General commands that can be applied to "+rowCol + ".";
    case HEADER: return "<span class='title'>Header: </span>Sets "+rowCol+" as headers.";
    case NEGATIVE: return "<span class='title'>Negative: </span>Makes a negative image of all cells in the selected "+rowCol+". Black squares are added to indicate negative "+rowCol+".";
    case INVERT: return "<span class='title'>Flip: </span>Flips the order of the selected "+rowCol + ".";
    case NORMALIZED_SIZE: return "<span class='title'>"+rowCol.capitalizeFirst()+" "+wh+": </span>Changes the "+wh+" of the selected "+rowCol + ".";
    case REORDER: return "<span class='title'>Reorder: </span>Automatically reorders the selected "+rowCol+" according to their visual similarity.";

    case GLUE: return "<span class='title'>Glue "+rowCol+": </span>Glues the selected "+rowCol+" so that they can be moved together. Click again to remove glue.";

    case SEPARATOR: return "<span class='title'>Separator: </span>Commands for adding separators between "+rowCol+".";
    case SEPARATOR_MARGIN: return "<span class='title'>White separator: </span>Adds or removes white space between "+rowCol + ".";
    case SEPARATOR_SIZE: return "<span class='title'>Black separator: </span>Adjusts the thickness of the black lines between "+rowCol + ". Set to zero to remove.";

    case ENCODING: return "<span class='title'>Shapes: </span>Commands for customizing the shapes shown in cells on differents "+rowCol+".";
    case TEXT: return "<span class='title'>Text: </span>Displays the cell values using text.";
    case GRAYSCALE: return "<span class='title'>Gray scale: </span>Uses shades of gray to convey values. White corresponds to the minimum value on the row, black corresponds to the maximum value.";
    case BARCHART: return "<span class='title'>Bar chart: </span>Uses bar charts to convey values. The higher the bar the higher the value. A bar with zero height corresponds to the minimum value on the row, a bar with maximum height corresponds to the maximum value.";
    case CIRCLE: return "<span class='title'>Circles: </span>Uses black circles to convey values. The larger the circle the higher the value. A circle of zero radius corresponds to the minimum value on the row, and a black square corresponds to the maximum value.";
    case HORIZON: return "<span class='title'>Dual bar charts: </span>Uses bar charts with two shades of gray to convey values. A white cell corresponds to the minimum value on the row; a cell filled with hatched lines corresponds to the midpoint value, and a black cell corresponds to the maximum value.";
    case MEANCHART: return "<span class='title'>Black and white bar charts: </span>Uses black and white bar charts to convey values. Values lower than the average are shown in white, while values above average value are black.";
    case MEANCHART2: return "<span class='title'>Average bar charts: </span>Uses black and gray bar charts to convey values. The area of the bar below average value is shown in gray, while the area of the bar values above average value is black.";
    case POSITION: return "<span class='title'>Lines: </span>Uses black lines to convey values; the higher the line the higher the value. A line at the bottom (or to the left) corresponds to the minimum value on the row, while a line to the top (or right) corresponds to the maximum value.";
    case BASELINE: return "<span class='title'>Baseline: </span>Uses black two colors to convey values above or below the baseline.";
    case CONF_INTERVAL: return "<span class='title'>Confidence Intervals: </span>Uses 3 values in the cell to plot confidence intervals.";
    case ENCODING_ORIENTATION_VERTICAL: return "<span class='title'>Vertical orientation: </span>Orients the shapes bottom up.";
    case ENCODING_ORIENTATION_HORIZONTAL: return "<span class='title'>Horizontal orientation: </span>Orients the shapes from left to right.";

    case SCALE: return "<span class='title'>Adjust: </span>Commands for customizing the scale of the values on the selected "+rowCol+".";
    case SCALE_RANGE: return "<span class='title'>Range: </span>Changes the minimum and maximum values on the selected rows. Can be used to ignore very low or very high values, or to increase contrast. Values outside the range are shown with small dots.";
    case SCALE_CONTRAST: return "<span class='title'>Strength: </span>Adjusts the visual strength of the selected rows. Reducing visual strength makes all cells appear whiter, and will reduce their importance during automatic reordering. Set the slider to zero to ignore the selected rows.";
    case SCALE_DISCRETIZE: return "<span class='title'>Steps: </span>: Sets the number of discrete steps used to generate cell shapes. This will limit the number of possible shapes. Possible values are 2, 3, 4, 5, 6, 7, 8, 9, and infinite.";
    case SCALE_CUSTOM_RANGE: return "<span class='title'>Custom range: </span>: If activated, the row minimum is the one specified in the _MIN_ column of the spreadsheet and the row maximum in the _MAX_ column. Otherwise, the min and max values are the min and max values of the cells in the row.";
    case SCALE_CUSTOM_RANGE_BASELINE: return "<span class='title'>Baseline: </span>: If activated, the baseline specified in the _BASELINE_ column of the spreadsheet becomes the baseline value of the cells in the row.";
    case SCALE_GLOBAL: return "TODO SCALE_GLOBAL";
      break;
    default:
      console.error("invalid action",this.bertin.getFieldTitle(action));
      return "Error - Unknown action"
  }
};



/*
 ------------the commands background, to handle crossing-------------

 (xMin,yMin)               (xMax,yMin)
 ----------------------------------->
 |                                  |
 |    (x1,y1)           (x2,y1)     |
 |     <----------------------------| (xMax,y1)
 |     |                    -------->
 |     |                    |       |
 |     |                    |       |
 |     --------------------->       |
 |    (x1,y2)          (x2,y2)      |
 |                                  |
 |                                  |
 <-----------------------------------
 (xMin,yMax)               (xMax,yMax)

 */
Commands.prototype.createDragLayer = function(){
  this.dragLayer.append("path")
      .datum({x:0,y:0})
      .attr("id","crossing-area")
      .style("fill", this.params.dragLayer.fill);
};


Commands.prototype.updateDragLayerSize = function(duration){
  var c = this.bertin.getMatrixCoordinates();
  var xMin = this.commandsBBox.x1-this.params.offsetMargin.right,
      yMin = this.commandsBBox.y1-this.params.offsetMargin.top,
      x1 = c.x1-this.params.margins.left,
      y1 = c.y1-this.params.margins.top,
      x2 = c.x2+this.params.margins.right,
      y2 = c.y2+this.params.margins.bottom,
      xMax = this.commandsBBox.x2+this.params.offsetMargin.right/*x2 + this.params.dimensionsInit.right*/,
      yMax = this.commandsBBox.y2+this.params.offsetMargin.bottom/*y2 + this.params.dimensionsInit.bottom*/;

  this.dragLayer.select("#crossing-area")
      .transition().duration(duration || 0)
      .attr("d","M "+xMin+","+yMin+" L " +
          xMax+","+yMin+" " +
          xMax+","+y1+" " +
          x1+","+ y1+" " +
          x1+","+ y2+" " +
          x2+","+ y2+" " +
          x2+","+ y1+" " +
          xMax+","+ y1+" " +
          xMax+","+yMax+" " +
          xMin+","+yMax+" " +
          "z");
};

Commands.prototype.showDragLayer = function(show, immediate){
  var $this = this;
  var mode = show ? "show" : "hide";
  $this.dragLayer.transition()
      .duration(immediate ? 0 : $this.transitions.fadeDragLayer[mode].duration)
      .delay(immediate ? 0 : $this.transitions.fadeDragLayer[mode].delay)
      .style("opacity",show ? 1 : 0)
      .each(function(){
        $this.bertin.glues.showDragLayer(show, true);
      });
};

Commands.prototype.getCoords = function(){
  return this.commandsBBox;
};

Commands.prototype.updateOffset = function(side){
  if(side != "left" && side != "top") return;
  var $this = this;

  var commandDatas = COMMAND_GROUPS.filter(function(commandData){return commandData.side == side}).sort(function(a,b){return d3.ascending(a.index, b.index)});
  var commandDataMin = commandDatas[commandDatas.length-1],
      commandDataMax = commandDatas[0];
  var commandTrMin = commandDataMin.translate;
  var commandTrMax = commandDataMax.translate;
  var subCommandTrMin = commandDataMin.subCommandsData[commandDataMin.subCommandsData.length-1].translates[commandDataMin.state];
  var subCommandTrMax = commandDataMax.subCommandsData[0].translates[commandDataMax.state];
  var subCommandSizeMin = -$this.getSubCommandSize(commandDataMin.subCommandsData[commandDataMin.subCommandsData.length-1].action);
  var subCommandSizeMax = $this.getSubCommandSize(commandDataMax.subCommandsData[0].action);

  var index = side == "left" ? 0 : 1;
  var min = commandTrMin[index] + subCommandTrMin[index] + subCommandSizeMin/2;
  var max = commandTrMax[index] + subCommandTrMax[index] + subCommandSizeMax/2;
  this.bertin.offset[index] = max - min + this.bertin.matrixParams.settings.offsetMargin[side] + this.bertin.matrixParams.settings.margins[side];
};

Commands.prototype.updateBBox = function(){
  var $this = this;
  var boundGroups = [{side: "left"},{side: "right"},{side: "top"},{side: "bottom"}];
  boundGroups.forEach(function(boundGroup){
    var commandData = COMMAND_GROUPS.filter(function(commandData){return commandData.side == boundGroup.side}).sort(function(a,b){return d3.descending(a.index, b.index)})[0];
    var commandTr = commandData.translate;
    var subCommandTr = commandData.subCommandsData[commandData.subCommandsData.length-1].translates[commandData.state];
    var subCommandSize = $this.getSubCommandSize(commandData.subCommandsData[commandData.subCommandsData.length-1].action);
    subCommandSize = ( boundGroup.side == "left" || boundGroup.side == "top" ) ? -subCommandSize : subCommandSize;
    switch(boundGroup.side){
      case "left":
      case "right":
        boundGroup.coord = commandTr[0] + subCommandTr[0] + subCommandSize/2;
        break;
      case "top":
      case "bottom":
        boundGroup.coord = commandTr[1] + subCommandTr[1] + subCommandSize/2;
        break;
    }
  });

  this.commandsBBox = {
    x1: boundGroups.filter(function(d){return d.side == "left"})[0].coord,
    x2: boundGroups.filter(function(d){return d.side == "right"})[0].coord,
    y1: boundGroups.filter(function(d){return d.side == "top"})[0].coord,
    y2: boundGroups.filter(function(d){return d.side == "bottom"})[0].coord
  };
};

Commands.prototype.updateCommandsTransform = function(target, elements){
  this.updateCommandGroupsPos();
  this.crossingHandler.updateSettingsTransform(target, elements);
  this.updateBBox();
};

Commands.prototype.applyCommandsTransform = function(target, elements, duration){
  this.updateDragLayerSize(duration);
  this.applyCommandGroupsPos(duration);
  this.crossingHandler.applySettingsTransform(target, elements, duration);
};



Commands.prototype.createCommandGroups = function(){
  var $this = this;

  this.commandGroups = this.dragLayer.selectAll(".commandGroup")
      .data(COMMAND_GROUPS)
      .enter()
      .append("g")
      .attr("class","commandGroup")
      .each(initCommandGroup);

  function initCommandGroup(commandData){
    commandData.size = $this.params.buttons.size;
    if(commandData.target == ROW) commandData.side = (commandData.mode == BETWEEN_TARGETS) ? "right" : "left";
    else commandData.side = (commandData.mode == BETWEEN_TARGETS) ? "bottom" : "top";

    commandData.state = COMMAND_GROUP_CLOSED;
    commandData.textSize = d3.stringBox($this.bertin.matrix.root, commandData.name, "14px arial");
    commandData.textDiagLength = commandData.textSize.width * Math.cos(Math.PI/4);

    var tr = $this.params.margins[commandData.side] + commandData.index*($this.params.buttons.margin+commandData.size) + commandData.size/2;
    var dy = -commandData.size/2;//shift to avoid overlapping buttons
    if(commandData.mode == ON_TARGET) {
      tr = - tr;
    }
    commandData.translates = {};
    commandData.translates.init = commandData.target == ROW ? [tr,dy] : [dy,tr];
    commandData.translates.dTr = [0,0];
    commandData.translates.current = Utils.vectorsSum(commandData.translates.init, commandData.translates.dTr);

    //add the label
    d3.select(this)
        .selectAll(".label")
        .data([commandData.name])
        .enter()
        .append("text")
        .style($this.params.labelsStyle)
        .attr("y",-commandData.size/2)
        .attr("dy",(commandData.side == "left" || commandData.side == "right") ? ".35em" : (commandData.side == "bottom") ? "0" : "1em"  )
        .attr("class","label")
        .text(function(d){return d})
        .on("mouseenter",enterCommandGroup)
        .on("mouseleave",leaveCommandGroup)
        .on("click",clickCommandGroup);

    //if expandable command
    if(commandData.group == true){
      commandData.subCommandsData = commandData.commands.map(function(d,i){
        var translates = [];
        var trInGroup = d3.sum(commandData.commands.filter(function(c,j){return j < i}),function(c){
          var tr = $this.getSubCommandSize(c) + $this.params.buttons.margin;
          if(ENCODING_EXTRA_SPACE_COMMANDS.indexOf(c) != -1) tr += ENCODING_EXTRA_SPACE;
          return tr;
        });
        trInGroup += $this.getSubCommandSize(d)/2 + $this.params.buttons.margin + commandData.size/2;
        if(ENCODING_EXTRA_SPACE_COMMANDS.indexOf(d) != -1) trInGroup += ENCODING_EXTRA_SPACE;

        if(commandData.mode == ON_TARGET) {
          trInGroup = - trInGroup;
        }

        translates[COMMAND_GROUP_OPENED] = commandData.target == ROW ? [trInGroup,0] : [0,trInGroup];
        translates[COMMAND_GROUP_CLOSED] = [0,0];
        return {action: d, index: i, translates: translates, commandData: commandData}
      });

      d3.select(this).selectAll(".command-sub-group")
          .data(commandData.subCommandsData)
          .enter()
          .append("g")
          .attr("class","command-sub-group")
          .style("opacity", commandData.state == COMMAND_GROUP_OPENED ? 1 : 0)
          .attr("transform", function(d){
            return "translate("+d.translates[d.commandData.state]+")";
          });
      /*
       .each(function(d){

       if(SHOW_SUB_ICON_COMMANDS.indexOf(d.action) != -1){
       d3.select(this).append("image")
       .attr("xlink:href", function(d){return $this.getCommandSubHeaderIcon(d,"off")})
       .attr("transform", commandData.target == COL ? "rotate(90)" : undefined)
       .attr("class","command-sub-icon")
       .attr("width",commandData.size)
       .attr("height",commandData.size)
       .attr("x",-commandData.size/2)
       .attr("y",-commandData.size/2)
       .on("mouseenter",enterSubCommandGroup)
       .on("mouseleave",leaveSubCommandGroup);
       }

       });
       */

      //add the commandGroup Separator
      d3.select(this).append("line").attr("class","command-sep-black")
          .style("stroke", "black")
          .style("opacity", $this.params.groupSeparator.opacity.black)
          .style("stroke-width",$this.params.groupSeparator.width);

      d3.select(this).append("line").attr("class","command-sep-white")
          .style("stroke", "white")
          .style("opacity", $this.params.groupSeparator.opacity.white)
          .style("stroke-width",$this.params.groupSeparator.width);


      d3.select(this).append("image").attr("class","command-icon")
          .attr("width",commandData.size)
          .attr("height",commandData.size)
          .attr("x",-commandData.size/2)
          .attr("y",-commandData.size/2)
          .on("mouseenter",enterCommandGroup)
          .on("mouseleave",leaveCommandGroup)
          .on("click",clickCommandGroup);
    }

    //now create the corresponding crossing buttons
    $this.crossingHandler.createButtons(commandData,d3.select(this));

    //when buttons created, get the size of the command when opened
    commandData.dTrOpened = $this.getCommandOpenedSize(commandData);
  }

  function clickCommandGroup(d){
    if(d.group == false) return;
    if(d.state == COMMAND_GROUP_OPENED) $this.closeCommandGroup(d);
    else $this.openCommandGroup(d);
    $this.highlightCommandGroup(undefined,false);
  }

  function enterCommandGroup(d){
    $this.bertin.descriptionArea.showCommandDescription(d);
    $this.highlightCommandGroup(d,true);
  }

  function leaveCommandGroup(d){
    $this.bertin.descriptionArea.hideDescription(d);
    $this.highlightCommandGroup(d,false);
  }

  $this.updateCommandGroupsLabels(undefined, undefined);
  $this.commandGroups.each(function(d){
    $this.updateCommandIcon(d);
  });
};

Commands.prototype.highlightCommandGroup = function(commandGroup,highlight){
  if(!highlight) {
    d3.selectAll(".commandGroupHighlight").remove();
    this.commandGroups.filter(function(d){return d == commandGroup})
        .select(".label")
        .style("stroke","none");
  }
  else {
    var size = 10;
    if(commandGroup.group && commandGroup.state == COMMAND_GROUP_OPENED) size = Math.abs(commandGroup.dTrOpened);
    var matCoords = this.bertin.getMatrixCoordinates();
    var x, y, w,h;
    if(commandGroup.target == ROW){
      if(commandGroup.group && commandGroup.state == COMMAND_GROUP_OPENED){
        x = commandGroup.translate[0] +(commandGroup.side == "left" ? -size : 0) - .5*commandGroup.size;
        w = size + commandGroup.size;
      }
      else{
        x = commandGroup.translate[0] - .5*commandGroup.size;
        w = commandGroup.size;
      }
      y = matCoords.y1 - commandGroup.size;
      h = matCoords.y2 - matCoords.y1 + commandGroup.size * 2
    }
    else{
      if(commandGroup.group && commandGroup.state == COMMAND_GROUP_OPENED){
        y = commandGroup.translate[1] +(commandGroup.side == "top" ? -size : 0) - .5*commandGroup.size;
        h = size + commandGroup.size;
      }
      else{
        y = commandGroup.translate[1] - .5*commandGroup.size;
        h = commandGroup.size;
      }
      x = matCoords.x1 - commandGroup.size;
      w = matCoords.x2 - matCoords.x1 + commandGroup.size * 2;
    }
    this.bertin.matrix.root.append("rect")
        .attr({
          class: "commandGroupHighlight",
          x: x,
          y : y,
          width: w,
          height: h
        })
        .style({
          "pointer-events": "none",
          opacity: this.bertin.matrixParams.settings.highlight.opacityOn,
          fill: this.bertin.matrixParams.settings.highlight.fill,
          stroke: this.bertin.matrixParams.settings.highlight.stroke,
          "stroke-width": this.bertin.matrixParams.settings.highlight.strokeWidth
        });
    this.commandGroups.filter(function(d){return d == commandGroup})
        .select(".label")
        .style("stroke",this.bertin.matrixParams.settings.highlight.fill)
        .style("stroke-opacity",this.bertin.matrixParams.settings.highlight.opacityLabel)
        .style("stroke-width",1)
  }
};

Commands.prototype.getSubCommandSize = function(subCommand){
  if(SIMPLE_SLIDER_COMMANDS.indexOf(subCommand) != -1 || RANGE_SLIDER_COMMANDS.indexOf(subCommand) != -1){
    return this.params.widgets.size[subCommand];
  }
  else return this.params.buttons.size;
};

Commands.prototype.getCommandOpenedSize = function(commandData){
  var $this = this;
  var w = d3.sum(commandData.commands, function(command){
    var w = $this.crossingHandler.groups[commandData.mode][commandData.target][command].buttons[0].getSize();
    if(ENCODING_EXTRA_SPACE_COMMANDS.indexOf(command) != -1) w += ENCODING_EXTRA_SPACE;
    return w;
  });
  w += commandData.commands.length * $this.params.buttons.margin;
  if(commandData.mode == ON_TARGET) w = - w;
  return w;
};

Commands.prototype.updateCommandIcon = function(commandData){
  var $this = this;
  this.commandGroups.filter(function(d){return d == commandData})
      .select(".command-icon")
      //.attr("transform", commandData.target == COL ? "rotate(90)" : undefined)
      .attr("xlink:href",$this.getCommandHeaderIcon(commandData,commandData.state == COMMAND_GROUP_CLOSED ? "off" : "on"));
};

/*
 type = "setting" or "command"
 state = undefined, "on", "off"
 */
Commands.prototype.getImage = function(commandName,action,target,type,state,minMax){
  var name;
  name = "./img/"+type+"/"+commandName;
  if(action != undefined){//setting header
    name += "-"+this.bertin.getFieldTitle(action);
  }
  name += target == ROW ? "-H" : "-V";
  if(minMax != undefined){
    name += "-"+minMax;
  }
  if(state != undefined){
    name += "-"+state;
  }
  name += ".png";
  return name;
};

Commands.prototype.getCommandHeaderIcon = function(commandData,state){
  var name = commandData.name;
  if(commandData.group){
    name = "expand";
  }
  return this.getImage(name,undefined,commandData.target,"command",state);

  /*
   if(commandData.group == false) img = commandData.name;
   else if(commandData.state == COMMAND_GROUP_CLOSED) img = "expandoff";
   else img = "expandon";
   return IMAGE_BASE64["commandHeader"+img];//"./img/command-header-"+img+".png";
   */
};

Commands.prototype.getCommandSubHeaderIcon = function(subHeader,state,minMax){
  return this.getImage(subHeader.commandData.name,subHeader.action,subHeader.commandData.target,"setting",state,minMax);
  /*
   return "./img/setting-header-"+
   subHeader.commandData.name+"-"+
   this.bertin.getFieldTitle(subHeader.action)+".png";
   */

  //return IMAGE_BASE64["settingHeader"+subHeader.commandData.name+this.bertin.getFieldTitle(subHeader.action)];
};

Commands.prototype.getIconRotate = function(action,target){
  /*
  if(target == ROW && action == REORDER
      || target == ROW && action == NORMALIZED_SIZE
      || target == ROW && action == SEPARATOR_MARGIN
      || target == ROW && action == SEPARATOR_SIZE
      ) return "90";
  */
  return "";
};

Commands.prototype.updateCommandGroupsPos = function(){
  var matrixDims = this.bertin.getMatrixDimensions();
  var offset = this.bertin.offset;
  var margins = this.params.margins;

  this.commandGroups.each(function(commandGroup){
    switch(commandGroup.side){
      case "left":
        commandGroup.translate = Utils.vectorsSum(commandGroup.translates.current,[offset[0]-margins.left,offset[1]]);
        commandGroup.seplength = matrixDims.height - commandGroup.size;
        break;
      case "top":
        commandGroup.translate = Utils.vectorsSum(commandGroup.translates.current,[offset[0],offset[1]-margins.top]);
        commandGroup.seplength = matrixDims.width - commandGroup.size;
        break;
      case "right":
        commandGroup.translate = Utils.vectorsSum(commandGroup.translates.current,[offset[0]+matrixDims.width+margins.left + margins.right,offset[1]]);
        commandGroup.seplength = matrixDims.height - commandGroup.size;
        break;
      case "bottom":
        commandGroup.translate = Utils.vectorsSum(commandGroup.translates.current,[offset[0],offset[1]+matrixDims.height+margins.top + margins.bottom]);
        commandGroup.seplength = matrixDims.width - commandGroup.size/2;
        break;
      default: console.error("invalid side",commandGroup.side);
    }
  });
};

Commands.prototype.applyCommandGroupsPos = function(duration){
  var $this = this;
  this.commandGroups.transition().duration(duration || 0)
      .attr("transform",function(d){return "translate("+ d.translate+")"})
      .each(function(d){
        d3.select(this).select(".command-sep-black").transition().attr({
          x1: getSepX1(d.side, "black", d.size),
          x2: getSepX2(d.side, "black", d.seplength, d.size),
          y1: getSepY1(d.side, "black", d.size),
          y2: getSepY2(d.side, "black", d.seplength, d.size)
        });
        d3.select(this).select(".command-sep-white").transition().attr({
          x1: getSepX1(d.side, "white", d.size),
          x2: getSepX2(d.side, "white", d.seplength, d.size),
          y1: getSepY1(d.side, "white", d.size),
          y2: getSepY2(d.side, "white", d.seplength, d.size)
        });
      });

  function getSepX1(side,type,margin){
    switch(side){
      case "top":
      case "bottom":
        return margin;
        break;
      case "left":
      case "right":
        return type == "black" ? -$this.params.groupSeparator.width/2 : $this.params.groupSeparator.width/2;
        break;
      default: console.error("invalid side",side);return null;
    }
  }

  function getSepX2(side,type,length,margin){
    switch(side){
      case "top":
      case "bottom":
        return margin + length;
        break;
      case "left":
      case "right":
        return type == "black" ? -$this.params.groupSeparator.width/2 : $this.params.groupSeparator.width/2;
        break;
      default: console.error("invalid side",side);return null;
    }
  }

  function getSepY1(side, type, margin){
    switch(side){
      case "top":
      case "bottom":
        return type == "black" ? -$this.params.groupSeparator.width/2 : $this.params.groupSeparator.width/2;
        break;
      case "left":
      case "right":
        return margin;
        break;
      default: console.error("invalid side",side);return null;
    }
  }

  function getSepY2(side, type, length, margin){
    switch(side){
      case "top":
      case "bottom":
        return type == "black" ? -$this.params.groupSeparator.width/2 : $this.params.groupSeparator.width/2;
        break;
      case "left":
      case "right":
        return margin + length;
        break;
      default: console.error("invalid side",side);return null;
    }
  }
};


Commands.prototype.getCommandGroupLabelAttributes = function(commandGroup){
  var attributes = {x: 0, y: 0, transform: undefined};

  switch(commandGroup.side){
    case "left":
      switch(commandGroup.state){
        case COMMAND_GROUP_CLOSED:
          attributes.x = -commandGroup.textDiagLength+commandGroup.size/2;
          attributes.y = -commandGroup.textDiagLength-commandGroup.size/2;
          attributes.transform = "rotate(45 "+attributes.x+","+attributes.y+")";
          break;
        case COMMAND_GROUP_OPENED:
          attributes.x = commandGroup.dTrOpened/2 - commandGroup.textSize.width/2;
          attributes.y = -commandGroup.size*1.5;
          attributes.transform = "rotate(0 "+attributes.x+","+attributes.y+")";
          break;
        default: console.error("unknown state for commandGroup",commandGroup);
      }
      break;
    case "right":
      switch(commandGroup.state){
        case COMMAND_GROUP_CLOSED:
          attributes.x = - commandGroup.size/2;
          attributes.y = - commandGroup.size;
          attributes.transform = "rotate(-45 "+attributes.x+","+attributes.y+")";
          break;
        case COMMAND_GROUP_OPENED:
          attributes.x = commandGroup.dTrOpened/2 - commandGroup.textSize.width/2;
          attributes.y = -commandGroup.size*1.5;
          attributes.transform = "rotate(0 "+attributes.x+","+attributes.y+")";
          break;
        default: console.error("unknown state for commandGroup",commandGroup);
      }
      break;
    case "top":
      switch(commandGroup.state){
        case COMMAND_GROUP_CLOSED:
          attributes.x = - commandGroup.textDiagLength - commandGroup.size/2;
          attributes.y = - commandGroup.textDiagLength - commandGroup.size/2;
          attributes.transform = "rotate(45 "+attributes.x+","+attributes.y+")";
          break;
        case COMMAND_GROUP_OPENED:
          attributes.x = -commandGroup.size/2;
          attributes.y = commandGroup.dTrOpened/2 - commandGroup.textSize.width/2;
          attributes.transform = "rotate(90 "+attributes.x+","+attributes.y+")";
          break;
        default: console.error("unknown state for commandGroup",commandGroup);
      }
      break;
    case "bottom":
      switch(commandGroup.state){
        case COMMAND_GROUP_CLOSED:
          attributes.x = -commandGroup.textDiagLength-commandGroup.size/2;
          attributes.y = commandGroup.textDiagLength-commandGroup.size/2;
          attributes.transform = "rotate(-45 "+attributes.x+","+attributes.y+")";
          break;
        case COMMAND_GROUP_OPENED:
          attributes.x = -commandGroup.size;
          attributes.y = commandGroup.dTrOpened/2 + commandGroup.textSize.width/2;
          attributes.transform = "rotate(-90 "+attributes.x+","+attributes.y+")";
          break;
        default: console.error("unknown state for commandGroup",commandGroup);
      }
      break;
    default: console.error("unknown commandGroup side",commandGroup);
  }

  return attributes;

};


Commands.prototype.openCommandGroup = function(commandGroup){
  if(commandGroup.group == false) return;
  commandGroup.state = COMMAND_GROUP_OPENED;
  this.changeCommandGroupState(commandGroup);
};

Commands.prototype.closeCommandGroup = function(commandGroup){
  if(commandGroup.group == false) return;
  commandGroup.state = COMMAND_GROUP_CLOSED;
  this.changeCommandGroupState(commandGroup);

};

Commands.prototype.changeCommandGroupState = function(commandGroup){
  var $this = this;
  this.updateCommandIcon(commandGroup);
  this.updateSubHeadersCollapseFrom(commandGroup);
  $this.updateCommandsTransform();
  $this.updateOffset(commandGroup.side);

  var updateAttributes = {};
  updateAttributes.posAbs = {};
  this.bertin.matrix.updateAttributes(updateAttributes, function(){
    $this.updateCommandsTransform();
    var updateView = [];
    updateView[UPDATE_DURATION] = $this.transitions.expandCommand.duration;
    updateView[UPDATE_TRANSLATE] = {};
    updateView[UPDATE_SEPARATOR] = {type: SEPARATOR_POSITION, animate: true};
    updateView[UPDATE_GLUE] = {mode:ON_BUTTONS, effect: "update"};
    $this.bertin.matrix.updateView(updateView);
    $this.updateCommandGroupsLabels(commandGroup, $this.transitions.expandCommand.duration);
    $this.crossingHandler.changeButtonsCollapse(commandGroup, $this.transitions.expandCommand.duration);
    $this.applySubHeadersCollapseFrom(commandGroup, $this.transitions.expandCommand.duration);
    $this.applyCommandsTransform(commandGroup.target,undefined,$this.transitions.expandCommand.duration);
    $this.bertin.annotator.updateAnnotationsPos($this.transitions.expandCommand.duration);
    $this.bertin.updateSVGSize();
  });
};

Commands.prototype.updateSubHeadersCollapseFrom = function(commandGroup){
  COMMAND_GROUPS.filter(function(commandData){return commandData.index >= commandGroup.index}).forEach(function(commandData){
    if(commandData != commandGroup){//the commandGroups after the target commandGroup
      var dTr = 0;
      COMMAND_GROUPS.filter(function(d){
        return d.group == true && d.state == COMMAND_GROUP_OPENED && d.index < commandData.index && d.mode == commandData.mode && d.target == commandData.target
      }).forEach(function(prevCommandData){
            //if(prevCommandData.subCommandsData.length == 0) return;
            dTr += prevCommandData.dTrOpened;
          });

      commandData.translates.dTr = commandData.target == ROW ? [dTr,0] : [0,dTr];
      commandData.translates.current = Utils.vectorsSum(commandData.translates.dTr,commandData.translates.init);
    }
  });
};

Commands.prototype.applySubHeadersCollapseFrom = function(commandGroup, duration){
  this.commandGroups.filter(function(cGroup){return cGroup == commandGroup})
      .transition().duration(duration || 0)
      .selectAll(".command-sub-group")
      .style("opacity", commandGroup.state == COMMAND_GROUP_OPENED ? 1 : 0)
      .attr("transform",function(subCommand){
        return "translate("+subCommand.translates[commandGroup.state]+")";
      });
};

Commands.prototype.updateCommandGroupsLabels = function(commandGroups, duration){
  var $this = this;
  if(commandGroups != undefined && commandGroups instanceof Object) commandGroups = [commandGroups];
  this.commandGroups.select(".label")
      .filter(function(d){return commandGroups == undefined || commandGroups.indexOf(d) != -1})
      .transition().duration(duration || 0)
      .each(function(commandGroup){
        var labelAttr = $this.getCommandGroupLabelAttributes(commandGroup);
        d3.select(this).transition()
            .attr("transform", labelAttr.transform)
            .attr("x", labelAttr.x)
            .attr("y", labelAttr.y);
      });
};




