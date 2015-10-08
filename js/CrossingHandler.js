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

/*
 To handle the crossing groups
 */
CrossingHandler = function(commands){
  this.commands = commands;
  this.bertin = commands.bertin;
  this.groups = [];
  this.params = this.bertin.matrix.settings;
  this.crossingButtons = new CrossingButton(this);
  this.crossingRangeSlider = new CrossingRangeSlider(this);
  this.crossingSimpleSlider = new CrossingSimpleSlider(this);
  this.transitions = this.bertin.matrix.transitions.crossingSettings;
};


CrossingHandler.prototype.createButtons = function(commandData,commandG){

  var targetData = this.bertin.getAllElements(commandData.target,commandData.mode);
  if(EXCEPT_EXTREMITIES_COMMANDS.indexOf(commandData.action) != -1){
    targetData = targetData.slice(1,targetData.length-1);
  }
  var butSize = this.params.buttons.size;
  var $this = this;

  commandG.selectAll(".setting")
      .data(targetData.map(function(d){
        return {
          targetData: d,
          commandData: commandData
        }
      }))
      .enter()
      .append("g")
      .attr("class","setting")
      .each(function(setting){
        var settingGroup = d3.select(this);

        //add the setting header
        if(setting.commandData.group == true && setting.commandData.feedbackIcon == true){
          d3.select(this).append("image")
              .attr("class","setting-header")
              .attr("x",-butSize/2)
              .attr("y",-butSize/2)
              .attr("width",butSize)
              .attr("height",butSize)
              .attr("xlink:href", $this.getSettingSubHeaderFeedbackIcon(setting));
        }

        //add the buttons
        commandData.commands.forEach(function(action,i){
          var butData = {
            settingData: setting,
            settingGroup: settingGroup,
            state : BUTTON_STATE.OFF,
            deactivated : false,
            x : 0,
            y : 0,
            indexInCommandGroup : i,
            orientation : setting.target == ROW ? HORIZONTAL : VERTICAL,
            action : action,
            commandData: commandData,
            targetData: setting.targetData
          };
          $this.addButtonToGroup(commandData.mode, commandData.target, action, butData);
        });
      });

};

CrossingHandler.prototype.getSettingSubHeaderFeedbackIcon = function(setting){
  return IMAGE_BASE64["settingHeader"+setting.commandData.name+this.bertin.getFieldTitle(setting.targetData.get(setting.commandData.action))];
  /*
  return "./img/setting-header-"+
      setting.commandData.name+"-"+
      this.bertin.getFieldTitle(setting.targetData.get(setting.commandData.action))+".png";
      */
};


CrossingHandler.prototype.addButtonToGroup = function(mode, target, action, butData){
  if(!this.groups[mode]) this.groups[mode] = [];
  if(!this.groups[mode][target]) this.groups[mode][target] = [];
  if(!this.groups[mode][target][action]) this.groups[mode][target][action] = new CrossingGroup(this, mode, target, action);
  var widget;
  if(RANGE_SLIDER_COMMANDS.indexOf(action) != -1) {
    widget = new CrossableRangeSlider(butData,this.groups[mode][target][action], SLIDER_DISCRETE.indexOf(action) != -1);
  }
  else if(SIMPLE_SLIDER_COMMANDS.indexOf(action) != -1) {
    widget = new CrossableSimpleSlider(butData,this.groups[mode][target][action],SLIDER_DISCRETE.indexOf(action) != -1);
  }
  else {
    widget = new CrossableButton(butData,this.groups[mode][target][action]);
  }
  this.groups[mode][target][action].buttons.push(widget);
};


CrossingHandler.prototype.changeButtonsCollapse = function(commandGroup, duration){
  var $this = this;
  this.commands.dragLayer.selectAll(".crossing-button").filter(function(but){
    if(but.commandData != commandGroup) return false;
    but.hidden = $this.isButtonHidden(but);
    but.deactivated = !$this.isButtonActivable(but);
    $this.updateButAbsTransform(but);
    return true;
  })
      .transition()
      .duration(duration || 0)
      .style("opacity", function(d){return $this.getButtonOpacity(d)})
      .style("pointer-events", function(d){return $this.getButtonPointerEvents(d)})
      .attr("transform",function(but){
        return "translate("+but.translates[commandGroup.state]+")";
      });
};

CrossingHandler.prototype.getButtonOpacity = function(but){
  return but.hidden ? 0 : but.deactivated ? .2 : 1;
};

CrossingHandler.prototype.getButtonPointerEvents = function(but){
  if(but.hidden || but.deactivated) return "none";
  else return "auto";
};


/*
 Update the value of transform for setting groups for elements (can be a mix of RowCol and Between) in parameter
 and update the value of the absolute transform of the buttons
 */
CrossingHandler.prototype.updateSettingsTransform = function(target,toUpdate){
  var $this = this;
  if(typeof target == "string") console.warn("target is a String: "+target);
  var targets = target == undefined ? [ROW,COL] : [target];
  $this.commands.dragLayer.selectAll(".setting")
      .filter(function(setting){
        if(target == undefined || toUpdate == undefined) return true;
        if(setting.commandData.mode == BETWEEN_TARGETS && target != setting.commandData.target) return true;//Need to update all the between settings on the opposite target
        if(targets.indexOf(setting.commandData.target) == -1) return false;
        return toUpdate.indexOf(setting.targetData) != -1;
      })
      .each(function(setting){
        setting.translate = $this.getSettingTranslate(setting);
        d3.select(this).selectAll(".crossing-button").each(function(but){
          $this.updateButAbsTransform(but);
        });
      });
};

