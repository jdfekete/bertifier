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

import {BARCHART, BASELINE, CELL_BACKGROUND_COLOR, CIRCLE, COL, CONF_INTERVAL, ENCODING_ORIENTATION_VERTICAL, GRAYSCALE, MEANCHART, MEANCHART2, HEADER, HORIZON, POSITION, ROW, STAT_MEAN, TEXT} from './Settings.js';
import {bertin_params} from './Settings.js';

export default function CellEncoding(bertin){
  this.bertin = bertin;
  this.fonts = {cell: {size: 9, font: "RobotoCondensed-Regular"}, header: {size: 12, font: "RobotoCondensed-Regular"}};
}

/*
 name must be "header" or "cell"
 */
CellEncoding.prototype.getFontString = function(name){
  return this.fonts[name].size+"px "+this.fonts[name].font;
};
CellEncoding.prototype.getFont = function(name){
  return this.fonts[name];
};

CellEncoding.prototype.getNALeftEncodingAttributes = function(params){
  return {
    x1: -params.graphicSize/2,
    y1: -params.graphicSize/2,
    x2: params.graphicSize/2,
    y2: params.graphicSize/2
  };
};
CellEncoding.prototype.getNARightEncodingAttributes = function(params,side){
  return {
    x1: -params.graphicSize/2,
    y1: params.graphicSize/2,
    x2: params.graphicSize/2,
    y2: -params.graphicSize/2
  };
};
CellEncoding.prototype.getNaEncodingStyle = function(){
  return {
    stroke: "black",
    "stroke-width": bertin_params.matrixParams.default_stroke_width
  };
};

CellEncoding.prototype.getBackgroundAttributes = function(params){
  return {
    x: -params.width/2,
    y: -params.height/2,
    width: params.width,
    height: params.height
  };
};

CellEncoding.prototype.getBackgroundStyle = function(){
  return{
    opacity: 1,
    fill: CELL_BACKGROUND_COLOR.default,
    "stroke-width": 0
  }
};

CellEncoding.prototype.getClipPathAttributes = function(params){
  if(!params.header && params.encoding == CIRCLE)
    return{
      x: -params.graphicSize/2,
      y: -params.graphicSize/2,
      width: params.graphicSize,
      height: params.graphicSize
    };
  return this.getBackgroundAttributes(params);
};


CellEncoding.prototype.updateCellBackground = function(params){
  params.cellObject.select("rect.background").transition().attr(this.getBackgroundAttributes(params));
};

CellEncoding.prototype.updateCellClipPath = function(params){
  params.cellObject.select("#clip-rect-"+ params.l+"-"+ params.c).transition().attr(this.getClipPathAttributes(params));
};

CellEncoding.prototype.updateNAEncoding = function(params){
  params.cellObject.selectAll("line.graphic.na").transition().attr({
    x1: -params.graphicSize/2,
    y1: function(d){return d == "left" ? -params.graphicSize/2 : params.graphicSize/2},
    x2: params.graphicSize/2,
    y2: function(d){return d == "left" ? params.graphicSize/2 : -params.graphicSize/2}
  });
};

CellEncoding.prototype.getCellText = function(params){
  var text = params.cellData.value.toString();
  if(params.cellData.ci_min != undefined && params.cellData.ci_max != undefined){
    text = Utils.getCIText(params.cellData);
  }
  if(params.cellAttrs[COL][HEADER] || params.cellAttrs[ROW][HEADER]) return text.toUpperCase();
  else return text;
};

CellEncoding.prototype.getCellTextAnchor = function(params){
  if(params.cellAttrs[ROW][HEADER]){
    return "start";
  } else if(params.cellAttrs[COL][HEADER]){
    return "end";
  } else {
    return "middle";
  }
};

CellEncoding.prototype.getCellTextStyle = function(params){
  return {
    "text-anchor": this.getCellTextAnchor(params),
    font: params.cellAttrs[COL][HEADER] || params.cellAttrs[ROW][HEADER] ? this.getFontString("header") : this.getFontString("cell"),
    fill: "black",
    stroke: "none"
  };
};

