import type { TimerData } from './CommonTypes';
import type { RoomMode } from './RoomTypes';

export interface UnsubscribeSuccessMessage {
  type: 'unsubscribeSuccess';
}

export interface RoomValidityMessage {
  type: 'roomValidity';
  valid: boolean;
}

export interface RoomUpdateMessage {
  type: 'roomUpdate';
  timers: TimerData[];
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface ViewOnlyRoomInfoMessage {
  type: 'roomInfo';
  accessLevel: RoomMode;
  viewAccessId: string;
}
export interface EditRoomInfoMessage extends ViewOnlyRoomInfoMessage {
  editAccessId: string;
}

export type RoomInfoMessage = ViewOnlyRoomInfoMessage | EditRoomInfoMessage;

export type ServerMessageTypes =
  | UnsubscribeSuccessMessage
  | RoomValidityMessage
  | RoomInfoMessage
  | RoomUpdateMessage
  | ErrorMessage;
