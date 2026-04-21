
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
              value={
                field.value
                  ? format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                  : ''
              }
              placeholder="Selecione uma data"
              onClick={() => setOpen(!open)}
            />

            {open && (
              <div className="absolute z-50 mt-2 rounded-2xl border bg-white p-3 shadow-xl">
                <DayPicker
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date)
                    setOpen(false)
                  }}
                  locale={ptBR}
                  className="text-sm"
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
