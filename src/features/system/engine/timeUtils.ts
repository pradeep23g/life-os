export function isPastWednesdayInIndia() {
  const indiaNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = indiaNow.getDay()
  return day === 0 || day > 3
}