CrossingHandler.prototype.applySettingsTransform = function(target,toUpdate,duration){
  var $this = this;
  $this.groups.forEach(function(d){
    d.forEach(function(d2){
      d2.forEach(function(group){
        group.buttons.forEach(function(widget){
          widget.updateBackground();
        });
      });
    })
  });
  $this.commands.dragLayer.selectAll(".setting")
      .filter(function(setting){
        if(target == undefined || toUpdate == undefined) return true;
        if(setting.commandData.mode == BETWEEN_TARGETS && target != setting.commandData.target) return true;//Need to update all the between settings on the opposite target
        if(setting.commandData.target != target) return false;
        return toUpdate.indexOf(setting.targetData) != -1;
      })
      .transition()
      .duration(duration || 0)
      .attr("transform", function(setting){
        return "translate("+ setting.translate+")";
      });
};



CrossingHandler.prototype.applyLiveSliderCrossingChanges = function(slider, type, crossed, uncrossed, newVal){
  var mode = slider.group.mode,
      target = slider.group.target,
      action = slider.group.action;
  var $this = this;

  var modified = crossed.concat(uncrossed).map(function(slider){return slider.data.targetData});
  var updateAttributes = {},
      updateView = [];

  //update the thumbs position
  crossed.forEach(function(d){
    d.data.targetData.setAttr(action,{event: "set", type: type, value: newVal});
    d.changeThumbValue(type, newVal);
    d.updateSliderBar();
    if(slider.group.action == NORMALIZED_SIZE && !RESIZE_ROWCOL_BUG){
      d.data.targetData.createSizePreview();
    }
  });
  uncrossed.forEach(function(d){
    switch(slider.group.action){
      case SCALE_RANGE:
        d.data.targetData.setAttr(action,{event: "restore", type: SLIDER_MIN});
        d.data.targetData.setAttr(action,{event: "restore", type: SLIDER_MAX});
        d.changeThumbValue(type, d.data.targetData.scale.getValue(slider.group.action, SCALE_IN, type));
        break;

      case SCALE_CONTRAST:
        d.data.targetData.setAttr(action,{event: "restore", type: SLIDER_VALUE});
        d.changeThumbValue(type, d.data.targetData.scale.getValue(slider.group.action, SCALE_IN, type));
        break;

      case SCALE_DISCRETIZE:
        d.data.targetData.setAttr(action,{event: "restore", type: SLIDER_VALUE});
        d.changeThumbValue(type, d.data.targetData.scale.getValue(slider.group.action, SCALE_IN, type));
        break;

      case SEPARATOR_MARGIN:
      case SEPARATOR_SIZE:
        d.data.targetData.setAttr(action,{event: "restore", type: SLIDER_VALUE});
        d.changeThumbValue(type, d.data.targetData.separator.getNormalizedWidth(slider.group.action));
        break;

      case NORMALIZED_SIZE:
        d.data.targetData.setAttr(action,{event: "restore", type: SLIDER_VALUE});
        if(!RESIZE_ROWCOL_BUG) d.data.targetData.removeSizePreview();
        d.changeThumbValue(type, d.data.targetData.getNormalizedSize());
        break;

      default: console.error("invalid group action",$this.bertin.getFieldTitle(slider.group.action));
    }
    d.updateSliderBar();
  });

  /*-----------------------if ON_TARGET---------------------------------*/
  if(mode == ON_TARGET){
    if(action == SCALE_RANGE || action == SCALE_CONTRAST || action == SCALE_DISCRETIZE){
      //updateAttributes.encodingScales = {modified: target == ROW ? modified : undefined};
      updateView[UPDATE_ENCODING] = {target: target, modified: modified};
    }
    //Just to show the bug
    else if(action == NORMALIZED_SIZE && RESIZE_ROWCOL_BUG){
      modified.forEach(function(rowCol){rowCol.removeSizePreview(updateView[UPDATE_DURATION])});

      minIndex = d3.min(modified,function(d){return d.index});
      modifiedAfter = $this.bertin.elements[target].filter(function(e){return e.index >= minIndex});
      updateAttributes.posAbs = {target: target, startModified: d3.min(modified, function(d){return d.index})};

      updateView[TRANSLATE_ENCODING] = {target: target, modified: modified};
      updateView[UPDATE_TRANSLATE] = {target: target, modified: modifiedAfter};
      updateView[UPDATE_SEPARATOR] = {animate: true};//TODO - not optimal
      updateView[UPDATE_GLUE] = {mode: ON_BUTTONS, effect: "update"};

      $this.bertin.matrix.updateAttributes(updateAttributes, function(){
        $this.commands.updateCommandsTransform();//need to update all settings
        $this.commands.applyCommandsTransform(undefined, undefined, $this.bertin.matrix.transitions.layout.duration);
        $this.bertin.matrix.updateView(updateView);
        $this.bertin.updateSVGSize();
      });
    }
    else if(action == NORMALIZED_SIZE){
      //erase updateAttributes to update everything
      updateAttributes.elementsSizes = {type: "slider", target: target, modified: modified};
      updateAttributes.posAbs = {target: target, startModified: d3.min(modified, function(d){return d.index})};//for posAbs attribute computation

      updateView[UPDATE_ROWCOL_SIZE_PREVIEW] = {target: target, modified: modified};
    }
    else console.error("unknown setting action",action);
  }
  /*-----------------------if BETWEEN_TARGETS---------------------------------*/
  else if(mode == BETWEEN_TARGETS){
    if(action == SEPARATOR_MARGIN || action == SEPARATOR_SIZE){
      updateView[UPDATE_SEPARATOR] = {target: target, type: action, modified: modified};
    }
  }
  else console.error("invalid mode "+mode);

  updateView[UPDATE_DURATION] = $this.bertin.matrix.transitions.encoding.duration;
  $this.bertin.matrix.updateAttributes(updateAttributes, function(){
    $this.bertin.matrix.updateView(updateView);
  });
};

