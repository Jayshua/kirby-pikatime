var util  = require("../../util");
var Point = require("../../point");
var Time  = require("../../time");



/********************************************************/
/* Render the clock face, selector, and digital display */
/********************************************************/
var render = function(time, pointer) {
   this.renderTimeDisplay(time, pointer);
   this.renderPeriodToggle(time, pointer);

   if (this.state.isAnimating) {
      this.renderAnimation(time, pointer);
   } else {
      this.renderArm(time, pointer, this.state.interval);

      if (this.state.interval === "hour") {
         this.renderHourFace(time, pointer);
      } else {
         this.renderMinuteFace(time, pointer);
      }
   }
};


/****************************************************************************************/
/* Render both the minute and hour faces while performing the animation between the two */
/****************************************************************************************/
var renderAnimation = function(time, pointer) {
   // Update the animation and compute the current, eased, animation point
   this.state.animation += 0.04;
   var animationPoint = util.cubicEase(this.state.animation);
   var scalingFactor = (0.3 * animationPoint);


   //////////////////////////////
   // Render the previous face
   this.ctx.save();
   // Scale the face larger as the animation progresses
   this.ctx.scale(1 + scalingFactor, 1 + scalingFactor);
   // Fade the face out as the animation progresses
   this.ctx.globalAlpha = (1 - animationPoint > 0) ? 1 - animationPoint : 0;
   // Render the time selector arm
   this.renderArm(time, pointer, this.state.interval);
   // Render the face itself
   if (this.state.interval === "hour") {
      this.renderHourFace(time, pointer);
   } else {
      this.renderMinuteFace(time, pointer);
   }
   // Restore the scale and alpha to the previous values
   this.ctx.restore();


   //////////////////////////////
   // Render the incoming face
   this.ctx.save();
   // Scale the face down, expanding as the animation progresses
   this.ctx.scale(0.7 + scalingFactor, 0.7 + scalingFactor);
   // Fade the face in as the animation progresses
   this.ctx.globalAlpha = animationPoint;
   // Render the time selector arm
   this.renderArm(time, pointer, (this.state.interval === "hour") ? "minute" : "hour");
   // Render the face itself
   if (this.state.interval === "hour") {
      this.renderMinuteFace(time, pointer);
   } else {
      this.renderHourFace(time, pointer);
   }
   // Restore the scale and alpha to the previous values
   this.ctx.restore();


   // Turn off the animation and sent the final interval when the animation completes
   if (this.state.animation >= 1) {
      this.state.isAnimating = false;
      this.state.animation   = 0;
      this.state.interval    = (this.state.interval === "hour") ? "minute" : "hour";
   }
};


/**************************************/
/* Render the clock face selector arm */
/**************************************/
var renderArm = function(time, pointerLocation, intervalToRender) {
   var ctx = this.ctx;

   // Calculate the location of the selector circle
   var selectorLocation;
   if (this.state.dragging) {
      // Limit the selector to the clock face's radial plane
      selectorLocation = Point.fromPolar(pointerLocation.theta, this.options.faceRadius);
   } else {
      var angle;
      if (intervalToRender === "hour") {
         angle = Time.getHourAngle(time);
      } else {
         angle = Time.getMinuteAngle(time);
      }

      selectorLocation = Point.fromPolar(angle, this.options.faceRadius);
   }

   // Render the arm
   ctx.strokeStyle = this.options.highlight;
   ctx.beginPath();
   ctx.moveTo(0, 0);
   ctx.lineTo(selectorLocation.x, selectorLocation.y);
   ctx.stroke();

   // Render the selector circle
   ctx.fillStyle = this.options.highlight;
   ctx.beginPath();
   ctx.arc(selectorLocation.x, selectorLocation.y, this.options.selectorRadius, 0, Math.PI * 2);
   ctx.fill();

   // Render the white dot at the center of the clock
   ctx.fillStyle = this.options.color;
   ctx.beginPath();
   ctx.arc(0, 0, 1, 0, Math.PI * 2);
   ctx.fill();
};


/*************************************/
/* Render the hour face of the clock */
/*************************************/
var renderHourFace = function(time, pointerLocation) {
   var ctx = this.ctx;

   // Iterate over the 12 clock face position and render the needed numbers
   util.circleIterate(this.options.faceRadius, 12, function(point, step) {
      ctx.fillStyle    = this.options.color;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.font         = this.options.font;

      // Convert the first step - 0 - to 12 for the clock rendering
      var hour = (step === 0) ? 12 : step;

      ctx.fillText(hour, point.x, point.y);
   }.bind(this));
};


/***************************************/
/* Render the minute face of the clock */
/***************************************/
var renderMinuteFace = function(time, pointerLocation) {
   var ctx = this.ctx;

   // Iterate over the 12 clock face position and render the needed numbers
   util.circleIterate(this.options.faceRadius, 12, function(point, step) {
      ctx.fillStyle    = this.options.color;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.font         = this.options.font;

      var minute = util.padLeft(step * 5, 2, 0);

      ctx.fillText(minute, point.x, point.y);
   }.bind(this));
};


/****************************/
/* Render the period toggle */
/****************************/
var renderPeriodToggle = function(time, pointerLocation) {
   var ctx = this.ctx;
   var amLocation = this.options.amLocation;
   var pmLocation = this.options.pmLocation;

   // Render the highlight around the selected period
   ctx.fillStyle = this.options.highlight;
   ctx.beginPath();
   if (time.period === "am") {
      ctx.arc(amLocation.x, amLocation.y, this.options.selectorRadius, 0, Math.PI * 2);
   } else {
      ctx.arc(pmLocation.x, pmLocation.y, this.options.selectorRadius, 0, Math.PI * 2);
   }
   ctx.fill();

   // Render the period text
   ctx.fillStyle    = this.options.color;
   ctx.font         = this.options.font;
   ctx.textAlign    = "center";
   ctx.textBaseline = "middle";
   ctx.fillText("am", amLocation.x, amLocation.y);
   ctx.fillText("pm", pmLocation.x, pmLocation.y);
};


/***********************************/
/* Render the digital time display */
/***********************************/
var renderTimeDisplay = function(time, pointerLocation) {
   var ctx          = this.ctx;
   ctx.textAlign    = "left";
   ctx.textBaseline = "middle";
   ctx.font         = this.options.timeFont;

   var hour    = util.padLeft((time.hour12 === 0) ? 12 : time.hour12, 2);
   var minute  = util.padLeft(time.minute, 2);
   var period  = time.period;
   var metrics = this.calculateTimeMetrics(time);

   ctx.fillStyle = (this.state.interval === "hour") ? this.options.highlight : this.options.color;
   ctx.fillText(hour, metrics.hour.x, metrics.hour.y);

   ctx.fillStyle = this.options.color;
   ctx.fillText(":", metrics.colon.x, metrics.colon.y);

   ctx.fillStyle = (this.state.interval === "minute") ? this.options.highlight : this.options.color;
   ctx.fillText(minute, metrics.minute.x, metrics.minute.y);

   ctx.fillStyle = this.options.color;
   ctx.fillText(period, metrics.period.x, metrics.period.y);
};



module.exports = {
   render             : render,
   renderAnimation    : renderAnimation,
   renderHourFace     : renderHourFace,
   renderArm          : renderArm,
   renderMinuteFace   : renderMinuteFace,
   renderPeriodToggle : renderPeriodToggle,
   renderTimeDisplay  : renderTimeDisplay,
};