CellEncoding.prototype.getCellTextAttributes = function(params){
  return {
    x: this.getTextX(params.cellData,params.cellAttrs[COL][HEADER],params.cellAttrs[ROW][HEADER],params.width),
    y: this.getTextY(params.cellData,params.cellAttrs[COL][HEADER],params.cellAttrs[ROW][HEADER],params.height),
    transform: this.getTextTransform(params.cellData,params.width,params.height,params.cellAttrs[COL][HEADER],params.cellAttrs[ROW][HEADER],params.orientation),
    dy: ".35em"
  };
};

CellEncoding.prototype.getCircleAttributes = function(params){
//return {r: params.value * Math.sqrt(2)*params.graphicSize/2};
  var diameter = 2 * Math.sqrt(params.value / Math.PI);
  if (diameter > 1) {
    var t = (diameter - 1) / (2 / Math.sqrt(Math.PI) - 1);
    t = t * 0.5 + Math.pow(t, 6) * 0.5;
    diameter = t * (Math.sqrt(2) - 1) + 1;
  }

  return {r: diameter * params.graphicSize/2};
};

/*
 param value to ovverride the params.value value
 */
CellEncoding.prototype.getBarchartAttributes = function(params, value){
  var _value = value != undefined ? value : params.value;
  if(params.orientation == ENCODING_ORIENTATION_VERTICAL) return {
    x: -params.width/2,
    y: params.height/2 - _value * params.height,
    height: _value * params.height,
    width: params.width
  };
  else return{
    x: -params.width/2,
    y: -params.height/2,
    height:params.height,
    width: _value * params.width
  }
};

CellEncoding.prototype.getGrayScaleAttributes = function(params){
  return {
    x: -params.width/2,
    y: -params.height/2,
    width: params.width,
    height: params.height
  };
};

CellEncoding.prototype.getGrayScaleStyle = function(params){
  var c = (1 - params.value)*255;
  return {
    fill: d3.rgb(c, c, c),
    stroke: "none"
  };
};

CellEncoding.prototype.getMeanChartAttributes = function(params){
  return this.getBarchartAttributes(params);
};

CellEncoding.prototype.getMeanChartStyle = function(params){
  return {
    fill: params.value >= params.mean ? "black" : "white",
    stroke: params.value >= params.mean ? "none" : "black",
    "stroke-width": 1
  };
};

CellEncoding.prototype.getMeanChart2BgAttributes = function(params){
  return this.getBarchartAttributes(params);
};
CellEncoding.prototype.getMeanChart2FgAttributes = function(params){
  if(params.orientation == ENCODING_ORIENTATION_VERTICAL) return {
    x: -params.width/2,
    y: params.height/2 - Math.min(params.value,params.mean) * params.height,
    height: Math.min(params.value,params.mean) * params.height,
    width: params.width
  };
  else return{
    x: -params.width/2,
    y: -params.height/2,
    height:params.height,
    width: Math.min(params.value,params.mean) * params.width
  }
};

CellEncoding.prototype.getMeanChart2BgStyle = function(params){
  return {
    fill: "black",
    stroke: "none",
    "stroke-width": 0
  };
};
CellEncoding.prototype.getMeanChart2FgStyle = function(params){
  return {
    fill: "lightgray",
    stroke: "black",
    "stroke-width": 1
  };
};

CellEncoding.prototype.getHorizonHatchAttributes = function(params){
  return this.getBackgroundAttributes(params);
};

CellEncoding.prototype.getHorizonHatchStyle = function(params){
  return {
    fill: params.orientation == ENCODING_ORIENTATION_VERTICAL ? "url(#horizonHatchVertical)" : "url(#horizonHatchHorizontal)",
    stroke: "none"
  }
};

CellEncoding.prototype.getHorizonBarOrigAndSize = function(params){
  var l,orig,size;
  var refSize = params.orientation == ENCODING_ORIENTATION_VERTICAL ? params.height : params.width;
  if(params.orientation == ENCODING_ORIENTATION_VERTICAL){
    if(params.value < params.mean){
      l = params.mean == 0 ? 0 : ( params.value / params.mean ) * refSize;
      orig = -refSize/2 + l;
      size = refSize - l;
    }
    else{
      l = params.mean == 0 ? 0 : ( params.value - params.mean ) * refSize / ( 1 - params.mean );
      orig = refSize/2 - l;
      size = l;
    }
  }
  else{
    if(params.value < params.mean){
      l = params.mean == 0 ? 0 : ( params.value / params.mean ) * refSize;
      orig = -refSize/2;
      size = refSize - l;
    }
    else{
      l = params.mean == 0 ? 0 : ( params.value - params.mean ) * refSize / ( 1 - params.mean );
      orig = -refSize/2;
      size = l;
    }
  }

  return {orig: orig, size: size};
};

