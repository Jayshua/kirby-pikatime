var util  = require("../../util");
var Point = require("../../point");
var Time  = require("../../time");



/******************************************************/
/* Constructor - Create a 12 hour format time control */
/******************************************************/
var Face12 = function(ctx, options) {
   this.canvas = ctx.canvas;
   this.ctx    = ctx;

   this.options = util.extend({
      font          : "12px Arial", // The font of the numerals around the clock face
      timeFont      : "24px Arial", // The font of the time display
      faceRadius    : 70,           // The radius of the face
      selectorRadius: 15,           // The radius of the green circle when something is selected
      timeY         : -70 - 50,     // The y coordinate of the time display
      amLocation    : Point.fromCart(-50, 110), // The location of the am selector
      pmLocation    : Point.fromCart(+50, 110), // The location of the pm selector
   }, options);

   this.state = {
      animation: 0, // From 0-1
      isAnimating: false,
      interval: "hour",    // The interval (minute/second) currently being selected
      dragging: false      // Whether the user is currently dragging the selector
   };

   util.on("interactionStart", this.handleInteractionStart.bind(this));
   util.on("interactionEnd",   this.handleInteractionEnd  .bind(this));
   util.on("controlOpen",      function() {this.state.interval = "hour"}.bind(this));
};


/************************************************************************************/
/* Set the currently being selected interval, prepping the animation in the process */
/************************************************************************************/
Face12.prototype.setInterval = function(interval) {
   if (this.state.interval === interval) {
      return;
   }

   setTimeout(function() {
      this.state.isAnimating = true;
   }.bind(this), 10);
};

/*****************************************************/
/* Calculate the metrics of the digital time display */
/*****************************************************/
Face12.prototype.timeMetrics = function(time) {
   var ctx = this.ctx;
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
      totalWidth:  totalWidth,
      hourWidth:   hourWidth,
      colonWidth:  colonWidth,
      minuteWidth: minuteWidth,
      periodWidth: periodWidth,
      hour:        Point.fromCart(hourX,   this.options.timeY),
      colon:       Point.fromCart(colonX,  this.options.timeY),
      minute:      Point.fromCart(minuteX, this.options.timeY),
      period:      Point.fromCart(periodX, this.options.timeY),
   };
};


/****************************************************************************************/
/* Determine if the start of an interaction indicates the beginning of a drag operation */
/****************************************************************************************/
Face12.prototype.handleInteractionStart = function(point, state) {
   // Calculate the location of the selector
   var angle = (this.state.interval === "hour") ? Time.getHourAngle(state.time) : Time.getMinuteAngle(state.time);
   var selectorLocation = Point.fromPolar(angle, this.options.faceRadius);
   selectorLocation = Point.rotate(selectorLocation, -Math.PI / 2)

   if (util.intersects(point, selectorLocation, this.options.selectorRadius)) {
      this.state.dragging = true;
   }
};


/****************************************************************************************/
/* Complete the dragging or selecting operation by setting the time to the chosen value */
/****************************************************************************************/
Face12.prototype.handleInteractionEnd = function(point, state) {
   if (this.state.dragging === true) {
      var selectedAngle = Point.getPolar(state.pointerLocation).theta;

      // The clock face has 12 at the top, but angels are calculated from the right
      // This adjusts to accommodate the rotated clock face
      selectedAngle += Math.PI / 2;

      // Get the selected time
      var currentTime = Time.get12(state.time);
      var newTime;
      if (this.state.interval === "hour") {
         newTime = Time.from12(Time.hourFromAngle(selectedAngle), currentTime.minute, currentTime.period);
         this.setInterval("minute");
      } else {
         newTime = Time.from12(currentTime.hour, Time.minuteFromAngle(selectedAngle), currentTime.period);
      }

      // Notify the rest of the system of the new time
      util.trigger("timeChange", newTime);

      // Complete the dragging operation
      this.state.dragging = false;
   } else {
      // Iterate over the 12 points around the clock face and to see if the interaction was in any of them
      util.circleIterate(this.options.faceRadius, 12, function(point, step) {
         // If the interaction intersects the current point around the circle, trigger a time change
         if (util.intersects(state.pointerLocation, point, this.options.selectorRadius)) {

            // Rotate the point to accommodate the rotated clock face
            point = Point.rotate(point, Math.PI / 2);

            // Calculate the new time
            var currentTime = Time.get12(state.time);
            var newTime;
            if (this.state.interval === "hour") {
               var selectedHour = Time.hourFromAngle(Point.getPolar(point).theta);
               newTime = Time.from12(selectedHour, currentTime.minute, currentTime.period);
               this.setInterval("minute");
            } else {
               var selectedMinute = Time.minuteFromAngle(Point.getPolar(point).theta);
               newTime = Time.from12(currentTime.hour, selectedMinute, currentTime.period);
            }

            // Trigger the time change
            util.trigger("timeChange", newTime);
         }
      }.bind(this));


      var currentTime = Time.get12(state.time);

      // Test if the interaction intersects the AM period button
      if (util.intersects(state.pointerLocation, this.options.amLocation, this.options.selectorRadius * 2)) {
         util.trigger("timeChange", Time.from12(currentTime.hour, currentTime.minute, "am"));
      }

      // Test if the interaction intersects the PM period button 
      if (util.intersects(state.pointerLocation, this.options.pmLocation, this.options.selectorRadius * 2)) {
         util.trigger("timeChange", Time.from12(currentTime.hour, currentTime.minute, "pm"));
      }

      // Test if the interaction intersects the hour display
      var displayMetrics = this.timeMetrics(currentTime);
      var hourLocation = Point.add(displayMetrics.hour, Point.fromCart(displayMetrics.hourWidth / 2, 0));
      var minuteLocation = Point.add(displayMetrics.minute, Point.fromCart(displayMetrics.minuteWidth / 2, 0));
      if (util.intersects(state.pointerLocation, hourLocation, displayMetrics.hourWidth / 2)) {
         this.setInterval("hour");
      }

      // Test if the interaction intersects the minute display
      console.log(displayMetrics.minuteWidth);
      if (util.intersects(state.pointerLocation, minuteLocation, displayMetrics.minuteWidth / 2)) {
         this.setInterval("minute");
      }
   }

};