CrossingHandler.prototype.applyEndSliderCrossingChanges = function(mode, target, action, buttons){
  if(SETTING_CHANGE_WHEN_RELEASE.indexOf(action) == -1) return;
  var $this = this;
  var modified = buttons.map(function(but){return but.data.targetData});
  var updateView = [],
      updateAttributes = {},
      minIndex,
      modifiedAfter;
  updateView[UPDATE_DURATION] = $this.bertin.matrix.transitions.layout.duration;

  if(mode == ON_TARGET){
    //Just to show the bug
    if(action == NORMALIZED_SIZE && RESIZE_ROWCOL_BUG){
      //nothing to do if showing bug
    }
    else if(action == NORMALIZED_SIZE){
      modified.forEach(function(rowCol){rowCol.removeSizePreview(updateView[UPDATE_DURATION])});

      minIndex = d3.min(modified,function(d){return d.index});
      modifiedAfter = $this.bertin.elements[target].filter(function(e){return e.index >= minIndex});
      updateAttributes.posAbs = {target: target, startModified: d3.min(modified, function(d){return d.index})};

      updateView[TRANSLATE_ENCODING] = {target: target, modified: modified};
      updateView[UPDATE_TRANSLATE] = {target: target, modified: modifiedAfter};
      updateView[UPDATE_SEPARATOR] = {animate: true};//TODO - not optimal
      updateView[UPDATE_GLUE] = {mode: ON_BUTTONS, effect: "update"};

      $this.bertin.matrix.updateAttributes(updateAttributes, function(){
        $this.commands.updateCommandsTransform();//need to update all settings
        $this.commands.applyCommandsTransform(undefined, undefined, $this.bertin.matrix.transitions.layout.duration);
        $this.bertin.matrix.updateView(updateView);
        $this.bertin.updateSVGSize();
      });
    }
    else console.error("invalid action "+action);
  }
  else if(mode == BETWEEN_TARGETS){
    if(action == SEPARATOR_MARGIN || action == SEPARATOR_SIZE){
      //if separator, then apply the new scale and extend the previously created separators
      minIndex = d3.min(modified,function(d){return d.index});
      modifiedAfter = $this.bertin.elements[target].filter(function(e){return e.index >= minIndex});

      updateAttributes.posAbs = {target: target, startModified: d3.min(modified, function(d){return d.index})};

      updateView[UPDATE_TRANSLATE] = {target: target, modified: modifiedAfter};
      updateView[UPDATE_SEPARATOR] = {animate: true};//TODO - not optimal
      updateView[UPDATE_GLUE] = {mode:ON_BUTTONS, effect: "update"};

      $this.bertin.matrix.updateAttributes(updateAttributes, function(){
        $this.commands.updateCommandsTransform();//need to update all settings
        $this.commands.applyCommandsTransform(undefined, undefined, $this.bertin.matrix.transitions.layout.duration);

        $this.bertin.matrix.updateView(updateView);
        $this.bertin.updateSVGSize();
      });
    }
    else console.error("invalid action "+action);


  }
  else console.error("invalid mode "+mode);
};


/*
 Apply the crossing changes, WITHOUT changing the layout
 target = ROW or COL
 action = the different button actions
 initialState = ON or OFF
 crossed = crossed buttons
 uncrossed = uncrossed buttons
 */
CrossingHandler.prototype.applyLiveCrossingChanges = function(mode, target, action, initialState, crossed, uncrossed){
  //console.log(target,action,initialState,crossed,uncrossed)
  var $this = this;

  var setAttr = initialState == BUTTON_STATE.OFF;

  var modified = crossed.concat(uncrossed).map(function(but){return but.data.targetData});
  var updateAttributes = {},
      updateView = [];

  crossed.forEach(function(but){
    if(ENCODING_COMMANDS.indexOf(action) != -1)but.data.targetData.setAttr(action,{event: "set"});
    else but.data.targetData.setAttr(action,setAttr);
  });
  uncrossed.forEach(function(but){
    if(ENCODING_COMMANDS.indexOf(action) != -1)but.data.targetData.setAttr(action,{event: "restore"});
    else but.data.targetData.setAttr(action,!setAttr);
  });

  //if no immediate feedback, just update the buttons
  if(action == REORDER || action == INVERT){
    $this.updateButtonsStyle();
    return;
  }

  /*-----------------------if ON_TARGET---------------------------------*/
  if(mode == ON_TARGET){
    //if header, then update the encodingscales, row/col sizes and posAbs of corresponding row/col
    if(action==HEADER){

      if(target == ROW){
        //erase updateAttributes to update everything
        updateAttributes.encodingScales = {modified: modified};
        updateAttributes.elementsSizes = {type: "text", target: target, modified: modified};
        updateAttributes.posAbs = {};

        updateView[TRANSLATE_ENCODING] = {target: COL, modified: $this.bertin.elements[COL]};
        updateView[CHANGE_ENCODING] = {target: target, modified: modified};

      }
      else{
        updateAttributes.encodingScales = {};//update all row encoding scales
        updateAttributes.elementsSizes = {type: "text", target: target, modified: modified};//for size attribute computation
        updateAttributes.posAbs = {target: target, startModified: d3.min(modified, function(d){return d.index})};//for posAbs attribute computation

        updateView[CHANGE_ENCODING] = {target: target, modified: modified};
        updateView[UPDATE_ENCODING] = {target: target, modified: $this.bertin.elements[COL].filter(function(d){return modified.indexOf(d) == -1})};
      }

      if($this.bertin.allRowsAreEncoded()){
        //TODO?
      }
    }

    //if an encoding button
    else if(ENCODING_TYPES.indexOf(action) != -1){
      updateView[CHANGE_ENCODING] = {target: target, modified: modified};
      modified.forEach(function(row){row.scale.updateCellsTransferedValue()});

      /*
       if($this.bertin.allRowsAreEncoded()){
       //updateAttributes.elementsSizes = {target: COL};//update all cols
       //updateAttributes.posAbs = {target: COL};//all cols
       }
       */
    }

    else if(action == NEGATIVE){
      if(target == ROW){
        updateView[UPDATE_DURATION] = $this.bertin.matrixParams.transitions.crossingSettings.negative.animate;
        updateView[UPDATE_ENCODING] = {animate: true};
        modified.forEach(function(row){row.scale.updateCellsTransferedValue()});
      }
      else{
        updateView[UPDATE_DURATION] = $this.bertin.matrixParams.transitions.crossingSettings.negative.animate;
        updateView[UPDATE_ENCODING] = {animate: true};
        $this.bertin.getAllElements(ROW,ON_TARGET).forEach(function(row){row.scale.updateCellsTransferedValue()});
      }
    }

    else if(ENCODING_ORIENTATION_TYPES.indexOf(action) != -1){
      updateView[CHANGE_ENCODING] = {target: target, modified: modified};
    }

    //if reorder
    else if(action == REORDER || action == INVERT){
      //do nothing
    }

    else if(action == SCALE_GLOBAL){

    }

    else if(action == SCALE_CUSTOM_RANGE || action == SCALE_CUSTOM_RANGE_BASELINE){
      updateView[UPDATE_DURATION] = $this.bertin.matrixParams.transitions.crossingSettings.negative.animate;
      updateView[UPDATE_ENCODING] = {animate: true};
      $this.bertin.getAllElements(ROW,ON_TARGET).forEach(function(row){row.scale.updateCellsTransferedValue()});
    }

    else console.error("unknown setting action",action);
  }
  /*-----------------------if BETWEEN_TARGETS---------------------------------*/
  else if(mode == BETWEEN_TARGETS){
    //if glue, nothing to do
    if(action == GLUE){

    }
    else console.error("invalid mode "+mode);
  }
  else console.error("invalid mode "+mode);


  updateView[UPDATE_DURATION] = $this.bertin.matrix.transitions.encoding.duration;
  $this.bertin.matrix.updateAttributes(updateAttributes, function(){
    $this.bertin.matrix.updateView(updateView);
  });

  $this.updateButtonsStyle();
};

