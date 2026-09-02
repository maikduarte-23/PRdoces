import { useEffect } from 'react';

/**
 * Hook utilitário para comportamento padrão de modais:
 * - Fecha com a tecla 'Escape'
 * - Bloqueia a rolagem de fundo do body (scroll lock) enquanto o modal estiver aberto
 */
export function useModalBehavior(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    // Bloqueia rolagem do body
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Captura Escape
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
}
