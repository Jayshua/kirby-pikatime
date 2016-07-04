/******************************************************************/
/* Face12 Interaction
/* ------------------
/* Handles the user click/tap/dragging interactions on clock face.
/*
/******************************************************************/
var util  = require("../../util");
var Point = require("../../point");
var Time  = require("../../time");



/****************************************************************************************/
/* Determine if the start of an interaction indicates the beginning of a drag operation */
/****************************************************************************************/
var handleInteractionStart = function(pointer, time) {
   // Calculate the location of the selector
   var angle = (this.state.interval === "hour") ? Time.getHourAngle(time) : Time.getMinuteAngle(time);
   var selectorLocation = Point.fromPolar(angle, this.options.faceRadius);

   // Set the current dragging state to true if the interaction started on the selector
   if (util.intersects(pointer, selectorLocation, this.options.selectorRadius)) {
      this.state.dragging = true;
   }
};


/****************************************************************************************/
/* Complete the dragging or click/tap operation by setting the time to the chosen value */
/****************************************************************************************/
var handleInteractionEnd = function(pointer, time) {
   if (this.state.dragging === true) {
      this.handleDragEnd(pointer, time);
   } else {
      this.handleFaceInteract(pointer, time);
      this.handlePeriodInteract(pointer, time);
      this.handleDisplayInteract(pointer, time);
   }
};


/*********************************************************************************************/
/* Handle the completion of a drag operation by setting the current time to the chosen value */
/*********************************************************************************************/
var handleDragEnd = function(pointer, time) {
   // Get the selected time
   var newTime;
   if (this.state.interval === "hour") {
      newTime = Time.from12(Time.hourFromAngle(pointer.theta), time.minute, time.period);
      this.setInterval("minute");
   } else {
      newTime = Time.from24(time.hour, Time.minuteFromAngle(pointer.theta));
   }

   // Notify the rest of the system of the new time
   util.trigger("timeChange", newTime);

   // Complete the dragging operation
   this.state.dragging = false;
};


/******************************************************************************/
/* Test if the click/tap was on the clock face and set the current time if so */
/******************************************************************************/
var handleFaceInteract = function(pointer, time) {
   // Calculate the radial area within which a click/tap is a valid time choice
   var innerRadius = this.options.faceRadius - this.options.selectorRadius / 2;
   var outerRadius = this.options.faceRadius + this.options.selectorRadius / 2;

   // Test if the click is a valid choice and set the current time if so
   if (pointer.radius > innerRadius && pointer.radius < outerRadius) {
      var newTime;
      if (this.state.interval === "hour") {
         newTime = Time.from12(Time.hourFromAngle(pointer.theta), time.minute, time.period);
         this.setInterval("minute");
      } else {
         newTime = Time.from24(time.hour, Time.minuteFromAngle(pointer.theta));
      }

      util.trigger("timeChange", newTime);
   }
};


/*********************************************************************************/
/* Test if the click/tap was on the period toggle and set the current time if so */
/*********************************************************************************/
var handlePeriodInteract = function(pointer, time) {
   // Test if the interaction intersects the AM period button
   if (util.intersects(pointer, this.options.amLocation, this.options.selectorRadius * 2)) {
      util.trigger("timeChange", Time.from12(time.hour12, time.minute, "am"));
   }

   // Test if the interaction intersects the PM period button 
   if (util.intersects(pointer, this.options.pmLocation, this.options.selectorRadius * 2)) {
      util.trigger("timeChange", Time.from12(time.hour12, time.minute, "pm"));
   }
};


/***********************************************************************************/
/* Test if the click/tap was on the digital display and set the current time if so */
/***********************************************************************************/
var handleDisplayInteract = function(pointer, time) {
   var displayMetrics = this.calculateTimeMetrics(time);

   // Test if the interaction intersects the hour display
   var hourLocation = Point.add(displayMetrics.hour, Point.fromCart(displayMetrics.hourWidth / 2, 0));
   if (util.intersects(pointer, hourLocation, displayMetrics.hourWidth / 2)) {
      this.setInterval("hour");
   }

   // Test if the interaction intersects the minute display
   var minuteLocation = Point.add(displayMetrics.minute, Point.fromCart(displayMetrics.minuteWidth / 2, 0));
   if (util.intersects(pointer, minuteLocation, displayMetrics.minuteWidth / 2)) {
      this.setInterval("minute");
   }
};



module.exports = {
   handleInteractionStart : handleInteractionStart,
   handleInteractionEnd   : handleInteractionEnd,
   handleDragEnd          : handleDragEnd,
   handleFaceInteract     : handleFaceInteract,
   handlePeriodInteract   : handlePeriodInteract,
   handleDisplayInteract  : handleDisplayInteract,
};