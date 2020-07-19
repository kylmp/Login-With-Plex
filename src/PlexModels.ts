export interface IPlexClient {
  appName: string;
  clientId: string;
  forwardUrl: string;
}

export interface IPlexUser {
  code: string,
  pin: number,
  auth?: string
}