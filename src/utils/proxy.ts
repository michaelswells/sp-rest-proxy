import * as spauth from 'node-sp-auth';
import * as spRequest from 'sp-request';
import { parse as urlParse } from 'url';

import { IProxyContext } from '../core/interfaces';

export class ProxyUtils {

  private spr: spRequest.ISPRequest;

  constructor(private ctx: IProxyContext) { /**/ }

  public getAuthOptions(): Promise<spauth.IAuthResponse> {
    return spauth.getAuth(this.ctx.siteUrl, this.ctx.authOptions) as any;
  }

  public getCachedRequest(spr: spRequest.ISPRequest): spRequest.ISPRequest {
    this.spr = spr || spRequest.create(this.ctx.authOptions);
    return this.spr;
  }

  public isOnPrem(url: string): boolean {
    return url.indexOf('.sharepoint.com') === -1 && url.indexOf('.sharepoint.cn') === -1;
  }

  public isUrlHttps(url: string): boolean {
    return url.split('://')[0].toLowerCase() === 'https';
  }

  public isUrlAbsolute(url: string): boolean {
    return url.indexOf('http:') === 0 || url.indexOf('https:') === 0;
  }

  public buildEndpointUrl(reqUrl: string): string {
    const siteUrlParsed = urlParse(this.ctx.siteUrl);
    const baseUrlArr = siteUrlParsed.pathname.split('/');
    const reqUrlArr = reqUrl.split('?')[0].split('/');
    const len = baseUrlArr.length > reqUrlArr.length ? reqUrlArr.length : baseUrlArr.length;
    let similarity = 0;
    let reqPathName = reqUrl;
    for (let i = 0; i < len; i += 1) {
      similarity += baseUrlArr[i] === reqUrlArr[i] ? 1 : 0;
    }
    if (similarity < 2) {
      reqPathName = (`${siteUrlParsed.pathname}/${reqUrl}`).replace(/\/\//g, '/');
    }
    reqPathName = reqPathName.replace(/\/\//g, '/');
    return `${siteUrlParsed.protocol}//${siteUrlParsed.host}${reqPathName}`;
  }

  public buildProxyEndpointUrl(reqUrl: string): string {
    const spHostUrl = this.ctx.siteUrl.split('/').splice(0, 3).join('/');
    let proxyUrl = reqUrl;
    if (proxyUrl.toLowerCase().indexOf(spHostUrl.toLowerCase()) === 0) {
      proxyUrl = proxyUrl.replace(new RegExp(spHostUrl, 'i'), this.ctx.proxyHostUrl);
    }
    return proxyUrl;
  }

}
