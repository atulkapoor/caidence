import { useEffect } from 'react';

/**
 * Hook to prevent body scroll when modal is open
 * Adds overflow-hidden to document.body and cleans up on unmount or when isOpen changes
 */
export const useModalScroll = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);
};
