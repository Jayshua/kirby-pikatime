module.exports = {
   /**********************************************************************/
   /* Return a new object with all the properties from the two arguments */
   /**********************************************************************/
   extend: function(obj1, obj2) {
      obj1 = obj1 || {};
      obj2 = obj2 || {};

      var newObj = {}; // The new object to return

      // Add all the properties of obj1 to the new object
      for (var key in obj1) {
         if (obj1.hasOwnProperty(key)) {
            newObj[key] = obj1[key];
         }
      }

      // Add all the properties of obj2 to the new object
      for (var key in obj2) {
         if (obj2.hasOwnProperty(key)) {
            newObj[key] = obj2[key];
         }
      }

      return newObj;
   },

   /*****************************************/
   /* Test if a point is inside a rectangle */
   /*****************************************/
   intersects: function(testX, testY, rectX, rectY, width, height) {
      return (testX > rectX && testX < rectX + width &&
              testY > rectY && testY < rectY + height);
   },

   /******************************************************/
   /* Test if a point is inside a square where squareX   */
   /* and squareY are given as the center of the square  */
   /******************************************************/
   centerIntersects: function(testX, testY, squareX, squareY, squareSize) {
      return (testX > squareX - squareSize && testX < squareX + squareSize &&
              testY > squareY - squareSize && testY < squareY + squareSize);
   },

   /***********************************************************/
   /* Pad a string with 0 (by default) to the specified width */
   /***********************************************************/
   padString: function(string, width, placeholder) {
      placeholder = placeholder || '0'; // The character to pad the string with
      string = string + '';             // Cast the passed in value to a string

      if (string.length >= width) {
         return string;
      } else {
         return new Array(width - string.length + 1).join(placeholder) + string;
      }
   },

   /************************************************************/
   /* Iterate around a circle passing the x and y coordinates  */
   /* for each point to the passed function                    */
   /************************************************************/
   circleForEach: function(radius, steps, func) {
      // Handle optional steps argument
      if (typeof func === "undefined") {
         func = steps;
         steps = 12;
      }

      var stepSize = (Math.PI * 2) / steps; // The size of an iteration around the circle
      var rotation =  Math.PI / 2;          // The rotation to apply to the coordinates

      // Loop over the circle, calling the callback for each step
      for (var step = 0; step < steps; step++) {
         var x = Math.cos( (stepSize * step) - rotation ) * radius;
         var y = Math.sin( (stepSize * step) - rotation ) * radius;
         func(x, y, step);
      }
   },

   /****************************************************************/
   /* Add a click listener to a canvas whose arguments are the     */
   /* x/y coordinates of the mouse click on the canvas rather than */
   /* the event object                                             */
   /****************************************************************/
   onClick: function(canvas, func) {
      canvas.addEventListener("click", function(evt) {
         var canvasMetrics = canvas.getBoundingClientRect();
         var mouseX = evt.clientX - canvasMetrics.left;
         var mouseY = evt.clientY - canvasMetrics.top;

         func(mouseX, mouseY);
      });
   },

   /**********************************************************/
   /* Handle out-of-path state requests. That is, functions  */
   /* outside of render methods can use this to request the  */
   /* currently selected hour/minute                         */
   /**********************************************************/
   getTimeHandler: null,
   registerGetTimeHandler: function(func) {
      this.stateRequestHandler = func;
   },
   getTime: function() {
      if (this.stateRequestHandler)
         return this.stateRequestHandler();
      else
         return null;
   },

   /***********************************/
   /* Store all of the event handlers */
   /***********************************/
   events: {},

   /*************************/
   /* Add an event listener */
   /*************************/
   on: function(event, func) {
      if (typeof this.events[event] === "undefined")
         this.events[event] = [];

      this.events[event].push(func);
   },

   /********************/
   /* Trigger an event */
   /********************/   
   trigger: function(event) {
      var args = Array.prototype.slice.call(arguments, 1);

      if (typeof this.events[event] !== "undefined") {
         this.events[event].forEach(function(func) {
            func.apply(null, args);
         });
      }
   }
};
