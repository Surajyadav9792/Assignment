export const theme = {
  colors: {
    bg: '#0E1116',
    bgElev: '#151A21',
    bgElev2: '#1B2129',
    border: '#232A33',
    text: '#E6EAF0',
    muted: '#8B95A3',
    subtle: '#5A6573',
    accent: '#4F8AF7',
    accentHover: '#3D78E6',
    accentSoft: 'rgba(79,138,247,0.12)',
    success: '#2BB673',
    warn: '#F2A341',
    danger: '#E5484D',
    info: '#5B9DF9',
  },
};

export const AVATAR_PALETTE = ['#4F8AF7', '#2BB673', '#F2A341', '#A271F4', '#5B9DF9'];

export const hashColor = (str = '') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};
