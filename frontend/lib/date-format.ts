export function formatIsoCalendarDate(value: string | null | undefined) {
    if (!value) {
        return null
    }

    const [datePart] = value.split('T')
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)

    if (!match) {
        return null
    }

    const [, year, month, day] = match

    return `${day}/${month}/${year}`
}
