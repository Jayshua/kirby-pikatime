/**********************************************************************/
/* Math
/* ------
/* The Math.* trig functions are oriented with radian 0 to the right.
/* This is reasonable, and fairly standard. However, clocks start
/* everything at the top. It's more convenient to rotate the entire
/* coordinate system than it is to add the adjustment in every time.
/*
/* This file implements the basic trig functions such that radian
/* 0 is directly up - like a clock face
/*
/* As an aside, this would simply be in util, however Point.js depends
/* on it and util depends on Point. This would result in a circular
/* dependency, which, while possible to resolve, was simply easier
/* to avoid by moving to a separate file.
/**********************************************************************/
var math = {};
module.exports = math;



math.sin = function(angle) {
   return Math.sin(angle - Math.PI / 2);
};

math.cos = function(angle) {
   return Math.cos(angle - Math.PI / 2);
};

math.atan2 = function(y, x) {
   return Math.atan2(y, x) + Math.PI / 2;
};