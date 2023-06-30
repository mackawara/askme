function getSecsToMidnight() {
  const now = new Date(); // Get current date and time
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  ); // Set tomorrow's date

  const millisecondsUntilMidnight = tomorrow - now; // Calculate milliseconds between now and midnight
  const secondsUntilMidnight = Math.floor(millisecondsUntilMidnight / 1000); // Convert to seconds
  console.log(secondsUntilMidnight);
  return secondsUntilMidnight;
}
module.exports = getSecsToMidnight;
