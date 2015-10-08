/*
Bertifier, crafting tabular visualizations, v1
(c) 2014-2014, Inria
Authors: PERIN Charles, DRAGICEVIC Pierre, FEKETE Jean-Daniel

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 Abstract CrossableWidget
 */
function CrossableWidget(butData,group){
  if(arguments.length > 0) this.initWidget(butData,group);
}

CrossableWidget.prototype.initWidget = function(butData,group){
  this.group = group;
  this.data = butData;
  this.data.translates = [];
  this.data.translates[COMMAND_GROUP_OPENED] = this.getRelTranslateOpen();
  this.data.translates[COMMAND_GROUP_CLOSED] = [0,0];
  this.data.size = this.group.handler.params.widgets.size[this.group.action] || this.group.handler.params.buttons.size;
  this.data.icons = this.getIcons();
  this.initWidgetBase();//inherited
};

CrossableWidget.prototype.getSize = function(){
  return this.data.size;
};

CrossableWidget.prototype.getRelTranslateOpen = function(){
  if(this.data.commandData.group == false) return [0,0];
  //if a subcommand, retrieve the subHeader translate
  return this.data.commandData.subCommandsData[this.data.indexInCommandGroup].translates[COMMAND_GROUP_OPENED];
};

CrossableWidget.prototype.initWidgetBase = function(){
  var $this = this;
  this.widgetGroup = this.data.settingGroup.append("g")
      .datum(this.data)
      .attr("class","crossing-button")
    //.style("pointer-events", "none")
      .attr("transform", "translate("+this.data.translates[this.data.commandData.state]+")")
      .on("mouseenter", function(){$this.mouseEnter()})
      .on("mouseleave", function(){$this.mouseLeave()});

  this.widgetGroup.append("rect")
      .attr({
        class: "background"
      })
      .style({
        stroke: "none",
        fill: $this.group.handler.params.dragLayer.fill,
        opacity:.00001
      });

  this.updateBackground();

  this.dragBehavior = d3.behavior.drag().origin(Object)
      .on("dragstart",function(d){$this.startDrag(d);})
      .on("drag", function(d){$this.drag(d3.event,d);})
      .on("dragend", function(d){$this.endDrag(d);});
};



CrossableWidget.prototype.createHoverHighlight = function(){
  if(!this.highlight){
    this.highlight = this.group.handler.bertin.matrix.root.append("rect")
        .attr({class: "overCommand-"+this.group.target+"-"+this.group.type+"-"+this.group.action})
        .style({
          "pointer-events": "none",
          opacity: 0,
          fill: this.group.handler.bertin.matrixParams.settings.highlight.fill,
          stroke: this.group.handler.bertin.matrixParams.settings.highlight.stroke,
          "stroke-width": this.group.handler.bertin.matrixParams.settings.highlight.strokeWidth
        });

    this.updateHoverHighlight();
    this.highlight.transition().duration(this.group.handler.bertin.matrixParams.transitions.crossingSettings.highlight.duration)
        .style("opacity",this.group.handler.bertin.matrixParams.settings.highlight.opacityOn);
  }
};

