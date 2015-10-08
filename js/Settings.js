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


//debug constants
const COMMANDS_LAYER_ALWAYS_VISIBLE = false;

const SHOW_BUG_BUTTONS = false;
var RESIZE_ROWCOL_BUG = SHOW_BUG_BUTTONS;


const DRAG_LOCK_THRESHOLD = 5;

var setting_index = 0;
const COL = setting_index++,
    ROW = setting_index++,
    BETWEEN = setting_index++,

    HEADER = setting_index++,
    HIDDEN = setting_index++,
    NEGATIVE = setting_index++,
    INVERT = setting_index++,
    ENCODING = setting_index++,
    SCALE = setting_index++,
    SCALE_RANGE = setting_index++,
    SCALE_NORMALIZE = setting_index++,
    SCALE_CONTRAST = setting_index++,
    SCALE_DISCRETIZE = setting_index++,
    SCALE_CUSTOM_RANGE = setting_index++,
    SCALE_GLOBAL = setting_index++,
    HIGHLIGHT = setting_index++,

    REORDER = setting_index++,

    GLUE = setting_index++,
    SEPARATOR = setting_index++,
    MISC = setting_index++,
    SEPARATOR_MARGIN = setting_index++,
    SEPARATOR_SIZE = setting_index++,
    SEPARATOR_POSITION = setting_index++,

    TEXT = setting_index++,
    GRAYSCALE = setting_index++,
    BARCHART = setting_index++,
    CIRCLE = setting_index++,
    HORIZON = setting_index++,
    MEANCHART = setting_index++,
    MEANCHART2 = setting_index++,
    BASELINE = setting_index++,
    CONF_INTERVAL = setting_index++,
    POSITION = setting_index++,

    ENCODING_ORIENTATION = setting_index++,
    ENCODING_ORIENTATION_VERTICAL = setting_index++,
    ENCODING_ORIENTATION_HORIZONTAL = setting_index++,

    ENCODING_SCALES = setting_index++,
    SIZE = setting_index++,
    NORMALIZED_SIZE = setting_index++,
    POS_ABS = setting_index++,
    INDEX = setting_index++;

const ENCODING_TYPES = [TEXT,GRAYSCALE,CIRCLE,POSITION,BARCHART,MEANCHART,MEANCHART2,HORIZON,BASELINE,CONF_INTERVAL];
const ENCODING_ORIENTATION_TYPES = [ENCODING_ORIENTATION_VERTICAL,ENCODING_ORIENTATION_HORIZONTAL];

const MISC_COMMANDS = [HEADER,REORDER,INVERT,NEGATIVE,NORMALIZED_SIZE];
const ENCODING_COMMANDS = ENCODING_TYPES.concat(ENCODING_ORIENTATION_TYPES);
const SEPARATOR_COMMANDS = [SEPARATOR_MARGIN,SEPARATOR_SIZE];
const SCALE_COMMANDS = [SCALE_CUSTOM_RANGE,SCALE_RANGE,SCALE_CONTRAST,SCALE_DISCRETIZE/*,SCALE_GLOBAL*/];/*SCALE_CUSTOM_RANGE_BASELINE,*/

const SIMPLE_SLIDER_COMMANDS = [SEPARATOR_MARGIN,SEPARATOR_SIZE,SCALE_CONTRAST,SCALE_DISCRETIZE,NORMALIZED_SIZE];
const RANGE_SLIDER_COMMANDS = [SCALE_RANGE];

const SHOW_SUB_ICON_COMMANDS = SIMPLE_SLIDER_COMMANDS.concat(RANGE_SLIDER_COMMANDS);
const EXCEPT_EXTREMITIES_COMMANDS = [GLUE];

const DESCRIPTION_SHOW_ICONS = true;

const ON_TARGET = 0,
    BETWEEN_TARGETS = 1;

const ON_BUTTONS = 0,
    ON_MATRIX = 1;

const UPDATE_DURATION = 0,
    UPDATE_TRANSLATE = 1,
    CHANGE_ENCODING = 2,
    TRANSLATE_ENCODING = 3,
    UPDATE_SEPARATOR = 4,
    UPDATE_GLUE = 5,
    UPDATE_ENCODING = 6,
    FORCE_ALL_CELLS = 7,
    UPDATE_ROWCOL_SIZE_PREVIEW = 8;

const HORIZONTAL = 0,
    VERTICAL = 1;

const STAT_MEAN = 0;

const DEFAULT_ENCODING = TEXT;
const DEFAULT_ENCODING_ORIENTATION = ENCODING_ORIENTATION_VERTICAL;

const WIDGETS_HIGHLIGHT_ELEMENT = ENCODING_COMMANDS.concat(MISC_COMMANDS).concat(SEPARATOR_COMMANDS).concat(SCALE_COMMANDS).concat([GLUE]);
const WIDGETS_HIGHLIGHT_LEFTRIGHT = [];//EXCEPT_EXTREMITIES_COMMANDS;


const SCALE_CUSTOM_RANGE_MIN = "_MIN_";
const SCALE_CUSTOM_RANGE_MAX = "_MAX_";
const SCALE_CUSTOM_RANGE_BASELINE = "_BASELINE_";

