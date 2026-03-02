import { z } from 'zod';

export const ComputeNodeStatusSchema = z.enum(['IDLE', 'RESERVED', 'COMPUTING', 'OFFLINE']);
export type ComputeNodeStatus = z.infer<typeof ComputeNodeStatusSchema>;

export const ComputeNodeSchema = z.object({
  nodeId: z.string().min(1),
  seatId: z.string().min(1),
  venueId: z.string().min(1),
  specs: z.object({
    cpuModel: z.string().min(1),
    cpuCores: z.number().int().positive(),
    gpuModel: z.string().min(1),
    vram: z.number().int().nonnegative(),
    ram: z.number().int().positive(),
  }),
  status: ComputeNodeStatusSchema,
  availableWindows: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().min(1),
      endTime: z.string().min(1),
    }),
  ),
  pricePerHourMinor: z.number().int().nonnegative(),
  minBookingHours: z.number().int().positive(),
  maxBookingHours: z.number().int().positive(),
  supportedTasks: z.array(z.enum(['ML_TRAINING', 'RENDERING', 'ZK_PROVING', 'GENERAL'])),
});
export type ComputeNode = z.infer<typeof ComputeNodeSchema>;

export const ComputeJobStatusSchema = z.enum(['PENDING', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export type ComputeJobStatus = z.infer<typeof ComputeJobStatusSchema>;

export const ComputeJobSchema = z.object({
  jobId: z.string().min(1),
  requesterId: z.string().min(1),
  nodeId: z.string().min(1).optional(),
  taskType: z.string().min(1),
  taskSpec: z.object({
    dockerImage: z.string().min(1).optional(),
    command: z.string().min(1),
    inputUri: z.string().min(1),
    outputUri: z.string().min(1),
    envVars: z.record(z.string()),
  }),
  status: ComputeJobStatusSchema,
  estimatedHours: z.number().nonnegative(),
  actualHours: z.number().nonnegative().optional(),
  priceMinor: z.number().int().nonnegative(),
  depositMinor: z.number().int().nonnegative(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  resultHash: z.string().min(1).optional(),
});
export type ComputeJob = z.infer<typeof ComputeJobSchema>;

