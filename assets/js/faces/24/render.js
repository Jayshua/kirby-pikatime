var util  = require("../../util.js");
var Point = require("../../point.js");
var Time  = require("../../time.js");



/********************************************************/
/* Render the clock face, selector, and digital display */
/********************************************************/
var render = function(parentState) {
   this.renderTimeDisplay(parentState.time, parentState.pointerLocation);

   if (this.state.animating) {
      this.renderAnimation(parentState.time, parentState.pointerLocation);
   } else {
      this.renderClockSelector(parentState.time, parentState.pointerLocation, this.state.interval);

      if (this.state.interval === "hour") {
         this.renderHourFace(parentState.time, parentState.pointerLocation);
      } else {
         this.renderMinuteFace(parentState.time, parentState.pointerLocation);
      }
   }
};


/****************************************************************************************/
/* Render both the minute and hour faces while performing the animation between the two */
/****************************************************************************************/
var renderAnimation = function(time, pointerLocation) {
   this.state.animationState += 0.05;
   var animationPoint = util.cubicEase(this.state.animationState);
   var scalingFactor = (0.3 * animationPoint);

   ///////////////////////////////
   // Render the previous face
   this.ctx.save();
   // Scale the face up
   this.ctx.scale(1 + scalingFactor, 1 + scalingFactor);
   // Fade the face out
   this.ctx.globalAlpha = (1 - animationPoint > 0) ? 1 - animationPoint : 0;
   // Render the selector
   this.renderClockSelector(time, pointerLocation, this.state.interval);
   // Render the face itself
   if (this.state.interval === "hour") {
      this.renderHourFace(time, pointerLocation);
   } else {
      this.renderMinuteFace(time, pointerLocation);
   }
   // Restore scale and alpha to previous values
   this.ctx.restore();


   ///////////////////////////////
   // Render the incoming face
   this.ctx.save();
   // Scale the face down, expanding as the animation progresses
   this.ctx.scale(0.7 + scalingFactor, 0.7 + scalingFactor);
   // Fade the face in as the animation progresses
   this.ctx.globalAlpha = animationPoint;
   // Render the selector
   this.renderClockSelector(time, pointerLocation, (this.state.interval === "hour") ? "minute" : "hour");
   // Render the face itself
   if (this.state.interval === "hour") {
      this.renderMinuteFace(time, pointerLocation);
   } else {
      this.renderHourFace(time, pointerLocation);
   }
   // Restore the scale and alpha to the previous values
   this.ctx.restore();


   // Turn off the animation and set the final interval when animation is complete
   if (this.state.animationState >= 1) {
      this.state.animating = false;
      this.state.animationState = 0;
      this.state.interval = (this.state.interval === "hour") ? "minute" : "hour";
   }
};


/**************************************/
/* Render the selector circle and arm */
/**************************************/
var renderClockSelector = function(time, pointer, interval) {
   var ctx = this.ctx;
   ctx.fillStyle   = this.options.highlight;
   ctx.strokeStyle = this.options.highlight;

   // Move the rendering origin to the center of the clock face
   ctx.save();
   ctx.translate(this.options.faceLocation.x, this.options.faceLocation.y);

   // Calculate the current location of the selector
   var markLocation;
   if (this.state.dragging) {
      // Adjust the pointer for the clock face offset
      pointer = Point.subtract(pointer, this.options.faceLocation);

      if (interval === "hour") {
         // Constrain the selector to one of the two face's radius
         var midRadius = (this.options.face12Radius + this.options.face24Radius) / 2;
         var markRadius = (pointer.radius > midRadius) ? this.options.face24Radius : this.options.face12Radius;

         markLocation = Point.fromPolar(pointer.theta, markRadius);
      } else {
         markLocation = Point.fromPolar(pointer.theta, this.options.minuteRadius);
      }
   } else {
      if (interval === "hour") {
         // Determine which of the hour faces the mark is on based on current time
         var markRadius = (time.hour < 12) ? this.options.face12Radius : this.options.face24Radius;
         markLocation = Point.fromPolar(Time.getHourAngle(time), markRadius);
      } else {
         markLocation = Point.fromPolar(Time.getMinuteAngle(time), this.options.minuteRadius);
      }
   }

   // Render the selector circle
   ctx.beginPath();
   ctx.arc(markLocation.x, markLocation.y, this.options.selectorRadius, 0, Math.PI * 2);
   ctx.fill();

   // Render the selector arm
   ctx.beginPath();
   ctx.moveTo(0, 0);
   ctx.lineTo(markLocation.x, markLocation.y);
   ctx.stroke();

   // Render the white dot at the center of the clock
   ctx.fillStyle = this.options.color;
   ctx.beginPath();
   ctx.arc(0, 0, 1, 0, Math.PI * 2);
   ctx.fill();

   // Restore the origin to its previous location
   ctx.restore();
};


