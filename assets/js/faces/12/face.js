/********************************************************************************/
/* Face12
/* ------
/* Implements the 12 hour face control.
/*
/* The 12 hour face is divided into three modules:
/* 1. face.js        - The basic state, options, event initialization
/* 2. interaction.js - User interaction management including click/touch handlers
/* 3. render.js      - The code that renders the face onto the canvas
/*
/* The modules are added to the Face12 prototype by an extend call at
/* the bottom of this file.
/********************************************************************************/
var util  = require("../../util");
var Point = require("../../point");



/******************************************************/
/* Constructor - Create a 12 hour format time control */
/******************************************************/
var Face12 = function(ctx, options) {
   this.canvas = ctx.canvas;
   this.ctx    = ctx;

   this.options = util.extend({
      font           : "12px Arial", // The font of the numerals around the clock face
      timeFont       : "24px Arial", // The font of the time display
      faceRadius     : 70,           // The radius of the face
      selectorRadius : 15,           // The radius of the green circle when something is selected
      timeY          : -70 - 50,     // The y coordinate of the time display
      amLocation     : Point.fromCart(-50, 110), // The location of the am selector
      pmLocation     : Point.fromCart(+50, 110), // The location of the pm selector
   }, options);

   this.state = {
      animation   : 0,      // The state of the clock face animation (0 to 1)
      isAnimating : false,  // Whether the clock face is currently animating between hour and minute
      interval    : "hour", // The interval (minute/second) currently being selected
      dragging    : false   // Whether the user is currently dragging the selector
   };

   util.on("interactionStart", this.handleInteractionStart.bind(this));
   util.on("interactionEnd",   this.handleInteractionEnd  .bind(this));
   util.on("controlOpen",      this.handleControlOpen     .bind(this));
};


/*********************************************************************/
/* Reset the interval currently being entered when the control opens */
/*********************************************************************/
Face12.prototype.handleControlOpen = function() {
   this.state.interval = "hour";
};


/************************************************************************************/
/* Set the currently being selected interval, prepping the animation in the process */
/************************************************************************************/
Face12.prototype.setInterval = function(interval) {
   if (this.state.interval !== interval) {
      this.state.isAnimating = true;
   }
};


/*****************************************************/
/* Calculate the metrics of the digital time display */
/*****************************************************/
Face12.prototype.calculateTimeMetrics = function(time) {
   var ctx  = this.ctx;
   ctx.font = this.options.timeFont;

   var hour   = util.padLeft((time.hour === 0) ? 12 : time.hour, 2);
   var minute = util.padLeft(time.minute, 2);
   var period = time.period;

   var hourWidth   = ctx.measureText(hour  ).width;
   var colonWidth  = ctx.measureText(":"   ).width;
   var minuteWidth = ctx.measureText(minute).width;
   var periodWidth = ctx.measureText(period).width;
   var totalWidth  = hourWidth + colonWidth + minuteWidth + periodWidth;

   var hourX   = -(totalWidth / 2);
   var colonX  = hourX   + hourWidth;
   var minuteX = colonX  + colonWidth;
   var periodX = minuteX + minuteWidth;

   return {
      totalWidth  : totalWidth,
      hourWidth   : hourWidth,
      colonWidth  : colonWidth,
      minuteWidth : minuteWidth,
      periodWidth : periodWidth,
      hour        : Point.fromCart(hourX,   this.options.timeY),
      colon       : Point.fromCart(colonX,  this.options.timeY),
      minute      : Point.fromCart(minuteX, this.options.timeY),
      period      : Point.fromCart(periodX, this.options.timeY),
   };
};


Face12.prototype = util.extend(Face12.prototype, require("./render"), require("./interaction"));



module.exports = Face12;