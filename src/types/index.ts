/**
 * Global TypeScript type definitions
 */

export enum CallState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  FAILED = 'FAILED',
}

export enum NetworkQuality {
  EXCELLENT = 6,
  GOOD = 5,
  POOR = 4,
  BAD = 3,
  VERY_BAD = 2,
  DISCONNECTED = 1,
  UNKNOWN = 0,
}

export interface User {
  id: string;
  name: string;
  role: 'doctor' | 'patient';
  avatar?: string;
}

export interface CallSession {
  id: string;
  channelName: string;
  token: string;
  appointmentId: string;
  startTime: Date;
  endTime?: Date;
  participants: User[];
}

export interface VideoConfig {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  minBitrate: number;
  orientationMode: 'adaptive' | 'fixed';
}

export interface AudioConfig {
  bitrate: number;
  sampleRate: number;
  channels: number;
}

export interface CallMetrics {
  videoBitrate: number;
  audioBitrate: number;
  packetLoss: number;
  latency: number;
  frameRate: number;
  networkQuality: NetworkQuality;
}

export interface CallError {
  code: string;
  message: string;
  details?: any;
}

export interface AgoraToken {
  token: string;
  channelName: string;
  uid: number;
  expiresAt: Date;
}

export interface CallControls {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeakerEnabled: boolean;
  isFrontCamera: boolean;
}

export type CallEventType =
  | 'userJoined'
  | 'userLeft'
  | 'connectionStateChanged'
  | 'networkQualityChanged'
  | 'error'
  | 'warning';

export interface CallEvent {
  type: CallEventType;
  data: any;
  timestamp: Date;
}

// Made with Bob
