/*******************************************************************/
/* Point.js
/* --------
/* Implement some basic point computations for working with both
/* Cartesian and Polar coordinate systems.
/*
/* The Point object is meant to be treated as an immutable value.
/* If you need to change a coordinate, create a new point using
/* one of the from methods.
/*******************************************************************/
var math = require("./math");

var Point = {};
module.exports = Point;



/**********************/
/* Point Constructors */
/**********************/
// Create a point from a set of Cartesian coordinates
Point.fromCart = function(x, y) {
   return {
      x: x,
      y: y,
      theta: math.atan2(y, x),
      radius: Math.sqrt(x * x + y * y)
   };
};


// Create a point from a set of Polar coordinates
Point.fromPolar = function(theta, radius) {
   return {
      x: math.cos(theta) * radius,
      y: math.sin(theta) * radius,
      theta: theta,
      radius: radius
   };
};


// Create a point from the interaction location of an event object
Point.fromEvent = function(event) {
   var interactionX;
   var interactionY;

   // Determine if we are dealing with a mouse event, or a
   // touch event and get the coordinates of the interaction
   if (typeof event.changedTouches !== "undefined") {
      interactionX = event.changedTouches[0].clientX;
      interactionY = event.changedTouches[0].clientY;
   } else {
      interactionX = event.clientX;
      interactionY = event.clientY;
   }

   return Point.fromCart(interactionX, interactionY);
};



/*****************/
/* Point Methods */
/*****************/
// Get a new point as the difference of two others
Point.subtract = function(pointA, pointB) {
   return Point.fromCart(pointA.x - pointB.x, pointA.y - pointB.y);
};


// Get a new point as the sum of two others
Point.add = function(pointA, pointB) {
   return Point.fromCart(pointA.x + pointB.x, pointA.y + pointB.y);
};