import { Dialog } from 'components/Dialog/Dialog';
import { Spinner } from 'components/Spinner';
import { supabase } from 'lib/supabase';
import { useRef, useState } from 'react';
import { useRoomId } from 'stores/useRoomStore';
import './AddTimer.css';

export const AddTimer = () => {
  const roomId = useRoomId();

  const [eventName, setEventName] = useState('');
  const [rounds, setRounds] = useState<string>('');
  const [roundTime, setRoundTime] = useState<string>('');
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTime, setDraftTime] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsAdding(true);
    const { error } = await supabase.rpc('create_timer', {
      _rounds: Number(rounds!),
      _round_time: Number(roundTime!) * 60 * 1000,
      _has_draft: hasDraft,
      _draft_time: Number(draftTime ?? 0) * 60 * 1000,
      _room_id: roomId,
      _event_name: eventName,
    });

    setIsAdding(false);
    if (error) {
      console.error(error.message);
      return;
    }

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
          <button type="submit" className="add-timer-submit" disabled={isAdding}>
            {isAdding ? <Spinner /> : 'Add Timer'}
          </button>
        </form>
      </Dialog>
    </>
  );
};
