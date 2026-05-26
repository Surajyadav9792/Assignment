export function Logo({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ForgeFlow"
    >
      <rect width="32" height="32" rx="6" fill="#4F8AF7" />
      <path d="M7 9 L25 9 L25 13 L19 13 L19 23 L13 23 L13 13 L7 13 Z" fill="#0E1116" />
      <path d="M9 23 L23 23 L23 25 L9 25 Z" fill="#0E1116" opacity="0.6" />
    </svg>
  );
}