const FIELDS = [];
FIELDS[HEADER] = "header";
FIELDS[HIDDEN] = "hidden";
FIELDS[NEGATIVE] = "negative";
FIELDS[ENCODING] = "encoding";
FIELDS[ENCODING_SCALES] = "scales";
FIELDS[SIZE] = "size";
FIELDS[NORMALIZED_SIZE] = "normalizedSize";
FIELDS[POS_ABS] = "posAbs";
FIELDS[INDEX] = "index";
FIELDS[SEPARATOR] = "separator";
FIELDS[SEPARATOR_MARGIN] = "SeparatorWhite";
FIELDS[SEPARATOR_SIZE] = "SeparatorBlack";
FIELDS[GLUE] = "glue";
FIELDS[ROW] = "row";
FIELDS[COL] = "col";
FIELDS[SCALE] = "scale";
FIELDS[REORDER] = "reorder";
FIELDS[INVERT] = "flip";
FIELDS[HIGHLIGHT] = "highlight";
FIELDS[SCALE_GLOBAL] = "scaleGlobal";
FIELDS[SCALE_RANGE] = "scaleRange";
FIELDS[SCALE_NORMALIZE] = "scaleNormalize";
FIELDS[SCALE_CONTRAST] = "scaleContrast";
FIELDS[SCALE_DISCRETIZE] = "scaleDiscretize";
FIELDS[SCALE_CUSTOM_RANGE] = "scaleCustomRange";
FIELDS[SCALE_CUSTOM_RANGE_BASELINE] = "scaleCustomRangeBaseline";
FIELDS[MISC] = "Misc";
FIELDS[TEXT] = "text";
FIELDS[GRAYSCALE] = "grayscale";
FIELDS[BARCHART] = "barchart";
FIELDS[CIRCLE] = "circle";
FIELDS[HORIZON] = "horizon";
FIELDS[MEANCHART] = "meanChart";
FIELDS[MEANCHART2] = "meanChart2";
FIELDS[POSITION] = "position";
FIELDS[BASELINE] = "baseline";
FIELDS[CONF_INTERVAL] = "confidenceInterval";
FIELDS[ENCODING_ORIENTATION] = "encodingOrientation";
FIELDS[ENCODING_ORIENTATION_VERTICAL] = "encodingOrientationVertical";
FIELDS[ENCODING_ORIENTATION_HORIZONTAL] = "encodingOrientationHorizontal";

const CELL_BACKGROUND_COLOR = {
  default: "white",
  drag: "#D6E9FF"
};

const MENU_HEIGHT = 0;
const DESCRIPTION_AREA_HEIGHT = 50;
const EXPORTSVG_WIDTH = 100;
const ANNOTATOR_WIDTH = 300;
const MENU_BUTTONS_SIZE = 20;

const SLIDER_SIZES = [];
SLIDER_SIZES[SCALE_RANGE] = 70;
SLIDER_SIZES[SCALE_CONTRAST] = 50;
SLIDER_SIZES[SCALE_DISCRETIZE] = 60;
SLIDER_SIZES[SEPARATOR_MARGIN] = SLIDER_SIZES[SEPARATOR_SIZE] = 50;
SLIDER_SIZES[NORMALIZED_SIZE] = 60;

const SLIDER_DISCRETE = [SCALE_DISCRETIZE,SEPARATOR_MARGIN,SEPARATOR_SIZE,NORMALIZED_SIZE];

const MAX_DISCRETIZE_VALUE = 10;

const ENCODING_EXTRA_SPACE_COMMANDS = [ENCODING_ORIENTATION_VERTICAL];
const ENCODING_EXTRA_SPACE = 12;

const SLIDER_MIN = 0,
    SLIDER_MAX = 1,
    SLIDER_VALUE = 2;

const SCALE_IN = 0,
    SCALE_OUT = 1;

const TICK_OFF = 0,
    TICK_ON = 1;

const SEP_DEFAULT_WIDTH = [];
SEP_DEFAULT_WIDTH[SEPARATOR_SIZE] = .5;
SEP_DEFAULT_WIDTH[SEPARATOR_MARGIN] = 0;

const DISCRETE_SLIDERS_VALUES = [];
DISCRETE_SLIDERS_VALUES[SEPARATOR_SIZE] = DISCRETE_SLIDERS_VALUES[SEPARATOR_MARGIN] = [0,.5,1,2,4,8,16];
DISCRETE_SLIDERS_VALUES[SCALE_DISCRETIZE] = [2,3,4,5,6,7,8,9,10];
DISCRETE_SLIDERS_VALUES[NORMALIZED_SIZE] = [15,20,40,60,80,100,150,200,300,500];

const SLIDERS_BAR_WIDTH = 7;

const SLIDERS_BAR_EXTRA_SIZE = 4;

const ANNOTATION_COMMANDS = [
  {
    action: "create",
    descr: "<span class='title'>Annotation: </span>Create or edit an annotation",
    hotspot: "5 9"//"5 -17"//x y positions on the 10*18 icon
  },
  {
    action: "remove",
    descr: "<span class='title'>Annotation: </span>Delete an annotation",
    hotspot: "10 10"//x y positions on the 20*20 icon
  },
  {
    action: "move",
    descr: "<span class='title'>Annotation: </span>Move an annotation by dragging it",
    hotspot: ""//x y positions on the 20*20 icon. no need for move
  },
  {
    action: "light",
    descr: "<span class='title'>Annotation: </span>Set the font light",
    hotspot: "10 10"//x y positions on the 20*20 icon
  },
  {
    action: "regular",
    descr: "<span class='title'>Annotation: </span>Set the font regular",
    hotspot: "10 10"//x y positions on the 20*20 icon
  },
  {
    action: "bold",
    descr: "<span class='title'>Annotation: </span>Set the font bold",
    hotspot: "10 10"//x y positions on the 20*20 icon
  },
  {
    action: "italic",
    descr: "<span class='title'>Annotation: </span>Set the font italic",
    hotspot: "10 10"//x y positions on the 20*20 icon
  },
  {
    action: "larger",
    descr: "<span class='title'>Annotation: </span>Increase the size of the font",
    hotspot: "10 10"//x y positions on the 20*20 icon
  },
  {
    action: "smaller",
    descr: "<span class='title'>Annotation: </span>Reduce the size of the font",
    hotspot: "10 10"//x y positions on the 20*20 icon
  },
  {
    action: "rotate_clockwise",
    descr: "<span class='title'>Annotation: </span>Rotate the text clockwise",
    hotspot: "10 10"//x y positions on the 20*20 icon
  },
  {
    action: "rotate_counterclockwise",
    descr: "<span class='title'>Annotation: </span>Rotate the text counterclockwise",
    hotspot: "10 10"//x y positions on the 20*20 icon
  }
];
ANNOTATION_COMMANDS.forEach(function(annotation){annotation.type = "annotation"});


