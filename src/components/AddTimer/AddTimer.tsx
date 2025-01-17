import { Dialog } from 'components/Dialog/Dialog';
import { useRef, useState } from 'react';
import './AddTimer.css';

interface AddTimerProps {
  onAddTimer: (timer: {
    eventName: string;
    rounds: number;
    roundTime: number;
    hasDraft: boolean;
    draftTime: number;
  }) => void;
}

export const AddTimer = ({ onAddTimer }: AddTimerProps) => {
  const [eventName, setEventName] = useState('');
  const [rounds, setRounds] = useState<string>('');
  const [roundTime, setRoundTime] = useState<string>('');
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTime, setDraftTime] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const toggleDialog = () => {
    if (!dialogRef.current) {
      return;
    }

    if (dialogRef.current.hasAttribute('open')) {
      dialogRef.current.close();
    } else {
      dialogRef.current.showModal();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTimer({
      eventName,
      rounds: Number(rounds!),
      roundTime: Number(roundTime!),
      hasDraft,
      draftTime: Number(draftTime ?? 0),
    });
    setEventName('');
    setRounds('');
    setRoundTime('');
    setHasDraft(false);
    setDraftTime('');
    toggleDialog();

    formRef.current?.reset();
  };

  return (
    <>
      <button className="add-timer" onClick={toggleDialog}>
        +
      </button>
      <Dialog toggleDialog={toggleDialog} ref={dialogRef}>
        <h2 className="add-timer-title">Add New Timer</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="add-timer-form">
          <div className="form-field">
            <label className="form-field-label" htmlFor="eventName">
              Event Name
            </label>
            <input id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
          </div>
          <div className="form-field-divider" />
          <div className="form-field-horizontal">
            <label className="form-field-label" htmlFor="hasDraft">
              Include Draft Round
            </label>
            <input type="checkbox" id="hasDraft" checked={hasDraft} onChange={(e) => setHasDraft(e.target.checked)} />
          </div>
          <div className="form-field">
            <label className="form-field-label" htmlFor="draftTime">
              Draft Time (minutes)
            </label>
            <input
              id="draftTime"
              placeholder={hasDraft ? '' : 'No draft time'}
              type="text"
              pattern="[1-9][0-9]*"
              value={hasDraft ? draftTime : ''}
              onChange={(e) => setDraftTime(e.target.value)}
              required
              disabled={!hasDraft}
              title="A number is required"
            />
          </div>
          <div className="form-field-divider" />
          <div className="form-field">
            <label className="form-field-label" htmlFor="rounds">
              Number of Rounds
            </label>
            <input
              id="rounds"
              type="text"
              pattern="[1-9][0-9]*"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
              required
              title="A number is required"
            />
          </div>
          <div className="form-field">
            <label className="form-field-label" htmlFor="roundTime">
              Round Time (minutes)
            </label>
            <input
              id="roundTime"
              type="text"
              pattern="[1-9][0-9]*"
              value={roundTime}
              onChange={(e) => setRoundTime(e.target.value)}
              required
              title="A number is required"
            />
          </div>
          <div className="form-field-divider" />
          <button type="submit" className="add-timer-submit">
            Add Timer
          </button>
        </form>
      </Dialog>
    </>
  );
};
