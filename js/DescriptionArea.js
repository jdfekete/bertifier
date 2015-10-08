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

function DescriptionArea(bertin, params){
  this.params = params;
  this.bertin = bertin;
  this.init();
}

DescriptionArea.prototype.init = function(){
  this.descrArea = d3.select("body")
      .append("div")
      .attr("class","descriptionArea")
      .style({
        left: (this.params.x+this.params.margin.left)+"px",
        top: (this.params.y+this.params.margin.top)+"px",
        width: this.params.width+"px",
        height: this.params.height+"px"
      });
  if(DESCRIPTION_SHOW_ICONS) this.descrIcon = this.descrArea.append("span");
  this.descrText = this.descrArea.append("span");
};

DescriptionArea.prototype.showButtonDescription = function(but){
  this.descrText.html(but.descr);
  if(DESCRIPTION_SHOW_ICONS) this.descrIcon.html(this.getIconHtml({type: but.type, action: but.action}));
};

DescriptionArea.prototype.showCommandDescription = function(command, action){
  if(command.group && action){
    this.descrText.html(this.bertin.commands.getCommandDescription(action, command.target));
    if(DESCRIPTION_SHOW_ICONS) this.descrIcon.html(this.getIconHtml({type: "subcommand", command: command, action: action}));
  }
  else{
    this.descrText.html(this.bertin.commands.getCommandDescription(command.action, command.target));
    if(DESCRIPTION_SHOW_ICONS) this.descrIcon.html(this.getIconHtml({type: "command", command: command}));
  }
};

DescriptionArea.prototype.getIconHtml = function(params){
  var iconName;
  switch(params.type){
    case "command":
      iconName = this.bertin.commands.getCommandHeaderIcon(params.command,"off");
      break;
    case "subcommand":
      if(RANGE_SLIDER_COMMANDS.indexOf(params.action) != -1) iconName = this.bertin.commands.getCommandSubHeaderIcon({commandData: params.command, action: params.action},"off","max");
      else iconName = this.bertin.commands.getCommandSubHeaderIcon({commandData: params.command, action: params.action},"off");
      break;
    case "menu":
        iconName = this.bertin.getIcon(params.action);
      break;
    case "annotation":
      iconName = this.bertin.getIcon("annotation_"+params.action);
      break;
  }
  return "<img src="+iconName+" style='width: 16px; height: 16px; margin-right: 5px; margin-top: 2px;'></img>";
};

DescriptionArea.prototype.hideDescription = function(){
  if(DESCRIPTION_SHOW_ICONS) this.descrIcon.html("");
  this.descrText.html("");
};

DescriptionArea.prototype.setWidth = function(w){
  this.descrArea.style("width",w+"px");
};