const bertin_params = {
  width: 1024,
  height: 650,
  x: 0,
  y: 0,

  /*--------------------------------------------------
   -----------------Matrix Parameters------------------
   --------------------------------------------------*/
  matrixParams: {
    x: 0,
    y: MENU_HEIGHT + DESCRIPTION_AREA_HEIGHT + 10,

    default_stroke_width:.5,
    row_standard_size: 20,

    rowCol_min_size: 15,
    rowCol_max_size: 500,

    encodings: {
      extrema: {
        circleRadius: 2,
        circleRadiusPosition: 4,
        lineWidth: 2
      },
      position: {
       style: {
         "stroke-width": 2,
         stroke: "black"
       }
      },
      ci: {
        estimateFront: {
          r: 4
        },
        estimateBack: {
          r: 6
        }
      }
    },

    separator: {
      width0: 2,
      width1: 10,
      min_width: 0,
      max_width: 20
    },

    negative: {
      size: 10
    },

    glue: {
      strokeWidth: {
        onButtons: 2,
        onMatrix: 4
      }
    },

    dragHighlight: {
      opacityOn: .08,
      opacityOff: 0,
      fill: d3.rgb(0,100,255),
      stroke: "none",
      strokeWidth: 0
    },

    /*---------------Widgets----------------*/
    settings: {
      buttons: {
        size: 12,
        margin: 5
      },
      labelsStyle: {
        "font-size": "14px",
        "text-anchor": "start",
        fill: d3.rgb(127,127,127),
        stroke: "none"
      },
      minBackgroundSize: 10,
      groupSeparator: {
        opacity: {
          black:.25,
          white:.4
        },
        width:1
      },
      dragLayer: {
        fill: d3.rgb(245,245,245)
      },
      widgets: {
        size: SLIDER_SIZES,
        margin: 5,
        height: 10,
        internalMargin: 5,
        minDiff:.15
      },
      sliders: {
        axisStyle: {
          stroke: d3.rgb(180,180,180),
          "stroke-width":1
        },
        /*
        barStyle: {
          stroke: d3.rgb(138,166,206),
          "stroke-width": 5
        },
        */
        sliderBar: {
          rx: SLIDERS_BAR_WIDTH/2,
          ry: SLIDERS_BAR_WIDTH/2,
          attrs: {
            y: -SLIDERS_BAR_WIDTH/2,
            height: SLIDERS_BAR_WIDTH
          },
          style: {
            fill: d3.rgb(120,160,220),
            stroke: "none"
          }
        },
        snapTicks: {
          attrsOn: {
            x: -1,
            y: -SLIDERS_BAR_WIDTH/2,
            width: 2,
            height: SLIDERS_BAR_WIDTH
          },
          attrsOff: {
            x: -1.5,
            y: -1.5,
            width: 3,
            height: 3
          },
          styleOn: {
            fill: "white",
            stroke: "none"
          },
          styleOff: {
            fill: d3.rgb(200,200,200),
            stroke: "none"
          }
          /* OLD VERSION - for circles
          attrs: {
            r: 1.5
          },
          styleOn: {
            fill: "white",
            stroke: "none"
          },
          styleOff: {
            fill: d3.rgb(138,166,206),
            stroke: "none"
          }
          */
        }
      },
      dimensionsInit: {
        top: 55,
        left: 100,
        right: 200,
        bottom: 200
      },
      offsetMargin: {
        left: 50,
        top: 20,
        right: 20,
        bottom: 20
      },
      margins: {//the margins between the matrix and the settings
        top: 10,
        left: 10,
        right: 10,
        bottom: 10
      },
      highlight: {
        opacityOn: .08,
        opacityOff: 0,
        opacityLabel:.2,
        fill: d3.rgb(0,100,255),
        stroke: "none",
        strokeWidth: 0,
        minSize: 4
      },
      sizePreview: {
        stroke: d3.rgb(120,160,220),
        "stroke-width": 1,
        fill: "none"
      },
      crossing: {
        lineStyle: {
          stroke: d3.rgb(120,160,220),
          "stroke-width":4,
          "pointer-events": "none"
        }
      }
    },

    /*---------------Transitions----------------*/
    transitions: {
      order: {
        duration: 150
      },
      encoding: {
        duration: 200
      },
      updateEncoding: {
        duration: 10
      },
      layout: {
        duration: 200
      },
      crossingSettings: {
        stylizeButtons: {
          duration: 100
        },
        fadeDragLayer: {
          show: {
            duration: 300,
            delay: 0
          },
          hide: {
            duration: 1500,
            delay: 200
          }
        },
        separator: {
          duration: 200
        },
        glue: {
          create: 100,
          animate: 300
        },
        negative: {
          create: 100,
          animate: 300
        },
        expandCommand: {
          duration: 350
        },
        highlight: {
          duration: 100
        }
      }
    }
  },

  /*--------------------------------------------------
   ------------------Menu Parameters------------------
   --------------------------------------------------*/
  menuParams:{
    x: 0,
    y: 0,
    height: MENU_HEIGHT,
    margin: {
      top: 5,
      bottom: 5,
      left: 5,
      right: 5
    },
    defineScaleParams: {
      width: 700,
      scaleType: {
        width: 65
      },
      encodingType: {
        width: 50
      },
      dataPanel: {
        width: 700 - 65 - 50
      }
    },
    historyParams: {
      x: 0,
      y: 0,
      width: 800
    },
    transitions: {
      changeScaleType: {
        duration: 300
      }
    }
  },

  /*--------------------------------------------------
   ------------Description Area Parameters------------
   --------------------------------------------------*/
  descriptionAreaParams:{
    height: DESCRIPTION_AREA_HEIGHT,
    x: EXPORTSVG_WIDTH+ANNOTATOR_WIDTH,
    y: 0,
    margin: {
      top: 2,
      bottom: 2,
      left: 2,
      right: 2
    }
  },

  exportSVGParams: {
    x: 0,
    y: 0,
    margin: {
      top: 2,
      bottom: 2,
      left: 2,
      right: 20
    },
    width: EXPORTSVG_WIDTH,
    height: DESCRIPTION_AREA_HEIGHT,
    svgExportArea: {
      fill: d3.rgb(245,245,245),
      show: {
        duration: 300,
        delay: 0
      },
      hide: {
        duration: 1500,
        delay: 200
      }
    }
  },

  annotatorParams: {
    x: EXPORTSVG_WIDTH,
    y: 0,
    width: ANNOTATOR_WIDTH,
    height: DESCRIPTION_AREA_HEIGHT,
    margin: {
      top: 2,
      bottom: 2,
      left: 2,
      right: 20
    },
    hoverStyle: {
      border: "1px solid lightgray",
      "border-radius": "5px",
      "background-color": d3.rgb(245,245,245)
    },
    activeStyle: {
      border: "1px solid lightgray",
      "border-radius": "5px",
      "background-color": "#ADCEFF"
    },
    unactiveStyle: {
      border: "none",
      "background-color": d3.rgb(245,245,245)
    },
    hoverAnnotation: {
      opacityOn: .08,
      opacityOff: 0,
      fill: d3.rgb(0,100,255),
      stroke: "none",
      strokeWidth: 0
    },
    annotationArea: {
      fill: d3.rgb(245,245,245),
      show: {
        duration: 300,
        delay: 0
      },
      hide: {
        duration: 1500,
        delay: 200
      }
    }
  }
};


