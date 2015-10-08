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

import {bertin_params} from './js/Settings.js';
import {Bertin} from './js/Bertin.js';

 /*
   init function starting when the document is ready
   */
  $(document).ready(function(){
    init();
  });

  var bertin;

  function createErrorPage(errorMess){
    d3.select("body").append("div")
        .style("text-align","center")
        .html(
            "Error: "+errorMess+"<br><br>" +
                "<a href='./index.html'>Go back to select a dataset</a>"
        );
  };

  function init(){
    //GS
    if(location.search.indexOf("dataset=")>=0){
      bertin_params.load = (location.search.indexOf("load")>=0);
      bertin_params.datasetId = getDatasetId();
      bertin_params.datasetVersion = getDatasetVersion();
    }

    //CSV
    else if(location.search.indexOf("csv=") != -1){
      bertin_params.load = (location.search.indexOf("load")>=0);
      bertin_params.csv = true;
    }
    else createErrorPage("No dataset provided.");

    showLoadingPage();
    bertin = new Bertin(bertin_params);

  }

  function showLoadingPage(){
    var loading = d3.select("body").append("div").attr("id","loading");
    loading.append("p").html("Loading...");
    loading.append("img")
        .attr("src", "./img/loading/loading12.png")
        .style("width","64px")
        .style("height","64px");
  }

 
  function getDatasetId(){
    var dataUrl = location.search.slice(location.search.indexOf("dataset=")+"dataset=".length);
    if (dataUrl.indexOf("&")>0){
      dataUrl = dataUrl.slice(0, dataUrl.indexOf("&"));
    }
    return dataUrl;
  }

  function getDatasetVersion(){
    var dataVersion = location.search.slice(location.search.indexOf("gs_v=")+"gs_v=".length);
    if (dataVersion.indexOf("&")>0){
      dataVersion = dataVersion.slice(0, dataVersion.indexOf("&"));
    }
    return dataVersion;
  }

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-50004311-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
