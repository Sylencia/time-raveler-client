import { Cross1Icon } from '@radix-ui/react-icons';
import { forwardRef } from 'react';
import './Dialog.css';

type DialogProps = {
  children: React.ReactNode;
  toggleDialog: () => void;
};

export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(({ children, toggleDialog }, ref) => {
  return (
    <dialog
      tabIndex={-1}
      className="dialog"
      ref={ref}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          toggleDialog();
        }
      }}
    >
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        {children}
        <button tabIndex={0} className="dialog-close" onClick={toggleDialog}>
          <Cross1Icon height={16} width={16} />
        </button>
      </div>
    </dialog>
  );
});