/*
 When release crossing, change the layout only if action in SETTING_CHANGE_LAYOUT
 */
CrossingHandler.prototype.applyEndCrossingChanges = function(mode, target, action, initialState, buttons){
  if(SETTING_CHANGE_WHEN_RELEASE.indexOf(action) == -1) return;
  var $this = this;
  var modified = buttons.map(function(but){return but.data.targetData});
  var updateView = [];
  updateView[UPDATE_DURATION] = $this.bertin.matrix.transitions.layout.duration;

  if(mode == ON_TARGET){
    if(action == REORDER){
      //console.log(modified,initialState);
      $this.bertin.autoSortMatrix(target,"leafOrder","manhattan", modified);
      modified.forEach(function(rowCol){rowCol.set(REORDER,false)});
      $this.updateButtonsStyle();
    }
    else if(action == INVERT){
      $this.bertin.invertRowCols(target,modified);
      modified.forEach(function(rowCol){rowCol.set(INVERT,false)});
      $this.updateButtonsStyle();
    }
    else if(action == HEADER){
      var minIndex = d3.min(modified,function(d){return d.index});
      var modifiedAfter = $this.bertin.elements[target].filter(function(e){return e.index >= minIndex});
      updateView[CHANGE_ENCODING] = {target: target, modified: target == ROW ? modified : $this.bertin.elements[target]};
      updateView[UPDATE_TRANSLATE] = {target: target, modified: modifiedAfter};
      updateView[UPDATE_SEPARATOR] = {type: SEPARATOR_POSITION, animate: true};//TODO - not optimal
      updateView[UPDATE_GLUE] = {mode:ON_BUTTONS, effect: "update"};

      //if need to change the size of a column
      if(target == ROW){
        $this.commands.updateCommandsTransform();//need to update all settings
        $this.commands.applyCommandsTransform(COL, undefined, $this.bertin.matrix.transitions.layout.duration);
        updateView[UPDATE_TRANSLATE] = {/*target: COL*/};
        updateView[FORCE_ALL_CELLS] = true;
        $this.bertin.matrix.updateView(updateView);
      }
      else{
        $this.commands.updateCommandsTransform(/*target, modifiedSettings*/);
        $this.commands.applyCommandsTransform(target, modifiedAfter, $this.bertin.matrix.transitions.layout.duration);
        $this.bertin.matrix.updateView(updateView);
      }
      $this.bertin.updateSVGSize();
    }
    else console.error("invalid action",action);
  }
  else if(mode == BETWEEN_TARGETS){
    if(action == GLUE){
      updateView[UPDATE_GLUE] = {target: target, action: action, modified: modified, effect: initialState ? "remove" : "create"};

      $this.bertin.matrix.updateView(updateView);
    }
    else console.error("invalid action "+action);


  }
  else console.error("invalid mode "+mode);
};

CrossingHandler.prototype.removeCrossedHighlight = function(){

  if(this.crossedHighlight){
    this.crossedHighlight.transition().duration(this.bertin.matrixParams.transitions.crossingSettings.highlight.duration)
        .style("opacity",this.bertin.matrixParams.settings.highlight.opacityOff)
        .remove();
    this.crossedHighlight = undefined;
  }

};

