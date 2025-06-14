
import React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M23 2H9C5.13401 2 2 5.13401 2 9V23C2 26.866 5.13401 30 9 30H23C26.866 30 30 26.866 30 23V9C30 5.13401 26.866 2 23 2Z"
      fill="#1A1A1A"
    />
    <path
      d="M20 10H12V15H18"
      stroke="#FF6B35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 10V22"
      stroke="#FF6B35"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 21L11 11"
      stroke="#FF8C42"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 11H21V16"
      stroke="#FF8C42"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Logo;
