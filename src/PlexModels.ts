export interface IPlexClient {
  appName: string;
  clientId: string;
  forwardUrl: string;
}

export interface IPlexCredentials {
  code: string,
  pin: number,
  auth?: string
}