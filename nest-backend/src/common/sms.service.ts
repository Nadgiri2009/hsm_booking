import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';
import * as querystring from 'querystring';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private getConfig() {
    return {
      appid: process.env.SMS_APPID || '',
      user: process.env.SMS_USER || '',
      pass: process.env.SMS_PASS || '',
      from: process.env.SMS_FROM || '',
      dlt: process.env.SMS_DLT || '',
      gateway: 'https://push3.aclgateway.com/servlet/com.aclwireless.pushconnectivity.listeners.TextListener',
    };
  }

  async sendSms(message: string, mobileNo: string) {
    try {
      const cfg = this.getConfig();
      const params = {
        appid: cfg.appid,
        userId: cfg.user,
        pass: cfg.pass,
        contenttype: '1',
        from: cfg.from,
        to: `91${mobileNo}`,
        text: message,
        alert: '1',
        selfid: 'true',
        dlrreq: 'true',
        dtm: cfg.dlt,
      } as any;

      const qs = querystring.stringify(params);
      const url = `${cfg.gateway}?${qs}`;
      this.logger.debug('Sending SMS to ' + mobileNo + ' via ' + url);
      const resp = await fetch(url);
      const txt = await resp.text();
      this.logger.log(`SMS sent to ${mobileNo}: ${txt}`);
      return { success: true, response: txt };
    } catch (ex) {
      this.logger.error('SMS send failed', ex as any);
      return { success: false, error: String(ex) };
    }
  }
}
