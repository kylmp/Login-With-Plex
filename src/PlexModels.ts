export interface IPlexClient {
  appName: string;
  clientId: string;
  forwardUrl: string;
  platform: string;
  device: string;
  version: string;
}

export interface IPlexCredentials {
  code: string,
  pin: number,
  auth?: string
}