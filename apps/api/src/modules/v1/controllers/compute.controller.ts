import { Body, Controller, HttpException, HttpStatus, Param, Post, Get } from '@nestjs/common';
import { SubmitJobBodySchema } from '../contracts';
import { FeatureFlagsService } from '../services/featureFlags.service';
import { StoreService } from '../services/store.service';

@Controller('/v1/compute')
export class ComputeController {
  constructor(
    private readonly flags: FeatureFlagsService,
    private readonly store: StoreService,
  ) {}

  @Get('/nodes')
  nodes() {
    if (!this.flags.computeMarketEnabled()) {
      throw new HttpException({ message: '算力市場は無効です' }, HttpStatus.NOT_IMPLEMENTED);
    }
    return this.store.listComputeNodes();
  }

  @Post('/jobs')
  submit(@Body() body: unknown) {
    if (!this.flags.computeMarketEnabled()) {
      throw new HttpException({ message: '算力市場は無効です' }, HttpStatus.NOT_IMPLEMENTED);
    }
    const parsed = SubmitJobBodySchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ message: '入力が不正です' }, HttpStatus.BAD_REQUEST);
    const job = this.store.submitComputeJob({
      requesterId: parsed.data.requesterId,
      taskType: parsed.data.taskType,
      taskSpec: parsed.data.taskSpec,
    });
    return { jobId: job.jobId };
  }

  @Get('/jobs/:jobId')
  getJob(@Param('jobId') jobId: string) {
    if (!this.flags.computeMarketEnabled()) {
      throw new HttpException({ message: '算力市場は無効です' }, HttpStatus.NOT_IMPLEMENTED);
    }
    const job = this.store.getComputeJob(jobId);
    if (!job) throw new HttpException({ message: 'ジョブが見つかりません' }, HttpStatus.NOT_FOUND);
    return { jobId: job.jobId, status: job.status };
  }

  @Post('/jobs/:jobId/cancel')
  cancel(@Param('jobId') jobId: string) {
    if (!this.flags.computeMarketEnabled()) {
      throw new HttpException({ message: '算力市場は無効です' }, HttpStatus.NOT_IMPLEMENTED);
    }
    const job = this.store.cancelComputeJob(jobId);
    if (!job) throw new HttpException({ message: 'ジョブが見つかりません' }, HttpStatus.NOT_FOUND);
    return { jobId: job.jobId, cancelled: true as const };
  }

  @Get('/jobs/:jobId/result')
  result(@Param('jobId') jobId: string) {
    if (!this.flags.computeMarketEnabled()) {
      throw new HttpException({ message: '算力市場は無効です' }, HttpStatus.NOT_IMPLEMENTED);
    }
    const job = this.store.getComputeJob(jobId);
    if (!job) throw new HttpException({ message: 'ジョブが見つかりません' }, HttpStatus.NOT_FOUND);
    return { jobId: job.jobId, resultUri: null };
  }
}
