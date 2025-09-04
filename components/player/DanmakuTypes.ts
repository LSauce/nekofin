import { DandanCommentMode } from '@/services/dandanplay';

export type ActiveBullet = {
  id: number;
  text: string;
  colorHex: string;
  top: number;
  durationMs: number;
  mode: DandanCommentMode;
  startOffsetMs: number;
  scheduledMs: number;
  textWidth: number;
};
