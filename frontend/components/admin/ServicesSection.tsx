'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { serviceFormSchema, type ServiceFormValues } from '../../features/admin/schemas'
import { type AdminServiceItem } from '../../features/admin/types'
import {
    createAdminService,
    deleteAdminService,
    updateAdminService,
} from '../../features/admin/services/admin-api.service'
import { useAdminServicesQuery } from '../../features/admin/hooks/use-admin-services-query'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Modal } from '../ui/modal'

type ServiceFormMode = 'create' | 'edit'

function formatPriceInput(value: number) {
    return Number.isFinite(value)
        ? value.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          })
        : ''
}

function parsePriceInput(value: string) {
    const trimmedValue = value.trim()
    const normalizedValue = trimmedValue.includes(',')
        ? trimmedValue.replace(/\./g, '').replace(',', '.')
        : trimmedValue
    const parsedValue = Number(normalizedValue)

    return Number.isFinite(parsedValue) ? parsedValue : Number.NaN
}

function ServiceModalIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 sm:h-8 sm:w-8" fill="none">
            <path
                d="M7 3V6M17 3V6M4.75 9.25H19.25M6.5 5H17.5C18.8807 5 20 6.11929 20 7.5V18C20 19.3807 18.8807 20.5 17.5 20.5H6.5C5.11929 20.5 4 19.3807 4 18V7.5C4 6.11929 5.11929 5 6.5 5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8 13H9.5M11.25 13H12.75M14.5 13H16M8 16H9.5M11.25 16H12.75M14.5 16H16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    )
}

