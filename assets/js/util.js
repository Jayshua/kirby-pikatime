var Point = require("./point");
var math  = require("./math");

var util = {};
module.exports = util;



/**********************************************************************************/
/* Return a new object with the properties from the objects provided as arguments */
/**********************************************************************************/
util.extend = function() {
   let newObject = {};

   // Iterate over each object, assigning its keys to the result object
   for (var i = 0; i < arguments.length; i++) {
      for (var key in arguments[i]) {
         if (arguments[i].hasOwnProperty(key)) {
            newObject[key] = arguments[i][key];
         }
      }
   }

   return newObject;
};


/**************************************/
/* Test if a point is inside a square */
/**************************************/
util.intersects = function(point, square, squareSize) {
   return (point.x > square.x - squareSize && point.x < square.x + squareSize &&
           point.y > square.y - squareSize && point.y < square.y + squareSize);
};


/*************************************************************/
/* Ease a value between 0 and 1 using a Cubic ease algorithm */
/*************************************************************/
util.cubicEase = function(percentage) {
   if ((percentage / 0.5) < 1) {
      return (percentage * percentage) / 0.5;
   } else {
      return -((percentage - 0.5) * (percentage - 2) - 0.5);
   }
};


/***********************************************************/
/* Pad a string with 0 (by default) to the specified width */
/***********************************************************/
util.padLeft = function(string, width, placeholder) {
   placeholder = placeholder || '0'; // The character to pad the string with
   string = string + '';             // Cast the passed in value to a string

   if (string.length >= width) {
      return string;
   } else {
      return new Array(width - string.length + 1).join(placeholder) + string;
   }
};


/*************************************************************************************/
/* Iterate around the outside of a circle passing the Point to the provided function */
/*************************************************************************************/
util.circleIterate = function(radius, steps, func) {
   var stepSize = (Math.PI * 2) / steps; // The size of single step around the circle

   // Loop over the circle, calling the callback for each step
   for (var step = 0; step < steps; step++) {
      var x = math.cos( (stepSize * step) ) * radius;
      var y = math.sin( (stepSize * step) ) * radius;
      func(Point.fromCart(x, y), step);
   }
};


/***********************************/
/* Store all of the event handlers */
/***********************************/
util.events = {};

/*************************/
/* Add an event listener */
/*************************/
util.on = function(event, func) {
   if (typeof this.events[event] === "undefined")
      this.events[event] = [];

   this.events[event].push(func);
};

/********************/
/* Trigger an event */
/********************/   
util.trigger = function(event) {
   var args = Array.prototype.slice.call(arguments, 1);

   if (typeof this.events[event] !== "undefined") {
      this.events[event].forEach(function(func) {
         func.apply(null, args);
      });
   }
};
