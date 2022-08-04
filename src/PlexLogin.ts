import {IPlexClient, IPlexCredentials} from './PlexModels'
import https from 'https';

export class PlexLogin {
  constructor(private client: IPlexClient) {
    this.client.appName = encodeURIComponent(this.client.appName);
    this.client.clientId = encodeURIComponent(this.client.clientId);
    this.client.forwardUrl = encodeURIComponent(this.client.forwardUrl);
    this.client.platform = encodeURIComponent(this.client.platform);
    this.client.device = encodeURIComponent(this.client.device);
    this.client.version = encodeURIComponent(this.client.version);
  }

  /**
   * Generates a new set of credentials for a user (code and pin)
   */
  public async generateCredentials(): Promise<IPlexCredentials> {
    let url = 'https://plex.tv/api/v2/pins';
    let body = `strong=true&X-Plex-Product=${this.client.appName}&X-Plex-Client-Identifier=${this.client.clientId}&X-Plex-Device=${this.client.device}&X-Plex-Platform=${this.client.platform}&X-Plex-Version=${this.client.version}`;
    return new Promise((resolve, reject) => {
      this.httpRequest(url, body)
        .then(res => { resolve({code: res.code, pin: res.id}) })
        .catch(err => { reject('Error generating user code and pin\n'+err) });
    });
  }

  /**
   * Returns the plex login url to redirect the user to
   * @param cred : the credentials for the user's login (code required)  
   */
  public getLoginUrl(cred: IPlexCredentials): string {
    if (cred.code === undefined) 
      throw new Error('PlexUser code is required to generate login url');
    return `https://app.plex.tv/auth#?clientID=${this.client.clientId}&code=${cred.code}` +
           `&forwardUrl=${this.client.forwardUrl}&context%5Bdevice%5D%=${this.client.device}5Bproduct%5D=${this.client.appName}`;
  }

  /**
   * Returns the user's plex auth token
   * @param cred : the credentials for the user's login (code and pin required)  
   */
  private async getAuthToken(cred: IPlexCredentials): Promise<string> {
    var url = `https://plex.tv/api/v2/pins/${cred.pin}?code=${cred.code}&X-Plex-Client-Identifier=${this.client.clientId}`;
    return new Promise((resolve, reject) => {
      this.httpRequest(url)
        .then(res => { resolve(res.authToken) })
        .catch(err => { reject('Error generating user auth token\n'+err) });
    });
  }

  /**
   * Returns the user's plex information
   * @param cred : the credentials for the user's login (code and pin required)  
   */
  public async getUserInfo(cred: IPlexCredentials): Promise<object | null> {
    if (cred.auth === undefined) {
      if (cred.code === undefined || cred.pin === undefined) 
        throw new Error('Plex code and pin is required to retrieve plex user info');
      cred.auth = await this.getAuthToken(cred).catch(err => { throw err });
    } 
    var url = `https://plex.tv/api/v2/user?X-Plex-Product=${this.client.appName}` + 
              `&X-Plex-Client-Identifier=${this.client.clientId}&X-Plex-Token=${cred.auth}`;
    return new Promise((resolve, reject) => {
      this.httpRequest(url)
        .then(res => { resolve(res) })
        .catch(err => { reject('Error retrieving plex user information\n'+err) });
    });
  }

  /**
   * Make an HTTP request using standard library. 
   * If body provided will do POST and expected form-urlencoded body, otherwise does GET request.
   * Response is always parsed JSON
   * @param url : URL to send request to
   * @param body : form url-encoded body
   */
  private httpRequest(url: string, body?: string): Promise<any> {
    let headers: any = {accept: 'application/json'};
    let method: string = "GET";
    if (body !== undefined) {
      headers['Content-Length'] = body.length;
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      method = "POST";
    }
    let config: object = {
      method: method,
      headers: headers
    }
    return new Promise((resolve, reject) => {
      let req = https.request(url, config, (response) => {
        let res = '';
        response.on('data', (chunk) => {
          res += chunk;
        });
        response.on('end', () => {
          let data = JSON.parse(res)
          if (data)
            resolve(data);
          else
            reject(new Error('Error parsing response'));
        });
      })
      .on("error", (error) => {
        reject(error);
      });
      if (body !== undefined) 
        req.write(body);
      req.end();
    });
  }
}