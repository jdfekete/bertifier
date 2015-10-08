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


function ExportSVG(bertin, params){
  this.bertin = bertin;
  this.params = params;
  this.init();
}

const AUTO_SAVE = false;
const AUTO_SAVE_INTERVAL = 30000;

ExportSVG.prototype.init = function(){
  var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
  var $this = this;


  if(AUTO_SAVE){
    setInterval(function(){
      downloadSVG("Matrix_Settings")
    },AUTO_SAVE_INTERVAL);
  }


  this.svgExportArea = d3.select("body").append("div")
      .attr("id","svgExport")
      .style({
        left: (this.params.x+this.params.margin.left)+"px",
        top: (this.params.y+this.params.margin.top)+"px",
        width: (this.params.width-this.params.margin.right+5)+"px",
        height: (this.params.margin.top + 5 + this.params.margin.bottom + MENU_BUTTONS_SIZE)+"px",
        "background-color": $this.params.svgExportArea.fill,
        opacity: 0
      })
      .on({
        mouseenter: function(){$this.bertin.showTopMenu(true)},
        mouseleave: function(){$this.bertin.showTopMenu(false)}
      });
  this.svgExportArea.selectAll(".menuButton")
      .data([
        {
          type: "menu",
          action: "save",
          category: "Matrix",
          descr: "<span class='title'>Save: </span>Save the image into your Downloads directory in SVG format"
        },
        {
          type: "menu",
          action: "saveSet",
          category: "Matrix_Settings",
          descr: "<span class='title'>Save with commands: </span>Save the image and the commands configuration into your Downloads directory in SVG format"
        },
        {
          type: "menu",
          action: "print",
          category: "print",
          descr: "<span class='title'>Print: </span>Print the image using the browser's Print window"
        }
      ])
      .enter()
      .append("div")
      .attr("class","menuButton")
      .style("width", MENU_BUTTONS_SIZE+"px")
      .style("height", MENU_BUTTONS_SIZE+"px")
      .style("margin-top",5+"px")
      .style("margin-left",function(d,i){return (5+i*(5+MENU_BUTTONS_SIZE))+"px"})
      .style("font-size", "9px")
      .style("line-height", "1.4em")
      .on("mouseenter", function(d){
        $this.bertin.descriptionArea.showButtonDescription(d);
      })
      .on("mouseleave", function(d){
        $this.bertin.descriptionArea.hideDescription();
      })
      .on("click", function(d, i) {
        d3.event.preventDefault();
        switch(d.category){
          case "print":
            printMatrix();
            break;
          default:
            downloadSVG(d.category);
        }
      })
    //.text(function(d){return "Download "+ d.action})
      .append("img")
      .attr({
        src: function(d){return $this.bertin.getIcon(d.action)}
      })
      .style("margin-left", 2+"px")
      .style("margin-top", 2+"px")
      .style("width", (MENU_BUTTONS_SIZE-4)+"px")
      .style("height", (MENU_BUTTONS_SIZE-4)+"px");


  function printMatrix(){
    window.print();
  }

  function download(source,category) {
    var filename = "untitled";

    if (source.id) {
      filename = source.id;
    } else if (source.class) {
      filename = source.class;
    } else if (window.document.title) {
      filename = window.document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    }
    filename += "_"+category;

    var url = window.URL.createObjectURL(new Blob(source.source, { "type" : "text\/xml" }));


    var a = d3.select("body")
        .append('a')
        .attr("class", "svg-crowbar")
        .attr("download", filename + ".svg")
        .attr("href", url)
        .style("display", "none");

    a.node().click();

    setTimeout(function() {
      window.URL.revokeObjectURL(url);
    }, 10);
  }

  function getStyles(doc) {
    var styles = "",
        styleSheets = doc.styleSheets;

    if (styleSheets) {
      for (var i = 0; i < styleSheets.length; i++) {
        processStyleSheet(styleSheets[i]);
      }
    }

    function processStyleSheet(ss) {
      if (ss.cssRules) {
        for (var i = 0; i < ss.cssRules.length; i++) {
          var rule = ss.cssRules[i];
          if (rule.type === 3) {
            // Import Rule
            processStyleSheet(rule.styleSheet);
          } else {
            // hack for illustrator crashing on descendent selectors
            if (rule.selectorText) {
              if (rule.selectorText.indexOf(">") === -1) {
                styles += "\n" + rule.cssText;
              }
            }
          }
        }
      }
    }
    return styles;
  }

  function downloadSVG(category){
    var documents = [window.document],
        SVGSources = [];
    d3.selectAll("iframe").each(function() {
      if (this.contentDocument) {
        documents.push(this.contentDocument);
      }
    });
    if(documents.length != 1) console.error("must be only one doc !");
    documents.forEach(function(doc) {
      var styles = getStyles(doc);
      var newSources = getSources(doc, styles, category);
      // because of prototype on NYT pages
      for (var i = 0; i < newSources.length; i++) {
        SVGSources.push(newSources[i]);
      }
    });
    if (SVGSources.length > 1) {
      console.error("only one svg");
    } else if (SVGSources.length > 0) {
      download(SVGSources[0],category);
    } else {
      console.error("no svg found");
    }
  }

  function getSources(doc, styles, category) {
    var svgInfo = [],
        svgs = d3.select(doc).selectAll("svg");

    if(svgs.length != 1) console.error("must have only one svg !");

    styles = (styles === undefined) ? "" : styles;

    svgs.each(function () {
      var svg = d3.select(this);

      svg.attr("version", "1.1")
          .select("defs")
          .append("style")
          .attr("type", "text/css");

      var svgNode = svg.node();

      var svgClone = svgNode.cloneNode(true);

      if(category == "Matrix"){
        var toRemove = svgClone.getElementsByClassName('settings-group')[0];
        toRemove.parentNode.removeChild(toRemove);
      }
      else{
        var toShow = svgClone.getElementsByClassName('settings-group')[0];
        //toShow.setAttribute("opacity",1.0);
        d3.select(toShow).style("opacity",1)
        console.log(d3.select(toShow))
      }

      // removing attributes so they aren't doubled up
      svgClone.removeAttribute("xmlns");
      svgClone.removeAttribute("xlink");

      // These are needed for the svg
      if (!svgClone.hasAttributeNS(d3.ns.prefix.xmlns, "xmlns")) {
        svgClone.setAttributeNS(d3.ns.prefix.xmlns, "xmlns", d3.ns.prefix.svg);
      }

      if (!svgClone.hasAttributeNS(d3.ns.prefix.xmlns, "xmlns:xlink")) {
        svgClone.setAttributeNS(d3.ns.prefix.xmlns, "xmlns:xlink", d3.ns.prefix.xlink);
      }

      var source = (new XMLSerializer()).serializeToString(svgClone).replace('</style>', '<![CDATA[' + styles + ']]></style>');
      var rect = svg.node().getBoundingClientRect();
      svgInfo.push({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        class: svg.attr("class"),
        id: svg.attr("id"),
        childElementCount: svg.node().childElementCount,
        source: [doctype + source]
      });
    });
    return svgInfo;
  }

};