/*************************/
/* Render the clock face */
/*************************/
Face12.prototype.render = function(parentState) {
   var localState = util.extend(parentState, this.state);


   this.renderPeriodToggle(localState);
   this.renderTimeDisplay(localState);


   if (this.state.isAnimating) {
      this.state.animation += 0.04;
      var a = this.state.animation;
      var animationPoint;
      

      this.ctx.save();
      this.ctx.scale(1 + (0.3 * animationPoint), 1 + (0.3 * animationPoint));
      this.ctx.globalAlpha = (1 - animationPoint > 0) ? 1 - animationPoint : 0;
      this.renderArm(localState, this.state.interval);
      (this.state.interval === "hour") ? this.renderHourFace(localState) : this.renderMinuteFace(localState);
      this.ctx.restore();

      this.ctx.save();
      this.ctx.scale(0.7 + (0.3 * animationPoint), 0.7 + (0.3 * animationPoint));
      this.ctx.globalAlpha = animationPoint;
      this.renderArm(localState, (this.state.interval === "hour") ? "minute" : "hour");
      (this.state.interval === "hour") ? this.renderMinuteFace(localState) : this.renderHourFace(localState);
      this.ctx.restore();

      if (this.state.animation >= 1) {
         this.state.isAnimating = false;
         this.state.animation = 0;
         this.state.interval = (this.state.interval === "hour") ? "minute" : "hour";
         debugger;
      }
   } else {
      this.renderArm(localState, localState.interval);
      if (localState.interval === "hour") {
         this.renderHourFace(localState);
      } else {
         this.renderMinuteFace(localState);
      }
   }

};


/**************************************/
/* Render the clock face selector arm */
/**************************************/
Face12.prototype.renderArm = function(state, intervalToRender) {
   var ctx = this.ctx;
   var canvas = this.canvas;

   // Calculate the location of the current time
   var selectorLocation;
   if (state.dragging) {
      // If dragging, set the selector to the interaction
      // location, limited to the clock face's circular plane
      let pointer = Point.getPolar(state.pointerLocation);
      selectorLocation = Point.fromPolar(pointer.theta, this.options.faceRadius);
   } else {
      // If not dragging, set the selector to the current time
      var angle;
      if (intervalToRender === "hour") {
         angle = Time.getHourAngle(state.time);
      } else {
         angle = Time.getMinuteAngle(state.time);
      }

      selectorLocation = Point.fromPolar(angle, this.options.faceRadius);
      selectorLocation = Point.rotate(selectorLocation, -Math.PI / 2);
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
Face12.prototype.renderHourFace = function(state) {
   var ctx = this.ctx;

   // Iterate over the 12 clock face position and render the needed numbers
   util.circleIterate(this.options.faceRadius, 12, function(point, step) {
      ctx.fillStyle    = this.options.color;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.font         = this.options.font;

      // Convert the first step - 0 - to 12 for the clock rendering
      var hour = (step === 0) ? 12 : step;
      point = Point.rotate(point, -Math.PI / 2);

      ctx.fillText(hour, point.x, point.y);
   }.bind(this));
};


/***************************************/
/* Render the minute face of the clock */
/***************************************/
Face12.prototype.renderMinuteFace = function(state) {
   var ctx = this.ctx;

   // Iterate over the 12 clock face position and render the needed numbers
   util.circleIterate(this.options.faceRadius, 12, function(point, step) {
      ctx.fillStyle    = this.options.color;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.font         = this.options.font;

      var minute = util.padLeft(step * 5, 2, 0);
      point = Point.rotate(point, -Math.PI / 2);

      ctx.fillText(minute, point.x, point.y);
   }.bind(this));
};


/****************************/
/* Render the period toggle */
/****************************/
Face12.prototype.renderPeriodToggle = function(state) {
   var ctx = this.ctx;
   var amLocation = this.options.amLocation;
   var pmLocation = this.options.pmLocation;

   // Render the highlight around the selected period
   ctx.fillStyle = this.options.highlight;
   ctx.beginPath();
   if (Time.get12(state.time).period === "am") {
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
Face12.prototype.renderTimeDisplay = function(state) {
   var ctx          = this.ctx;
   ctx.textAlign    = "left";
   ctx.textBaseline = "middle";
   ctx.font         = this.options.timeFont;

   var time    = Time.get12(state.time);
   var hour    = util.padLeft((time.hour === 0) ? 12 : time.hour, 2);
   var minute  = util.padLeft(time.minute, 2);
   var period  = time.period;
   var metrics = this.timeMetrics(time);

   ctx.fillStyle = (state.interval === "hour") ? this.options.highlight : this.options.color;
   ctx.fillText(hour, metrics.hour.x, metrics.hour.y);

   ctx.fillStyle = this.options.color;
   ctx.fillText(":", metrics.colon.x, metrics.colon.y);

   ctx.fillStyle = (state.interval === "minute") ? this.options.highlight : this.options.color;
   ctx.fillText(minute, metrics.minute.x, metrics.minute.y);

   ctx.fillStyle = this.options.color;
   ctx.fillText(period, metrics.period.x, metrics.period.y);
};



module.exports = Face12;
