/**********************************************************************/
/* Pikatime
/* --------
/* Implements the top level control functionality including:
/* - Dom creation and management
/* - Showing/hiding the control.
/* - The top level rendering function with requestAnimationFrame.
/* - The top level user interaction listeners, which are then delegated
/*   to the clock faces with an event bus from the utilities module.
/* - Loading and saving the time to and from the input element
/* 
/**********************************************************************/
var util  = require("./util");
var Point = require("./point");
var Time  = require("./time");



/**************************/
/* Create a time selector */
/**************************/
Pikatime = function(inputElement, options) {
   this.options = util.extend({
      color      : "white",   // The color of the text
      background : "black",   // The background color of the canvas
      highlight  : "#8dae28", // The color of the highlight when something is selected
      face       : "12"       // The clock face to show
   }, options);

   this.state = {
      time            : Time.from24(15, 0),   // The currently selected time
      pointerLocation : Point.fromCart(0, 0), // The location of the user's mouse/finger
      focused         : false                 // Whether the control is currently focused
   };

   // Build the control's DOM
   this.inputElement = inputElement;
   this.initDom();

   // Setup the canvas
   this.dom.canvas.height = 325;
   this.dom.canvas.width  = 250;

   // Initialize the clock face
   var Face = require("./faces/" + this.options.face + "/face.js");
   this.clockFace = new Face(this.dom.ctx, this.options);

   // Handle time changes
   util.on("timeChange", function(newTime) {
      this.state.time = newTime;
   }.bind(this));

   this.render();
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
   okButton         .addEventListener("click",      this.save                  .bind(this));
   cancelButton     .addEventListener("click",      this.hide                  .bind(this));
   document         .addEventListener("mousedown",  this.handleInteractionStart.bind(this));
   document         .addEventListener("mousemove",  this.handleInteractionMove .bind(this));
   document         .addEventListener("mouseup",    this.handleInteractionEnd  .bind(this));
   document         .addEventListener("touchstart", this.handleInteractionStart.bind(this));
   document         .addEventListener("touchmove",  this.handleInteractionMove .bind(this));
   document         .addEventListener("touchend",   this.handleInteractionEnd  .bind(this));

   // Insert the hidden container into the dom
   container.style.display = "none";
   document.body.appendChild(container);

   // Store references
   this.dom = {
      container       : container,
      canvas          : canvas,
      ctx             : canvas.getContext("2d"),
      buttonContainer : buttonContainer,
      cancelButton    : cancelButton,
      okButton        : okButton,
   };
};


/****************************/
/* Render the clock control */
/****************************/
Pikatime.prototype.render = function() {
   if (this.dom.container.style.display === "block") {
      var ctx    = this.dom.ctx;
      var canvas = this.dom.canvas;

      ctx.fillStyle = this.options.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      this.clockFace.render(this.state.time, this.state.pointerLocation);
      ctx.restore();
   }

   window.requestAnimationFrame(this.render.bind(this));
};


/********************/
/* Show the control */
/********************/
Pikatime.prototype.show = function(event) {
   // Update the state with the input field's current values
   var time = /([0-9]+)(:)([0-9]+)/.exec(this.inputElement.value);
   if (time) {
      this.state.time = Time.from24(parseInt(time[1], 10), parseInt(time[3], 10));
   } else {
      this.state.time = Time.from24(0, 0);
   }

   // Display the container
   this.dom.container.style.display = "block";

   // Get input and pikatime container metrics for the position calculations
   var inputMetrics     = this.inputElement.getBoundingClientRect();
   var contianerMetrics = this.dom.container.getBoundingClientRect();

   // Compute the desired location of the pikatime control
   var intendedLocation = {
      top: inputMetrics.bottom + window.scrollY + 12,
      left: inputMetrics.left
   };

   // Adjust the location as necessary to keep the control entirely on screen.
   // With a 12 pixel margin from the lower edge - for aesthetic reasons.
   var containerBottom = intendedLocation.top + contianerMetrics.height;
   var windowBottom    = window.innerHeight + window.scrollY;
   if (containerBottom > windowBottom - 12) {
      intendedLocation.top -= containerBottom - windowBottom;
      intendedLocation.top -= 12;

      // Hide the arrow which will no longer be pointing at the input element
      this.dom.container.classList.add("pikatime-container-no-arrow");
   } else {
      this.dom.container.classList.remove("pikatime-container-no-arrow");
   }

   // Set the control's location
   this.dom.container.style.left = intendedLocation.left + "px";
   this.dom.container.style.top  = intendedLocation.top + "px";


   // Save the center of the canvas for interaction location calculations
   var canvasMetrics = this.dom.canvas.getBoundingClientRect();
   this.canvasCenter = Point.fromCart(
      canvasMetrics.left + (this.dom.canvas.width  / 2),
      canvasMetrics.top  + (this.dom.canvas.height / 2)
   );

   // Set control state and trigger open event
   this.state.focused = true;
   util.trigger("controlOpen");
};


/********************/
/* Hide the control */
/********************/
Pikatime.prototype.hide = function() {
   this.dom.container.style.display = "none";
   this.state.focused = false;
   this.inputElement.focus();
};


/*****************************************************/
/* Save the state of the picker to the input element */
/*****************************************************/
Pikatime.prototype.save = function(event) {
   this.inputElement.value = util.padLeft(this.state.time.hour, 2) + ":" + util.padLeft(this.state.time.minute, 2);
   this.hide();
   this.inputElement.focus();
};


/*************************************************************************************/
/* Handle the start of a user's interaction with the control (mousedown, touchstart) */
/*************************************************************************************/
Pikatime.prototype.handleInteractionStart = function(event) {
   if (this.state.focused) {
      if (event.target === this.dom.canvas) {
         event.preventDefault();
         event.stopPropagation();
         this.state.pointerLocation = Point.subtract(Point.fromEvent(event), this.canvasCenter);
         util.trigger("interactionStart", this.state.pointerLocation, this.state.time);
      } else if (event.target !== this.dom.okButton && event.target !== this.dom.cancelButton) {
         this.hide();
      }
   } else {
      if (event.target === this.inputElement) {
         // Prevent the keyboard from popping up on mobile devices
         if (typeof event.changedTouches !== "undefined") {
            event.preventDefault();
            event.stopPropagation();
         }

         this.show(event);
      }
   }
};


/*************************************************************************/
/* Handle a movement interaction with the control (mousemove, touchmove) */
/*************************************************************************/
Pikatime.prototype.handleInteractionMove = function(event) {
   if (this.state.focused && event.target === this.dom.canvas) {
      event.preventDefault();
      event.stopPropagation();
      this.state.pointerLocation = Point.subtract(Point.fromEvent(event), this.canvasCenter);
   }
};


/*********************************************************************************/
/* Handle the end of the user's interaction with the control (mouseup, touchend) */
/*********************************************************************************/
Pikatime.prototype.handleInteractionEnd = function(event) {
   if (this.state.focused) {
      this.state.pointerLocation = Point.subtract(Point.fromEvent(event), this.canvasCenter);
      util.trigger("interactionEnd", this.state.pointerLocation, this.state.time);
   }
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
