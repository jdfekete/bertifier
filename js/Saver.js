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


function Saver(bertin){
  this.bertin = bertin;
  this.init();
}

Saver.prototype.init = function(){
  //to test
  //console.log(this.getUrl());
};

Saver.prototype.loadFromUrl = function() {

  var params = {};
  params.datasetId = Utils.getURLParameter("datasetId");

};

Saver.prototype.getUrl = function() {
  var params = this.getAllParams();
  var str = jQuery.param( params );
  //var str = JSON.stringify(params)
  return str;
};

Saver.prototype.getAllParams = function(){

  var params = {};
  params.datasetId = this.bertin.datasetId;

  return {
    p1: 0,
    p2: "test",
    p3: {
      p31: 0,
      p32: "test2",
      p34: [0,5,6,8]
    },
    p4: ["test",5],
    p5: [{id: 5, array: [0,5,9]},{id: "sqd", arrayObj: [{id2: "test"},{id2: 8},{id2: [4,5,6]}]}]
  }
};