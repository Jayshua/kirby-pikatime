/**************************/
/* Create a time selector */
/**************************/
var Pikatime = function(inputElement) {
   this.state  = "hour"; // Whether we are currently selecting hours or minutes
   this.hour   = 12;     // The currently selected hour
   this.minute = 10;     // The currently selected minute
   this.period = "am";   // The currently selected period

   this.inputElement = inputElement;
   this.createDom();

   // The canvas/ctx of the clock selector
   var canvas = this.canvas;
   this.ctx   = canvas.getContext("2d");
   canvas.height = 300;
   canvas.width  = 250;
   // Bind the click handler to the canvas
   canvas.addEventListener("click", this.handleClick.bind(this));

   this.color      = "white";   // The color of the text
   this.background = "black";   // The background color of the canvas
   this.highlight  = "#8dae28"; // The color of the highlight when something is selected

   this.clockRadius    = 70; // The radius of the clock face
   this.selectedRadius = 15; // The radius of the highlight around selected buttons
   this.controlPadding = 40; // The distance between the clock face and the buttons/time

   // The x/y locations of the am/pm buttons
   this.amX = canvas.width  / 2 - this.clockRadius;
   this.amY = canvas.height / 2 + this.clockRadius + this.controlPadding;
   this.pmX = canvas.width  / 2 + this.clockRadius;
   this.pmY = canvas.height / 2 + this.clockRadius + this.controlPadding;

   this.animationState = { // The state of the clock face animation
      location: 1,         // The current (eased) location of the animation
      linearLocation: 1,   // The linear (not eased) location of the animation
      minuteIn: false,     // Whether the animation is bringing the minute face in
      hourIn:  false       // Whether the animation is bringing the hour face in
   }

   this.render();
};

Pikatime.prototype.createDom = function() {
   var container       = document.createElement("div");
   var canvas          = document.createElement("canvas");
   var buttonContainer = document.createElement("div");
   var cancelButton    = document.createElement("button");
   var okButton        = document.createElement("button");

   container.appendChild(canvas);
   container.appendChild(buttonContainer);
   buttonContainer.appendChild(cancelButton);
   buttonContainer.appendChild(okButton);
   okButton.setAttribute("tabindex", "-1");
   cancelButton.setAttribute("tabindex", "-1");

   okButton    .innerText = "OK";
   cancelButton.innerText = "Cancel";

   container.setAttribute("class", "pikatime-container");

   okButton         .addEventListener("click", this.handleOkClick    .bind(this));
   cancelButton     .addEventListener("click", this.handleCancelClick.bind(this));
   this.inputElement.addEventListener("focus", this.handleInputClick .bind(this));
   this.inputElement.addEventListener("blur",  this.handleBlur       .bind(this));

   this.canvas = canvas;
   this.containerElement = container;
};

Pikatime.prototype.handleInputClick = function() {
   // Set current input type
   this.state = "hour";

   // Get current time from input field
   var time   = /([0-9]+)(:)([0-9]+)/.exec(this.inputElement.value);
   if (time) {
      this.hour   = parseInt(time[1], 10);
      this.minute = parseInt(time[3], 10);
      if (this.hour > 12) {
         this.hour  -= 12;
         this.period = "pm";
      } else {
         this.period = "am";
      }
   } else {
      this.hour   = 12;
      this.minute = 0;
      this.period = "am";
   }

   // Insert selector into dom
   this.inputElement.parentNode.insertBefore(this.containerElement, this.inputElement.nextSibling);

   var rect = this.containerElement.getBoundingClientRect();
   if (rect.right > window.innerWidth) {
      this.containerElement.style.left = "auto";
      this.containerElement.style.right = "0";
   }

   this.interacted = false;
};

Pikatime.prototype.handleBlur = function() {
   setTimeout(function() {
      if (this.interacted === false) {
         this.handleCancelClick();
      }
   }.bind(this), 200);
};