const KEY_CODES_MAP = [];
KEY_CODES_MAP[32] = " ";
KEY_CODES_MAP[48] = "0";
KEY_CODES_MAP[49] = "1";
KEY_CODES_MAP[50] = "2";
KEY_CODES_MAP[51] = "3";
KEY_CODES_MAP[52] = "4";
KEY_CODES_MAP[53] = "5";
KEY_CODES_MAP[54] = "6";
KEY_CODES_MAP[55] = "7";
KEY_CODES_MAP[56] = "8";
KEY_CODES_MAP[57] = "9";
KEY_CODES_MAP[65] = "a";
KEY_CODES_MAP[66] = "b";
KEY_CODES_MAP[67] = "c";
KEY_CODES_MAP[68] = "d";
KEY_CODES_MAP[69] = "e";
KEY_CODES_MAP[70] = "f";
KEY_CODES_MAP[71] = "g";
KEY_CODES_MAP[72] = "h";
KEY_CODES_MAP[73] = "i";
KEY_CODES_MAP[74] = "j";
KEY_CODES_MAP[75] = "k";
KEY_CODES_MAP[76] = "l";
KEY_CODES_MAP[77] = "m";
KEY_CODES_MAP[78] = "n";
KEY_CODES_MAP[79] = "o";
KEY_CODES_MAP[80] = "p";
KEY_CODES_MAP[81] = "q";
KEY_CODES_MAP[82] = "r";
KEY_CODES_MAP[83] = "s";
KEY_CODES_MAP[84] = "t";
KEY_CODES_MAP[85] = "u";
KEY_CODES_MAP[86] = "v";
KEY_CODES_MAP[87] = "w";
KEY_CODES_MAP[88] = "x";
KEY_CODES_MAP[89] = "y";
KEY_CODES_MAP[90] = "z";
KEY_CODES_MAP[8] = "backspace";
KEY_CODES_MAP[9] = "tab";
KEY_CODES_MAP[13] = "enter";
KEY_CODES_MAP[16] = "shift";
KEY_CODES_MAP[17] = "ctrl";
KEY_CODES_MAP[18] = "alt";
KEY_CODES_MAP[19] = "pause/break";
KEY_CODES_MAP[20] = "caps lock";
KEY_CODES_MAP[27] = "escape";
KEY_CODES_MAP[33] = "page up";
KEY_CODES_MAP[34] = "page down";
KEY_CODES_MAP[35] = "end";
KEY_CODES_MAP[36] = "home";
KEY_CODES_MAP[37] = "left arrow";
KEY_CODES_MAP[38] = "up arrow";
KEY_CODES_MAP[39] = "right arrow";
KEY_CODES_MAP[40] = "down arrow";
KEY_CODES_MAP[45] = "insert";
KEY_CODES_MAP[46] = "delete";
KEY_CODES_MAP[91] = "left window key";
KEY_CODES_MAP[92] = "right window key";
KEY_CODES_MAP[93] = "select key";
KEY_CODES_MAP[96] = "0";
KEY_CODES_MAP[97] = "1";
KEY_CODES_MAP[98] = "2";
KEY_CODES_MAP[99] = "3";
KEY_CODES_MAP[100] = "4";
KEY_CODES_MAP[101] = "5";
KEY_CODES_MAP[102] = "6";
KEY_CODES_MAP[103] = "7";
KEY_CODES_MAP[104] = "8";
KEY_CODES_MAP[105] = "9";
KEY_CODES_MAP[106] = "*";
KEY_CODES_MAP[107] = "+";
KEY_CODES_MAP[109] = "-";
KEY_CODES_MAP[110] = ".";
KEY_CODES_MAP[111] = "/";
KEY_CODES_MAP[112] = "f1";
KEY_CODES_MAP[113] = "f2";
KEY_CODES_MAP[114] = "f3";
KEY_CODES_MAP[115] = "f4";
KEY_CODES_MAP[116] = "f5";
KEY_CODES_MAP[117] = "f6";
KEY_CODES_MAP[118] = "f7";
KEY_CODES_MAP[119] = "f8";
KEY_CODES_MAP[120] = "f9";
KEY_CODES_MAP[121] = "f10";
KEY_CODES_MAP[122] = "f11";
KEY_CODES_MAP[123] = "f12";
KEY_CODES_MAP[144] = "num lock";
KEY_CODES_MAP[145] = "scroll lock";
KEY_CODES_MAP[186] = ";";
KEY_CODES_MAP[187] = "=";
KEY_CODES_MAP[188] = ",";
KEY_CODES_MAP[189] = "-";
KEY_CODES_MAP[190] = ".";
KEY_CODES_MAP[191] = "/";
KEY_CODES_MAP[192] = "`";
KEY_CODES_MAP[219] = "[";
KEY_CODES_MAP[220] = "\\";
KEY_CODES_MAP[221] = "]";
KEY_CODES_MAP[222] = "'";