CellEncoding.prototype.getHorizonBarAttributes = function(params){
  var startAndHeight = this.getHorizonBarOrigAndSize(params);

  if(params.orientation == ENCODING_ORIENTATION_VERTICAL) {
    return {
      x: -params.width/2,
      y: startAndHeight.orig,
      height: startAndHeight.size,
      width: params.width
    }
  }
  else {
    return {
      x: startAndHeight.orig,
      y: -params.height/2,
      height: params.height,
      width: startAndHeight.size
    };
  }
};

CellEncoding.prototype.getHorizonBarStyle = function(params){
  return {
    fill: params.value >= params.mean ? "black" : "white",
    stroke: "none"
  };
};

CellEncoding.prototype.getBaselineAttributes = function(params){
  var diff = params.value - params.baseline;


  /*
   //if baseline in the center of the cell
   if(diff >= 0){
   if(params.orientation == ENCODING_ORIENTATION_VERTICAL) return {
   x: -params.width/2,
   y: - diff * params.height,
   height: diff * params.height,
   width: params.width
   };
   else return{
   x: 0,
   y: -params.height/2,
   height: params.height,
   width: diff * params.width
   }
   }
   else{
   if(params.orientation == ENCODING_ORIENTATION_VERTICAL) return {
   x: -params.width/2,
   y: 0,
   height: -diff * params.height,
   width: params.width
   };
   else return{
   x: diff * params.width,
   y: -params.height/2,
   height: params.height,
   width: -diff * params.width
   }
   }
   */

  //if baseline at the bottom of the cell
  return this.getBarchartAttributes(params, Math.abs(diff)*2);//TODO - only works if baseline is the center value


};

CellEncoding.prototype.getBaselineStyle = function(params){
  return {
    fill: params.value - params.baseline > 0 ? "#76A6D3" : "#C23E4F",
    stroke: "none"
  };
};

CellEncoding.prototype.getCILineAttributes = function(params){
  var strokeWidth = bertin.matrixParams.encodings.position.style["stroke-width"];
  if(params.orientation == ENCODING_ORIENTATION_VERTICAL) {
    var x = 0;
    return{
      x1: x,
      x2: x,
      y1: params.height/2 - strokeWidth/2 - params.ci_max * (params.height-strokeWidth),
      y2: params.height/2 - strokeWidth/2 - params.ci_min * (params.height-strokeWidth)
    }
  }
  else{
    var y = 0;
    return {
      x1: - params.width/2 + strokeWidth/2 + params.ci_max * (params.width-strokeWidth),
      x2: - params.width/2 + strokeWidth/2 + params.ci_min * (params.width-strokeWidth),
      y1: y,
      y2: y
    };
  }
};

CellEncoding.prototype.getCIEstimateAttributes = function(params){
  if(params.orientation == ENCODING_ORIENTATION_VERTICAL) {
    return{
      cx: 0,
      cy: params.height/2 - params.value * params.height
    }
  }
  else{
    return{
      cx: - params.width/2 + params.value * params.width,
      cy: 0
    }
  }
};

CellEncoding.prototype.getPositionAttributes = function(params){
  var strokeWidth = bertin.matrixParams.encodings.position.style["stroke-width"];
  if(params.orientation == ENCODING_ORIENTATION_VERTICAL) {
    var y = params.height/2 - strokeWidth/2 - params.value * (params.height-strokeWidth);
    return {
      x1: -params.width/2,
      x2: params.width/2,
      y1: y,
      y2: y
    };
  }
  else{
    var x = -params.width/2 + strokeWidth/2 + params.value * (params.width-strokeWidth);
    return{
      x1: x,
      x2: x,
      y1: -params.height/2,
      y2: params.height/2
    }
  }
};

