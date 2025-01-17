export type TimerData = {
  id: string;
  endTime: number;
  timeRemaining: number;
  running: boolean;
  eventName: string;
  rounds: number;
  roundTime: number;
  hasDraft: boolean;
  draftTime: number;
  currentRoundNumber: number;
  currentRoundLength: number;
};
