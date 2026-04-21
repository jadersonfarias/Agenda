declare module '@prisma/client' {
  export type Appointment = any
  export type Service = any

  export const AppointmentStatus: {
    SCHEDULED: 'SCHEDULED'
    COMPLETED: 'COMPLETED'
    CANCELED: 'CANCELED'
  }

  export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus]

  export class PrismaClient {
    [key: string]: any
    $connect(): Promise<void>
    $disconnect(): Promise<void>
  }
}
