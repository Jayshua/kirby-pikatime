/********************************************************************************/
/* Face24
/* ------
/* Implements the 24 hour face control.
/*
/* The 24 hour face is divided into three modules:
/* 1. face.js        - Initialization of state, options, and events. Plus methods
/* 2. interaction.js - User interaction management including click/touch handlers
/* 3. render.js      - The code that renders the face onto the canvas
/*
/* The modules are added to the Face24 prototype by an extend call at
/* the bottom of this file.
/********************************************************************************/
var util  = require("../../util");
var Point = require("../../point");



var Face24 = function(ctx, options) {
   this.ctx    = ctx;
   this.canvas = ctx.canvas;

   this.state = {
      interval       : "hour", // The interval (hour/minute) currently being selected
      dragging       : false,  // Whether the selector is currently being dragged
      interacting    : false,  // Whether the user currently performing an interaction (other than dragging)
      animating      : false,  // Whether the clock face is currently animating between hour and minute
      animationState : 0       // The current state of the clock face animation (0 to 1)
   };

   this.options = util.extend({
      selectorRadius : 15,                      // The size of the green selector circle
      face24Radius   : 90,                      // The radius of the 13-24 hour clock face
      face12Radius   : 60,                      // The radius of the 1-12 hour clock face
      minuteRadius   : 75,                      // The radius of the minute clock face
      faceLocation   : Point.fromCart(0, 20),   // The location of the clock face
      timeLocation   : Point.fromCart(0, -135), // The location of the digital time display
      font           : "12px Arial",            // The font of the numerals around the clock face
      timeFont       : "24px Arial",            // The font of the digital time display
   }, options);

   // Attach the internal event handlers
   util.on("interactionStart", this.handleInteractStart.bind(this));
   util.on("interactionEnd",   this.handleInteractEnd  .bind(this));
   util.on("controlOpen",      this.handleControlOpen  .bind(this));
};


/********************************************************************************/
/* Reset the interval currently being selected to "hour" when the control opens */
/********************************************************************************/
Face24.prototype.handleControlOpen = function() {
   this.state.interval = "hour";
};


/*******************************************************************************************/
/* Change the interval by setting the animating state.                                     */
/* The actual interval changing is done in the render method when the animation completes. */
/*******************************************************************************************/
Face24.prototype.changeInterval = function(newInterval) {
   if (this.state.interval !== newInterval) {
      this.state.animating = true;
   }
};


/*********************************************************/
/* Add the rest of the Face24 modules onto the prototype */
/*********************************************************/
Face24.prototype = util.extend(Face24.prototype, require("./interaction"), require("./render"));



module.exports = Face24;