CrossingHandler.prototype.updateCrossedHighlight = function(action, src, crossedWidgets){
  var widgetCoords = this.bertin.commands.getCoords(),
      matrixCoords = this.bertin.getMatrixCoordinates();

  //remove widget highlights if exist
  src.removeHoverHighlight();

  var targetDatas = crossedWidgets.map(function(d){return d.data.targetData}).sort(function(a,b){return d3.ascending(a.index, b.index)});

  this.crossedHighlight = this.bertin.matrix.root
      .selectAll(".crossedHighlight")
      .data(targetDatas);
  this.crossedHighlight.enter()
      .append("rect")
      .attr("class","crossedHighlight")
      .style({
        "pointer-events": "none",
        opacity: this.params.highlight.opacityOn,
        fill: this.params.highlight.fill,
        stroke: this.params.highlight.stroke,
        "stroke-width": this.params.highlight.strokeWidth
      });
  this.crossedHighlight.attr({
        x: getX,
        y: getY,
        width: getWidth,
        height: getHeight
      });

  this.crossedHighlight.exit().remove();

  function getX(targetData){
    if(targetData.target == ROW) return targetData.mode == ON_TARGET ? widgetCoords.x1 : matrixCoords.x1;
    else return targetData.getX1Highlight();
  }
  function getY(targetData){
    if(targetData.target == COL) return targetData.mode == ON_TARGET ? widgetCoords.y1 : matrixCoords.y1;
    else return targetData.getX1Highlight();
  }
  function getWidth(targetData){
    if(targetData.target == ROW) return targetData.mode == ON_TARGET ? matrixCoords.x2 - widgetCoords.x1 : widgetCoords.x2 - matrixCoords.x1;
    else return targetData.getSizeHighlight();
  }
  function getHeight(targetData){
    if(targetData.target == COL) return targetData.mode == ON_TARGET ? matrixCoords.y2 - widgetCoords.y1 : widgetCoords.y2 - matrixCoords.y1;
    else return targetData.getSizeHighlight();
  }
};

/*
 Stylizes the crossing buttons
 */
CrossingHandler.prototype.updateButtonsStyle = function(buttons){
  var $this = this;
  var t = this.commands.dragLayer.selectAll(".setting")
      .transition().duration($this.transitions.stylizeButtons.duration)
      .each(function(setting){
        //update the setting feedback headers
        if(setting.commandData.group == true && setting.commandData.feedbackIcon){
          d3.select(this).select(".setting-header")
              .attr("xlink:href",$this.getSettingSubHeaderFeedbackIcon(setting));
        }
      });

  //update the buttons
  t.selectAll(".crossing-button")
      .filter(function(but){return buttons ? buttons.indexOf(but) != -1 : true})
      .each(function(d){
        var but = d3.select(this);
        d.deactivated = !$this.isButtonActivable(d);
        d.hidden = $this.isButtonHidden(d);
        but.style("opacity", $this.getButtonOpacity(d));
        if(d.deactivated || d.hidden) but.style("pointer-events", "none");
        else but.style("pointer-events", "auto");
        if(d.targetData.mode == ON_TARGET){
          if(d.action == HEADER && d.targetData.is(HEADER)) activate();
          else if(d.action == NEGATIVE && d.targetData.is(NEGATIVE)) activate();
          else if(d.action == INVERT){
            if(d.targetData.is(INVERT)) activate();
            else deactivate();
          }
          else if(d.action == REORDER){
            if(d.targetData.is(REORDER)) activate();
            else deactivate();
          }
          else if(d.action == SCALE_GLOBAL){
            if(d.targetData.is(SCALE_GLOBAL)) activate();
            else deactivate();
          }
          else if(d.action == SCALE_CUSTOM_RANGE){
            if(d.targetData.is(SCALE_CUSTOM_RANGE)) activate();
            else deactivate();
          }
          else if(d.action == SCALE_CUSTOM_RANGE_BASELINE){
            if(d.targetData.is(SCALE_CUSTOM_RANGE_BASELINE)) activate();
            else deactivate();
          }
          else if(d.commandData.crossing == false){
            if(d.state == BUTTON_STATE.ON) activate();
            else deactivate();
          }
          else if(ENCODING_ORIENTATION_TYPES.indexOf(d.action) != -1){
            if(d.targetData.get(ENCODING_ORIENTATION) == d.action) activate();
            else deactivate();
          }
          else if(d.action == NORMALIZED_SIZE){
            //nothing to do
          }

          else if(d.action == d.targetData[FIELDS[ENCODING]] && !d.targetData.is(HEADER)) activate();
          else if(d.state != BUTTON_STATE.OFF) deactivate();
        }
        else if(d.targetData.mode == BETWEEN_TARGETS){

          if(d.commandData.action == SEPARATOR){
            if(d.action == SEPARATOR_SIZE || d.action == SEPARATOR_MARGIN){

            }
            else console.log("invalid action for between separator",$this.bertin.getFieldTitle(d.commandData.action));
          }
          else if(d.targetData.is(d.action)) activate();
          else if(d.state != BUTTON_STATE.OFF) deactivate();
        }
        else console.error("invalid mode "+ d.targetData.mode);

        function activate(){
          //but.select(".button-shape").attr("filter","url(#bluer)");
          but.select(".button-shape").attr("xlink:href", d.icons["on"]);
          d.state = BUTTON_STATE.ON;

        }
        function deactivate(){
          //but.select(".button-shape").attr("filter","none");
          but.select(".button-shape").attr("xlink:href", d.icons["off"]);
          d.state = BUTTON_STATE.OFF;
        }
      });
};

/*
 Return true if the button is visible
 */
