var util = require("../../util");

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