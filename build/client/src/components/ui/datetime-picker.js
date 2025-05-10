"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateTimePicker = void 0;
const react_1 = require("react");
const calendar_1 = require("./calendar");
const DateTimePicker = ({ value, onChange, disabled, }) => {
    const [date, setDate] = (0, react_1.useState)(value);
    const handleDateChange = (newDate) => {
        setDate(newDate);
        onChange?.(newDate);
    };
    return (<div className="flex flex-col gap-2">
      <calendar_1.Calendar mode="single" selected={date} onSelect={handleDateChange} disabled={disabled}/>
      <input type="time" className="border rounded px-2 py-1" disabled={disabled || !date} value={date?.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }) ?? ""} onChange={(e) => {
            if (!date)
                return;
            const [hours, minutes] = e.target.value.split(":").map(Number);
            const newDate = new Date(date);
            newDate.setHours(hours);
            newDate.setMinutes(minutes);
            handleDateChange(newDate);
        }}/>
    </div>);
};
exports.DateTimePicker = DateTimePicker;
