/**
 * notificationService.js
 * Handles browser notification permissions and scheduling.
 */

const activeTimeouts = new Map()

/**
 * Requests browser notification permission if not already granted.
 * @returns {Promise<boolean>} True if permission is granted.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.error('This browser does not support desktop notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Schedules a notification to be shown after a specific delay.
 * @param {string} id Unique identifier for the notification (e.g. route + stop)
 * @param {string} title Notification title
 * @param {string} body Notification message
 * @param {number} delayMs Delay in milliseconds until the notification shows
 * @param {Function} onTrigger Optional callback when notification is shown
 */
export function scheduleNotification(id, title, body, delayMs, onTrigger) {
  // Cancel any existing timeout for this ID
  cancelNotification(id)

  if (delayMs <= 0) {
    // If time has already passed, show immediately (or handle as error)
    showNotification(title, body)
    onTrigger?.()
    return
  }

  const timeoutId = setTimeout(() => {
    showNotification(title, body)
    activeTimeouts.delete(id)
    onTrigger?.()
  }, delayMs)

  activeTimeouts.set(id, timeoutId)
}

/**
 * Cancels a scheduled notification.
 * @param {string} id Unique identifier
 */
export function cancelNotification(id) {
  if (activeTimeouts.has(id)) {
    clearTimeout(activeTimeouts.get(id))
    activeTimeouts.delete(id)
  }
}

/**
 * Directly shows a notification.
 * @param {string} title 
 * @param {string} body 
 */
function showNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/vite.svg', // Fallback to vite logo or app icon
    })
  }
}