CrossableWidget.prototype.updateHoverHighlight = function(){
  var widgetCoords = this.group.handler.bertin.commands.getCoords(),
      matrixCoords = this.group.handler.bertin.getMatrixCoordinates();
  var targetElement = this.data.targetData;

  var x, y, width, height;
  if(WIDGETS_HIGHLIGHT_ELEMENT.indexOf(this.data.action) != -1){
    if(targetElement.mode == ON_TARGET){//row/col
      if(targetElement.target == ROW){
        x = widgetCoords.x1;
        y = targetElement.getPosAbs() - targetElement.getSize()/2;
        width = matrixCoords.x2 - x;
        height = targetElement.getSize();
      }
      else{
        x = targetElement.getPosAbs() - targetElement.getSize()/2;
        y = widgetCoords.y1;
        width = targetElement.getSize();
        height = matrixCoords.y2 - y;
      }
    }
    else{//separators
      if(targetElement.target == ROW){
        x = matrixCoords.x1;
        y = targetElement.getPosAbs() - targetElement.getSize()/2;
        width = widgetCoords.x2 - x;
        height = targetElement.getSize();
        if(height < this.group.handler.bertin.matrixParams.settings.highlight.minSize){
          y -= this.group.handler.bertin.matrixParams.settings.highlight.minSize/2;
          height += this.group.handler.bertin.matrixParams.settings.highlight.minSize;
        }
      }
      else{
        x = targetElement.getPosAbs() - targetElement.getSize()/2;
        y = matrixCoords.y1;
        width = targetElement.getSize();
        height = widgetCoords.y2 - y;
        if(width < this.group.handler.bertin.matrixParams.settings.highlight.minSize){
          x -= this.group.handler.bertin.matrixParams.settings.highlight.minSize/2;
          width += this.group.handler.bertin.matrixParams.settings.highlight.minSize;
        }
      }
    }
  }
  else if(WIDGETS_HIGHLIGHT_LEFTRIGHT.indexOf(this.data.action) != -1){//glue
    if(targetElement.mode == ON_TARGET){
      console.error("invalid highlight on target",this);
    }
    else{
      var left = this.group.handler.bertin.elements[targetElement.target][targetElement.index-1];
      var right = this.group.handler.bertin.elements[targetElement.target][targetElement.index+1];
      if(!left || !right) console.error("missing left or right",left,right,this);

      if(targetElement.target == ROW){
        x = matrixCoords.x1;
        y = left.getX1Coord();
        width = widgetCoords.x2 - x;
        height = right.getX2Coord() - y;
      }
      else{
        x = left.getX1Coord();
        y = matrixCoords.y1;
        width = right.getX2Coord() - x;
        height = widgetCoords.y2 - y;
      }
    }
  }
  else return;

  this.highlight.attr({
    x: x,
    y: y,
    width: width,
    height: height
  });
};

CrossableWidget.prototype.removeHoverHighlight = function(){
  if(this.highlight){
    d3.selectAll(".overCommand-"+this.group.target+"-"+this.group.type+"-"+this.group.action).transition().duration(this.group.handler.bertin.matrixParams.transitions.crossingSettings.highlight.duration)
        .style("opacity",this.group.handler.bertin.matrixParams.settings.highlight.opacityOff)
        .remove();
    this.highlight = undefined;
  }
};

CrossableWidget.prototype.mouseEnter = function(){
  this.createHoverHighlight();
  this.group.handler.bertin.descriptionArea.showCommandDescription(this.data.commandData, this.group.action);
};

CrossableWidget.prototype.mouseLeave = function(){
  this.removeHoverHighlight();
  this.group.handler.bertin.descriptionArea.hideDescription();
};

CrossableWidget.prototype.getIcons = function(){
  if(this instanceof CrossableRangeSlider){//if 2 icons
    if(this.data.commandData.group == true){
      var on = [], off = [];
      on[SLIDER_MIN] = this.group.handler.commands.getCommandSubHeaderIcon({commandData: this.data.commandData, action: this.data.action},"on","min");
      on[SLIDER_MAX] = this.group.handler.commands.getCommandSubHeaderIcon({commandData: this.data.commandData, action: this.data.action},"on","max");
      off[SLIDER_MIN] = this.group.handler.commands.getCommandSubHeaderIcon({commandData: this.data.commandData, action: this.data.action},"off","min");
      off[SLIDER_MAX] = this.group.handler.commands.getCommandSubHeaderIcon({commandData: this.data.commandData, action: this.data.action},"off","max");
      return {on: on, off: off};
    }
    //else get command header icon
    else{
      return {
        on: this.group.handler.commands.getCommandHeaderIcon(this.data.commandData,"on"),
        off: this.group.handler.commands.getCommandHeaderIcon(this.data.commandData,"off")
      };
    }
  }

  //if 1 icon
  //if command group, get command subHeader icon
  if(this.data.commandData.group == true){
    return {
      on: this.group.handler.commands.getCommandSubHeaderIcon({commandData: this.data.commandData, action: this.data.action},"on"),
      off: this.group.handler.commands.getCommandSubHeaderIcon({commandData: this.data.commandData, action: this.data.action},"off")
    };
  }
  //else get command header icon
  else{
    return {
      on: this.group.handler.commands.getCommandHeaderIcon(this.data.commandData,"on"),
      off: this.group.handler.commands.getCommandHeaderIcon(this.data.commandData,"off")
    };
  }
};

