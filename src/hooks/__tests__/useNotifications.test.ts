import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '@/hooks/useNotifications';

const mockNotification = {
  permission: 'default' as NotificationPermission,
  requestPermission: jest.fn().mockResolvedValue('granted'),
};

Object.defineProperty(global, 'Notification', {
  value: mockNotification,
  writable: true,
});

describe('useNotifications', () => {
  it('starts with permission as default', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.permission).toBe('default');
  });

  it('requestPermission calls Notification.requestPermission', async () => {
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(mockNotification.requestPermission).toHaveBeenCalled();
  });
});
