import {
	eachDayOfInterval,
	endOfMonth,
	format,
	isSameMonth,
	isToday,
	startOfMonth,
} from "date-fns";
import React, { useState } from "react";
import "./Calendar.css";

function Calendar() {
	const [currentMonth, setCurrentMonth] = useState(new Date());

	const days = eachDayOfInterval({
		start: startOfMonth(currentMonth),
		end: endOfMonth(currentMonth),
	});

	const nextMonth = () =>
		setCurrentMonth((prev) => new Date(prev.setMonth(prev.getMonth() + 1)));
	const prevMonth = () =>
		setCurrentMonth((prev) => new Date(prev.setMonth(prev.getMonth() - 1)));

	return (
		<div className="calendar-container">
			<div className="calendar-header">
				<button type="button" onClick={prevMonth}>
					←
				</button>
				<h2>{format(currentMonth, "MMMM yyyy")}</h2>
				<button type="button" onClick={nextMonth}>
					→
				</button>
			</div>

			<div className="calendar-weekdays">
				{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
					<div key={d}>{d}</div>
				))}
			</div>

			<div className="calendar-grid">
				{days.map((day) => (
					<div
						key={day.toISOString()}
						className={`calendar-day ${
							isToday(day)
								? "today"
								: !isSameMonth(day, currentMonth)
									? "faded"
									: ""
						}`}
					>
						{format(day, "d")}
					</div>
				))}
			</div>
		</div>
	);
}

export default Calendar;
