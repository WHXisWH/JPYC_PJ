import { Controller, Get } from '@nestjs/common';

@Controller('/v1')
export class HealthController {
  @Get('/health')
  health() {
    return { ok: true as const };
  }
}

