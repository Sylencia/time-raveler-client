export enum RoomAccess {
  VIEW_ONLY = 'view',
  EDIT = 'edit',
}

export type RoomMode = RoomAccess.EDIT | RoomAccess.VIEW_ONLY | undefined;