CrossableWidget.prototype.isCrossed = function(l){
  if(this.data.deactivated || this.data.hidden) return false;
  var coords = {x1: Math.min(l.x1,l.x2), x2: Math.max(l.x1,l.x2), y1: Math.min(l.y1, l.y2), y2: Math.max(l.y1, l.y2)};
  return coords.x1 <= this.data.absBBox.x2
      && coords.x2 >= this.data.absBBox.x1
      && coords.y1 <= this.data.absBBox.y2
      && coords.y2 >= this.data.absBBox.y1;
};

CrossableWidget.prototype.containsPoint = function(x,y){
  return x <= this.data.absBBox.x2
      && x >= this.data.absBBox.x1
      && y <= this.data.absBBox.y2
      && y >= this.data.absBBox.y1;
};

CrossableWidget.prototype.updateBackground = function(){
  var targetSize = this.data.targetData.getSize();
  targetSize = Math.max(targetSize,this.group.handler.params.minBackgroundSize);
  this.widgetGroup.select(".background")
      .attr({
        x: this.data.targetData.target == ROW ? -this.data.size/2 - this.group.handler.params.buttons.size/4 : -targetSize/2,
        y: this.data.targetData.target == ROW ? -targetSize/2 : -this.data.size/2 -this.group.handler.params.buttons.size/4,
        width: this.data.targetData.target == ROW ? this.data.size + this.group.handler.params.buttons.size/2 : targetSize,
        height: this.data.targetData.target == ROW ? targetSize : this.data.size +this.group.handler.params.buttons.size/2
      });
};






/*
 CrossableButtons, inherits from CrossableWidgets
 */
function CrossableButton(butData,group){
  CrossableWidget.apply(this, arguments);
  this.initButton();
}
CrossableButton.prototype = new CrossableWidget();
CrossableButton.prototype.constructor = CrossableButton;

CrossableButton.prototype.initButton = function(){
  var $this = this;
  this.widgetGroup.call(this.dragBehavior);
  this.widgetGroup.append("image")
      .attr("xlink:href", this.data.icons["off"])
      .attr("class","button-shape")
      //.attr("transform", function(){return "rotate("+$this.group.handler.bertin.commands.getIconRotate($this.data.action,$this.group.target)+")";})
      .attr("width",this.data.size)
      .attr("height",this.data.size)
      .attr("x",-this.data.size/2)
      .attr("y",-this.data.size/2);
};

CrossableButton.prototype.startDrag = function(but){
  if(but.deactivated || but.hidden) return;
  var params = {
    src: this,
    start: this.data.absTranslate,
    group: this.group,
    state: this.data.state
  };
  this.group.handler.crossingButtons.start(params);
};
CrossableButton.prototype.drag = function(event,but){
  if(but.deactivated || but.hidden) return;
  this.group.handler.crossingButtons.drag(event);
};
CrossableButton.prototype.endDrag = function(but){
  if(but.deactivated || but.hidden) return;
  this.group.handler.crossingButtons.end();
};








/*
 Abstract CrossableSlider, inherits from CrossableWidgets
 */
CrossableSlider = function(butData,group,snap){
  CrossableWidget.apply(this, arguments);
  if(arguments.length > 0)this.initBaseSlider(snap);
};
CrossableSlider.prototype = new CrossableWidget();
CrossableSlider.prototype.constructor = CrossableSlider;
CrossableSlider.prototype.updateSliderBar = function(){/*does nothing, but needed*/};

