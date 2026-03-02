import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/modules/app.module';

describe('API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/health', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('POST /v1/passes/purchase requires Idempotency-Key', async () => {
    const res = await request(app.getHttpServer()).post('/v1/passes/purchase').send({
      planId: 'p1',
      venueId: 'v1',
      paymentMethod: 'JPYC',
    });
    expect(res.status).toBe(400);
  });

  it('POST /v1/passes/purchase validates body and idempotency key format', async () => {
    const server = app.getHttpServer();

    const invalidBody = await request(server).post('/v1/passes/purchase').set('Idempotency-Key', 'abcDEF12').send({
      planId: '',
      venueId: 'v1',
      paymentMethod: 'JPYC',
    });
    expect(invalidBody.status).toBe(400);

    const invalidKey = await request(server).post('/v1/passes/purchase').set('Idempotency-Key', '短い').send({
      planId: 'p1',
      venueId: 'v1',
      paymentMethod: 'JPYC',
    });
    expect(invalidKey.status).toBe(400);
  });

  it('POST /v1/passes/purchase is idempotent', async () => {
    const server = app.getHttpServer();
    const body = { planId: 'p1', venueId: 'v1', paymentMethod: 'JPYC' as const };

    const r1 = await request(server).post('/v1/passes/purchase').set('Idempotency-Key', 'abcDEF12').send(body);
    expect(r1.status).toBe(201);
    const tx = r1.body.ledgerTxId as string;
    expect(tx).toMatch(/^ltx_[a-f0-9]{16}$/);
    expect(r1.body.passId).toMatch(/^pass_[a-f0-9]{16}$/);

    const r2 = await request(server).post('/v1/passes/purchase').set('Idempotency-Key', 'abcDEF12').send(body);
    expect(r2.status).toBe(201);
    expect(r2.body.ledgerTxId).toBe(tx);
    expect(r2.body.passId).toBe(r1.body.passId);

    const r3 = await request(server)
      .post('/v1/passes/purchase')
      .set('Idempotency-Key', 'abcDEF12')
      .send({ ...body, venueId: 'v2' });
    expect(r3.status).toBe(409);
  });
});
