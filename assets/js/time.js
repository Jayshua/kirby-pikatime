/****************************************************************/
/* Time.js
/* -------
/* Implement basic time computations for working with both
/* 12 hour and 24 hour time formats.
/*
/* The time object is meant to be treated as an immutable value.
/* If you need to change one of the times, create a new
/* time object with one of the from methods.
/****************************************************************/
var Time = {};
module.exports = Time;



/*********************/
/* Time constructors */
/*********************/
// Create a time object from 12 hour time
Time.from12 = function(hour, minute, period) {
	return {
		hour:   (period === "am") ? hour : hour + 12,
		minute: minute,
		hour12: hour,
		period: period
	};
};


// Create a time object from 24 hour time
Time.from24 = function(hour, minute) {
	return {
		hour: hour,
		minute: minute,
		hour12: (hour < 12) ? hour : hour - 12,
		period: (hour < 12) ? "am" : "pm"
	};
};


/*******************/
/* Time Conversion */
/*******************/
// Get the clock face angle of the hour part of a time object
Time.getHourAngle = function(time) {
	var angle = (time.hour / 12) * Math.PI * 2;
	if (angle > Math.PI) angle -= Math.PI * 2;
	return angle;
};


// Get the clock face angle of the minute part of a time object
Time.getMinuteAngle = function(time) {
	var angle = (time.minute / 60) * Math.PI * 2;
	if (angle > Math.PI) angle -= Math.PI * 2;
	return angle;
};


/****************/
/* Time Methods */
/****************/
// Convert a clock face angle to a minute value
Time.minuteFromAngle = function(angle) {
	// Convert the angle to a range from 0 to 2PI
	if (angle < 0) {
		angle += Math.PI * 2;
	}

	// Calculate the minute, rounded to the nearest 5
	var percentAroundFace = angle / (Math.PI * 2);
	var minute = Math.round((percentAroundFace * 60) / 5) * 5;
	if (minute === 60) minute = 0;
	return minute;
};


// Convert a clock face angle to an hour value
Time.hourFromAngle = function(angle) {
	// Convert the angle to a range from 0 to 2PI
	if (angle < 0) {
		angle += Math.PI * 2;
	}

	// Calculate the hour
	var percentAroundFace = angle / (Math.PI * 2);
	var hour = Math.round(percentAroundFace * 12);
	if (hour === 12) hour = 0;
	return hour;
};
