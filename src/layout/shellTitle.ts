export function getShellTitle(pathname: string): string {
  if (pathname === '/') {
    return 'Home'
  }

  if (pathname === '/arc' || pathname.startsWith('/arc/')) {
    return 'Winter Arc'
  }

  if (pathname === '/system' || pathname === '/mission-control') {
    return 'Mission Control'
  }

  if (pathname === '/mind-os') {
    return 'Mind OS'
  }

  if (pathname.startsWith('/mind-os/habits')) {
    return 'Mind OS - Habits'
  }

  if (pathname.startsWith('/mind-os/journal')) {
    return 'Mind OS - Journal'
  }

  if (pathname === '/productivity-hub') {
    return 'Productivity Hub'
  }

  if (pathname.startsWith('/productivity-hub/tasks')) {
    return 'Productivity Hub - Tasks'
  }

  if (pathname.startsWith('/productivity-hub/planning')) {
    return 'Productivity Hub - Planning'
  }

  if (pathname === '/learning-os') {
    return 'Learning OS'
  }

  if (pathname.startsWith('/learning-os/explore')) {
    return 'Learning OS - Explore'
  }

  if (pathname.startsWith('/learning-os/analytics')) {
    return 'Learning OS - Analytics'
  }

  if (pathname.startsWith('/learning-os/roadmap')) {
    return 'Learning OS - Roadmap'
  }

  if (pathname === '/fitness-os') {
    return 'Fitness OS'
  }

  if (pathname.startsWith('/fitness-os/workouts')) {
    return 'Fitness OS - Workouts'
  }

  if (pathname.startsWith('/fitness-os/library')) {
    return 'Fitness OS - Library'
  }

  if (pathname.startsWith('/fitness-os/pr')) {
    return 'Fitness OS - Personal Records'
  }

  if (pathname.startsWith('/time-os')) {
    return 'Time OS'
  }

  if (pathname.startsWith('/finance-os')) {
    return 'Finance OS'
  }

  if (pathname.startsWith('/data-lab')) {
    return 'Data Lab'
  }

  if (pathname.startsWith('/reports')) {
    return 'Reports'
  }

  if (pathname.startsWith('/profile')) {
    return 'Profile & Stats'
  }

  return 'Life OS'
}