function ServiceForm({
    businessId,
    mode,
    initialValues,
    onCancel,
    onSaved,
}: {
    businessId: string
    mode: ServiceFormMode
    initialValues?: AdminServiceItem | null
    onCancel: () => void
    onSaved: (value: AdminServiceItem, mode: ServiceFormMode) => void
}) {
    const [isSaving, setIsSaving] = useState(false)
    const [priceInput, setPriceInput] = useState(
        formatPriceInput(initialValues ? Number(initialValues.price) : 0)
    )
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: initialValues
            ? {
                name: initialValues.name,
                description: initialValues.description ?? '',
                price: Number(initialValues.price),
                durationMinutes: initialValues.durationMinutes,
            }
            : {
                name: '',
                description: '',
                price: 0,
                durationMinutes: 30,
            },
    })
    const descriptionValue = watch('description') ?? ''

    const onSubmit = handleSubmit(async (values) => {
        setIsSaving(true)
        const description = values.description?.trim() ? values.description.trim() : null

        try {
            const data =
                mode === 'create'
                    ? await createAdminService({
                          businessId,
                          ...values,
                          description,
                      })
                    : await updateAdminService({
                          businessId,
                          serviceId: initialValues!.id,
                          ...values,
                          description,
                      })
            onSaved(data, mode)
            toast.success(mode === 'create' ? 'Serviço criado com sucesso' : 'Serviço atualizado com sucesso')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar serviço')
        } finally {
            setIsSaving(false)
        }
    })

    return (
        <form className="grid gap-5 sm:gap-6" onSubmit={onSubmit}>
            <Label className="space-y-2.5">
                <span className="text-sm font-semibold text-slate-800 sm:text-base">Nome do serviço</span>
                <Input
                    placeholder="Ex: Corte feminino"
                    className="min-h-14 rounded-2xl border-slate-200 bg-white px-5 shadow-sm focus:border-purple-500 focus:ring-purple-100"
                    {...register('name')}
                />
                {errors.name ? <p className="text-xs text-red-600 sm:text-sm">{errors.name.message}</p> : null}
            </Label>

            <div className="grid gap-4 sm:grid-cols-2">
                <Label className="space-y-2.5">
                    <span className="text-sm font-semibold text-slate-800 sm:text-base">Preço</span>
                    <div className="flex min-h-14 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100">
                        <span className="flex w-16 shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 text-base font-semibold text-slate-700">
                            R$
                        </span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={priceInput}
                            onChange={(event) => {
                                const nextValue = event.target.value

                                setPriceInput(nextValue)
                                setValue('price', parsePriceInput(nextValue), {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }}
                            onBlur={() => {
                                const parsedValue = parsePriceInput(priceInput)

                                if (Number.isFinite(parsedValue)) {
                                    setPriceInput(formatPriceInput(parsedValue))
                                }
                            }}
                            className="min-w-0 flex-1 bg-white px-5 py-3 text-base text-slate-900 outline-none"
                            placeholder="30,00"
                        />
                    </div>
                    {errors.price ? <p className="text-xs text-red-600 sm:text-sm">{errors.price.message}</p> : null}
                </Label>

                <Label className="space-y-2.5">
                    <span className="text-sm font-semibold text-slate-800 sm:text-base">Duração (min)</span>
                    <Input
                        type="number"
                        min="5"
                        step="5"
                        className="min-h-14 rounded-2xl border-slate-200 bg-white px-5 shadow-sm focus:border-purple-500 focus:ring-purple-100"
                        {...register('durationMinutes', { valueAsNumber: true })}
                    />
                    {errors.durationMinutes ? <p className="text-xs text-red-600 sm:text-sm">{errors.durationMinutes.message}</p> : null}
                </Label>
            </div>

            <Label className="space-y-2.5">
                <span className="text-sm font-semibold text-slate-800 sm:text-base">Descrição do serviço (opcional)</span>
                <textarea
                    rows={4}
                    maxLength={300}
                    placeholder="Ex.: acabamento de barba com toalha quente e finalização."
                    className="w-full min-h-28 resize-y rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    {...register('description')}
                />
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <span className="inline-flex min-w-0 items-start gap-2 text-xs leading-5 text-slate-500 sm:text-sm">
                        <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" fill="none">
                            <path
                                d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                                stroke="currentColor"
                                strokeWidth="1.6"
                            />
                            <path d="M10 9.5V14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            <path d="M10 6.25H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>A descrição ajuda o cliente a entender melhor o que está incluso no serviço.</span>
                    </span>
                    <span className="shrink-0 text-right text-xs text-slate-400">{descriptionValue.length}/300</span>
                </div>
                {errors.description ? <p className="text-xs text-red-600 sm:text-sm">{errors.description.message}</p> : null}
            </Label>

            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    className="min-h-12 border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 sm:min-w-44"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={isSaving}
                    className="min-h-12 bg-purple-700 shadow-lg shadow-purple-200/70 hover:bg-purple-800 sm:min-w-56"
                >
                    {isSaving ? 'Salvando...' : mode === 'create' ? 'Criar serviço' : 'Salvar alterações'}
                </Button>
            </div>
        </form>
    )
}

type ServicesSectionProps = {
    businessId: string
    enabled: boolean
    initialServices: AdminServiceItem[]
}

export function ServicesSection({ businessId, enabled, initialServices }: ServicesSectionProps) {
    const queryClient = useQueryClient()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingService, setEditingService] = useState<AdminServiceItem | null>(null)
    const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)
    const servicesQuery = useAdminServicesQuery(businessId, enabled)
    const services = servicesQuery.data ?? initialServices

    const handleServiceSaved = async (_service: AdminServiceItem, _mode: ServiceFormMode) => {
        await queryClient.invalidateQueries({ queryKey: ['admin-services'] })
        setIsCreateOpen(false)
        setEditingService(null)
    }

    const handleDeleteService = async (serviceId: string) => {
        setDeletingServiceId(serviceId)

        try {
            await deleteAdminService({
                businessId,
                serviceId,
            })
            await queryClient.invalidateQueries({ queryKey: ['admin-services'] })
            toast.success('Serviço removido com sucesso')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao remover serviço')
        } finally {
            setDeletingServiceId(null)
        }
    }

    return (
        <>
            <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                <div className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Catálogo</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Serviços cadastrados</h2>
                        <p className="mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
                            Crie, edite ou remova serviços. Serviços com agendamentos vinculados ficam protegidos contra exclusão.
                        </p>
                    </div>

                    <Button type="button" onClick={() => setIsCreateOpen(true)} className="min-h-12 lg:min-h-0 sm:w-auto">
                        Novo serviço
                    </Button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {servicesQuery.isLoading ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500 sm:text-sm">
                            Carregando serviços...
                        </div>
                    ) : null}

                    {servicesQuery.isError ? (
                        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-600">
                            Não foi possível carregar os serviços.
                        </div>
                    ) : null}

                    {!servicesQuery.isLoading && !servicesQuery.isError && services.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                            Nenhum serviço cadastrado ainda. Crie o primeiro para começar a vender horários.
                        </div>
                    ) : null}

                    {!servicesQuery.isLoading && !servicesQuery.isError
                        ? services.map((service) => (
                              <div
                                  key={service.id}
                                  className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
                              >
                                  <div className="min-w-0 space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{service.name}</h3>
                                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold uppercase tracking-[.2em] text-purple-700">
                                              {service.durationMinutes} min
                                          </span>
                                      </div>
                                      <p className="text-xs text-slate-600 sm:text-sm">R$ {Number(service.price).toFixed(2)}</p>
                                      {service.description ? (
                                          <p
                                              className="overflow-hidden text-xs leading-5 text-slate-500 sm:text-sm"
                                              style={{
                                                  display: '-webkit-box',
                                                  WebkitBoxOrient: 'vertical',
                                                  WebkitLineClamp: 2,
                                              }}
                                          >
                                              {service.description}
                                          </p>
                                      ) : null}
                                      <p className="text-xs text-slate-500 sm:text-sm">
                                          {service.appointmentCount === 0
                                              ? 'Sem agendamentos vinculados'
                                              : `${service.appointmentCount} agendamento(s) vinculado(s)`}
                                      </p>
                                  </div>

                                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:w-auto">
                                      <Button type="button" variant="secondary" onClick={() => setEditingService(service)} className="min-h-12 lg:min-h-0 sm:w-auto">
                                          Editar
                                      </Button>
                                      <Button
                                          type="button"
                                          variant="danger"
                                          disabled={deletingServiceId === service.id || service.appointmentCount > 0}
                                          title={
                                              service.appointmentCount > 0
                                                  ? 'Serviços com agendamentos vinculados não podem ser excluídos'
                                                  : 'Excluir serviço'
                                          }
                                          onClick={() => handleDeleteService(service.id)}
                                          className="min-h-12 lg:min-h-0 sm:w-auto"
                                      >
                                          {deletingServiceId === service.id ? 'Removendo...' : 'Excluir'}
                                      </Button>
                                  </div>
                              </div>
                          ))
                        : null}
                </div>
            </Card>

            <Modal
                title="Novo serviço"
                description="Cadastre nome, preço, duração e os detalhes do serviço para apresentar aos clientes."
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                headerIcon={<ServiceModalIcon />}
                overlayClassName="items-start py-4 backdrop-blur-sm sm:items-center sm:py-6"
                panelClassName="my-auto max-w-3xl overflow-visible p-5 sm:p-8"
            >
                <ServiceForm businessId={businessId} mode="create" onCancel={() => setIsCreateOpen(false)} onSaved={handleServiceSaved} />
            </Modal>

            <Modal
                title="Editar serviço"
                description="Atualize nome, preço, duração e os detalhes do serviço selecionado."
                open={Boolean(editingService)}
                onClose={() => setEditingService(null)}
                headerIcon={<ServiceModalIcon />}
                overlayClassName="items-start py-4 backdrop-blur-sm sm:items-center sm:py-6"
                panelClassName="my-auto max-w-3xl overflow-visible p-5 sm:p-8"
            >
                <ServiceForm businessId={businessId} mode="edit" initialValues={editingService} onCancel={() => setEditingService(null)} onSaved={handleServiceSaved} />
            </Modal>
        </>
    )
}
