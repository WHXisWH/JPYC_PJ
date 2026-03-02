import { Controller, Get } from '@nestjs/common';

@Controller('/v1/user')
export class UserController {
  @Get('/balance')
  balance() {
    // MVP: 実装はウォレット方式（ノンカストディ/カストディ）で大きく変わるため、ここでは形だけ定義
    return { currency: 'JPYC' as const, balanceMinor: 0, depositHeldMinor: 0 };
  }
}