/*************************************/
/* Render the hour face of the clock */
/*************************************/
var renderHourFace = function(time, pointer) {
   var ctx = this.ctx;
   ctx.fillStyle    = this.options.color;
   ctx.font         = this.options.font;
   ctx.textAlign    = "center";
   ctx.textBaseline = "middle";

   // Translate the origin to the center of the clock face
   ctx.save();
   ctx.translate(this.options.faceLocation.x, this.options.faceLocation.y);

   // Iterate over the 12 inner clock face positions and render 1-12 numerals
   util.circleIterate(this.options.face12Radius, 12, function(point, step) {
      ctx.fillText(step, point.x, point.y);
   });

   // Iterate over the 12 outer clock face positions and render 13-24 numerals
   util.circleIterate(this.options.face24Radius, 12, function(point, step) {
      step += 12;
      ctx.fillText(step, point.x, point.y);
   });

   // Restore the origin to its previous location
   ctx.restore();
};


/***************************************/
/* Render the minute face of the clock */
/***************************************/
var renderMinuteFace = function(time, pointer) {
   var ctx = this.ctx;
   ctx.fillStyle    = this.options.color;
   ctx.textAlign    = "center";
   ctx.textBaseline = "middle";
   ctx.font         = this.options.font;

   // Translate the origin to the center of the clock face
   ctx.save();
   ctx.translate(this.options.faceLocation.x, this.options.faceLocation.y);

   // Iterate over the 12 clock face locations and render the minute numerals
   util.circleIterate(this.options.minuteRadius, 12, function(point, step) {
      var minute = step * 5;
      ctx.fillText(util.padLeft(minute, 2, 0), point.x, point.y);
   });

   // Restore the origin to its original location
   ctx.restore();
};


/**********************************************************/
/* Render the digital display that shows the current time */
/**********************************************************/
var renderTimeDisplay = function(time, pointer) {
   var ctx = this.ctx;
   ctx.textAlign    = "left";
   ctx.textBaseline = "top";
   ctx.font         = this.options.timeFont;

   // Get the full time text and display metrics
   var hour    = util.padLeft(time.hour,   2);
   var minute  = util.padLeft(time.minute, 2);
   var metrics = this.calculateTimeMetrics(time);

   // Render the hour segment
   ctx.fillStyle = (this.state.interval === "hour") ? this.options.highlight : this.options.color;
   ctx.fillText(hour, metrics.hour.x, metrics.hour.y);

   // Render the colon
   ctx.fillStyle = this.options.color;
   ctx.fillText(":", metrics.colon.x, metrics.colon.y);

   // Render the minute segment
   ctx.fillStyle = (this.state.interval === "minute") ? this.options.highlight : this.options.color;
   ctx.fillText(minute, metrics.minute.x, metrics.minute.y);
};


/*************************************************************************************/
/* Calculate the location and width of each text segment of the digital time display */
/*************************************************************************************/
var calculateTimeMetrics = function(time) {
   var ctx = this.ctx;
   ctx.font = this.options.timeFont;

   // Build the time strings with leading 0s
   var hour   = util.padLeft(time.hour, 2);
   var minute = util.padLeft(time.minute, 2);

   // Calculate the width of each segment
   var hourWidth   = ctx.measureText(hour)  .width;
   var colonWidth  = ctx.measureText(":")   .width;
   var minuteWidth = ctx.measureText(minute).width;
   var totalWidth  = hourWidth + colonWidth + minuteWidth;

   // Calculate the x coordinate of each segment
   var hourX   = this.options.timeLocation.x - (totalWidth / 2);
   var colonX  = hourX  + hourWidth;
   var minuteX = colonX + colonWidth;

   return {
      hourWidth   : hourWidth,
      colonWidth  : colonWidth,
      minuteWidth : minuteWidth,
      totalWidth  : totalWidth,
      hour        : Point.fromCart(hourX,   this.options.timeLocation.y),
      colon       : Point.fromCart(colonX,  this.options.timeLocation.y),
      minute      : Point.fromCart(minuteX, this.options.timeLocation.y)
   };
};



module.exports = {
   render              : render,
   renderAnimation     : renderAnimation,
   renderTimeDisplay   : renderTimeDisplay,
   renderMinuteFace    : renderMinuteFace,
   renderHourFace      : renderHourFace,
   renderClockSelector : renderClockSelector,
   calculateTimeMetrics: calculateTimeMetrics,
};