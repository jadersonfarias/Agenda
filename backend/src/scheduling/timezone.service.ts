import { BadRequestException, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'

type BusinessHoursWindow = {
  requestedDate: DateTime
  openDateUtc: Date
  closeDateUtc: Date
}

@Injectable()
export class TimezoneService {
  private readonly maxFutureDays = 30

  parseBusinessDate(date: string, timezone: string) {
    const parsedDate = DateTime.fromISO(date, { zone: timezone }).startOf('day')

    if (!parsedDate.isValid) {
      throw new BadRequestException('Data inválida')
    }

    return parsedDate
  }

  validateBusinessDateRange(requestedDate: DateTime, timezone: string) {
    const today = DateTime.now().setZone(timezone).startOf('day')
    const maxDate = today.plus({ days: this.maxFutureDays })

    if (requestedDate < today) {
      throw new BadRequestException('Não é permitido consultar ou criar agendamentos no passado')
    }

    if (requestedDate > maxDate) {
      throw new BadRequestException(`A data deve estar dentro de ${this.maxFutureDays} dias`)
    }
  }

  getBusinessHoursWindow(date: string, timezone: string, openTime: string, closeTime: string): BusinessHoursWindow {
    const requestedDate = this.parseBusinessDate(date, timezone)
    this.validateBusinessDateRange(requestedDate, timezone)

    const openDate = DateTime.fromISO(`${requestedDate.toISODate()}T${openTime}:00`, { zone: timezone })
    const closeDate = DateTime.fromISO(`${requestedDate.toISODate()}T${closeTime}:00`, { zone: timezone })

    if (!openDate.isValid || !closeDate.isValid) {
      throw new BadRequestException('Horário de funcionamento inválido')
    }

    if (closeDate <= openDate) {
      throw new BadRequestException('Horário de encerramento deve ser maior que o horário de abertura')
    }

    return {
      requestedDate,
      openDateUtc: openDate.toUTC().toJSDate(),
      closeDateUtc: closeDate.toUTC().toJSDate(),
    }
  }

  buildUtcDateTime(date: string, time: string, timezone: string) {
    const dateTime = DateTime.fromISO(`${date}T${time}:00`, { zone: timezone })

    if (!dateTime.isValid) {
      throw new BadRequestException('Data ou horário inválido')
    }

    return dateTime.toUTC()
  }

  validateAppointmentDateTime(date: string, time: string, timezone: string) {
    const scheduledAtUtc = this.buildUtcDateTime(date, time, timezone)
    this.validateBusinessDateRange(scheduledAtUtc.setZone(timezone).startOf('day'), timezone)

    if (scheduledAtUtc <= DateTime.utc()) {
      throw new BadRequestException('Não é permitido criar agendamentos no passado')
    }

    return scheduledAtUtc.toJSDate()
  }

  formatUtcTimeInTimezone(date: Date, timezone: string) {
    return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(timezone).toFormat('HH:mm')
  }
}
