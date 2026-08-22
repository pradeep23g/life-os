export function isPastWednesdayInIndia() {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
  }).format(new Date())
  return ['Thu', 'Fri', 'Sat', 'Sun'].includes(weekday)
}