Pikatime.prototype.handleOkClick = function() {
   this.containerElement.parentNode.removeChild(this.containerElement);

   if (this.period === "am")
      this.inputElement.value = this.padString(this.hour, 2)      + ":" + this.padString(this.minute, 2);
   else
      this.inputElement.value = this.padString(this.hour + 12, 2) + ":" + this.padString(this.minute, 2);
};

Pikatime.prototype.handleCancelClick = function() {
   this.containerElement.parentNode.removeChild(this.containerElement);
};

/******************************/
/* Update the animation state */
/******************************/
Pikatime.prototype.updateAnimation = function() {
   // Update the animation state
   this.animationState.linearLocation += 0.05;

   // Check if animation is done and set new state appropriately
   if (this.animationState.linearLocation > 1) {
      this.animationState.linearLocation = 1;

      if (this.animationState.hourIn)
         this.state = "hour";
      if (this.animationState.minuteIn)
         this.state = "minute";

      this.animationState.minuteIn = false;
      this.animationState.hourIn   = false;
   }

   // Ease the actual animation using the sin function
   this.animationState.location = Math.sin((Math.PI / 2) * this.animationState.linearLocation);
};

/****************************************/
/* Begin an animation of the clock face */
/****************************************/
Pikatime.prototype.animate = function(type) {
   this.animationState[type] = true;
   this.animationState.linearLocation = 0;
};

/*****************************************/
/* Test if a point is inside a rectangle */
/*****************************************/
Pikatime.prototype.intersects = function(testX, testY, x, y, width, height) {
   return (testX > x && testX < x + width &&
           testY > y && testY < y + height);
};

/******************************************************/
/* Test if a point is inside a rectangle with x and y */
/* given as the center of the rectangle               */
/******************************************************/
Pikatime.prototype.centerIntersects = function(testX, testY, x, y, radius) {
   return (testX > x - this.selectedRadius && testX < x + this.selectedRadius &&
           testY > y - this.selectedRadius && testY < y + this.selectedRadius);
};

/******************************************************/
/* Test if a set of coordinates are within one of the */
/* numbers on the clock face                          */
/******************************************************/
Pikatime.prototype.intersectsClock = function(x, y) {
   var canvas = this.canvas;
   var iteratee = (Math.PI * 2) / 12;

   for (var i = 0; i < 12; i++) {
      var numberX = Math.cos(iteratee * i - Math.PI / 2) * this.clockRadius;
      var numberY = Math.sin(iteratee * i - Math.PI / 2) * this.clockRadius;
      numberX += canvas.width  / 2;
      numberY += canvas.height / 2;

      if (this.centerIntersects(x, y, numberX, numberY, this.selectedRadius)) {
         if (this.state === "hour")
            return (i === 0) ? 12 : i;
         else
            return i * 5;
      }
   }

   return false;
};

/*********************************************/
/* Handle clicks on the time selector canvas */
/*********************************************/
Pikatime.prototype.handleClick = function(evt) {
   var canvas      = this.canvas;
   var rect        = this.canvas.getBoundingClientRect();
   var mouseX      = evt.clientX - rect.left;
   var mouseY      = evt.clientY - rect.top;
   var timeMetrics = this.timeMetrics();

   this.interacted = true;

   // Check for a click on the clock numbers
   var numberIntersected = this.intersectsClock(mouseX, mouseY);
   if (numberIntersected !== false) {
      if (this.state === "hour") {
         this.hour = numberIntersected;
         this.animate("minuteIn");
      } else {
         this.minute = numberIntersected;
      }
   }

   // Check for a click on the periods
   if (this.centerIntersects(mouseX, mouseY, this.amX, this.amY, this.selectedRadius))
      this.period = "am";
   if (this.centerIntersects(mouseX, mouseY, this.pmX, this.pmY, this.selectedRadius))
      this.period = "pm";

   // Check for a click on the hours
   if (this.intersects(mouseX, mouseY, timeMetrics.hourX, timeMetrics.timeY - timeMetrics.height, timeMetrics.hourWidth, timeMetrics.height))
      if (this.state === "minute") this.animate("hourIn");

   // Check for a click on the minutes
   if (this.intersects(mouseX, mouseY, timeMetrics.minuteX, timeMetrics.timeY - timeMetrics.height, timeMetrics.minuteWidth, timeMetrics.height))
      if (this.state === "hour") this.animate("minuteIn");

};

