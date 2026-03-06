import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { IdentityVerifyBodySchema } from '../contracts';
import { StoreService } from '../services/store.service';

@Controller('/v1/identity')
export class IdentityController {
  constructor(private readonly store: StoreService) {}

  @Post('/verify')
  verify(@Body() body: unknown) {
    const parsed = IdentityVerifyBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException({ message: '入力が不正です' }, HttpStatus.BAD_REQUEST);
    }
    const r = this.store.createIdentityVerification(parsed.data);
    return { identityVerificationId: r.identityVerificationId };
  }
}