CellEncoding.prototype.getTextX = function(cellData,isColHeader,isRowHeader,cellWidth){
  if(isRowHeader){
    return 0;
  } else if(isColHeader){
    return cellWidth/2;
  } else {
    return 0;
  }
};

CellEncoding.prototype.getTextY = function(cellData,isColHeader,isRowHeader,cellHeight){
  return 0;
};

CellEncoding.prototype.getTextTransform = function(cellData,cellWidth,cellHeight,isColHeader,isRowHeader,orientation){
  if(!isRowHeader){
    if(isColHeader) return "";
    return orientation == ENCODING_ORIENTATION_VERTICAL ? "" : "rotate(90) translate("+[0,0]+")";
  }
  return "rotate(-90) translate("+[-cellHeight/2,0]+")";
};



CellEncoding.prototype.updateCellEncoding = function(params){
  switch(params.encoding){
    case TEXT:
      params.cellObject.select("text.graphic").transition()
          .attr(this.getCellTextAttributes(params))
          .text(this.getCellText(params))
          .style(this.getCellTextStyle(params));
      break;

    case BARCHART:
      params.cellObject.select(".barchart").transition()
          .attr(this.getBarchartAttributes(params));
      break;

    case CIRCLE:
      params.cellObject.select(".circle").transition()
          .attr(this.getCircleAttributes(params));
      break;

    case GRAYSCALE:
      params.cellObject.select(".grayscale").transition()
          .attr(this.getGrayScaleAttributes(params))
          .style(this.getGrayScaleStyle(params));
      break;

    case MEANCHART:
      params.mean = params.cellData.row.scale.getStatistic(STAT_MEAN);
      params.cellObject.select(".meanchart").transition()
          .attr(this.getMeanChartAttributes(params))
          .style(this.getMeanChartStyle(params));
      break;

    case MEANCHART2:
      params.mean = params.cellData.row.scale.getStatistic(STAT_MEAN);
      params.cellObject.select("rect.meanchart2.bgbar").transition()
          .attr(this.getMeanChart2BgAttributes(params));
      params.cellObject.select("rect.meanchart2.fgbar").transition()
          .attr(this.getMeanChart2FgAttributes(params));
      break;

    case HORIZON:
      params.mean = params.cellData.row.scale.getStatistic(STAT_MEAN);
      params.cellObject.select("rect.horizon.hatch").transition()
          .attr(this.getHorizonHatchAttributes(params))
          .style(this.getHorizonHatchStyle(params));
      params.cellObject.select("rect.horizon.bar").transition()
          .attr(this.getHorizonBarAttributes(params))
          .style(this.getHorizonBarStyle(params));
      break;

    case POSITION:
      params.cellObject.select(".position").transition()
          .attr(this.getPositionAttributes(params));
      break;

    case BASELINE:
      params.baseline = params.cellData.row.scale.getNormalizedBaseline();
      params.cellObject.select(".baseline").transition()
          .attr(this.getBaselineAttributes(params))
          .style(this.getBaselineStyle(params));
      break;

    case CONF_INTERVAL:
      params.cellObject.select(".ci_bar").transition()
          .attr(this.getBarchartAttributes(params));
      params.cellObject.select(".ci_estimate_back").transition()
          .attr(this.getCIEstimateAttributes(params));
      params.cellObject.select(".ci_estimate_front").transition()
          .attr(this.getCIEstimateAttributes(params));
      if(params.cellData.ci_min != undefined && params.cellData.ci_max != undefined){
        params.cellObject.select(".ci_line").transition()
            .attr(this.getCILineAttributes(params));
      }
      break;

    default:
      console.error("invalid encoding",bertin.getFieldTitle(params.encoding));
  }
  if(params.encoding != TEXT){
    this.updateExtremum(params);
  }
};

CellEncoding.prototype.createBackground = function(params){
  params.cellObject.append("rect")
      .attr("class","background")
      .attr(this.getBackgroundAttributes(params))
      .style(this.getBackgroundStyle());
};

