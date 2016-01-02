var util = require("../../util");

module.exports = function(ctx, options) {
   var canvas = ctx.canvas;
   
   var state = {
      interval: "hour" // The interval (hour/minute) currently being selected
   };

   options = util.extend({
      selectedRadius: 15, // The radius of the circle when something is selected
      face24Radius:   90, // The radius of the 24 hour part of the face
      face12Radius:   60, // The radius of the 12 hour part of the face
      minuteRadius:   75, // The radius of the minute part of the face
      timeY:          20, // The y location of the time display
      font:           "12px Arial", // The font of the numerals around the clock face
      timeFont:       "24px Arial", // The font of the time display
   }, options);


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
   var timeMetrics = function(hour, minute) {
      ctx.font         = options.timeFont;

      var hourWidth   = ctx.measureText(hour)  .width;
      var colonWidth  = ctx.measureText(":")   .width;
      var minuteWidth = ctx.measureText(minute).width;
      var totalWidth  = hourWidth + colonWidth + minuteWidth;

      var hourX   = (canvas.width / 2) - (totalWidth / 2);
      var colonX  = hourX  + hourWidth;
      var minuteX = colonX + colonWidth;
      
      return {
         hourWidth:   hourWidth,
         colonWidth:  colonWidth,
         minuteWidth: minuteWidth,
         totalWidth:  totalWidth,
         hourX:       hourX,
         colonX:      colonX,
         minuteX:     minuteX
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
      // Iterator over the 12 inner clock face position and render the needed numbers
      center(options.face12Radius, function(x, y, step) {
         ctx.fillStyle    = options.color;
         ctx.textAlign    = "center";
         ctx.textBaseline = "middle";
         ctx.font         = options.font;

         var hour = (step === 0) ? 12 : step;

         if (state.hour === hour)
            renderClockSelector(x, y);

         ctx.fillText(hour, x, y);
      });

      // Iterator over the 12 outer clock face position and render the needed numbers
      center(options.face24Radius, function(x, y, step) {
         ctx.fillStyle    = options.color;
         ctx.textAlign    = "center";
         ctx.textBaseline = "middle";
         ctx.font         = options.font;

         var hour = step + 12;
         if (hour === 12) hour = 0;
         
         if (state.hour === hour)
            renderClockSelector(x, y);

         ctx.fillText(util.padString(hour, 2), x, y);
      });
   };
   
   /***************************************/
   /* Render the minute face of the clock */
   /***************************************/
   var renderMinuteFace = function(state) {
      // Iterator over the 12 clock face position and render the needed numbers
      center(options.minuteRadius, function(x, y, step) {
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

   /**************************************************/
   /* Render the display that shows the current time */
   /**************************************************/
   var renderTimeDisplay = function(state) {
      ctx.textAlign    = "left";
      ctx.textBaseline = "top";
      ctx.font         = options.timeFont;

      var hour    = util.padString(state.hour,   2);
      var minute  = util.padString(state.minute, 2);
      var metrics = timeMetrics(hour, minute);

      ctx.fillStyle = (state.interval === "hour") ? options.highlight : options.color;
      ctx.fillText(hour, metrics.hourX, options.timeY);

      ctx.fillStyle = options.color;
      ctx.fillText(":", metrics.colonX, options.timeY);

      ctx.fillStyle = (state.interval === "minute") ? options.highlight : options.color;
      ctx.fillText(minute, metrics.minuteX, options.timeY);
   };

   /********************************/
   /* Render the entire clock face */
   /********************************/
   var render = function(parentState) {
      var localState = util.extend(parentState, state);

      if (localState.interval === "hour") {
         renderHourFace(localState);
      } else {
         renderMinuteFace(localState);
      }

      renderTimeDisplay(localState);
   };

   /***********************************/
   /* Handle clicks on the clock face */
   /***********************************/
   util.onClick(canvas, function(mouseX, mouseY) {
      if (state.interval === "hour") {
         // Test for click on the inner face
         center(options.face12Radius, function(numberX, numberY, step) {
            if (util.centerIntersects(mouseX, mouseY, numberX, numberY, options.selectedRadius)) {
               var newHour = (step === 0) ? 12 : step;
               util.trigger("hourChange", newHour);
               state.interval = "minute";
            }
         });

         // Test for click on the outer face
         center(options.face24Radius, function(numberX, numberY, step) {
            if (util.centerIntersects(mouseX, mouseY, numberX, numberY, options.selectedRadius)) {
               var newHour = step + 12;
               if (newHour === 12) newHour = 0;
               util.trigger("hourChange", newHour);
               state.interval = "minute";
            }
         });
      } else {
         // Test for clicks on the minute face
         center(options.minuteRadius, function(numberX, numberY, step) {
            if (util.centerIntersects(mouseX, mouseY, numberX, numberY, options.selectedRadius)) {
               var newMinute = step * 5;
               util.trigger("minuteChange", newMinute);
            }
         });
      }

      // Test for clicks on the time display
      var metrics = timeMetrics();
      // Click on the hour display
      if (util.intersects(mouseX, mouseY, metrics.hourX, options.timeY, metrics.hourWidth, 24)) {
         state.interval = "hour";
      }
      // Click on the minute display
      if (util.intersects(mouseX, mouseY, metrics.minuteX, options.timeY, metrics.minuteWidth, 24)) {
         state.interval = "minute";
      }
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
