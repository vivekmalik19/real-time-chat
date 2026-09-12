export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getAvatarUrl = (user) => {
  if (user?.avatar) return user.avatar;
  const seed = user?.username || 'User';
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'online':
      return 'bg-emerald-500';
    case 'away':
      return 'bg-amber-500';
    case 'busy':
      return 'bg-rose-500';
    default:
      return 'bg-slate-500';
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case 'online':
      return 'Online';
    case 'away':
      return 'Away';
    case 'busy':
      return 'Do Not Disturb';
    default:
      return 'Offline';
  }
};
