import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/modules/app.module';

describe('API v1 surface', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/venues and /v1/venues/:id/plans', async () => {
    const venues = await request(app.getHttpServer()).get('/v1/venues');
    expect(venues.status).toBe(200);
    expect(Array.isArray(venues.body)).toBe(true);
    expect(venues.body[0].venueId).toBeDefined();

    const plans = await request(app.getHttpServer()).get(`/v1/venues/${venues.body[0].venueId}/plans`);
    expect(plans.status).toBe(200);
    expect(Array.isArray(plans.body)).toBe(true);
  });

  it('POST /v1/identity/verify validates body', async () => {
    const bad = await request(app.getHttpServer()).post('/v1/identity/verify').send({ userId: '' });
    expect(bad.status).toBe(400);

    const ok = await request(app.getHttpServer()).post('/v1/identity/verify').send({ userId: 'u1', venueId: 'venue_demo' });
    expect(ok.status).toBe(201);
    expect(ok.body.identityVerificationId).toMatch(/^idv_[a-f0-9]{16}$/);
  });

  it('sessions checkin/checkout basic flow and idempotency', async () => {
    const purchase = await request(app.getHttpServer())
      .post('/v1/passes/purchase')
      .set('Idempotency-Key', 'abcDEF12')
      .send({ planId: 'plan_3h', venueId: 'venue_demo', paymentMethod: 'JPYC' });
    expect(purchase.status).toBe(201);

    const checkin = await request(app.getHttpServer())
      .post('/v1/sessions/checkin')
      .send({ passId: purchase.body.passId, seatId: 'seat_1', venueId: 'venue_demo' });
    expect(checkin.status).toBe(201);
    expect(checkin.body.sessionId).toMatch(/^sess_[a-f0-9]{16}$/);

    const checkout1 = await request(app.getHttpServer())
      .post('/v1/sessions/checkout')
      .set('Idempotency-Key', 'checkout01')
      .send({ sessionId: checkin.body.sessionId });
    expect(checkout1.status).toBe(201);
    expect(checkout1.body.usedMinutes).toBe(0);

    const checkout2 = await request(app.getHttpServer())
      .post('/v1/sessions/checkout')
      .set('Idempotency-Key', 'checkout01')
      .send({ sessionId: checkin.body.sessionId });
    expect(checkout2.status).toBe(201);
    expect(checkout2.body).toEqual(checkout1.body);

    const conflict = await request(app.getHttpServer())
      .post('/v1/sessions/checkout')
      .set('Idempotency-Key', 'checkout01')
      .send({ sessionId: 'sess_other' });
    expect(conflict.status).toBe(409);
  });

  it('GET /v1/user/balance', async () => {
    const res = await request(app.getHttpServer()).get('/v1/user/balance');
    expect(res.status).toBe(200);
    expect(res.body.currency).toBe('JPYC');
  });

  it('merchant can create venue and upsert plan', async () => {
    const venue = await request(app.getHttpServer())
      .post('/v1/merchant/venues')
      .send({ name: '新店舗', address: '大阪', timezone: 'Asia/Tokyo' });
    expect(venue.status).toBe(201);

    const plan = await request(app.getHttpServer())
      .put(`/v1/merchant/venues/${venue.body.venueId}/plans`)
      .send({ name: '1時間', baseDurationMinutes: 60, basePriceMinor: 500, depositRequiredMinor: 0 });
    expect(plan.status).toBe(200);
    expect(plan.body.venueId).toBe(venue.body.venueId);
  });

  it('compute endpoints return 501 when disabled', async () => {
    const nodes = await request(app.getHttpServer()).get('/v1/compute/nodes');
    expect(nodes.status).toBe(501);

    const submit = await request(app.getHttpServer()).post('/v1/compute/jobs').send({
      requesterId: 'u1',
      taskType: 'GENERAL',
      taskSpec: { command: 'echo 1', inputUri: 'in', outputUri: 'out', envVars: {} },
    });
    expect(submit.status).toBe(501);
  });

  it('transfer endpoint returns 501 when disabled', async () => {
    const purchase = await request(app.getHttpServer())
      .post('/v1/passes/purchase')
      .set('Idempotency-Key', 'abcDEF12')
      .send({ planId: 'plan_3h', venueId: 'venue_demo', paymentMethod: 'JPYC' });
    expect(purchase.status).toBe(201);

    const res = await request(app.getHttpServer())
      .post(`/v1/passes/${purchase.body.passId}/transfer`)
      .set('Idempotency-Key', 'transfer01')
      .send({});
    expect(res.status).toBe(501);
  });

  it('merchant seats and disputes endpoints', async () => {
    const venue = await request(app.getHttpServer())
      .post('/v1/merchant/venues')
      .send({ name: '新店舗2', address: '福岡', timezone: 'Asia/Tokyo' });
    expect(venue.status).toBe(201);

    const seat = await request(app.getHttpServer())
      .post(`/v1/merchant/venues/${venue.body.venueId}/seats`)
      .send({ type: 'BOOTH' });
    expect(seat.status).toBe(201);
    expect(seat.body.seatId).toMatch(/^seat_[a-f0-9]{16}$/);

    const compute = await request(app.getHttpServer())
      .post(`/v1/merchant/venues/${venue.body.venueId}/compute/enable`)
      .send({ enable: true });
    expect(compute.status).toBe(201);
    expect(compute.body.computeEnabled).toBe(true);

    const dispute = await request(app.getHttpServer()).post('/v1/merchant/disputes').send({ venueId: venue.body.venueId, reason: 'x' });
    expect(dispute.status).toBe(201);
    expect(dispute.body.disputeId).toMatch(/^disp_[a-f0-9]{16}$/);
  });
});
