import clsx from 'clsx';
import { ReactNode, useMemo, useState } from 'react';
import './ExpandablePill.css';

interface ExpandablePillProps {
  onClick?: () => void;
  icon: ReactNode;
  text: string;
  className?: string;
}

interface PillActiveStates {
  hover: boolean;
  focus: boolean;
}

export const ExpandablePill = ({ onClick, icon, text, className }: ExpandablePillProps) => {
  const [isFocused, setIsFocused] = useState<PillActiveStates>({
    hover: false,
    focus: false,
  });

  const showContent = useMemo(() => isFocused.hover || isFocused.focus, [isFocused]);

  const handleOnClick = (shouldCopy: boolean = true) => {
    if (onClick) {
      onClick();
    } else if (shouldCopy) {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <button
      className={clsx(className, 'expandable-pill')}
      onClick={() => handleOnClick(true)}
      onTouchStart={(e) => {
        e.preventDefault();
        handleOnClick(false);
        setIsFocused((prev: PillActiveStates) => ({ ...prev, hover: true }));
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        setIsFocused((prev: PillActiveStates) => ({ ...prev, hover: false }));
      }}
      onMouseEnter={() => setIsFocused((prev: PillActiveStates) => ({ ...prev, hover: true }))}
      onFocus={() => setIsFocused((prev: PillActiveStates) => ({ ...prev, focus: true }))}
      onMouseLeave={() => setIsFocused((prev: PillActiveStates) => ({ ...prev, hover: false }))}
      onBlur={() => setIsFocused((prev: PillActiveStates) => ({ ...prev, focus: false }))}
    >
      {icon}
      {showContent && <div>{text}</div>}
    </button>
  );
};