CellEncoding.prototype.updateExtremum = function(params){
  //bertin_params.matrixParams.encodings.extrema.
  var $this = this;

  if(params.extremumMin) update("min");
  else if(params.extremumMax) update("max");
  else {
    params.cellObject.selectAll(".extremum").remove();
  }

  function update(type){
    var extremumObject = $this.getExtremumObject(params);
    var extremum = params.cellObject.selectAll(".extremum."+type);
    if(extremum[0][0] != null){//if extremum already exist
      if(extremum[0][0].nodeName == extremumObject.type){//if same type
        extremum.attr(extremumObject.attr).style(extremumObject.style).moveToFront();
      }
      else{//if different type
        extremum.remove();
        createExtremum(type,extremumObject);
      }
    }
    else{//if min does not exist
      createExtremum(type,extremumObject);
    }
  }

  function createExtremum(type,obj){
    params.cellObject.append(obj.type)
        .attr("class", "graphic extremum "+type)
        .attr(obj.attr)
        .style(obj.style);
  }
};


CellEncoding.prototype.getExtremumObject = function(params){
  switch(params.encoding){
    case CIRCLE:
      if(params.extremumMin) return getExtremumLine("black");
      else if(params.extremumMax) return getExtremumCircleCenter("white");
      break;

    case BARCHART:
    case MEANCHART:
    case MEANCHART2:
    case HORIZON:
    case GRAYSCALE:
      if(params.extremumMin) return getExtremumCircleCenter("black");
      else if(params.extremumMax) return getExtremumCircleCenter("white");
      break;

    case POSITION:
      if(params.extremumMin) return getExtremumCircleSide("min","black");
      else if(params.extremumMax) return getExtremumCircleSide("max","black");
      break;

    case BASELINE:
      console.log("TODO - get extremum for baseline");//TODO
      break;

    case CONF_INTERVAL:
      console.log("TODO - get extremum for conf interval");//TODO
      break;

    default:
      console.error("invalid encoding",bertin.getFieldTitle(params.encoding));
      return null;
  }
  function getExtremumCircleCenter(type){
    return {
      type: "circle",
      attr: {
        cx: 0,
        cy: 0,
        r: bertin_params.matrixParams.encodings.extrema.circleRadius
      },
      style: {
        stroke: "none",
        fill: type
      }
    };
  }
  function getExtremumCircleSide(side, type){
    var cx,cy;
    if(side == "min"){
      cx = params.orientation == ENCODING_ORIENTATION_VERTICAL ? 0 : -params.width/2;
      cy = params.orientation == ENCODING_ORIENTATION_VERTICAL ? params.height/2 : 0;
    }
    else{
      cx = params.orientation == ENCODING_ORIENTATION_VERTICAL ? 0 : params.width/2;
      cy = params.orientation == ENCODING_ORIENTATION_VERTICAL ? -params.height/2 : 0
    }
    return {
      type: "circle",
      attr: {
        cx: cx,
        cy: cy,
        r: bertin_params.matrixParams.encodings.extrema.circleRadiusPosition
      },
      style: {
        stroke: "none",
        fill: type
      }
    }
  }
  function getExtremumLine(type){
    var x1, y1, x2, y2;
    if(params.orientation == ENCODING_ORIENTATION_VERTICAL) {
      x1 = -params.width/4;
      y1 = y2 = 0;
      x2 = params.width/4;
    }
    else {
      x1 = x2 = 0;
      y1 = -params.height/4;
      y2 = params.height/4;
    }

    return {
      type: "line",
      attr: {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
      },
      style: {
        "stroke-width": bertin_params.matrixParams.encodings.extrema.lineWidth,
        stroke: type
      }
    };
  }

};

