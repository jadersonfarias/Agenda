
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import { Input } from './input'

type DatePickerProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label?: string
}

export function DatePicker<TFieldValues extends FieldValues>({ control, name, label }: DatePickerProps<TFieldValues>) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative w-full">
      {label && (
        <label className="mb-1 block text-sm text-slate-600">
          {label}
        </label>
      )}

      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <>
            <Input
              readOnly
              aria-expanded={open}
              aria-haspopup="dialog"
              value={
                field.value
                  ? format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                  : ''
              }
              placeholder="Selecione uma data"
              onClick={() => setOpen(!open)}
              className="cursor-pointer pr-12"
            />
            <CalendarDays
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 right-4 size-5 text-purple-600 sm:size-6"
            />

            {open && (
              <div className="absolute left-0 z-50 mt-2 w-fit max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <DayPicker
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date)
                    setOpen(false)
                  }}
                  locale={ptBR}
                  className="text-sm [--rdp-accent-background-color:#f3e8ff] [--rdp-accent-color:#7c3aed] [--rdp-day-height:2.25rem] [--rdp-day-width:2.25rem] [--rdp-day_button-height:2.125rem] [--rdp-day_button-width:2.125rem] [--rdp-nav-height:2.25rem] [--rdp-nav_button-height:2rem] [--rdp-nav_button-width:2rem]"
                  styles={{
                    caption: { color: '#6b21a8' },
                    day_selected: {
                      backgroundColor: '#7c3aed',
                      color: 'white',
                    },
                    day_today: {
                      color: '#7c3aed',
                      fontWeight: 'bold',
                    },
                  }}
                />
              </div>
            )}
          </>
        )}
      />
    </div>
  )
}
