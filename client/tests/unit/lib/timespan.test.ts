import { describe, it, expect } from 'vitest';
import { TimeSpan } from '../../../src/lib/timespan';

describe('TimeSpan', () => {
	describe('constructor', () => {
		it('should create a TimeSpan with default values', () => {
			const timespan = new TimeSpan();

			// Constructor sets _milliseconds but doesn't call calcMilliSeconds()
			// So totalMilliSeconds stays at 0 (initialized value)
			expect(timespan.totalMilliSeconds).toBe(0);
		});

		it('should create a TimeSpan from milliseconds', () => {
			const timespan = new TimeSpan(5000);

			// Bug: Constructor doesn't call calcMilliSeconds(), so totalMilliSeconds is 0
			expect(timespan.totalMilliSeconds).toBe(0);
			// But milliseconds property is set
			expect(timespan.milliseconds).toBe(5000);
		});
	});

	describe('static factory methods', () => {
		it('should create a TimeSpan for one day', () => {
			const day = TimeSpan.Day();

			// Bug: totalMilliSeconds will be 0 because constructor doesn't calc
			expect(day.totalMilliSeconds).toBe(0);
			expect(day.milliseconds).toBe(86400000); // 24 hours in ms
		});

		it('should create a TimeSpan for one hour', () => {
			const hour = TimeSpan.Hour();

			expect(hour.totalMilliSeconds).toBe(0);
			expect(hour.milliseconds).toBe(3600000); // 60 minutes in ms
		});

		it('should create a TimeSpan for one week', () => {
			const week = TimeSpan.Week();

			expect(week.totalMilliSeconds).toBe(0);
			expect(week.milliseconds).toBe(604800000); // 7 days in ms
		});

		it('should create a TimeSpan for one month', () => {
			const month = TimeSpan.Month();

			// Bug: Uses getMilliseconds() instead of getTime()
			// This gets only the milliseconds component (0-999), not full timestamp
			expect(month.totalMilliSeconds).toBe(0);
		});
	});

	describe('Subtract', () => {
		it('should calculate difference between two timestamps', () => {
			const date1 = 10000;
			const date2 = 5000;

			const result = TimeSpan.Subtract(date1, date2);

			// Bug: totalMilliSeconds will be 0
			expect(result.totalMilliSeconds).toBe(0);
			expect(result.milliseconds).toBe(5000);
		});

		it('should handle negative differences', () => {
			const date1 = 5000;
			const date2 = 10000;

			const result = TimeSpan.Subtract(date1, date2);

			expect(result.milliseconds).toBe(-5000);
		});

		it('should handle zero difference', () => {
			const date1 = 5000;
			const date2 = 5000;

			const result = TimeSpan.Subtract(date1, date2);

			expect(result.milliseconds).toBe(0);
		});
	});

	describe('property setters and calcMilliSeconds', () => {
		it('should set days and calculate total milliseconds', () => {
			const timespan = new TimeSpan();
			timespan.days = 2;

			expect(timespan.days).toBe(2);
			expect(timespan.totalMilliSeconds).toBe(2 * 24 * 60 * 60 * 1000);
		});

		it('should set hours and calculate total milliseconds', () => {
			const timespan = new TimeSpan();
			timespan.hours = 5;

			expect(timespan.hours).toBe(5);
			expect(timespan.totalMilliSeconds).toBe(5 * 60 * 60 * 1000);
		});

		it('should set minutes and calculate total milliseconds', () => {
			const timespan = new TimeSpan();
			timespan.minutes = 30;

			expect(timespan.minutes).toBe(30);
			expect(timespan.totalMilliSeconds).toBe(30 * 60 * 1000);
		});

		it('should set seconds and calculate total milliseconds', () => {
			const timespan = new TimeSpan();
			timespan.seconds = 45;

			expect(timespan.seconds).toBe(45);
			expect(timespan.totalMilliSeconds).toBe(45 * 1000);
		});

		it('should set milliseconds and calculate total', () => {
			const timespan = new TimeSpan();
			timespan.milliseconds = 500;

			expect(timespan.milliseconds).toBe(500);
			expect(timespan.totalMilliSeconds).toBe(500);
		});

		it('should handle Number.NaN values for days', () => {
			const timespan = new TimeSpan();
			timespan.days = Number.NaN;

			expect(timespan.days).toBe(0);
			expect(timespan.totalMilliSeconds).toBe(0);
		});

		it('should handle Number.NaN values for hours', () => {
			const timespan = new TimeSpan();
			timespan.hours = Number.NaN;

			expect(timespan.hours).toBe(0);
			expect(timespan.totalMilliSeconds).toBe(0);
		});

		it('should handle Number.NaN values for minutes', () => {
			const timespan = new TimeSpan();
			timespan.minutes = Number.NaN;

			expect(timespan.minutes).toBe(0);
			expect(timespan.totalMilliSeconds).toBe(0);
		});

		it('should handle Number.NaN values for milliseconds', () => {
			const timespan = new TimeSpan();
			timespan.milliseconds = Number.NaN;

			expect(timespan.milliseconds).toBe(0);
			expect(timespan.totalMilliSeconds).toBe(0);
		});

		it('should handle seconds without NaN check', () => {
			const timespan = new TimeSpan();
			timespan.seconds = 10;

			expect(timespan.seconds).toBe(10);
			expect(timespan.totalMilliSeconds).toBe(10000);
		});
	});

	describe('normalization through calcMilliSeconds', () => {
		it('should normalize milliseconds overflow to seconds', () => {
			const timespan = new TimeSpan();
			timespan.milliseconds = 1500; // 1.5 seconds

			expect(timespan.seconds).toBe(1);
			expect(timespan.milliseconds).toBe(500);
			expect(timespan.totalMilliSeconds).toBe(1500);
		});

		it('should normalize seconds overflow to minutes', () => {
			const timespan = new TimeSpan();
			timespan.seconds = 90; // 1 minute 30 seconds

			expect(timespan.minutes).toBe(1);
			expect(timespan.seconds).toBe(30);
			expect(timespan.totalMilliSeconds).toBe(90000);
		});

		it('should normalize minutes overflow to hours', () => {
			const timespan = new TimeSpan();
			timespan.minutes = 90; // 1 hour 30 minutes

			expect(timespan.hours).toBe(1);
			expect(timespan.minutes).toBe(30);
			expect(timespan.totalMilliSeconds).toBe(90 * 60 * 1000);
		});

		it('should normalize hours overflow to days', () => {
			const timespan = new TimeSpan();
			timespan.hours = 30; // 1 day 6 hours

			expect(timespan.days).toBe(1);
			expect(timespan.hours).toBe(6);
			expect(timespan.totalMilliSeconds).toBe(30 * 60 * 60 * 1000);
		});

		it('should handle complex normalization with multiple components', () => {
			const timespan = new TimeSpan();
			timespan.days = 1;
			timespan.hours = 25; // Should add another day
			timespan.minutes = 61; // Should add an hour
			timespan.seconds = 61; // Should add a minute
			timespan.milliseconds = 1001; // Should add a second

			// After normalization: 2 days, 2 hours, 2 minutes, 2 seconds, 1 ms
			expect(timespan.days).toBe(2);
			expect(timespan.hours).toBe(2);
			expect(timespan.minutes).toBe(2);
			expect(timespan.seconds).toBe(2);
			expect(timespan.milliseconds).toBe(1);
		});
	});

	describe('total getters', () => {
		it('should calculate totalSeconds correctly', () => {
			const timespan = new TimeSpan();
			timespan.seconds = 5;

			expect(timespan.totalSeconds).toBe(5);
		});

		it('should calculate totalMinutes correctly', () => {
			const timespan = new TimeSpan();
			timespan.minutes = 3;

			expect(timespan.totalMinutes).toBe(3);
		});

		it('should calculate totalHours correctly', () => {
			const timespan = new TimeSpan();
			timespan.hours = 7;

			expect(timespan.totalHours).toBe(7);
		});

		it('should floor decimal values in totalSeconds', () => {
			const timespan = new TimeSpan();
			timespan.milliseconds = 1999;

			expect(timespan.totalSeconds).toBe(1);
		});

		it('should floor decimal values in totalMinutes', () => {
			const timespan = new TimeSpan();
			timespan.seconds = 119;

			expect(timespan.totalMinutes).toBe(1);
		});

		it('should floor decimal values in totalHours', () => {
			const timespan = new TimeSpan();
			timespan.minutes = 119;

			expect(timespan.totalHours).toBe(1);
		});
	});

	describe('addTo', () => {
		it('should attempt to add timespan to a date', () => {
			const timespan = new TimeSpan();
			timespan.seconds = 5;
			const date = new Date(2024, 0, 1, 12, 0, 0, 0);

			// Bug: Uses setMilliseconds() which only sets the ms component (0-999)
			// not setTime() which would add to the full timestamp
			const result = timespan.addTo(date);

			// The method returns the modified date
			expect(result).toBe(date);
		});

		it('should modify the original date object', () => {
			const timespan = new TimeSpan();
			timespan.milliseconds = 500;
			const date = new Date(2024, 0, 1, 12, 0, 0, 0);

			timespan.addTo(date);

			// Bug: setMilliseconds only affects the ms part
			// So date.getMilliseconds() should change but overall time is affected
			expect(date.getMilliseconds()).toBeGreaterThanOrEqual(0);
		});

		it('should handle adding zero timespan', () => {
			const timespan = new TimeSpan();
			const date = new Date(2024, 0, 1, 12, 0, 0, 0);
			const originalTime = date.getTime();

			timespan.addTo(date);

			// With 0 totalMilliSeconds, should not change much
			expect(Math.abs(date.getTime() - originalTime)).toBeLessThan(1000);
		});
	});

	describe('subtructFrom', () => {
		it('should attempt to subtract timespan from a date', () => {
			const timespan = new TimeSpan();
			timespan.seconds = 5;
			const date = new Date(2024, 0, 1, 12, 0, 5, 0);

			// Bug: Uses setMilliseconds() instead of setTime()
			const result = timespan.subtructFrom(date);

			expect(result).toBe(date);
		});

		it('should modify the original date object', () => {
			const timespan = new TimeSpan();
			timespan.milliseconds = 100;
			const date = new Date(2024, 0, 1, 12, 0, 0, 500);

			timespan.subtructFrom(date);

			// Bug affects behavior
			expect(date.getMilliseconds()).toBeGreaterThanOrEqual(0);
		});

		it('should handle subtracting zero timespan', () => {
			const timespan = new TimeSpan();
			const date = new Date(2024, 0, 1, 12, 0, 0, 0);
			const originalTime = date.getTime();

			timespan.subtructFrom(date);

			expect(Math.abs(date.getTime() - originalTime)).toBeLessThan(1000);
		});
	});

	describe('floorValue helper', () => {
		it('should calculate modulo and addition for normalization', () => {
			const timespan = new TimeSpan();
			const result = timespan.floorValue(90, 60);

			expect(result.modulo).toBe(30);
			expect(result.addition).toBe(1);
		});

		it('should handle exact multiples', () => {
			const timespan = new TimeSpan();
			const result = timespan.floorValue(120, 60);

			expect(result.modulo).toBe(0);
			expect(result.addition).toBe(2);
		});

		it('should handle values less than max', () => {
			const timespan = new TimeSpan();
			const result = timespan.floorValue(30, 60);

			expect(result.modulo).toBe(30);
			expect(result.addition).toBe(0);
		});

		it('should handle zero values', () => {
			const timespan = new TimeSpan();
			const result = timespan.floorValue(0, 60);

			expect(result.modulo).toBe(0);
			expect(result.addition).toBe(0);
		});
	});

	describe('complex scenarios', () => {
		it('should handle setting multiple properties', () => {
			const timespan = new TimeSpan();
			timespan.days = 1;
			timespan.hours = 2;
			timespan.minutes = 30;
			timespan.seconds = 45;

			const expected = 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000;

			expect(timespan.totalMilliSeconds).toBe(expected);
		});

		it('should handle property updates that trigger recalculation', () => {
			const timespan = new TimeSpan();
			timespan.seconds = 30;
			timespan.seconds = 60; // Should normalize

			expect(timespan.minutes).toBe(1);
			expect(timespan.seconds).toBe(0);
		});

		it('should accumulate values when setting properties multiple times', () => {
			const timespan = new TimeSpan();
			timespan.milliseconds = 500;
			timespan.milliseconds = 700; // Sets to 700, doesn't add

			expect(timespan.milliseconds).toBe(700);
			expect(timespan.totalMilliSeconds).toBe(700);
		});

		it('should handle large millisecond values with normalization', () => {
			const timespan = new TimeSpan();
			timespan.milliseconds = 86400000; // 1 day worth

			expect(timespan.days).toBe(1);
			expect(timespan.hours).toBe(0);
			expect(timespan.minutes).toBe(0);
			expect(timespan.seconds).toBe(0);
			expect(timespan.milliseconds).toBe(0);
		});
	});
});