const KEY_CODES_INPUT_TEXT = [32,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,96,97,98,99,100,101,102,103,104,105,106,107,109,110,111,186,187,188,189,190,191,192,219,220,221,222];


const IMAGE_BASE64 = {};
IMAGE_BASE64.commandHeaderexpandoff = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAR1QAAEdUBiJT0XwAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAAqklEQVRYR+2RQQrDIBQF8z24K68jbgTPlkKxMfS5ioU+UhLpGxgQxc+gy0a9uUsNIdRSym7Oua+vtDX1wLZxN1rTPIHtW1neQ4aynPaCCBnJokDIokDIokDIokDIokDIMgzE4KsECmQFCmQFCmQF8wZ+CwaPZFEgZFEgZFEgZFEgZFEgZPmfwF8xV6D3vqaULjfG2NetaQ80s9U59zhyO3se7X/yzDtmtr4AatlYVKm7z9sAAAAASUVORK5CYII=";
IMAGE_BASE64.commandHeaderexpandon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEdYAABHWASUt1TIAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAJVJREFUWEft0UEKgCAUhOGeB3fldcSN4NkKwnqRrqqFE6gwPwyIEXzUcpYH35KdczmldC3GWM89p6YK1IvRUtM8QP2tozXXFySwIQLRCEQjEI1AtFfgfdltJQJbVyKwdSUCW1eaFzhKBKIRiEYgGoFoBKIRiDYX0FqbQwjd572vZzVdQBFZjTHb085n+9P91/58R0TWA+O2ljKbB8zlAAAAAElFTkSuQmCC";
IMAGE_BASE64.commandHeaderGroup = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAScgAAEnIBXmVb4wAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAACFElEQVRYR+2XIZACMQxFkUgkEonEYc9hcVgcEotEIZFIJBKJPIlEIpFIJPbuDfd3pku23VBYd0/dXJJmmya/pfWPg3a7/RXQ6XRkaAjyTafT4/H4Yzifz/P5vNvtyvWDkPJ+vytPnNVqxfcp5k2o5OFw0MIO2P1gMFBwNmQ9nU5a0s3tdnsrd17WP97KvdvttIzher1+P6Cw+pfhcrnknPdkMtECZciESU4PhsNhrAk2m42cnFBk9qTogPV6HdvEbDaTU5nXCs5QKi5gu93KHIGRk2vAfr+XuRb2ZLdLhT0HVtkWXmEZj8eKCOAgZU5CDqszqIrMaegIRRQgk7I1ip3dpzZuBPpZ2QL4p8zNQfcrWwE6IFujjEYjJSxAnmRrFDuLteP7GawAJRLLw0G9dtohTkiPPBwsl0vFxOANJd+CxBDLwwGFVEwMpEe+BShRTCzl4YBCKiaBFWrKIFsZmR24lIBDlXvBS41tbzavEthIqu1/uto3ife7K28Y7juZk1Re5LGTqoCXhoICaq8K5NZ+MVeOzB6sYgOLIqjyMPR6vcrXUv0gPcHtrdAylbc6Qst7Vh4BORc5s0s3aoEy7AwJ5DjJx3fE3KhQ5tOaprBn5mexWGihDDjUvNz14lwLuSvPL8Fbew1hsp0/GFEP53v0BRD6xK8pGphe87y9M2H3KAlHiKRTBv5gUvv9vsz/RGi1fgFwlsqjlSh7hQAAAABJRU5ErkJggg==";