CrossingHandler.prototype.isButtonActivable = function(but_data){
  if(but_data.commandData.group == true && but_data.commandData.state == COMMAND_GROUP_CLOSED) return false;
  if(but_data.targetData.mode == ON_TARGET){
    return !(
        (but_data.targetData.is(HIDDEN))
            || (but_data.targetData.target == ROW && but_data.action == SCALE_CUSTOM_RANGE && !but_data.targetData.canSetCustomScaleRange())
            || (but_data.targetData.target == ROW && but_data.action == SCALE_CUSTOM_RANGE_BASELINE && !but_data.targetData.canSetBaseline())
            || (but_data.targetData.is(HEADER) && but_data.action != HEADER)
            || (but_data.targetData.target == ROW && but_data.action == NEGATIVE && but_data.targetData.get(ENCODING) == TEXT)
            || (but_data.action == REORDER && ( but_data.targetData.is(HEADER) || ( but_data.targetData.target == ROW && but_data.targetData.get(ENCODING) == TEXT) ))
            || (but_data.commandData.action == SCALE && ( but_data.targetData.is(HEADER) || ( but_data.targetData.get(ENCODING) == TEXT) ))
            );
  }
  else if(but_data.targetData.mode == BETWEEN_TARGETS){
    return true;
  }
  else {
    console.error("invalid mode "+but_data.mode);
    return null;
  }
};

CrossingHandler.prototype.isButtonHidden = function(but_data){
  return but_data.commandData.group == true && but_data.commandData.state == COMMAND_GROUP_CLOSED;
};

/*
 d can be Between or Row/Col
 */
CrossingHandler.prototype.getCrossingButtonAbsPos = function(d,action){
  return this.groups[d.mode][d.target][action].buttons.filter(function(but){
    return d == but.data.targetData;
  })[0].data.absTranslate;
};

CrossingHandler.prototype.getSettingTranslate = function(setting){
  var trTarget = this.commands.params.buttons.size/2 + setting.targetData.getPosAbs();//this.size/2 to shift of header half size
  var offset = setting.targetData.getOffset();
  if(offset == undefined) console.error("no offset for targetData",this.targetData);
  return setting.commandData.target == ROW ? [0,trTarget-offset] : [trTarget-offset,0];
};

CrossingHandler.prototype.updateButAbsTransform = function(but){
  var trCommand = but.commandData.translate;
  var trSetting = but.settingData.translate;
  var trBut = but.translates[but.commandData.state];

  if(trCommand == undefined || trSetting == undefined || trBut == undefined) return;

  but.absTranslate = [trCommand[0]+trSetting[0]+trBut[0],trCommand[1]+trSetting[1]+trBut[1]];

  if(SIMPLE_SLIDER_COMMANDS.indexOf(but.action) != -1 || RANGE_SLIDER_COMMANDS.indexOf(but.action) != -1){
    if(but.targetData.target == ROW)
      but.absBBox = {x1: but.absTranslate[0]-but.size/2, y1: but.absTranslate[1], x2: but.absTranslate[0]+but.size/2, y2: but.absTranslate[1]};
    else
      but.absBBox = {x1: but.absTranslate[0], y1: but.absTranslate[1]-but.size/2, x2: but.absTranslate[0], y2: but.absTranslate[1]+but.size/2};
  }
  else{
    but.absBBox = {x1: but.absTranslate[0]-but.size/2, y1: but.absTranslate[1]-but.size/2, x2: but.absTranslate[0]+but.size/2, y2: but.absTranslate[1]+but.size/2};
  }
};









/*
 To handle the crossing buttons identified
 */
CrossingGroup = function(handler, mode, target, action){
  this.handler = handler;
  this.mode = mode;
  this.target = target;
  this.action = action;
  this.buttons = [];
};



var BUTTON_STATE = {
  OFF: 0,
  HOVER: 1,
  ON: 2
};









CrossingSimpleSlider = function(handler){
  this.handler = handler;
};

CrossingSimpleSlider.prototype.start = function(params){
  this.crossedSliders = [];
  this.slider = params.slider;
  this.thumb = params.thumb;
  this.group = params.group;

  if(params.group.target == ROW) this.orientation = VERTICAL;
  else if(params.group.target == COL) this.orientation = HORIZONTAL;
  else console.error("invalid target "+params.group.target);

  this.line = this.handler.commands.dragLayer.insert("line",".commandGroup")
      .attr("class","crossing-line")
      .style(this.handler.params.crossing.lineStyle);

  var thumbTranslate = Utils.vectorsSum(this.slider.data.absTranslate,this.thumb.translate);
  this.lineCoords = {x1: thumbTranslate[0], y1: thumbTranslate[1], x2: thumbTranslate[0], y2: thumbTranslate[1]};
  this.updateLine();
  this.slider.setThumbSelected(this.thumb.type,true);
  this.group.handler.updateCrossedHighlight(this.group.action, this.slider, [this.slider]);
};

CrossingSimpleSlider.prototype.updateLine = function(){
  this.line.attr({
    x1: this.lineCoords.x1,
    y1: this.lineCoords.y1,
    x2: this.lineCoords.x2,
    y2: this.lineCoords.y2
  });
};

CrossingSimpleSlider.prototype.drag = function(drag_event,newVal){
  var $this = this;

  var dx,dy;
  if(this.orientation == HORIZONTAL){
    dx = drag_event.x;
    dy = 0;
  }
  else if(this.orientation == VERTICAL){
    dx = 0;
    dy = drag_event.y;
  }
  else console.error("invalid orientation",this.orientation);

  //Current crossing effects on matrix
  //the new crossed buttons
  var crossedCurrent = this.group.buttons.filter(function(slider){
    return slider.isCrossed($this.lineCoords);
  });

  var the_uncrossed = [];
  this.crossedSliders.forEach(function(slider){
    if(crossedCurrent.indexOf(slider) == -1) the_uncrossed.push(slider);
  });
  this.crossedSliders = crossedCurrent.filter(function(slider){
    return the_uncrossed.indexOf(slider) == -1;
  });

  //update the thumbs style
  this.crossedSliders.forEach(function(slider){slider.setThumbSelected($this.thumb.type, true)});
  the_uncrossed.forEach(function(slider){slider.setThumbSelected($this.thumb.type, false)});

  this.crossedSliders.sort(function(a,b){return d3.ascending(a.data.targetData.index, b.data.targetData.index)});

  $this.handler.applyLiveSliderCrossingChanges(
      this.slider,
      this.thumb.type,
      this.crossedSliders,
      the_uncrossed,
      newVal);

  $this.group.handler.updateCrossedHighlight(this.group.action, this.slider, this.crossedSliders);

  var thumbTranslate = Utils.vectorsSum($this.slider.data.absTranslate,$this.thumb.translate);
  $this.lineCoords = {x1: thumbTranslate[0], y1: thumbTranslate[1], x2: thumbTranslate[0]+dx, y2: thumbTranslate[1]+dy};
  $this.updateLine();
};

