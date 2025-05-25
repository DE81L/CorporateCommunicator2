import * as React from "react"
import { Calendar } from "./calendar"

export interface DateTimePickerProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
}

const DateTimePicker = React.forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ value, onChange, disabled, ...props }, ref) => {
    const [date, setDate] = React.useState<Date | undefined>(value)
    React.useEffect(() => {
      setDate(value)
    }, [value])

  const handleDateChange = (newDate?: Date) => {
    setDate(newDate)
    onChange?.(newDate)
  }


  return (
    <div className="flex flex-col gap-2">
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateChange}
        disabled={disabled}
        className="bg-background text-foreground"
      />
      <input
        type="time"
        className="border rounded px-2 py-1 dark:bg-muted dark:text-foreground"
        disabled={disabled || !date}
        value={
          date?.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          }) ?? ""
        }
        onChange={(e) => {
          if (!date) return
          const [hours, minutes] = e.target.value.split(":")?.map(Number)
          const newDate = new Date(date)
          newDate.setHours(hours)
          newDate.setMinutes(minutes)
          handleDateChange(newDate)
        }}
      />
    </div>
  )
}

DateTimePicker.displayName = "DateTimePicker"

export { DateTimePicker }