CrossableSlider.prototype.initBaseSlider = function(snap){
  var $this = this;
  this.snap = snap || false;
  this.data.height = $this.group.handler.params.widgets.height;
  this.sliderWidth = this.data.size - 2 * this.group.handler.params.widgets.internalMargin;

  var scaleRange = this.group.target == ROW ? [-$this.sliderWidth/2, $this.sliderWidth/2] : [$this.sliderWidth/2, -$this.sliderWidth/2];

  if(this.snap){
    this.snapValues = DISCRETE_SLIDERS_VALUES[$this.group.action].map(function(d,i){
      return {pos: i / (DISCRETE_SLIDERS_VALUES[$this.group.action].length - 1)};
    });

    this.snapScale = d3.scale.ordinal()
        .domain(this.snapValues.map(function(d){return d.pos}))
        .rangePoints(scaleRange,.1);
    this.ticksInterval = this.snapScale(this.snapValues[1].pos)-this.snapScale(this.snapValues[0].pos);

    this.ticks = this.widgetGroup.selectAll(".tick")
        .data(this.snapValues)
        .enter()
        .append("g")
        .attr({
          class: "tick",
          transform: function(d){return "translate("+($this.group.target == ROW ? [$this.snapScale(d.pos),0] : [0, $this.snapScale(d.pos)])+")"}
        });

    this.ticks.append("rect")
        .attr("class","tickShape");
    //.attr(this.group.handler.params.sliders.snapTicks.attrs);//TODO
  }

  else{
    this.widgetGroup.append("line")
        .attr("class","button-shape slider-line")
        .attr({
          x1: $this.group.target == ROW ? -$this.sliderWidth/2: 0,
          x2: $this.group.target == ROW ? $this.sliderWidth/2: 0,
          y1: $this.group.target == ROW ? 0 : -$this.sliderWidth/2,
          y2: $this.group.target == ROW ? 0 : $this.sliderWidth/2
        })
        .style(this.group.handler.params.sliders.axisStyle);
  }

  this.sliderScale = d3.scale.linear()
      .domain([0,1])
      .range(scaleRange)
      .clamp(true);
};


CrossableSlider.prototype.initThumbs = function(thumbsData){
  var $this = this;
  this.thumbs = this.widgetGroup.selectAll(".slider-thumb")
      .data(thumbsData)
      .enter()
      .append("g")
      .attr("class","slider-thumb")
      .attr("transform",function(d){
        d.translate = $this.getThumbTranslate(d);
        return "translate("+ d.translate+")"
      });

  this.thumbs.append("image")
      .attr("xlink:href", function(d){
        if($this instanceof CrossableRangeSlider) return $this.data.icons["off"][d.type];
        else return $this.data.icons["off"];
      })
      //.attr("transform", function(){return "rotate("+$this.group.handler.bertin.commands.getIconRotate($this.data.action,$this.group.target)+")";})
      .attr("class","button-shape")
      .attr("width",this.group.handler.params.buttons.size)
      .attr("height",this.group.handler.params.buttons.size)
      .attr("x",-this.group.handler.params.buttons.size/2)
      .attr("y",-this.group.handler.params.buttons.size/2);

  this.thumbs.call(this.dragBehavior);
};

CrossableSlider.prototype.getData = function(){
  switch(this.data.action){
    case SEPARATOR_MARGIN:
    case SEPARATOR_SIZE:
      return this.data.targetData[FIELDS[SEPARATOR]].getNormalizedWidth(this.data.action);
    case SCALE_CONTRAST:
    case SCALE_DISCRETIZE:
      return this.data.targetData[FIELDS[SCALE]].getValue(this.data.action,SCALE_IN,SLIDER_VALUE);
    case SCALE_RANGE:
      return this.data.targetData[FIELDS[SCALE]].getMinMax(this.data.action,SCALE_IN);
    case NORMALIZED_SIZE:
      return this.data.targetData.getNormalizedSize();
    default:
      console.error("invalid sub-action",this.group.handler.bertin.getFieldTitle(this.data.action));
      return null;
  }
};

