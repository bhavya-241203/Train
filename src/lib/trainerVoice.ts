export function trainerLine(score: number, streak: number): string {
  if (streak >= 30) return `${streak}-day streak. You're not stopping, are you?`
  if (streak >= 14) return `${streak} days strong. This is who you are now.`
  if (streak >= 7) return `${streak}-day streak, keep it up!`
  if (streak >= 3) return `${streak} days in a row. Momentum is building.`

  if (score >= 90) return 'Nearly perfect day. That\'s the standard now.'
  if (score >= 80) return 'Great day. Keep stacking these.'
  if (score >= 70) return 'Solid work today, back on the streak.'
  if (score >= 40) return 'Partial credit. Tomorrow, full send.'
  return 'Rough day. Reset and go again tomorrow.'
}
