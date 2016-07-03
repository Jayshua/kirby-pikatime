var util  = require("../../util");
var Time  = require("../../time");
var Point = require("../../point");



/****************************************************************************************/
/* Determine if the start of an interaction indicates the beginning of a drag operation */
/****************************************************************************************/
var handleInteractStart = function(interactionPoint, time) {
   // Calculate the location of the selector
   var selectorLocation;
   if (this.state.interval === "hour") {
      var angle = Time.getHourAngle(time);
      var radius = (time.hour < 12) ? this.options.face12Radius : this.options.face24Radius;
      selectorLocation = Point.fromPolar(angle, radius);
      selectorLocation = Point.add(selectorLocation, this.options.faceLocation);
   } else {
      var angle = Time.getMinuteAngle(time);
      selectorLocation = Point.fromPolar(angle, this.options.minuteRadius);
      selectorLocation = Point.add(selectorLocation, this.options.faceLocation);
   }

   // Check if this interaction is occurring on the selector
   if (util.intersects(interactionPoint, selectorLocation, this.options.selectorRadius)) {
      this.state.dragging = true;
   } else {
      this.state.interacting = true;
   }
};


/****************************************************************************************/
/* Complete the dragging or selecting operation by setting the time to the chosen value */
/****************************************************************************************/
var handleInteractEnd = function(pointer, time) {
   pointer = Point.subtract(pointer, this.options.faceLocation);

   if (this.state.dragging) {
      handleDragEnd.call(this, pointer, time);
   } else if (this.state.interacting) {
      handleSelectEnd.call(this, pointer, time);
   }

   this.state.dragging = false;
};


/*********************************************************************/
/* Determine if the user's dragging interaction causes a time change */
/*********************************************************************/
var handleDragEnd = function(pointer, time) {
   var newTime;

   if (this.state.interval === "hour") {
      var hour = Time.hourFromAngle(pointer.theta);
      var faceMidRadius = (this.options.face12Radius + this.options.face24Radius) / 2;
      if (pointer.radius > faceMidRadius) hour += 12;
      newTime = Time.from24(hour, time.minute);
      this.changeInterval("minute");
   } else {
      var minute = Time.minuteFromAngle(pointer.theta);
      newTime = Time.from24(time.hour, minute);
   }

   util.trigger("timeChange", newTime);
};


/*****************************************************************************/
/* Determine if the user's clicking/tapping interaction causes a time change */
/*****************************************************************************/
var handleSelectEnd = function(pointer, time) {
   // Detect interactions on the clock face
   if (this.state.interval === "hour") {
      // Calculate the range that the pointer must be in to count as a click on the face
      var lower12Radius =  this.options.face12Radius - this.options.selectorRadius;
      var midRadius     = (this.options.face12Radius + this.options.face24Radius) / 2;
      var upper24Radius =  this.options.face24Radius + this.options.selectorRadius;

      // Determine which face, if any, the click occurred on
      if (pointer.radius > lower12Radius && pointer.radius < midRadius) {
         var newHour = Time.hourFromAngle(pointer.theta);
         util.trigger("timeChange", Time.from24(newHour, time.minute));
         this.changeInterval("minute");
      } else if (pointer.radius > midRadius && pointer.radius < upper24Radius) {
         var newHour = Time.hourFromAngle(pointer.theta) + 12;
         util.trigger("timeChange", Time.from24(newHour, time.minute));
         this.changeInterval("minute");
      }
   } else {
      // Calculate the range that the pointer must be in to count as a click on the face
      var lowerRadius = this.options.minuteRadius - this.options.selectorRadius;
      var upperRadius = this.options.minuteRadius + this.options.selectorRadius;

      // Determine if the pointer was within the proper radius to count as a click on the face
      if (pointer.radius > lowerRadius && pointer.radius < upperRadius) {
         var newMinute = Time.minuteFromAngle(pointer.theta);
         util.trigger("timeChange", Time.from24(time.hour, newMinute));
      }
   }

   // Detect interactions on the digital time display
   var timeMetrics = this.calculateTimeMetrics(time);

   // Time metrics are calculated from the left side of the digits, we need them from the middle
   var hourLocation = Point.add(timeMetrics.hour, Point.fromCart(timeMetrics.hourWidth / 2, 0));
   var minuteLocation = Point.add(timeMetrics.minute, Point.fromCart(timeMetrics.minuteWidth / 2, 0));

   // Test for interaction on the hour segment
   if (util.intersects(hourLocation, pointer, timeMetrics.hourWidth / 2)) {
      this.changeInterval("hour");
   }

   // Test for interaction on the minute segment
   if (util.intersects(minuteLocation, pointer, timeMetrics.minuteWidth / 2)) {
      this.changeInterval("minute");
   }
};



module.exports = {
   handleInteractStart: handleInteractStart,
   handleInteractEnd:   handleInteractEnd
};
