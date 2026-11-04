import React from 'react';
import { CloudProviderId } from '../../types';

interface CloudProviderLogoProps {
  provider: CloudProviderId | 'kubernetes' | 'terraform' | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CloudProviderLogo: React.FC<CloudProviderLogoProps> = ({
  provider,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  const currentSizeClass = sizeClasses[size] || 'w-6 h-6';

  switch (provider.toLowerCase()) {
    case 'aws':
    case 'amazon web services':
      return (
        <svg
          viewBox="0 0 48 48"
          className={`${currentSizeClass} ${className} shrink-0`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* AWS Official Smile & Cloud Mark */}
          <rect width="48" height="48" rx="10" fill="#232F3E" />
          <path
            d="M14.5 28.5C21.2 33 28.8 33 35.5 28.5M34 27L36 29L33 31"
            stroke="#FF9900"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 18.5L16.2 25.5H18L21.2 18.5H19L17.1 23.2L15.2 18.5H13Z"
            fill="#FF9900"
          />
          <path
            d="M21.5 24.2C22.3 25 23.5 25.5 24.8 25.5C26.5 25.5 27.5 24.5 27.5 23.2C27.5 20.8 23.8 21.2 23.8 19.8C23.8 19.2 24.4 18.7 25.2 18.7C26.2 18.7 27 19.1 27.6 19.8L28.8 18.6C27.9 17.6 26.6 17.2 25.2 17.2C23.5 17.2 22.3 18.3 22.3 19.8C22.3 22.2 26 21.8 26 23.2C26 23.8 25.4 24.2 24.6 24.2C23.4 24.2 22.4 23.5 21.8 22.8L21.5 24.2Z"
            fill="#FF9900"
          />
          <path
            d="M29 18.5L31.5 25.5H33.2L35 19.8L36.8 25.5H38.5L41 18.5H39.2L37.7 23.6L35.9 18.5H34.1L32.3 23.6L30.8 18.5H29Z"
            fill="#FF9900"
          />
        </svg>
      );

    case 'azure':
    case 'microsoft azure':
      return (
        <svg
          viewBox="0 0 48 48"
          className={`${currentSizeClass} ${className} shrink-0`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Azure Official Geometric "A" Emblem */}
          <rect width="48" height="48" rx="10" fill="#0B1528" />
          <path
            d="M13 33.5L25.8 11.5H33.5L20.8 33.5H13Z"
            fill="url(#azure-grad-1)"
          />
          <path
            d="M24.8 25.8L29 18.5L37 33.5H29.5L24.8 25.8Z"
            fill="url(#azure-grad-2)"
          />
          <path
            d="M13 33.5L22.5 27L28 33.5H13Z"
            fill="url(#azure-grad-3)"
          />
          <defs>
            <linearGradient id="azure-grad-1" x1="13" y1="11.5" x2="33.5" y2="33.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0078D4" />
              <stop offset="1" stopColor="#002D6B" />
            </linearGradient>
            <linearGradient id="azure-grad-2" x1="24.8" y1="18.5" x2="37" y2="33.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#50E6FF" />
              <stop offset="1" stopColor="#0078D4" />
            </linearGradient>
            <linearGradient id="azure-grad-3" x1="13" y1="27" x2="28" y2="33.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#005BA1" />
              <stop offset="1" stopColor="#00244D" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'gcp':
    case 'google cloud':
    case 'google cloud platform':
      return (
        <svg
          viewBox="0 0 48 48"
          className={`${currentSizeClass} ${className} shrink-0`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* GCP Official 4-Color Cloud Mark */}
          <rect width="48" height="48" rx="10" fill="#171C28" />
          {/* Blue Cloud Top */}
          <path
            d="M27.5 16C24.8 16 22.4 17.5 21.2 19.8C20.4 19.3 19.5 19 18.5 19C15.5 19 13 21.5 13 24.5C13 24.8 13 25 13.1 25.3C11.3 26.2 10 28.2 10 30.5C10 33.8 12.7 36.5 16 36.5H35C37.8 36.5 40 34.3 40 31.5C40 29 38.2 26.9 35.8 26.6C35.9 26.1 36 25.5 36 25C36 20 32.2 16 27.5 16Z"
            fill="none"
          />
          <path
            d="M27.5 16.5C31.6 16.5 35 19.8 35 24C35 24.3 35 24.7 34.9 25L34.6 26.5L36.1 26.7C38.3 27 40 28.9 40 31.2C40 33.9 37.8 36 35 36H16C12.7 36 10 33.3 10 30C10 27.5 11.5 25.4 13.7 24.4L15.1 23.7L14.7 22.2C14.6 21.8 14.5 21.4 14.5 21C14.5 18.2 16.7 16 19.5 16C20.6 16 21.7 16.4 22.5 17.1L23.9 18.2L24.8 16.8C25.5 15.7 26.7 15 28 15"
            fill="none"
          />
          {/* Four colored cloud arches */}
          <path
            d="M21 21C21.8 18 24.5 16 27.8 16C32.3 16 36 19.6 36 24C36 24.5 35.9 25 35.8 25.5"
            stroke="#EA4335"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M35.8 25.5C37.7 26.2 39 28.2 39 30.5C39 33.5 36.5 36 33.5 36H24"
            stroke="#4285F4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M24 36H16C12.7 36 10 33.3 10 30C10 27.4 11.6 25.2 14 24.3"
            stroke="#34A853"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M14 24.3C14 23.8 14 23.4 14 23C14 20.2 16.2 18 19 18C20 18 20.9 18.3 21.6 18.8"
            stroke="#FBBC04"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'kubernetes':
    case 'k8s':
      return (
        <svg
          viewBox="0 0 48 48"
          className={`${currentSizeClass} ${className} shrink-0`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="48" height="48" rx="10" fill="#1A2744" />
          <path
            d="M24 11L35 17.5V30.5L24 37L13 30.5V17.5L24 11Z"
            stroke="#326CE5"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="24" r="4.5" fill="#326CE5" />
          <path d="M24 15V19.5M24 28.5V33M16 19.5L19.5 21.5M28.5 26.5L32 28.5M16 28.5L19.5 26.5M28.5 21.5L32 19.5" stroke="#326CE5" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'terraform':
      return (
        <svg
          viewBox="0 0 48 48"
          className={`${currentSizeClass} ${className} shrink-0`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="48" height="48" rx="10" fill="#1C182B" />
          <path d="M14 14L21.5 18.5V27.5L14 23V14Z" fill="#844FBA" />
          <path d="M23 19.5L30.5 15V24L23 28.5V19.5Z" fill="#5C4EE5" />
          <path d="M23 30.5L30.5 26V35L23 39.5V30.5Z" fill="#844FBA" />
          <path d="M32 14L39.5 18.5V27.5L32 23V14Z" fill="#00BC7F" />
        </svg>
      );

    default:
      return (
        <div
          className={`${currentSizeClass} ${className} rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0`}
        >
          {provider.slice(0, 3).toUpperCase()}
        </div>
      );
  }
};