/***********************************************************/
/* Pad a string with 0 (by default) to the specified width */
/***********************************************************/
Pikatime.prototype.padString = function(string, width, placeholder) {
   placeholder = placeholder || '0';
   string = string + '';

   if (string.length >= width) {
      return string;
   } else {
      return new Array(width - string.length + 1).join(placeholder) + string;
   }
};

/**************************************************/
/* Calculate the width/height of the time display */
/**************************************************/
Pikatime.prototype.timeMetrics = function() {
   var canvas = this.canvas;
   var ctx    = this.ctx;
   var hour   = this.padString(this.hour, 2, 0);
   var minute = this.padString(this.minute, 2, 0);
   var period = this.period;

   // Find width of time + period
   ctx.font = "24px Arial";
   var hourWidth   = ctx.measureText(hour).width;
   var minuteWidth = ctx.measureText(minute).width;
   var colonWidth  = ctx.measureText(":").width;

   ctx.font = "12px Arial";
   var periodWidth = ctx.measureText(period).width;

   var totalWidth  = hourWidth + colonWidth + minuteWidth + periodWidth;

   // Calculate left end of time and period
   var timeY   = canvas.height / 2 - this.clockRadius - this.controlPadding;
   var hourX   = (canvas.width / 2 - totalWidth / 2);
   var colonX  = hourX   + hourWidth;
   var minuteX = colonX  + colonWidth;
   var periodX = minuteX + minuteWidth;

   return {
      timeY:       timeY,
      hourX:       hourX,
      colonX:      colonX,
      minuteX:     minuteX,
      periodX:     periodX,
      hourWidth:   hourWidth,
      colonWidth:  colonWidth,
      minuteWidth: minuteWidth,
      periodWidth: periodWidth,
      height: 24
   }
};

/************************************************/
/* Render the currently selected time indicator */
/************************************************/
Pikatime.prototype.renderTime = function() {
   var canvas = this.canvas;
   var ctx    = this.ctx;
   var hour   = this.padString(this.hour, 2, 0);
   var minute = this.padString(this.minute, 2, 0);
   var period = this.period;
   var metrics = this.timeMetrics();

   ctx.textAlign    = "left";
   ctx.textBaseline = "alphabetic";
   ctx.font         = "24px Arial";

   // Draw Hour
   ctx.fillStyle = (this.state === "hour") ? this.highlight : this.color;
   ctx.fillText(hour, metrics.hourX, metrics.timeY);

   // Draw Colon
   ctx.fillStyle = this.color;
   ctx.fillText(":", metrics.colonX, metrics.timeY);

   // Draw Minute
   ctx.fillStyle = (this.state === "minute") ? this.highlight : this.color;
   ctx.fillText(minute, metrics.minuteX, metrics.timeY);

   // Draw period
   ctx.font = "12px Arial";
   ctx.fillStyle = this.color;
   ctx.fillText(period, metrics.periodX, metrics.timeY);
};


/*******************************************/
/* Render the clock face and selector dial */
/*******************************************/
Pikatime.prototype.renderClock = function(type) {
   var ctx          = this.ctx;
   var canvas       = this.canvas;

   ctx.fillColor    = this.color;
   ctx.textAlign    = "center";
   ctx.textBaseline = "middle";

   // Iterator over the 12 clock face position and render the needed numbers
   for (var i = 0; i < 12; i++) {  
      var x = Math.cos( (((Math.PI * 2) / 12) * i) - Math.PI / 2 ) * this.clockRadius;
      var y = Math.sin( (((Math.PI * 2) / 12) * i) - Math.PI / 2 ) * this.clockRadius;

      if (type === "hour") {
         // Render hour marks
         var hour = (i === 0) ? 12 : i;

         if (this.hour === hour) {
            this.renderClockSelector(x, y);
            ctx.fillStyle = this.color;
         }

         ctx.fillText(hour, x, y);
      } else {
         // Render Minute Marks
         var minute = i * 5;

         if (this.minute === minute) {
            this.renderClockSelector(x, y);
            this.fillStyle = this.color;
         }

         ctx.fillText(this.padString(minute, 2, 0), x, y);
      }
   }
};

