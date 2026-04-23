import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  requestNotificationPermission, 
  scheduleNotification, 
  cancelNotification 
} from '../services/notificationService'

describe('notificationService', () => {
  const NotificationMock = vi.fn()
  NotificationMock.permission = 'default'
  NotificationMock.requestPermission = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Reset the global Notification mock
    global.Notification = NotificationMock
    NotificationMock.permission = 'default'
    NotificationMock.requestPermission.mockReset()
    
    // Mock Map if needed or just let the module state persist but clear it between tests
    // Since activeTimeouts is private to the module, we can only verify it via side effects
  })

  describe('requestNotificationPermission', () => {
    it('returns false if Notification is not supported', async () => {
      const originalNotification = global.Notification
      delete global.Notification
      
      const result = await requestNotificationPermission()
      expect(result).toBe(false)
      
      global.Notification = originalNotification
    })

    it('returns true if already granted', async () => {
      NotificationMock.permission = 'granted'
      const result = await requestNotificationPermission()
      expect(result).toBe(true)
    })

    it('requests permission and returns true if user grants it', async () => {
      NotificationMock.permission = 'default'
      NotificationMock.requestPermission.mockResolvedValue('granted')
      
      const result = await requestNotificationPermission()
      
      expect(NotificationMock.requestPermission).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('returns false if user denies permission', async () => {
      NotificationMock.permission = 'default'
      NotificationMock.requestPermission.mockResolvedValue('denied')
      
      const result = await requestNotificationPermission()
      expect(result).toBe(false)
    })
  })

  describe('scheduling', () => {
    it('shows notification immediately if delay is 0', () => {
      NotificationMock.permission = 'granted'
      const onTrigger = vi.fn()
      
      scheduleNotification('test-id', 'Title', 'Body', 0, onTrigger)
      
      expect(NotificationMock).toHaveBeenCalledWith('Title', expect.objectContaining({
        body: 'Body'
      }))
      expect(onTrigger).toHaveBeenCalled()
    })

    it('schedules a notification for the future', () => {
      NotificationMock.permission = 'granted'
      const onTrigger = vi.fn()
      
      scheduleNotification('test-id', 'Future Title', 'Future Body', 1000, onTrigger)
      
      expect(NotificationMock).not.toHaveBeenCalled()
      
      vi.advanceTimersByTime(1000)
      
      expect(NotificationMock).toHaveBeenCalledWith('Future Title', expect.any(Object))
      expect(onTrigger).toHaveBeenCalled()
    })

    it('can cancel a scheduled notification', () => {
      NotificationMock.permission = 'granted'
      scheduleNotification('to-cancel', 'Will not show', '...', 5000)
      
      cancelNotification('to-cancel')
      
      vi.advanceTimersByTime(5000)
      expect(NotificationMock).not.toHaveBeenCalled()
    })

    it('re-scheduling with the same ID cancels the previous one', () => {
      NotificationMock.permission = 'granted'
      scheduleNotification('shared-id', 'First', '...', 5000)
      scheduleNotification('shared-id', 'Second', '...', 10000)
      
      vi.advanceTimersByTime(5000)
      expect(NotificationMock).not.toHaveBeenCalled()
      
      vi.advanceTimersByTime(5000)
      expect(NotificationMock).toHaveBeenCalledWith('Second', expect.any(Object))
    })
  })
})