CrossableSlider.prototype.getThumbTranslate = function(thumb){
  return this.group.target == ROW ? [this.sliderScale(this.thumbValues[thumb.type]),0] : [0,this.sliderScale(this.thumbValues[thumb.type])];
};

CrossableSlider.prototype.changeThumbValue = function(thumbType,value){
  var $this = this;
  $this.thumbValues[thumbType] = value;
  this.thumbs.filter(function(d){return d.type == thumbType})
      .attr("transform", function(d){
        d.translate = $this.getThumbTranslate(d);
        return "translate("+ d.translate+")"
      });
};

CrossableSlider.prototype.setThumbSelected = function(type,isSelected){
  var onOff = isSelected ? "on" : "off";
  var $this = this;
  this.thumbs.filter(function(d){return d.type == type})
      .select("image")
      .attr("xlink:href", function(d){
        if($this instanceof CrossableRangeSlider) return $this.data.icons[onOff][d.type];
        else return $this.data.icons[onOff];
      });
};

/*
 val in [0,1]
 */
CrossableSlider.prototype.getSnapValue = function(val){
  if(this.snap == false) return val;
  var diff = Number.MAX_VALUE;
  var value;
  for(var v in this.snapValues){
    //noinspection JSUnfilteredForInLoop
    var curVal = this.snapValues[v].pos;
    var curDiff = Math.abs(curVal - val);
    if(curDiff < diff){
      value = curVal;
      diff = curDiff;
    }
  }
  return value;
};

CrossableSlider.prototype.getTickState = function(tickValue,barRange){
  return tickValue >= barRange.start && tickValue <= barRange.end ? TICK_ON : TICK_OFF;
};

CrossableSlider.prototype.updateTicks = function(){
  if(!this.snap) return;
  var $this = this;
  var barCoords = this.getBarRange();
  this.ticks.select(".tickShape").each(function(d){
    var newState = $this.getTickState(d.pos,barCoords);
    if(d.state == undefined || newState != d.state){
      d.state = newState;
      var type = d.state == TICK_ON ? "styleOn" : "styleOff";
      var tickShapeAttr = d.state == TICK_ON ? $this.group.handler.params.sliders.snapTicks.attrsOn : $this.group.handler.params.sliders.snapTicks.attrsOff;
      var dx = (type == "styleOn") ? $this.ticksInterval/2 : 0;
      d3.select(this)
          .style($this.group.handler.params.sliders.snapTicks[type])
          .attr({
            x: $this.group.target == ROW ? tickShapeAttr.x + dx : tickShapeAttr.y,
            y: $this.group.target == ROW ? tickShapeAttr.y : tickShapeAttr.x + dx,
            width: $this.group.target == ROW ? tickShapeAttr.width : tickShapeAttr.height,
            height: $this.group.target == ROW ? tickShapeAttr.height : tickShapeAttr.width
          });
    }
  })
};

CrossableSlider.prototype.getSliderBarAttributes = function(v1,v2){
  var x, y, w,h;
  //+ (ROW ? -SLIDERS_BAR_EXTRA_SIZE : 0)
  if(this.group.target == ROW){
    x = v1 - SLIDERS_BAR_EXTRA_SIZE;
    y = this.group.handler.params.sliders.sliderBar.attrs.y;
    w = Math.abs(v2 - v1);
    h = this.group.handler.params.sliders.sliderBar.attrs.height;
  }
  else{
    //noinspection JSSuspiciousNameCombination
    x = this.group.handler.params.sliders.sliderBar.attrs.y;
    y = v2 + SLIDERS_BAR_EXTRA_SIZE;
    w = this.group.handler.params.sliders.sliderBar.attrs.height;
    h = Math.abs(v2 - v1);
  }
  return {x: x, y: y, width: w, height: h};
};



/*
 CrossableSimpleSlider, inherits from CrossableSlider
 */