IMAGE_BASE64.settingHeaderMischeader = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAASdAAAEnQB3mYfeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADxSURBVFiF7ZgxCoQwEEX/Ltt7GMHK2jo2qWwVPEZu4QnEa+gJLD1BUPEO7gUyLskUO8U8SDX8/AeDEHwBuCGY978FfiFe8EMN8jxH27bB2TiOWJYlqqgsSzRNE5wNw4B1XcnsHTrW2pui7/tg5ul0XUfeV9c1mRO/YhXkooJcVJCLCnJRQS7kY+GJqqqQZVlUpiiKlKo0QWMMjDFJhbGIX7EKchEvmPSROOcwTVNUxloL51x0V5LgcRzYti0qs+97SpX8FasgFxXkooJcVJCLCnIRL0g+Fs7zxDzPwZn3PrrIe0/ed10XmXtBf6LzEC/4BfqHf1WvqyDSAAAAAElFTkSuQmCC";
IMAGE_BASE64.settingHeaderMiscnegative = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnMAABJzAYwiuQcAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAG1JREFUWEft1sEJgEAMRNEtx4rSQzqwe5Uwh0AQDNmguPOuYedfd9AX7GUYyrpeHgUMP7deeLuBYQeHAENTiAhqjqri3Idhw3AHhg3DHRg2DHdg2PwljB9bgJqDQ4ChrPX+1QwnlcJFGKIXjXECpjp2HeQDegAAAAAASUVORK5CYII=";
IMAGE_BASE64.settingHeaderMiscreorder = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnMAABJzAYwiuQcAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAWRJREFUWEft1LFqg1AUxnEfJ6PgC/gGIYuQJaNQQoZMFnRwCuIs0jxAViWLa4qbs4ubQwZXcU5oD8kXuJJq71VpKNzfmHvO+ZMhUaQX0jTtY1KqquJ0P8Mwvia1WCxwup8Mj/Y/w1EUvXGgMSwwRoXpKJ57maaJBYYMd5Hhm5eF4zh+5zD9z2kMGe4iwzeu69Iv6m61Wp3PZzwwrtfrbrfDEGM2m+F0vx/DtI/nm642fbjZbDAkiidMutpZlj0Pc+EME9u28dxG/zZD2vxhmtzv95hoC8NQuM0fJjScJAmGGE3TOI6DIU5CYULzeZ5jjlEUhdiXFg2T9Xpd1zVGGafTSaA9IEwrnudhtO1wOPC2B4QJbVED022+73O1h4UJLaZpigVGVVXb7fb3C4PDZLlclmWJHca9jaEuY8LEsqzL5YK1h78I03oQBFh74Arruv75ZD6f45kDtY/HIzYfhC5Ik1GUb8B+WeUwNRUyAAAAAElFTkSuQmCC";
IMAGE_BASE64.settingHeaderMiscnormalizedSize = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAR2gAAEdoB/lpaRQAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAABW0lEQVRYR+2XYW6EIBCFsQdSj6In0os3lNc4KaG49b0Zm/3hl0xWzMJ8RhlgyDl/ppQ+SrwlEHtbORAqt+97muf5+zeM8opD2LYtT9OUMSQC7QhCBFu5SMkQwZ6chRfMYgwkMwzDcXWOJ4VrklyRA1f/10MWZJOqkpKgmkzpRwt6Xhdg+1OCKMIRlFl/XP0NJbgsS3fws1nauz+OY1rX9WhdAGWGoS3KhrXrMKxd5OjiTQsCk6ypxSxqFDngLtRG7+OPGFqug//FI+jlEfTyCHp5BL1IgjhWMjsSIB9HsdQxYD3FuoqudXdr12FYG+v3rZuFVs4CtPfO7rOSlGBPTol2J/QKejfj3fIDJiU9Scjn+QXbX5rFqqTST66DbDL1oVyF+mpSVQ64BMGr5CjmHjngFgSlrh1XP0AOx1Q35QlDQPHFcAhlxTgjTBBAKlIOhB077yLkG7yPlL4Ac+yFmviZt6AAAAAASUVORK5CYII=";

IMAGE_BASE64.settingHeaderScalescaleRange = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEdsAABHbASwduKEAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAARlJREFUWEfNlQEKg0AMBH26T9QHFdtY03pxEj2hZRcG6rjCIicdXlnEQakESiVQKoFSCZRKoFQCpRIolUCpBEpknudlHEe8dwV7dpomvFeA8oDn7kgf56FOAsqGmN6RcZyHugDKD1lsJPUJGuehfgDlShXqV1Sh/g6U26Mc6l+hCvU3WmHnpUrs95LFjkFyrr8XZ+N+nWSkxjgPjHz/qL60f8e2HAbaapWR+AYNhZFhnNFcnI6M/V6qwDjjIFaqUP8KVai/gXKlCvUrqlB/B8oPWcKXVmL/21moH0DZEGPjkvOCWJdGUhdAecDTO86JI6mTgBK5O87xkXSvAKUSKJVAqQRKJVAqgVIJlEqgVAKlEiiVGB5BCDEsT8/XAYGvY1B6AAAAAElFTkSuQmCC";
IMAGE_BASE64.settingHeaderScalescaleContrast = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAR2gAAEdoB/lpaRQAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAApElEQVRYR+3NkQKFMAAF0EejKJqNRlGURaMoG42iKBuNRtloFEVZFEVRFo2iLIqiYT/x8J4fOD9CSJIkaZpSShljnPMsy/I8L4qiLEshRFVVdV1LKZVSTdO0bdt1ndbaGGOt7fveOee9H4ZhHMdpmuZ5XpZlXddt2/Z9P44jhHCe53Vd930/z/O+b4wRMWLEiBEjRowYMWLEiBEjRowYMeK/xTF++MxNUL8OlGcAAAAASUVORK5CYII=";
IMAGE_BASE64.settingHeaderScalescaleDiscretize = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAR2QAAEdkBU+N7KAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAAtklEQVRYR7XNMQoEQRACwPn/p/eSypoDQaxU1PeNvX/kM24u+YybSz7j5pLPuLnkM24u+YybSz7j5pLPuLnkM24uec1cTq9mLqdXM5fTq5nL6dXM5fRq5nJ6NXM5vZq5nF7NXE6vZi6nF1Pr2Yup9ezF1Hr2Ymo9ezG1nr2YWs9eTK1nL6bWsxdT69mLqfXsHeIdP4d4x88h3vFziHf8HOIdP4d4x88h3vFziHf8HOIdP4d45L0fTzlXKGx+/g0AAAAASUVORK5CYII=";

