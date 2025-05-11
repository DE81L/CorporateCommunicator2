import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Calendar } from "./calendar";
export const DateTimePicker = ({ value, onChange, disabled, }) => {
    const [date, setDate] = useState(value);
    const handleDateChange = (newDate) => {
        setDate(newDate);
        onChange?.(newDate);
    };
    return (_jsxs("div", { className: "flex flex-col gap-2", children: [_jsx(Calendar, { mode: "single", selected: date, onSelect: handleDateChange, disabled: disabled }), _jsx("input", { type: "time", className: "border rounded px-2 py-1", disabled: disabled || !date, value: date?.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                }) ?? "", onChange: (e) => {
                    if (!date)
                        return;
                    const [hours, minutes] = e.target.value.split(":").map(Number);
                    const newDate = new Date(date);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    handleDateChange(newDate);
                } })] }));
};