function CrossableSimpleSlider(butData,group,snap){
  CrossableSlider.apply(this, arguments);
  this.initSimpleSlider();
}
CrossableSimpleSlider.prototype = new CrossableSlider();
CrossableSimpleSlider.prototype.constructor = CrossableSlider;

CrossableSimpleSlider.prototype.initSimpleSlider = function(){
  var $this = this;

  $this.thumbValues = [];
  $this.thumbValues[SLIDER_VALUE] = this.getData();
  var sliderData = [{
    type: SLIDER_VALUE,
    simpleSlider: $this.data,
    x: $this.group.target == ROW ? $this.sliderScale($this.thumbValues[SLIDER_VALUE]) : 0,
    y: $this.group.target == ROW ? 0 : $this.sliderScale($this.thumbValues[SLIDER_VALUE])
  }];

  this.sliderBar = this.widgetGroup
      .insert("rect",".tick")
      .attr("class","slider-bar")
      .attr("rx",this.group.handler.params.sliders.sliderBar.rx)
      .attr("ry",this.group.handler.params.sliders.sliderBar.ry)
      .style(this.group.handler.params.sliders.sliderBar.style);

  this.updateSliderBar();
  this.initThumbs(sliderData);
};

CrossableSimpleSlider.prototype.updateSliderBar = function(){
   // this.sliderBar.attr({
   // x1: this.group.target == ROW ? this.sliderScale(0) : 0,
   // x2: this.group.target == ROW ? this.sliderScale(this.thumbValues[SLIDER_VALUE]) : 0,
   // y1: this.group.target == ROW ? 0 : this.sliderScale(0),
   // y2: this.group.target == ROW ? 0 : this.sliderScale(this.thumbValues[SLIDER_VALUE])
   // });

  this.sliderBar.attr(this.getSliderBarAttributes(
      this.sliderScale(0),
      this.sliderScale(this.thumbValues[SLIDER_VALUE])
  ));

  //update the ticks
  if(this.snap){
    this.updateTicks();
  }
};

CrossableSimpleSlider.prototype.getBarRange = function(){
  return {
    start: 0,
    end: this.thumbValues[SLIDER_VALUE]
  }
};

CrossableSimpleSlider.prototype.startDrag = function(thumb){
  if(thumb.simpleSlider.deactivated || thumb.simpleSlider.hidden) return;
  //!!!!! -----------------  UPDATE THE CURRENT X VALUE FOR DRAG   --------------- !!!!!!!!
  if(this.group.target == ROW) thumb.x = this.sliderScale(this.thumbValues[thumb.type]);
  else thumb.y = this.sliderScale(this.thumbValues[thumb.type]);
  var params = {
    slider: this,
    thumb: thumb,
    group: this.group
  };
  this.group.handler.crossingSimpleSlider.start(params);
};
CrossableSimpleSlider.prototype.drag = function(event,thumb){
  var $this = this;
  if(thumb.simpleSlider.deactivated || thumb.simpleSlider.hidden) return;
  //to interact outside the slider
  var x = this.group.target == ROW ? event.x : event.y;
  var dx = this.group.target == ROW ? event.dx : event.dy;
  if(x > $this.sliderWidth/2 && dx < 0) return;
  if(x < -$this.sliderWidth/2 && dx > 0) return;

  //to stay in the slider range
  if(this.group.target == ROW) thumb.x = Math.max(-$this.sliderWidth/2, Math.min(thumb.x + dx, $this.sliderWidth/2));
  else thumb.y = Math.max(-$this.sliderWidth/2, Math.min(thumb.y + dx, $this.sliderWidth/2));
  var newVal = this.group.target == ROW ? $this.sliderScale.invert(thumb.x) : $this.sliderScale.invert(thumb.y);
  if(this.snap){
    newVal = $this.getSnapValue(newVal);
  }
  this.group.handler.crossingSimpleSlider.drag(event,newVal);
};
CrossableSimpleSlider.prototype.endDrag = function(thumb){
  if(thumb.simpleSlider.deactivated || thumb.simpleSlider.hidden) return;
  this.group.handler.crossingSimpleSlider.end();
};





