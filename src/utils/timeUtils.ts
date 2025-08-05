export const convertMinutesToMilliseconds = (minutes: number) => {
  return minutes * 60 * 1000;
};

export const formatTime = (milliseconds: number): string => {
  const seconds = Math.round(milliseconds / 1000);
  const sign = seconds < 0 ? '-' : '';
  const absSeconds = Math.abs(seconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const remainingSeconds = absSeconds % 60;

  let formattedString = sign;
  if (hours > 0) {
    formattedString += `${hours}:`;
  }
  formattedString += `${String(minutes).padStart(2, '0')}:`;
  formattedString += String(remainingSeconds).padStart(2, '0');

  return formattedString;
};

export const formatTimestampToTime = (utcNumber: number): string => {
  const date = new Date(utcNumber);

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12;
  hours = hours ? hours : 12;

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes}${ampm}`;
  return timeString;
};

export const adjustIsoTime = (isoString: string, offsetMs: number) => {
  return new Date(Date.parse(isoString) + offsetMs).toISOString();
};
