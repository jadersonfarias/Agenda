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
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: initialValues
            ? {
                name: initialValues.name,
                price: Number(initialValues.price),
                durationMinutes: initialValues.durationMinutes,
            }
            : {
                name: '',
                price: 0,
                durationMinutes: 30,
            },
    })

    const onSubmit = handleSubmit(async (values) => {
        setIsSaving(true)

        try {
            const data =
                mode === 'create'
                    ? await createAdminService({
                          businessId,
                          ...values,
                      })
                    : await updateAdminService({
                          businessId,
                          serviceId: initialValues!.id,
                          ...values,
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
        <form className="grid gap-4" onSubmit={onSubmit}>
            <Label className="space-y-2">
                <span className="text-sm font-medium sm:text-base">Nome do serviço</span>
                <Input placeholder="Ex: Corte feminino" {...register('name')} />
                {errors.name ? <p className="text-xs text-red-600 sm:text-sm">{errors.name.message}</p> : null}
            </Label>

            <div className="grid gap-4 sm:grid-cols-2">
                <Label className="space-y-2">
                    <span className="text-sm font-medium sm:text-base">Preço</span>
                    <Input type="number" step="0.01" min="0" {...register('price', { valueAsNumber: true })} />
                    {errors.price ? <p className="text-xs text-red-600 sm:text-sm">{errors.price.message}</p> : null}
                </Label>

                <Label className="space-y-2">
                    <span className="text-sm font-medium sm:text-base">Duração (min)</span>
                    <Input type="number" min="5" step="5" {...register('durationMinutes', { valueAsNumber: true })} />
                    {errors.durationMinutes ? <p className="text-xs text-red-600 sm:text-sm">{errors.durationMinutes.message}</p> : null}
                </Label>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} className="min-h-12 lg:min-h-0 sm:w-auto">
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
                description="Adicione um novo serviço ao catálogo do salão."
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            >
                <ServiceForm businessId={businessId} mode="create" onCancel={() => setIsCreateOpen(false)} onSaved={handleServiceSaved} />
            </Modal>

            <Modal
                title="Editar serviço"
                description="Atualize nome, preço e duração do serviço selecionado."
                open={Boolean(editingService)}
                onClose={() => setEditingService(null)}
            >
                <ServiceForm businessId={businessId} mode="edit" initialValues={editingService} onCancel={() => setEditingService(null)} onSaved={handleServiceSaved} />
            </Modal>
        </>
    )
}