/*
 CrossableRangeSlider, inherits from CrossableSlider
 */
function CrossableRangeSlider(butData,group,snap){
  CrossableSlider.apply(this, arguments);
  this.initRangeSlider();
}
CrossableRangeSlider.prototype = new CrossableSlider();
CrossableRangeSlider.prototype.constructor = CrossableSlider;

CrossableRangeSlider.prototype.initRangeSlider = function(){
  var $this = this;

  $this.thumbValues = [];
  var sliderData = this.getData().map(function(d,i){
    $this.thumbValues[i] = d;
    return {
      type: i,
      rangeSlider: $this.data,
      x: $this.group.target == ROW ? $this.sliderScale(d) : 0,
      y: $this.group.target == ROW ? 0 : $this.sliderScale(d)
    };
  });

  this.sliderBar = this.widgetGroup
      .insert("rect",".tick")
      .attr("class","slider-bar")
      .attr("rx",this.group.handler.params.sliders.sliderBar.rx)
      .attr("ry",this.group.handler.params.sliders.sliderBar.ry)
      .style(this.group.handler.params.sliders.sliderBar.style);

  this.updateSliderBar();
  this.initThumbs(sliderData);
};


CrossableRangeSlider.prototype.updateSliderBar = function(){
  /*
  this.sliderBar.attr({
    x1: this.group.target == ROW ? this.sliderScale(this.thumbValues[SLIDER_MIN]) : 0,
    x2: this.group.target == ROW ? this.sliderScale(this.thumbValues[SLIDER_MAX]) : 0,
    y1: this.group.target == ROW ? 0 : this.sliderScale(this.thumbValues[SLIDER_MIN]),
    y2: this.group.target == ROW ? 0 : this.sliderScale(this.thumbValues[SLIDER_MAX])
  });*/
  this.sliderBar.attr(this.getSliderBarAttributes(
      this.sliderScale(this.thumbValues[SLIDER_MIN])/* - SLIDERS_BAR_EXTRA_SIZE*/,
      this.sliderScale(this.thumbValues[SLIDER_MAX])/* + SLIDERS_BAR_EXTRA_SIZE*/
  ));

  //update the ticks
  if(this.snap){
    this.updateTicks();
  }
};

CrossableRangeSlider.prototype.getBarRange = function(){
  return {
    start: this.thumbValues[SLIDER_MIN],
    end: this.thumbValues[SLIDER_MAX]
  }
};

//TODO - crossing should be according to this.orientation, for now only vertical sliders
CrossableRangeSlider.prototype.startDrag = function(thumb){
  if(thumb.rangeSlider.deactivated || thumb.rangeSlider.hidden) return;
  //!!!!! -----------------  UPDATE THE CURRENT X VALUE FOR DRAG   --------------- !!!!!!!!
  thumb.x = this.sliderScale(this.thumbValues[thumb.type]);
  var params = {
    slider: this,
    thumb: thumb,
    group: this.group,
    type: thumb.type
  };
  this.group.handler.crossingRangeSlider.start(params);
};

CrossableRangeSlider.prototype.drag = function(event,thumb){
  var $this = this;
  if(thumb.rangeSlider.deactivated || thumb.rangeSlider.hidden) return;

  //to interact outside the slider
  if(event.x > $this.sliderWidth/2 && event.dx < 0) return;
  if(event.x < -$this.sliderWidth/2 && event.dx > 0) return;

  //to stay in the slider range
  thumb.x = Math.max(-$this.sliderWidth/2, Math.min(thumb.x + event.dx, $this.sliderWidth/2));
  var newVal = $this.sliderScale.invert(thumb.x);
  if(this.snap){
    newVal = $this.getSnapValue(newVal);
  }
  this.group.handler.crossingRangeSlider.drag(event,newVal);
};

CrossableRangeSlider.prototype.endDrag = function(thumb){
  if(thumb.rangeSlider.deactivated || thumb.rangeSlider.hidden) return;
  this.group.handler.crossingRangeSlider.end();
};