IMAGE_BASE64.settingHeaderSeparatorSeparatorWhite = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAR2gAAEdoB/lpaRQAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAABYUlEQVRYR+2XUW6DMBBETU8OJ4KjAPepqKewarAmxDvrVPngSauYBeMHiddOl1L6zvGV4yOB4LY3P5Omb67v+zTP8+9nS/AGw5Gltiy3GThm1wlBk64o5YxGkjTpCiZnsOs9EZ4ku8M1XYdhNEKTpEYO1F7HkAW9g6qSkqA6mNLPLRj5uoC3v0sQRbgFy7Icrde4BKdpojd/NktZfl3XNI7jcVQH3nl1lEXZ8ozyXH44pXjT5GWY5GOO8XhelIsXamP3ORMp0IZcB/+LWzDKLRjlFoxyC0aRBPOS5dqRAOyE0E/htPa9CqynWFcNyzPKc1i/hfWYJmmUcgbOMVhekKRJGkxOodwJXYV7N5Pvf7R0PLsc9ySJbqG8/aVZrEoq/eQ66B1MfahQoa4dVJUDIUFwNTiKeUQOhAXBMAxH6w/I4W9qC051Rw0UX0NcMZ4FTUoBqcZy7f52vosmv8H3kdIP5cveVq4Ni9YAAAAASUVORK5CYII=";
IMAGE_BASE64.settingHeaderSeparatorSeparatorBlack = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAR2gAAEdoB/lpaRQAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAABW0lEQVRYR+2XYW6EIBCFsQdSj6In0os3lNc4KaG49b0Zm/3hl0xWzMJ8RhlgyDl/ppQ+SrwlEHtbORAqt+97muf5+zeM8opD2LYtT9OUMSQC7QhCBFu5SMkQwZ6chRfMYgwkMwzDcXWOJ4VrklyRA1f/10MWZJOqkpKgmkzpRwt6Xhdg+1OCKMIRlFl/XP0NJbgsS3fws1nauz+OY1rX9WhdAGWGoS3KhrXrMKxd5OjiTQsCk6ypxSxqFDngLtRG7+OPGFqug//FI+jlEfTyCHp5BL1IgjhWMjsSIB9HsdQxYD3FuoqudXdr12FYG+v3rZuFVs4CtPfO7rOSlGBPTol2J/QKejfj3fIDJiU9Scjn+QXbX5rFqqTST66DbDL1oVyF+mpSVQ64BMGr5CjmHjngFgSlrh1XP0AOx1Q35QlDQPHFcAhlxTgjTBBAKlIOhB077yLkG7yPlL4Ac+yFmviZt6AAAAAASUVORK5CYII=";

