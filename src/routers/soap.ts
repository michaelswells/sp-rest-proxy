import { ProxyUtils } from '../utils';
import { IProxyContext, IProxySettings } from '../interfaces';
import { ISPRequest } from 'sp-request';
import { IAuthResponse } from 'node-sp-auth';
import { Request, Response, NextFunction } from 'express';

export class SoapRouter {

    private spr: ISPRequest;
    private ctx: IProxyContext;
    private settings: IProxySettings;
    private util: ProxyUtils;

    constructor(context: IProxyContext, settings: IProxySettings) {
        this.ctx = context;
        this.settings = settings;
        this.util = new ProxyUtils(this.ctx);
    }

    public router = (req: Request, res: Response, next?: NextFunction) => {
        let endpointUrl = this.util.buildEndpointUrl(req.originalUrl);
        this.spr = this.util.getCachedRequest(this.spr);

        console.log('\nPOST: ' + endpointUrl); // _self.ctx.siteUrl + req.originalUrl

        let regExpOrigin = new RegExp(req.headers.origin, 'g');
        let soapBody = '';
        req.on('data', (chunk) => {
            soapBody += chunk;
        });
        req.on('end', () => {
            soapBody = soapBody.replace(regExpOrigin, this.ctx.siteUrl);

            this.util.getAuthOptions()
                .then((opt: IAuthResponse) => {
                    let headers = opt.headers;

                    headers['Accept'] = 'application/xml, text/xml, */*; q=0.01';
                    headers['Content-Type'] = 'text/xml;charset="UTF-8"';
                    headers['X-Requested-With'] = 'XMLHttpRequest';
                    headers['Content-Length'] = soapBody.length;

                    this.spr.post(endpointUrl, {
                        headers: headers,
                        body: soapBody,
                        json: false
                    })
                        .then((response: any) => {
                            if (this.settings.debugOutput) {
                                console.log(response.statusCode, response.body);
                            }
                            res.send(response);
                            res.end();
                        });
                })
                .catch((err: any) => {
                    res.status(err.statusCode);
                    res.json(err);
                });
        });
    }
}