CellEncoding.prototype.createCellEncoding = function(params){
  var $this = this;
  if(!params.header && params.encoding != TEXT && isNaN(params.value)){//if not a value and not a header then N/A
    params.cellObject.append("line")
        .attr("class", "graphic na left")
        .attr($this.getNALeftEncodingAttributes(params))
        .style($this.getNaEncodingStyle())
        .style("opacity", 0);
    params.cellObject.append("line")
        .attr("class", "graphic na right")
        .attr($this.getNARightEncodingAttributes(params))
        .style($this.getNaEncodingStyle())
        .style("opacity", 0);
  }
  else{//if encoding text OR cell is a header
    if(params.encoding == TEXT || params.header){
      //remove extrema
      params.cellObject.selectAll(".extremum").remove();
      params.cellObject.append("text")
          .text(this.getCellText(params))
          .attr("class", "graphic")
          .attr(this.getCellTextAttributes(params))
          .style(this.getCellTextStyle(params))
          .style("opacity",0);
    }

    //here we have encoded values with another encoding than TEXT, and no header
    else {
      switch(params.encoding){
        case CIRCLE:
          params.cellObject.append("circle")
              .attr("class", "graphic circle")
              .attr(this.getCircleAttributes(params))
              .style({stroke: "none", fill: "black", opacity: 0});
          break;

        case BARCHART:
          params.cellObject.append("rect")
              .attr("class", "graphic barchart")
              .attr(this.getBarchartAttributes(params))
              .style({stroke: "none", fill: "black", opacity: 0});
          break;

        case GRAYSCALE:
          params.cellObject.append("rect")
              .attr("class", "graphic grayscale")
              .attr(this.getGrayScaleAttributes(params))
              .style(this.getGrayScaleStyle(params))
              .style("opacity", 0);
          break;

        case MEANCHART:
          params.mean = params.cellData.row.scale.getStatistic(STAT_MEAN);
          params.cellObject.append("rect")
              .attr("class", "graphic meanchart")
              .attr(this.getMeanChartAttributes(params))
              .style(this.getMeanChartStyle(params))
              .style("opacity", 0);
          break;

        case MEANCHART2:
          params.mean = params.cellData.row.scale.getStatistic(STAT_MEAN);
          params.cellObject.append("rect")
              .attr("class", "graphic meanchart2 bgbar")
              .attr(this.getMeanChart2BgAttributes(params))
              .style(this.getMeanChart2BgStyle(params))
              .style("opacity", 0);
          params.cellObject.append("rect")
              .attr("class", "graphic meanchart2 fgbar")
              .attr(this.getMeanChart2FgAttributes(params))
              .style(this.getMeanChart2FgStyle(params))
              .style("opacity", 0);
          break;

        case HORIZON:
          params.mean = params.cellData.row.scale.getStatistic(STAT_MEAN);
          params.cellObject.append("rect")
              .attr("class", "graphic horizon hatch")
              .attr(this.getHorizonHatchAttributes(params))
              .style(this.getHorizonHatchStyle(params))
              .style("opacity", 0);
          params.cellObject.append("rect")
              .attr("class", "graphic horizon bar")
              .attr(this.getHorizonBarAttributes(params))
              .style(this.getHorizonBarStyle(params))
              .style("opacity", 0);
          break;

        case POSITION:
          params.cellObject.append("line")
              .attr("class", "graphic position")
              .attr(this.getPositionAttributes(params))
              .style(bertin.matrixParams.encodings.position.style);
          break;

        case BASELINE:
          //if no baseline specified, take the mean
          params.baseline = params.cellData.row.scale.getNormalizedBaseline();
          params.cellObject.append("rect")
              .attr("class", "graphic baseline")
              .attr(this.getBaselineAttributes(params))
              .style(this.getBaselineStyle(params))
              .style("opacity", 0);
          break;

        case CONF_INTERVAL:
          params.cellObject.append("rect")
              .attr("class", "graphic ci_bar")
              .attr(this.getBarchartAttributes(params))
              .style({stroke: "none", fill: "lightgray", opacity: 0});
          params.cellObject.append("circle")
              .attr("class", "graphic ci_estimate_back")
              .attr(this.getCIEstimateAttributes(params))
              .attr("r",bertin.matrixParams.encodings.ci.estimateBack.r)
              .style({stroke: "none", fill: "white", opacity: 0});
          params.cellObject.append("circle")
              .attr("class", "graphic ci_estimate_front")
              .attr(this.getCIEstimateAttributes(params))
              .attr("r",bertin.matrixParams.encodings.ci.estimateFront.r)
              .style({stroke: "none", fill: "black", opacity: 0});
          if(params.cellData.ci_min != undefined && params.cellData.ci_max != undefined){
            params.cellObject.append("line")
                .attr("class", "graphic ci_line")
                .attr(this.getCILineAttributes(params))
                .style(bertin.matrixParams.encodings.position.style);
          }
          break;

        default: console.error("invalid encoding",bertin.getFieldTitle(params.encoding));
      }

      //add the extremum encoding
      this.updateExtremum(params);
    }
  }
};

