import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { z } from 'zod';
import { StoreService } from '../services/store.service';

const IdentityVerifyBodySchema = z.object({
  userId: z.string().min(1),
  venueId: z.string().min(1),
});

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

