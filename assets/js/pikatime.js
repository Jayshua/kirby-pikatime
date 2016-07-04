var util = require("./util");
var Point = require("./point");
var Time = require("./time");



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
      time:            Time.from24(15, 0),   // The currently selected time
      pointerLocation: Point.fromCart(0, 0) // The location of the user's mouse/finger
   };

   // Build the control's DOM
   this.inputElement = inputElement;
   this.initDom();

   // Setup the canvas
   var canvas    = this.canvas;
   this.ctx      = canvas.getContext("2d");
   canvas.height = 325;
   canvas.width  = 250;

   // Initialize the clock face
   var Face = require("./faces/" + this.options.face + "/face.js");
   this.clockFace = new Face(this.ctx, this.options);

   // Handle time changes
   util.on("timeChange", function(newTime) {
      this.state.time = newTime;
   }.bind(this));

   this.render();
   this.show();
};


/*******************************************************************************/
/* Create all the dom nodes needed for the time control (including the canvas) */
/*******************************************************************************/
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
   this.inputElement.addEventListener("focus",      this.show                  .bind(this));
   this.inputElement.addEventListener("blur",       this.handleBlur            .bind(this));
   okButton         .addEventListener("click",      this.save                  .bind(this));
   cancelButton     .addEventListener("click",      this.hide                  .bind(this));
   canvas           .addEventListener("mousedown",  this.handleInteractionStart.bind(this));
   canvas           .addEventListener("mousemove",  this.handleInteractionMove .bind(this));
   document         .addEventListener("mouseup",    this.handleInteractionEnd  .bind(this));
   canvas           .addEventListener("touchstart", this.handleInteractionStart.bind(this));
   canvas           .addEventListener("touchmove",  this.handleInteractionMove .bind(this));
   document         .addEventListener("touchend",   this.handleInteractionEnd  .bind(this));

   // Store references
   this.canvas           = canvas;
   this.containerElement = container;

   // Insert the hidden container into the dom
   this.containerElement.style.display = "none";
   document.body.appendChild(this.containerElement);
};


/****************************/
/* Render the clock control */
/****************************/
Pikatime.prototype.render = function() {
   if (this.containerElement.style.display === "block") {
      this.ctx.fillStyle = this.options.background;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.save();
      this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      this.clockFace.render(this.state.time, this.state.pointerLocation);
      this.ctx.restore();
   }

   window.requestAnimationFrame(this.render.bind(this));
};


/********************/
/* Show the control */
/********************/
Pikatime.prototype.show = function() {
   // Update the state with the input field's current values
   var time = /([0-9]+)(:)([0-9]+)/.exec(this.inputElement.value);
   if (time) {
      this.state.time = Time.from24(parseInt(time[1], 10), parseInt(time[3], 10));
   } else {
      this.state.time = Time.from24(0, 0);
   }

   // Display the container
   this.containerElement.style.display = "block";

   // Get coordinates for container position calculation
   var inputMetrics     = this.inputElement.getBoundingClientRect();
   var contianerMetrics = this.containerElement.getBoundingClientRect();

   // Position the container element horizontally
   if (inputMetrics.right + contianerMetrics.width - 12 < window.innerWidth) {
      this.containerElement.style.left = inputMetrics.right + 12 + "px";
   } else {
      this.containerElement.style.left = window.innerWidth - 24 - contianerMetrics.width + "px";
   }

   // Position the container element vertically
   var top = (inputMetrics.top + inputMetrics.height / 2) - (contianerMetrics.height / 2);
   if (top < 50) top = 50;
   this.containerElement.style.top = top + "px";

   // Save the center of the canvas for interaction location calculations
   var canvasMetrics = this.canvas.getBoundingClientRect();
   this.canvasCenter = Point.fromCart(
      canvasMetrics.left + (this.canvas.width  / 2),
      canvasMetrics.top  + (this.canvas.height / 2)
   );

   // Set control state and trigger open event
   this.interacted = false;
   util.trigger("controlOpen");
};


/********************/
/* Hide the control */
/********************/
Pikatime.prototype.hide = function() {
   this.containerElement.style.display = "none";
};


/**********************************************************************/
/* Determine whether to hide the control on blur of the input element */
/**********************************************************************/
Pikatime.prototype.handleBlur = function() {
   setTimeout(function() {
      if (this.interacted === false) {
        this.hide();
      }
   }.bind(this), 200);
};


/*************************************************************************************/
/* Handle the start of a user's interaction with the control (mousedown, touchstart) */
/*************************************************************************************/
Pikatime.prototype.handleInteractionStart = function(event) {
   event.preventDefault();
   var interactionLocation = Point.subtract(Point.fromEvent(event), this.canvasCenter);
   util.trigger("interactionStart", interactionLocation, this.state.time);
};


/*************************************************************************/
/* Handle a movement interaction with the control (mousemove, touchmove) */
/*************************************************************************/
Pikatime.prototype.handleInteractionMove = function(event) {
   event.preventDefault();
   this.state.pointerLocation = Point.subtract(Point.fromEvent(event), this.canvasCenter);
   util.trigger("interactionMove", this.state.pointerLocation, this.state.time);
};


/*********************************************************************************/
/* Handle the end of the user's interaction with the control (mouseup, touchend) */
/*********************************************************************************/
Pikatime.prototype.handleInteractionEnd = function(event) {
   if (event.target === this.inputElement) {
      return;
   } else {
      util.trigger("interactionEnd", this.state.pointerLocation, this.state.time);
   }
};


/*****************************************************/
/* Save the state of the picker to the input element */
/*****************************************************/
Pikatime.prototype.save = function() {
   this.inputElement.value = util.padLeft(this.state.time.hour, 2) + ":" + util.padLeft(this.state.time.minute, 2);
   this.hide();
};


/***********************************************/
/* If jQuery exists, add pickatime as a plugin */
/***********************************************/
if (typeof jQuery !== "undefined") {
   jQuery.fn.pikatime = function() {
      return this.each(function() {
         $element = jQuery(this);

         if (!$element.data("pikatime")) {
            $element.data("pikatime", new Pikatime(this, {
               face: $element.attr("data-mode")
            }));
         }

         return $element.data("pikatime");
      });
   }
}
