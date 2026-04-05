// client/src/hooks/useNotifications.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxios from './useAxios';
import { useAuth } from '../providers/AuthProvider';
import toast from 'react-hot-toast';

const useNotifications = () => {
  const axios = useAxios();
  const { user, dbUser } = useAuth();
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: () => axios.get('/member/notifications').then(r => r.data.notifications),
    enabled: !!dbUser,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const unreadCount = notifications.filter(
    n => !n.isRead?.includes(dbUser?._id)
  ).length;

  // Mark single notification as read
  const markRead = useMutation({
    mutationFn: (id) => axios.patch(`/member/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries(['my-notifications']),
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: () => axios.patch('/member/notifications/mark-all-read'),
    onSuccess: () => {
      qc.invalidateQueries(['my-notifications']);
      toast.success('সব নোটিফিকেশন পড়া হয়েছে');
    },
    onError: () => {
      toast.error('একটু পরে আবার চেষ্টা করুন');
    },
  });

  return { 
    notifications, 
    unreadCount, 
    markRead: markRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
  };
};

export default useNotifications;