/*
 When a crossing ends, change the layout if needed
 */
CrossingSimpleSlider.prototype.end = function(){
  var $this = this;
  this.handler.commands.dragLayer.selectAll(".crossing-line").remove();

  this.slider.group.buttons.forEach(function(slider){
    slider.setThumbSelected($this.thumb.type,false);
  });

  this.handler.applyEndSliderCrossingChanges(this.group.mode,this.group.target, this.group.action, this.crossedSliders);

  this.slider.group.buttons.forEach(function(slider){
    if(slider.group.action == SEPARATOR_MARGIN || slider.group.action == SEPARATOR_SIZE)slider.data.targetData.separator.backupWidth(slider.group.action);
    else if(slider.group.action == SCALE_CONTRAST) slider.data.targetData.scale.backupValue($this.group.action,SCALE_IN,SLIDER_VALUE);
    else if(slider.group.action == SCALE_DISCRETIZE) slider.data.targetData.scale.backupValue($this.group.action,SCALE_IN,SLIDER_VALUE);
    else if(slider.group.action == NORMALIZED_SIZE) slider.data.targetData.backupSize();
    else console.error('invalid action',$this.handler.bertin.getFieldTitle(slider.group.action));
  });

  this.group.handler.removeCrossedHighlight();

  this.slider = null;
  this.thumb = null;
  this.group = null;
  this.crossedSliders = [];
  this.lineCoords = null;
  this.line = null;
};






























CrossingRangeSlider = function(handler){
  this.handler = handler;
};

CrossingRangeSlider.prototype.start = function(params){
  this.crossedSliders = [];
  this.slider = params.slider;
  this.thumb = params.thumb;
  this.group = params.group;

  if(params.group.target == ROW) this.orientation = VERTICAL;
  else if(params.group.target == COL) this.orientation = HORIZONTAL;
  else console.error("invalid target "+params.group.target);

  this.line = this.handler.commands.dragLayer.insert("line",".commandGroup")
      .attr("class","crossing-line")
      .style(this.handler.params.crossing.lineStyle);

  var thumbTranslate = Utils.vectorsSum(this.slider.data.absTranslate,this.thumb.translate);
  this.lineCoords = {x1: thumbTranslate[0], y1: thumbTranslate[1], x2: thumbTranslate[0], y2: thumbTranslate[1]};
  this.updateLine();

  this.slider.setThumbSelected(this.thumb.type,true);
  //this.drag({x: 0, y: 0},undefined);
  this.group.handler.updateCrossedHighlight(this.group.action, this.slider, [this.slider]);
};

CrossingRangeSlider.prototype.updateLine = function(){
  this.line.attr({
    x1: this.lineCoords.x1,
    y1: this.lineCoords.y1,
    x2: this.lineCoords.x2,
    y2: this.lineCoords.y2
  });
};

CrossingRangeSlider.prototype.drag = function(drag_event,newVal){
  var $this = this;

  var dx,dy;
  if(this.orientation == HORIZONTAL){
    dx = drag_event.x;
    dy = 0;
  }
  else if(this.orientation == VERTICAL){
    dx = 0;
    dy = drag_event.y;
  }
  else console.error("invalid orientation",this.orientation);

  //Current crossing effects on matrix
  //the new crossed buttons
  var crossedCurrent = this.group.buttons.filter(function(slider){
    return slider.isCrossed($this.lineCoords);
  });

  var the_uncrossed = [];
  this.crossedSliders.forEach(function(slider){
    if(crossedCurrent.indexOf(slider) == -1) the_uncrossed.push(slider);
  });
  this.crossedSliders = crossedCurrent.filter(function(slider){
    return the_uncrossed.indexOf(slider) == -1;
  });

  //check that MIN < MAX over all crossed sliders
  if(this.thumb.type == SLIDER_MIN){
    var globalMax = d3.min($this.crossedSliders,function(slider){return slider.thumbValues[SLIDER_MAX]});
    newVal = Math.min(newVal,globalMax - $this.slider.group.handler.params.widgets.minDiff);
  }
  else if(this.thumb.type == SLIDER_MAX){
    var globalMin = d3.max($this.crossedSliders, function(slider){return slider.thumbValues[SLIDER_MIN]});
    newVal = Math.max(newVal,globalMin + $this.slider.group.handler.params.widgets.minDiff);
  }

  //update the thumbs style
  this.crossedSliders.forEach(function(slider){slider.setThumbSelected($this.thumb.type,true)});
  the_uncrossed.forEach(function(slider){slider.setThumbSelected($this.thumb.type,false)});

  this.crossedSliders.sort(function(a,b){return d3.ascending(a.data.targetData.index, b.data.targetData.index)});

  $this.handler.applyLiveSliderCrossingChanges(
      this.slider,
      this.thumb.type,
      this.crossedSliders,
      the_uncrossed,
      newVal);

  $this.group.handler.updateCrossedHighlight(this.group.action, this.slider, this.crossedSliders);

  var thumbTranslate = Utils.vectorsSum($this.slider.data.absTranslate,$this.thumb.translate);
  $this.lineCoords = {x1: thumbTranslate[0], y1: thumbTranslate[1], x2: thumbTranslate[0]+dx, y2: thumbTranslate[1]+dy};
  $this.updateLine();
};