IMAGE_BASE64.settingHeaderEncodingtext = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAScgAAEnIBXmVb4wAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAA9UlEQVRYR+3WWxGDMBCFYTzgoAYwgIIawQEOYgEteMACGmqhPZM9YVKuScvOlOl+b2UpPzvDQwrzd+q6fipo25aBLb8Yfnj8sbA//SSMxznncF30fc/Bu1uAxvINssN4RFVVnHlbYY495Idh4MDLDs+qkBIGtOO988Jd1/FqJDEMiHGWFUYVb82rkfRwWZboyd6p4dVdRXpYyN5JYXzDq7uK3DD2bprmOHwoN3waCwcc67FwwLEeCwcc67FwwLEeCwcc65kdHyccK8Fxgp0FHF1407nu3ta6MI6j3MM/fA+roLeTjCEPJ5ywYDrwprt42FxbUbwAP9uXngG4wGgAAAAASUVORK5CYII=";
IMAGE_BASE64.settingHeaderEncodinggrayscale = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAR3AAAEdwBflke3gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAACASURBVFiF7c6xCQMxEETRv+aq2FiVqHA1I5BqMAjkwNHBgYMJ5GBeBS+AzR+7AGqtZObpy80Yg9baN5iZlFJOnx69Tgd+cVDloMpBlYMqB1UOqhxUOahyUOWgykGVgyoHVQ6qHFQ5qHJQdQH03llrnb7czDkBCOAdEXG282zvvT9JEhVZvsBpvwAAAABJRU5ErkJggg==";
IMAGE_BASE64.settingHeaderEncodingbarchart = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAR3AAAEdwBflke3gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAACJSURBVFiF7dixDQMhFATRwaKj3wRFEdIEndAERVDHSWcHjk6y5GADCHYqeNJmm4A3B5cBWmtExG7LozkntdYvMCIopew2/ey1G/AvA9UMVDNQzUA1A9UMVDNQzUA1A9UMVDNQLQP03hlj7LY8WmsBkDj8+jh+YgPVDFQzUM1ANQPVckrp4lzo/QG8pRJaXEQ/5wAAAABJRU5ErkJggg==";
IMAGE_BASE64.settingHeaderEncodingcircle = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAR3AAAEdwBflke3gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJ3SURBVFiF7ZixiupAFIb/JMbYpbGxsLLRWvIIggHtbS2tQlAsVLCx9h18BRGCWAYRC7G3tbARKyGJgucWi+DKOkkms1eL/WC6k/wfZ2ByJhIAwgeTAoDRaIRyufxul29sNhsMBoMvwXK5jGq1+m6nH5HfLRDGn2BSPl4wleTh4/GI2WyGxWKB/X6Pw+EAAMjlcsjn86hUKqjVashms4kkyXEcisP5fKZWq0WyLBO+ztGXS5ZlarVadD6fY2U4jnN/RzxB13WpUCiEij2vQqFAruv+nmAQBNRutyN1jdXNdrtNQRCIF+x0Otxiz6vT6YgVXC6XiTr3UyeXy2UkwdBjxvM8NJtN3G63sNLI3G43NJtNeJ4XWhsq2Ov1sNvthIg9stvt0Ov1ItW+3OLT6USqqgrb2uelqiqdTif+LZ5Op7her/FaE4Pr9YrpdMqsYQrO53OhQjwZTMH9fi9UhieDKXj/tv4mYRlMQUmShMrwZDAFc7mcUBmeDKZgPp8XKsOTwRQ0TVOoDE8GU7BeryOdTgsVeiSdTqNerzNrmIK6rsOyLKFSj1iWBV3XQ+uY04zv+1QqlYR/5kqlEvm+n3ya0TQNk8kEiqLEbdBLFEXBZDKBpmmhtZFudYZhoNvtJha70+12YRhG5PpIE/XlcqF+v0+KonBvq6Io1O/36XK5hOZxX5rW6zUVi8XYcsVikdbrdeQcbkEiIs/zyLbtSLOiqqpk2zZ5nhcr4y7IdXHPZDIYj8cYDodwHId5cTdNM9JR8opEfxZ0XUej0UCj0UjyGiYf/2/mTzApHy+YAoDVagXf99/t8o3tdgsAkCRJCqT/MdtzQET0Dw+rZbSpC5CAAAAAAElFTkSuQmCC";
IMAGE_BASE64.settingHeaderEncodinghorizon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAR2gAAEdoB/lpaRQAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAB/UlEQVRYR82WuYrCUBSGJ7WCio1L6dqJhdiIhc+gb+QTCHa2NmKhIPgMbp3g1giujWAjgg6c8YSbjFeP17jMeD74m++m+IwJ5OsEMN8X5PN5aDab+hqNBqRSKbDZbFAoFEyvWq1Wg1gsBi6XC0qlEnnN5SqVCgQCAfD5fFAul6/OsckMRIEcj0fIZrPgcDig1Wrp7h673Q4ymQx4PB4YDAbCqtlsNhCPxyEYDMJ8PhdWBpukQCPO6XRCu90Wl6k5jxsOh8KqsRKHSIH4txpxnU5HXKLGiPN6vW+PQ6RAfObw+el2u+JYzStxoVDobhwiBdrtduj1euJIzX/EIfjimIHFYlFoNa/GLRYLYdXMZjP97TYD8Xbe4zxuNBoJq+bZOHxGI5GI9UAjDn/Vo3HhcPjhuGQyCdVq1VrgJ+K22638ktwK/FQccjfwPG48Hgur5l1xiDLw1bjlcimsmltxyM1AI87v9z8ch2/eO+IQMpBLHHIVyCkOkQLxe86Im0wm4hI1fxmHSIH4sflMXDQahdVqJayaR+IQKdDtdkO/34f9fm9puVxOv3PT6ZQ8p5ZOpyGRSMB6vSbPL1ev138DmY+UnEZKTiMlp5GS00jJaaTkNFJyGik5jZScRkpOIyWnkZLTSMlppOQ0UnIaKTmNlJxGSj7TNO1w2jfPaYcfDD0/LC6ow10AAAAASUVORK5CYII=";
IMAGE_BASE64.settingHeaderEncodingmeanChart = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAR2gAAEdoB/lpaRQAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAAq0lEQVRYR+3QoQEDQRDDwOu/6YRMAyvTH24Bv9/gLTQSiUYjkWg0EolGI5FoNBKJRiORaDQSiUYjkWg0EolGI5FoNBKJRiORaDQSiUYjkWg0EolGI5H4XPjuyHihdGS8UDoyXigdGS+UjowXSkfGC6Uj44XSkfFC6ch4oXRkvFA6Ml4oHRkvlI6MF0pHxgulI+OF0pHxQunIeKF0ZLxQOjJeKB0ZL5SOjIP3/iF5Yg/5RPZlAAAAAElFTkSuQmCC";
IMAGE_BASE64.settingHeaderEncodingposition = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAR2AAAEdgBgaSZzAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAASElEQVRYR+3NMQoAIBADQX9+Tz8tDAS0CjbCThkCO/qFqho3a9+PA+EMYSFsCGcIC2FDOENYCBvCGcJC2BDOEBbChnDmn3D3BDp+8VsngahqAAAAAElFTkSuQmCC";
IMAGE_BASE64.settingHeaderEncodingencodingOrientationVertical = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAR2AAAEdgBgaSZzAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAAzUlEQVRYR+3S2wnDMBBEUZWi0tRJSlFpKkURzKwxeSg7a4h/9nzZC+Yy4DJvcik8xuCT7lK41hpux8O991JKa43vonh4zV3hJTY6GMZciI0Oho+5EBgdCZ/nQmB0JPwyF9TRcvh9Lqij5fDHuSCN1sLf5oI0Wgtv5oJ/tBDezwX/aCH8cy44R3vDnrngHC2EHyeMGF4Nv9nSfq4Dg4ZXRYadGDS8KjLsxKDhVZFhJwYNr4oMOzFoeFVk2IlBw6siw04MGl4VGf6bm8JzPgHcVBy2csdpPAAAAABJRU5ErkJggg==";
IMAGE_BASE64.settingHeaderEncodingencodingOrientationHorizontal = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAIAAAADnC86AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAR2AAAEdgBgaSZzAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAAkUlEQVRYR+3SyQ3AMAhEUZfi0tyJS0lpLsVZhkOUFSUwOYR/QUhI70LqHxUwrYBpBUwrYFo28LAkiy4buNaaUso563lLGCl5exjd8l4wuuAFlkOfDnkGjDY8D0YT31pjw6UUqLMow7k1iQR+2dlXT+1J5AifkcgFviaRMawhkRmsJ5EN/KCAaQVMK2Baf4N7HwHSnBy26UyMFwAAAABJRU5ErkJggg==";