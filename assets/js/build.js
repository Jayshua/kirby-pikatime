/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(1);

	/**************************/
	/* Create a time selector */
	/**************************/
	Pikatime = function(inputElement, options) {
	   this.options = util.extend({
	      color:      "white",   // The color of the text
	      background: "black",   // The background color of the canvas
	      highlight:  "#8dae28", // The color of the highlight when something is selected
	      face:       "12"       // The clock face to show
	   }, options);

	   this.state = {
	      hour: 12,   // The currently selected hour
	      minute: 0,  // The currently selected minute
	   };

	   util.registerGetTimeHandler(function() {
	      return this.state;
	   }.bind(this));

	   // Build the dom of the selector
	   this.inputElement = inputElement;
	   this.initDom();

	   // Setup the canvas
	   var canvas    = this.canvas;
	   this.ctx      = canvas.getContext("2d");
	   canvas.height = 325;
	   canvas.width  = 250;

	   // Initialize the clock face
	   this.clockFace = __webpack_require__(2)("./" + this.options.face + "/face.js")(this.ctx, this.options);

	   // Handle time changes
	   util.on("hourChange", function(newHour) {
	      this.state.hour = newHour;
	   }.bind(this));

	   util.on("minuteChange", function(newMinute) {
	      this.state.minute = newMinute;
	   }.bind(this));

	   this.render();
	};

	/****************************/
	/* Render the clock control */
	/****************************/
	Pikatime.prototype.render = function() {
	   this.ctx.fillStyle = this.options.background;
	   this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	   this.clockFace.render(this.state);

	   window.requestAnimationFrame(this.render.bind(this));
	};

	/********************************************************************************/
	/* Creates all the dom nodes needed for the time control (including the canvas) */
	/********************************************************************************/
	Pikatime.prototype.initDom = function() {
	   var container       = document.createElement("div");
	   var canvas          = document.createElement("canvas");
	   var buttonContainer = document.createElement("div");
	   var cancelButton    = document.createElement("button");
	   var okButton        = document.createElement("button");

	   // Build the tree
	   container      .appendChild(canvas);
	   container      .appendChild(buttonContainer);
	   buttonContainer.appendChild(cancelButton);
	   buttonContainer.appendChild(okButton);

	   // Set the attributes
	   container   .setAttribute("class", "pikatime-container");
	   okButton    .setAttribute("tabindex", "-1");
	   cancelButton.setAttribute("tabindex", "-1");
	   okButton    .innerText = "OK";
	   cancelButton.innerText = "Cancel";

	   // Attach event listeners
	   okButton         .addEventListener("click", this.save.bind(this));
	   cancelButton     .addEventListener("click", this.hide.bind(this));
	   this.inputElement.addEventListener("focus", this.show.bind(this));
	   this.inputElement.addEventListener("blur",  this.handleBlur.bind(this));
	   canvas           .addEventListener("click", function(evt) {this.interacted = true;}.bind(this));

	   // Store references
	   this.canvas           = canvas;
	   this.containerElement = container;
	};

	/********************/
	/* Show the control */
	/********************/
	Pikatime.prototype.show = function() {
	   // Update the state with the input field's current values
	   var time = /([0-9]+)(:)([0-9]+)/.exec(this.inputElement.value);   
	   if (time) {
	      this.state.hour   = parseInt(time[1], 10);
	      this.state.minute = parseInt(time[3], 10);
	   } else {
	      this.state.hour   = 12;
	      this.state.minute = 0;
	   }

	   // Insert container into the dom
	   document.body.appendChild(this.containerElement);

	   var inputMetrics     = this.inputElement.getBoundingClientRect();
	   var contianerMetrics = this.containerElement.getBoundingClientRect();

	   // Position the container element
	   if (inputMetrics.right + contianerMetrics.width - 12 < window.innerWidth) {
	      this.containerElement.style.left = inputMetrics.right + 12 + "px";
	   } else {
	      this.containerElement.style.left = window.innerWidth - 24 - contianerMetrics.width + "px";
	   }

	   var top = (inputMetrics.top + inputMetrics.height / 2) - (contianerMetrics.height / 2);
	   if (top < 50) top = 50;
	   this.containerElement.style.top = top + "px";

	   this.interacted = false;
	   util.trigger("controlOpen");
	};

	/********************/
	/* Hide the control */
	/********************/
	Pikatime.prototype.hide = function() {
	   this.containerElement.parentNode.removeChild(this.containerElement);
	};

	/****************************************/
	/* Handle the blur of the input element */
	/****************************************/
	Pikatime.prototype.handleBlur = function() {
	   setTimeout(function() {
	      if (this.interacted === false) {
	        this.hide();
	      }
	   }.bind(this), 200);
	};

	/*****************************************************/
	/* Save the state of the picker to the input element */
	/*****************************************************/
	Pikatime.prototype.save = function() {
	   this.inputElement.value = util.padString(this.state.hour, 2) + ":" + util.padString(this.state.minute, 2);
	   this.hide();
	};


	/***********************************************/
	/* If jQuery exists, add pickatime as a plugin */
	/***********************************************/
	if (typeof jQuery !== "undefined") {
	   (function($) {
	      $.fn.pikatime = function() {
	         return this.each(function() {
	            $this = $(this);

	            if ($this.data("pikatime")) {
	               return $this.data("pikatime");
	            } else {
	               $this.data("pikatime", new Pikatime(this, {
	                  face: $this.attr("data-mode")
	               }));
	               return $this.data("pikatime");
	            }
	         });
	      }
	   }(jQuery));
	}


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = {
	   /**********************************************************************/
	   /* Return a new object with all the properties from the two arguments */
	   /**********************************************************************/
	   extend: function(obj1, obj2) {
	      obj1 = obj1 || {};
	      obj2 = obj2 || {};

	      var newObj = {}; // The new object to return

	      // Add all the properties of obj1 to the new object
	      for (var key in obj1) {
	         if (obj1.hasOwnProperty(key)) {
	            newObj[key] = obj1[key];
	         }
	      }

	      // Add all the properties of obj2 to the new object
	      for (var key in obj2) {
	         if (obj2.hasOwnProperty(key)) {
	            newObj[key] = obj2[key];
	         }
	      }

	      return newObj;
	   },

	   /*****************************************/
	   /* Test if a point is inside a rectangle */
	   /*****************************************/
	   intersects: function(testX, testY, rectX, rectY, width, height) {
	      return (testX > rectX && testX < rectX + width &&
	              testY > rectY && testY < rectY + height);
	   },

	   /******************************************************/
	   /* Test if a point is inside a square where squareX   */
	   /* and squareY are given as the center of the square  */
	   /******************************************************/
	   centerIntersects: function(testX, testY, squareX, squareY, squareSize) {
	      return (testX > squareX - squareSize && testX < squareX + squareSize &&
	              testY > squareY - squareSize && testY < squareY + squareSize);
	   },

	   /***********************************************************/
	   /* Pad a string with 0 (by default) to the specified width */
	   /***********************************************************/
	   padString: function(string, width, placeholder) {
	      placeholder = placeholder || '0'; // The character to pad the string with
	      string = string + '';             // Cast the passed in value to a string

	      if (string.length >= width) {
	         return string;
	      } else {
	         return new Array(width - string.length + 1).join(placeholder) + string;
	      }
	   },

	   /************************************************************/
	   /* Iterate around a circle passing the x and y coordinates  */
	   /* for each point to the passed function                    */
	   /************************************************************/
	   circleForEach: function(radius, steps, func) {
	      // Handle optional steps argument
	      if (typeof func === "undefined") {
	         func = steps;
	         steps = 12;
	      }

	      var stepSize = (Math.PI * 2) / steps; // The size of an iteration around the circle
	      var rotation =  Math.PI / 2;          // The rotation to apply to the coordinates

	      // Loop over the circle, calling the callback for each step
	      for (var step = 0; step < steps; step++) {
	         var x = Math.cos( (stepSize * step) - rotation ) * radius;
	         var y = Math.sin( (stepSize * step) - rotation ) * radius;
	         func(x, y, step);
	      }
	   },

	   /****************************************************************/
	   /* Add a click listener to a canvas whose arguments are the     */
	   /* x/y coordinates of the mouse click on the canvas rather than */
	   /* the event object                                             */
	   /****************************************************************/
	   onClick: function(canvas, func) {
	      canvas.addEventListener("click", function(evt) {
	         var canvasMetrics = canvas.getBoundingClientRect();
	         var mouseX = evt.clientX - canvasMetrics.left;
	         var mouseY = evt.clientY - canvasMetrics.top;

	         func(mouseX, mouseY);
	      });
	   },

	   /**********************************************************/
	   /* Handle out-of-path state requests. That is, functions  */
	   /* outside of render methods can use this to request the  */
	   /* currently selected hour/minute                         */
	   /**********************************************************/
	   getTimeHandler: null,
	   registerGetTimeHandler: function(func) {
	      this.stateRequestHandler = func;
	   },
	   getTime: function() {
	      if (this.stateRequestHandler)
	         return this.stateRequestHandler();
	      else
	         return null;
	   },

	   /***********************************/
	   /* Store all of the event handlers */
	   /***********************************/
	   events: {},

	   /*************************/
	   /* Add an event listener */
	   /*************************/
	   on: function(event, func) {
	      if (typeof this.events[event] === "undefined")
	         this.events[event] = [];

	      this.events[event].push(func);
	   },

	   /********************/
	   /* Trigger an event */
	   /********************/   
	   trigger: function(event) {
	      var args = Array.prototype.slice.call(arguments, 1);

	      if (typeof this.events[event] !== "undefined") {
	         this.events[event].forEach(function(func) {
	            func.apply(null, args);
	         });
	      }
	   }
	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./12/face.js": 3,
		"./24/face.js": 4
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 2;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(1);

	module.exports = function(ctx, options) {
	   var canvas = ctx.canvas

	   var state = {
	      interval: "hour" // The interval (minute/second) currently being selected
	   };

	   options = util.extend({
	      selectedRadius: 15,           // The radius of the circle when something is selected
	      faceRadius    : 70,           // The radius of the face
	      font          : "12px Arial", // The font of the numerals around the clock face
	      timeFont      : "24px Arial", // The font of the time display
	      timeY         : 20,           // The y coordinate of the time display
	      periodY       : 256,          // The y coordinate of the am/pm period selector
	      amX: canvas.width / 2 - 75,   // The x coordinate of the am control
	      pmX: canvas.width / 2 + 75    // The x coordinate of the pm control
	   }, options);

	   /****************************************/
	   /* Convert 24 hour time to 12 hour time */
	   /****************************************/
	   var convert24to12 = function(time) {
	      var newTime = {};

	      if (time.hour === 0) {
	         newTime.hour   = 12;
	         newTime.period = "am";
	      } else if (time.hour >= 1 && time.hour <= 11) {
	         newTime.hour = time.hour;
	         newTime.period = "am";
	      } else if (time.hour === 12) {
	         newTime.hour   = 12;
	         newTime.period = "pm";      
	      } else {
	         newTime.hour = time.hour - 12;
	         newTime.period = "pm";
	      }

	      newTime.minute = time.minute;
	      return newTime;
	   };

	   /****************************************/
	   /* Convert 12 hour time to 24 hour time */
	   /****************************************/
	   var convert12to24 = function(time) {
	      var newTime = {};

	      if (time.period === "am" && time.hour === 12) {
	         newTime.hour = 0;
	      } else if (time.period === "pm" && time.hour === 12) {
	         newTime.hour = 12;
	      } else if (time.period === "am") {
	         newTime.hour = time.hour;
	      } else {
	         newTime.hour = time.hour + 12;
	      }

	      newTime.minute = time.minute;
	      return newTime;
	   };

	   /************************************************************/
	   /* Translate util.circleForEach to the center of the canvas */
	   /************************************************************/
	   var center = function(radius, func) {
	      util.circleForEach(radius, function(x, y, step) {
	         x += canvas.width  / 2;
	         y += canvas.height / 2;
	         func(x, y, step);
	      });
	   };

	   /*********************************************/
	   /* Calculate the metrics of the time display */
	   /*********************************************/
	   var timeMetrics = function(hour, minute, period) {
	      ctx.font         = options.timeFont;

	      var hourWidth   = ctx.measureText(hour)  .width;
	      var colonWidth  = ctx.measureText(":")   .width;
	      var minuteWidth = ctx.measureText(minute).width;
	      var periodWidth = ctx.measureText(period).width;
	      var totalWidth  = hourWidth + colonWidth + minuteWidth + periodWidth;

	      var hourX   = (canvas.width / 2) - (totalWidth / 2);
	      var colonX  = hourX   + hourWidth;
	      var minuteX = colonX  + colonWidth;
	      var periodX = minuteX + minuteWidth;
	      
	      return {
	         hourWidth:   hourWidth,
	         colonWidth:  colonWidth,
	         minuteWidth: minuteWidth,
	         periodWidth: periodWidth,
	         totalWidth:  totalWidth,
	         hourX:       hourX,
	         colonX:      colonX,
	         minuteX:     minuteX,
	         periodX:     periodX
	      };
	   };

	   /**************************************/
	   /* Render the clock face selector arm */
	   /**************************************/
	   var renderClockSelector = function(x, y) {
	      ctx.fillStyle   = options.highlight;
	      ctx.strokeStyle = options.highlight;

	      // Render the selector circle
	      ctx.beginPath();
	      ctx.arc(x, y, options.selectedRadius, 0, Math.PI * 2);
	      ctx.fill();

	      // Render the selector arm
	      ctx.beginPath();
	      ctx.moveTo(canvas.width / 2, canvas.height / 2);
	      ctx.lineTo(x, y);
	      ctx.stroke();

	      // Render the white dot at the center of the clock
	      ctx.fillStyle = options.color;
	      ctx.beginPath();
	      ctx.arc(canvas.width / 2, canvas.height / 2, 1, 0, Math.PI * 2);
	      ctx.fill();
	   };

	   /*************************************/
	   /* Render the hour face of the clock */
	   /*************************************/
	   var renderHourFace = function(state) {
	      // Iterate over the 12 clock face position and render the needed numbers
	      center(options.faceRadius, function(x, y, step) {
	         var hour = (step === 0) ? 12 : step;
	         
	         ctx.fillStyle    = options.color;
	         ctx.textAlign    = "center";
	         ctx.textBaseline = "middle";
	         ctx.font         = options.font;

	         if (state.hour === hour) {
	            renderClockSelector(x, y);
	            ctx.fillStyle = options.color;
	         }

	         ctx.fillText(hour, x, y);
	      });
	   };
	   
	   /***************************************/
	   /* Render the minute face of the clock */
	   /***************************************/
	   var renderMinuteFace = function(state) {
	      // Iterate over the 12 clock face position and render the needed numbers
	      center(options.faceRadius, function(x, y, step) {
	         var minute = step * 5;

	         ctx.fillStyle    = options.color;
	         ctx.textAlign    = "center";
	         ctx.textBaseline = "middle";
	         ctx.font         = options.font;

	         if (minute === state.minute) {
	            renderClockSelector(x, y);
	         }

	         ctx.fillText(util.padString(minute, 2, 0), x, y);
	      });
	   };

	   /****************************/
	   /* Render the period toggle */
	   /****************************/
	   var renderPeriodSelector = function(state) {
	      // Render the highlight around the selected period
	      ctx.fillStyle = options.highlight;
	      ctx.beginPath();
	      if (state.period === "am") {
	         ctx.arc(options.amX, options.periodY, options.selectedRadius, 0, Math.PI * 2);
	      } else {
	         ctx.arc(options.pmX, options.periodY, options.selectedRadius, 0, Math.PI * 2);
	      }
	      ctx.fill();

	      // Render the period text
	      ctx.fillStyle    = options.color;
	      ctx.textAlign    = "center";
	      ctx.textBaseline = "middle";
	      ctx.fillText("am", options.amX, options.periodY);
	      ctx.fillText("pm", options.pmX, options.periodY);
	   };

	   /**********************************************/
	   /* Render the currently selected time display */
	   /**********************************************/
	   var renderTimeDisplay = function(state) {
	      ctx.textAlign    = "left";
	      ctx.textBaseline = "top";
	      ctx.font         = options.timeFont;

	      var hour    = util.padString(state.hour,   2);
	      var minute  = util.padString(state.minute, 2);
	      var period  = state.period;
	      var metrics = timeMetrics(hour, minute, period);

	      ctx.fillStyle = (state.interval === "hour") ? options.highlight : options.color;
	      ctx.fillText(hour, metrics.hourX, options.timeY);

	      ctx.fillStyle = options.color;
	      ctx.fillText(":", metrics.colonX, options.timeY);

	      ctx.fillStyle = (state.interval === "minute") ? options.highlight : options.color;
	      ctx.fillText(minute, metrics.minuteX, options.timeY);

	      ctx.fillStyle = options.color;
	      ctx.fillText(period, metrics.periodX, options.timeY);
	   };

	   /*************************/
	   /* Render the clock face */
	   /*************************/
	   var render = function(parentState) {
	      var localState = util.extend(convert24to12(parentState), state);

	      if (localState.interval === "hour") {
	         renderHourFace(localState);
	      } else {
	         renderMinuteFace(localState);
	      }

	      renderPeriodSelector(localState);
	      renderTimeDisplay(localState);
	   };

	   /*******************************/
	   /* Handle clicks on the canvas */
	   /*******************************/
	   util.onClick(canvas, function(mouseX, mouseY) {
	      // Test for clicks on the clock face
	      center(options.faceRadius, function(numberX, numberY, step) {
	         if (util.centerIntersects(mouseX, mouseY, numberX, numberY, options.selectedRadius)) {
	            if (state.interval === "hour") {
	               var currentTime  = convert24to12(util.getTime());
	               currentTime.hour = step;

	               util.trigger("hourChange", convert12to24(currentTime).hour);
	               state.interval = "minute";
	            } else {
	               var newMinute = step * 5;
	               util.trigger("minuteChange", newMinute);
	            }
	         }
	      });

	      // Test for click on the am period toggle
	      if (util.centerIntersects(mouseX, mouseY, options.amX, options.periodY, options.selectedRadius)) {
	         var currentTime = convert24to12(util.getTime());
	         currentTime.period = "am";
	         util.trigger("hourChange", convert12to24(currentTime).hour);
	      }

	      // Test for click on the pm period toggle
	      if (util.centerIntersects(mouseX, mouseY, options.pmX, options.periodY, options.selectedRadius)) {
	         var currentTime = convert24to12(util.getTime());
	         currentTime.period = "pm";
	         util.trigger("hourChange", convert12to24(currentTime).hour);
	      }

	      console.log(state.period);
	   });

	   /**********************************************************/
	   /* Reset the interval state when the control is displayed */
	   /**********************************************************/
	   util.on("controlOpen", function() {
	      state.interval = "hour";
	   });

	   return {
	      render: render
	   };
	};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(1);

	module.exports = function(ctx, options) {
	   var canvas = ctx.canvas;
	   
	   var state = {
	      interval: "hour" // The interval (hour/minute) currently being selected
	   };

	   options = util.extend({
	      selectedRadius: 15, // The radius of the circle when something is selected
	      face24Radius:   90, // The radius of the 24 hour part of the face
	      face12Radius:   60, // The radius of the 12 hour part of the face
	      faceOffsetY:    20,
	      minuteRadius:   75, // The radius of the minute part of the face
	      timeY:          25, // The y location of the time display
	      font:           "12px Arial", // The font of the numerals around the clock face
	      timeFont:       "24px Arial", // The font of the time display
	   }, options);


	   /************************************************************/
	   /* Translate util.circleForEach to the center of the canvas */
	   /* Offset slightly to make it "look" centered               */
	   /************************************************************/
	   var center = function(radius, func) {
	      util.circleForEach(radius, function(x, y, step) {
	         x += canvas.width  / 2;
	         y += canvas.height / 2 + options.faceOffsetY;
	         func(x, y, step);
	      });
	   };

	   /*********************************************/
	   /* Calculate the metrics of the time display */
	   /*********************************************/
	   var timeMetrics = function(hour, minute) {
	      ctx.font         = options.timeFont;

	      var hourWidth   = ctx.measureText(hour)  .width;
	      var colonWidth  = ctx.measureText(":")   .width;
	      var minuteWidth = ctx.measureText(minute).width;
	      var totalWidth  = hourWidth + colonWidth + minuteWidth;

	      var hourX   = (canvas.width / 2) - (totalWidth / 2);
	      var colonX  = hourX  + hourWidth;
	      var minuteX = colonX + colonWidth;
	      
	      return {
	         hourWidth:   hourWidth,
	         colonWidth:  colonWidth,
	         minuteWidth: minuteWidth,
	         totalWidth:  totalWidth,
	         hourX:       hourX,
	         colonX:      colonX,
	         minuteX:     minuteX
	      };
	   };

	   /**************************************/
	   /* Render the clock face selector arm */
	   /**************************************/
	   var renderClockSelector = function(x, y) {
	      ctx.fillStyle   = options.highlight;
	      ctx.strokeStyle = options.highlight;

	      // Render the selector circle
	      ctx.beginPath();
	      ctx.arc(x, y, options.selectedRadius, 0, Math.PI * 2);
	      ctx.fill();

	      // Render the selector arm
	      ctx.beginPath();
	      ctx.moveTo(canvas.width / 2, canvas.height / 2 + options.faceOffsetY);
	      ctx.lineTo(x, y);
	      ctx.stroke();

	      // Render the white dot at the center of the clock
	      ctx.fillStyle = options.color;
	      ctx.beginPath();
	      ctx.arc(canvas.width / 2, canvas.height / 2 + options.faceOffsetY, 1, 0, Math.PI * 2);
	      ctx.fill();
	   };

	   /*************************************/
	   /* Render the hour face of the clock */
	   /*************************************/
	   var renderHourFace = function(state) {
	      // Iterator over the 12 inner clock face position and render the needed numbers
	      center(options.face12Radius, function(x, y, step) {
	         ctx.fillStyle    = options.color;
	         ctx.textAlign    = "center";
	         ctx.textBaseline = "middle";
	         ctx.font         = options.font;

	         var hour = (step === 0) ? 12 : step;

	         if (state.hour === hour)
	            renderClockSelector(x, y);

	         ctx.fillText(hour, x, y);
	      });

	      // Iterator over the 12 outer clock face position and render the needed numbers
	      center(options.face24Radius, function(x, y, step) {
	         ctx.fillStyle    = options.color;
	         ctx.textAlign    = "center";
	         ctx.textBaseline = "middle";
	         ctx.font         = options.font;

	         var hour = step + 12;
	         if (hour === 12) hour = 0;
	         
	         if (state.hour === hour)
	            renderClockSelector(x, y);

	         ctx.fillText(util.padString(hour, 2), x, y);
	      });
	   };
	   
	   /***************************************/
	   /* Render the minute face of the clock */
	   /***************************************/
	   var renderMinuteFace = function(state) {
	      // Iterator over the 12 clock face position and render the needed numbers
	      center(options.minuteRadius, function(x, y, step) {
	         var minute = step * 5;

	         ctx.fillStyle    = options.color;
	         ctx.textAlign    = "center";
	         ctx.textBaseline = "middle";
	         ctx.font         = options.font;

	         if (minute === state.minute) {
	            renderClockSelector(x, y);
	         }

	         ctx.fillText(util.padString(minute, 2, 0), x, y);
	      });
	   };

	   /**************************************************/
	   /* Render the display that shows the current time */
	   /**************************************************/
	   var renderTimeDisplay = function(state) {
	      ctx.textAlign    = "left";
	      ctx.textBaseline = "top";
	      ctx.font         = options.timeFont;

	      var hour    = util.padString(state.hour,   2);
	      var minute  = util.padString(state.minute, 2);
	      var metrics = timeMetrics(hour, minute);

	      ctx.fillStyle = (state.interval === "hour") ? options.highlight : options.color;
	      ctx.fillText(hour, metrics.hourX, options.timeY);

	      ctx.fillStyle = options.color;
	      ctx.fillText(":", metrics.colonX, options.timeY);

	      ctx.fillStyle = (state.interval === "minute") ? options.highlight : options.color;
	      ctx.fillText(minute, metrics.minuteX, options.timeY);
	   };

	   /********************************/
	   /* Render the entire clock face */
	   /********************************/
	   var render = function(parentState) {
	      var localState = util.extend(parentState, state);

	      if (localState.interval === "hour") {
	         renderHourFace(localState);
	      } else {
	         renderMinuteFace(localState);
	      }

	      renderTimeDisplay(localState);
	   };

	   /***********************************/
	   /* Handle clicks on the clock face */
	   /***********************************/
	   util.onClick(canvas, function(mouseX, mouseY) {
	      if (state.interval === "hour") {
	         // Test for click on the inner face
	         center(options.face12Radius, function(numberX, numberY, step) {
	            if (util.centerIntersects(mouseX, mouseY, numberX, numberY, options.selectedRadius)) {
	               var newHour = (step === 0) ? 12 : step;
	               util.trigger("hourChange", newHour);
	               state.interval = "minute";
	            }
	         });

	         // Test for click on the outer face
	         center(options.face24Radius, function(numberX, numberY, step) {
	            if (util.centerIntersects(mouseX, mouseY, numberX, numberY, options.selectedRadius)) {
	               var newHour = step + 12;
	               if (newHour === 12) newHour = 0;
	               util.trigger("hourChange", newHour);
	               state.interval = "minute";
	            }
	         });
	      } else {
	         // Test for clicks on the minute face
	         center(options.minuteRadius, function(numberX, numberY, step) {
	            if (util.centerIntersects(mouseX, mouseY, numberX, numberY, options.selectedRadius)) {
	               var newMinute = step * 5;
	               util.trigger("minuteChange", newMinute);
	            }
	         });
	      }

	      // Test for clicks on the time display
	      var metrics = timeMetrics();
	      // Click on the hour display
	      if (util.intersects(mouseX, mouseY, metrics.hourX, options.timeY, metrics.hourWidth, 24)) {
	         state.interval = "hour";
	      }
	      // Click on the minute display
	      if (util.intersects(mouseX, mouseY, metrics.minuteX, options.timeY, metrics.minuteWidth, 24)) {
	         state.interval = "minute";
	      }
	   });

	   /**********************************************************/
	   /* Reset the interval state when the control is displayed */
	   /**********************************************************/
	   util.on("controlOpen", function() {
	      state.interval = "hour";
	   });

	   return {
	      render: render
	   };
	};


/***/ }
/******/ ]);