import {IPlexClient, IPlexCredentials} from './PlexModels'
import axios from 'axios';

export class PlexLogin {
  constructor(private clientInfo: IPlexClient) { }

  public async getCredentials(): Promise<IPlexCredentials> {
    var url = 'https://plex.tv/api/v2/pins'
    var body = 'strong=true' + 
              '&X-Plex-Product='+encodeURIComponent(this.clientInfo.appName) + 
              '&X-Plex-Client-Identifier='+encodeURIComponent(this.clientInfo.clientId);
    console.log(url)
    return new Promise((resolve, reject) => {
      axios.post(url, body, {headers: {accept: 'application/json'}})
        .then((res) => {
          resolve({code: res.data.code, pin: res.data.id});
        })
        .catch((err) => {
          reject('Error generating user code and pin');
        })
    });
  }

  public getLoginUrl(plexUser: IPlexCredentials): string {
    if (plexUser.code === undefined) {
      throw new Error('PlexUser code is required to generate login url');
    }
    return 'https://app.plex.tv/auth#?' +
           'clientID='+encodeURIComponent(this.clientInfo.clientId) +
           '&code='+encodeURIComponent(plexUser.code) +
           '&forwardUrl='+encodeURIComponent(this.clientInfo.forwardUrl) + 
           '&context%5Bdevice%5D%5Bproduct%5D='+encodeURIComponent(this.clientInfo.appName);
  }

  private async getAuthToken(plexUser: IPlexCredentials): Promise<string> {
    var url = 'https://plex.tv/api/v2/pins/'+plexUser.pin +
               '?code='+encodeURIComponent(plexUser.code) +
               '&X-Plex-Client-Identifier='+encodeURIComponent(this.clientInfo.clientId);
    return new Promise((resolve, reject) => {
      axios.get(url, {headers: {accept: 'application/json'}})
        .then((res) => {
          resolve(res.data.authToken);
        })
        .catch((err) => {
          reject('Error generating user auth token');
        })
    });
  }

  public async getUserInfo(plexUser: IPlexCredentials): Promise<object | null> {
    if (plexUser.code === undefined) 
      throw new Error('PlexUser code is required to retrieve plex info');
    if (plexUser.pin === undefined) 
      throw new Error('PlexUser pin is required to retrieve plex info');
    if (plexUser.auth === undefined) {
      plexUser.auth = await this.getAuthToken(plexUser).catch((err) => { throw err });
    }
    var url = 'https://plex.tv/api/v2/user' +
              '?X-Plex-Product='+encodeURIComponent(this.clientInfo.appName) + 
              '&X-Plex-Client-Identifier='+encodeURIComponent(this.clientInfo.clientId) + 
              '&X-Plex-Token='+encodeURIComponent(plexUser.auth);
    return new Promise((resolve, reject) => {
      axios.get(url, {headers: {accept: 'application/json'}})
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          reject('Error retrieving plex user information');
        })
    });
  }
}