/**************************************/
/* Render the clock face selector arm */
/**************************************/
Pikatime.prototype.renderClockSelector = function(x, y) {
   var ctx    = this.ctx;
   var canvas = this.canvas;

   ctx.fillStyle   = this.highlight;
   ctx.strokeStyle = this.highlight;

   // Render the selector circle
   ctx.beginPath();
   ctx.arc(x, y, this.selectedRadius, 0, Math.PI * 2);
   ctx.fill();

   // Render the selector arm
   ctx.beginPath();
   ctx.moveTo(0, 0);
   ctx.lineTo(x, y);
   ctx.stroke();

   // Render the white dot at the center of the clock
   ctx.fillStyle = this.color;
   ctx.beginPath();
   ctx.arc(0, 0, 1, 0, Math.PI * 2);
   ctx.fill();
};

/***********************************************************************/
/* Render the period text and the highlight around the selected period */
/***********************************************************************/
Pikatime.prototype.renderPeriod = function() {
   var canvas = this.canvas;
   var ctx = this.ctx;

   // Render the highlight around the selected period
   ctx.fillStyle = this.highlight;
   ctx.beginPath();
   if (this.period === "am") {
      ctx.arc(this.amX, this.amY, this.selectedRadius, 0, Math.PI * 2);
   } else {
      ctx.arc(this.pmX, this.pmY, this.selectedRadius, 0, Math.PI * 2);
   }
   ctx.fill();

   // Render the period text
   ctx.fillStyle    = this.color;
   ctx.textAlign    = "center";
   ctx.textBaseline = "middle";
   ctx.fillText("am", this.amX, this.amY);
   ctx.fillText("pm", this.pmX, this.pmY);
};

/***********************************/
/* Render the entire clock control */
/***********************************/
Pikatime.prototype.render = function() {
   var ctx = this.ctx;
   var canvas = this.canvas;

   ctx.fillStyle = "black";
   ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

   // Render the time display
   this.renderTime();

   // Render the current clock
   ctx.save();
   ctx.translate(canvas.width / 2, canvas.height / 2);
   if (this.animationState.location < 1) {
      // Render the clock face with animation
      // Render the exiting face
      ctx.save();
      ctx.scale(1 + (this.animationState.location / 3), 1 + (this.animationState.location / 3));
      ctx.globalAlpha = 1 - this.animationState.location;
      if (this.animationState.hourIn)
         this.renderClock("minute");
      else
         this.renderClock("hour");
      ctx.restore();
      ctx.globalAlpha = 1;

      // Render the entering face
      ctx.save();
      ctx.scale(this.animationState.location / 3 + 0.66, this.animationState.location / 3 + 0.66);
      ctx.globalAlpha = this.animationState.location;
      if (this.animationState.minuteIn)
         this.renderClock("minute");
      else
         this.renderClock("hour");
      ctx.restore();
      ctx.globalAlpha = 1;
   } else {
      // Render the clock face without animation
      this.renderClock(this.state);
   }
   ctx.restore();

   // Render the periods
   this.renderPeriod();

   // Update the animation state
   this.updateAnimation();

   // Call render in the future
   window.requestAnimationFrame(this.render.bind(this));
};


$.fn.pikatime = function() {
   return this.each(function() {
      $this = $(this);

      if ($this.data("pikatime")) {
         return $this.data("pikatime");
      } else {
         $this.data("pikatime", new Pikatime(this));
         return $this.data("pikatime");
      }
   });
}

// var mySelector = new Selector(document.getElementById("input"));
// mySelector.render();