/*
 When a crossing ends, change the layout if needed
 */
CrossingRangeSlider.prototype.end = function(){
  var $this = this;
  this.handler.commands.dragLayer.selectAll(".crossing-line").remove();

  this.slider.group.buttons.forEach(function(slider){
    slider.setThumbSelected($this.thumb.type,false);
  });
  this.handler.applyEndSliderCrossingChanges(this.group.mode,this.group.target, this.group.action, this.crossedSliders);

  this.slider.group.buttons.forEach(function(slider){
    if(!(slider.data.targetData.type == ROW)) console.error("targetData must be a Row",slider.data.targetData);
    slider.data.targetData.scale.backupValue($this.group.action,SCALE_IN,SLIDER_MIN);
    slider.data.targetData.scale.backupValue($this.group.action,SCALE_IN,SLIDER_MAX);
  });

  /*Nothing to update for now

   if(this.crossedSliders.indexOf(this.src) == -1) this.crossedSliders.push(this.src);
   this.handler.applyEndCrossingChanges(this.src.group.mode,this.src.group.target, this.src.group.action, this.initialState, this.crossedButtons);
   */

  this.group.handler.removeCrossedHighlight();

  this.slider = null;
  this.thumb = null;
  this.group = null;
  this.crossedSliders = [];
  this.lineCoords = null;
  this.line = null;
};





























/*
 Called when a crossing is started
 Can be either vertical or horizontal
 */
CrossingButton = function (handler){
  this.handler = handler;
};

CrossingButton.prototype.start = function(params){
  this.crossedButtons = [];
  this.src = params.src;
  this.inSrc = false;
  this.dragging = false;
  this.initialState = params.state;
  this.group = params.group;
  this.lineCoords = {x1: params.start[0], y1: params.start[1], x2: params.start[0], y2: params.start[1]};

  if(params.group.target == ROW) this.orientation = VERTICAL;
  else if(params.group.target == COL) this.orientation = HORIZONTAL;
  else console.error("invalid target "+params.group.target);

  this.line = this.handler.commands.dragLayer.selectAll(".crossing-line")
      .data([this.lineCoords])
      .enter()
      .insert("line",".commandGroup")
      .attr("class","crossing-line")
      .style(this.handler.params.crossing.lineStyle)
      .attr({
        x1: function(d){return d.x1},
        y1: function(d){return d.y1},
        x2: function(d){return d.x2},
        y2: function(d){return d.y2}
      });

  this.group.handler.updateCrossedHighlight(this.group.action, this.src, [this.src]);
  this.drag({x: 0, y: 0});
};

CrossingButton.prototype.drag = function(drag_event){
  var $this = this;
  var dx = this.orientation == HORIZONTAL ? drag_event.x : 0,
      dy = this.orientation == VERTICAL ? drag_event.y : 0;

  this.lineCoords.x2 = this.lineCoords.x1+dx;
  this.lineCoords.y2 = this.lineCoords.y1+dy;

  //SVG line update
  this.line.attr({
    x2: $this.lineCoords.x2,
    y2: $this.lineCoords.y2
  });

  //Current crossing effects on matrix
  //the new crossed buttons
  var crossed = this.group.buttons.filter(function(button){
    return button != $this.src && button.isCrossed($this.lineCoords);
  });

  var the_uncrossed = [], the_crossed = [];

  var newInSrc = this.src.containsPoint(this.lineCoords.x2,this.lineCoords.y2);
  if(this.inSrc != newInSrc){//if change the this.inSrc attr
    if(!this.dragging){//initial state, add src to the list
      the_crossed.push(this.src);
    }
    if(!this.dragging && !newInSrc){//if we left src for the 1st time, we init dragging
      this.dragging = true;
    }
    else if(this.dragging && newInSrc){//if dragging and we enter src, unselect it
      the_uncrossed.push(this.src);
    }
    else if(this.dragging && !newInSrc){//if dragging and we leave src, select it
      the_crossed.push(this.src);
    }
    this.inSrc = newInSrc;
  }

  this.crossedButtons.forEach(function(but){
    if(crossed.indexOf(but) == -1) the_uncrossed.push(but);
  });
  crossed.forEach(function(but){
    if($this.crossedButtons.indexOf(but) == -1){
      the_crossed.push(but);
      $this.crossedButtons.push(but);
    }
  });

  this.crossedButtons = this.crossedButtons.filter(function(but){
    return the_uncrossed.indexOf(but) == -1;
  });

  if(the_crossed.length>0 || the_uncrossed.length>0){
    $this.handler.applyLiveCrossingChanges(
        this.src.group.mode,
        this.src.group.target,
        this.src.group.action,
        this.initialState,
        the_crossed,
        the_uncrossed);
  }

  $this.group.handler.updateCrossedHighlight(this.group.action, this.src, this.crossedButtons.concat(this.src));
};

/*
 When a crossing ends, change the layout if needed
 */
CrossingButton.prototype.end = function(){
  this.handler.commands.dragLayer.selectAll(".crossing-line").transition().duration(100).remove();
  if(this.crossedButtons.indexOf(this.src) == -1) this.crossedButtons.push(this.src);
  this.handler.applyEndCrossingChanges(this.src.group.mode,this.src.group.target, this.src.group.action, this.initialState, this.crossedButtons);
  this.group.handler.removeCrossedHighlight();
  this.crossedButtons = [];
  this.group = null;
  this.initialState = null;
  this.dragging = undefined;
  this.src = null;
};
