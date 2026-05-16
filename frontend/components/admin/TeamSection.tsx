'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { type AdminInvitationItem, type AdminMembershipRole } from '../../features/admin/types'
import { useAdminCreateInvitationMutation } from '../../features/admin/hooks/use-admin-create-invitation-mutation'
import { useAdminCreateMembershipMutation } from '../../features/admin/hooks/use-admin-create-membership-mutation'
import { useAdminDeleteMembershipMutation } from '../../features/admin/hooks/use-admin-delete-membership-mutation'
import { useAdminInvitationsQuery } from '../../features/admin/hooks/use-admin-invitations-query'
import { useAdminMembershipsQuery } from '../../features/admin/hooks/use-admin-memberships-query'
import { useAdminUpdateMembershipRoleMutation } from '../../features/admin/hooks/use-admin-update-membership-role-mutation'
import { formatIsoCalendarDate } from '../../lib/date-format'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Modal } from '../ui/modal'
import { Select } from '../ui/select'

type MembershipFormValues = {
    email: string
    role: AdminMembershipRole
}

const membershipRoleLabels: Record<AdminMembershipRole, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    STAFF: 'Staff',
}

const membershipRoleBadgeStyles: Record<AdminMembershipRole, string> = {
    OWNER: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-sky-100 text-sky-700',
    STAFF: 'bg-slate-100 text-slate-700',
}

const membershipFormSchema = z.object({
    email: z.string().trim().email('Informe um email válido'),
    role: z.enum(['OWNER', 'ADMIN', 'STAFF']),
})

const invitationFormSchema = z.object({
    email: z.string().trim().email('Informe um email válido'),
    role: z.enum(['OWNER', 'ADMIN', 'STAFF']),
})

async function copyInvitationLink(invitationLink: string) {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
        toast.error('Não foi possível copiar o link neste navegador')
        return
    }

    await navigator.clipboard.writeText(invitationLink)
    toast.success('Link do convite copiado')
}

function getInvitationStatus(invitation: AdminInvitationItem) {
    if (invitation.acceptedAt) return 'Aceito'
    if (invitation.isExpired) return 'Expirado'
    return 'Pendente'
}

function getWhatsAppInvitationUrl(invitationLink: string) {
    const message = `Olá! Você recebeu um convite para acessar a equipe. Use este link para aceitar: ${invitationLink}`
    return `https://wa.me/?text=${encodeURIComponent(message)}`
}

function MembershipForm({
    businessId,
    onCancel,
    onSaved,
}: {
    businessId: string
    onCancel: () => void
    onSaved: () => void
}) {
    const createMembershipMutation = useAdminCreateMembershipMutation()
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<MembershipFormValues>({
        resolver: zodResolver(membershipFormSchema),
        defaultValues: {
            email: '',
            role: 'STAFF',
        },
    })

    const onSubmit = handleSubmit(async (values) => {
        try {
            await createMembershipMutation.mutateAsync({
                businessId,
                email: values.email,
                role: values.role,
            })
            reset()
            onSaved()
            toast.success('Membro adicionado com sucesso')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao adicionar membro')
        }
    })

    return (
        <form className="grid gap-4" onSubmit={onSubmit}>
            <Label className="space-y-2">
                <span className="text-sm font-medium sm:text-base">Email do usuário</span>
                <Input placeholder="usuario@exemplo.com" type="email" {...register('email')} />
                {errors.email ? <p className="text-xs text-red-600 sm:text-sm">{errors.email.message}</p> : null}
            </Label>

            <Label className="space-y-2">
                <span className="text-sm font-medium sm:text-base">Permissão</span>
                <Select {...register('role')} defaultValue="STAFF">
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="STAFF">Staff</option>
                </Select>
                {errors.role ? <p className="text-xs text-red-600 sm:text-sm">{errors.role.message}</p> : null}
            </Label>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={createMembershipMutation.isPending} className="min-h-12 lg:min-h-0 sm:w-auto">
                    {createMembershipMutation.isPending ? 'Salvando...' : 'Adicionar membro'}
                </Button>
            </div>
        </form>
    )
}

function InvitationForm({
    businessId,
    onCancel,
    onSaved,
}: {
    businessId: string
    onCancel: () => void
    onSaved: () => void
}) {
    const createInvitationMutation = useAdminCreateInvitationMutation()
    const [createdInvitation, setCreatedInvitation] = useState<AdminInvitationItem | null>(null)
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<MembershipFormValues>({
        resolver: zodResolver(invitationFormSchema),
        defaultValues: {
            email: '',
            role: 'STAFF',
        },
    })

    const onSubmit = handleSubmit(async (values) => {
        try {
            const invitation = await createInvitationMutation.mutateAsync({
                businessId,
                email: values.email,
                role: values.role,
            })
            setCreatedInvitation(invitation)
            reset()
            await onSaved()
            toast.success('Convite criado com sucesso')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao enviar convite')
        }
    })

    return (
        <form className="grid gap-4" onSubmit={onSubmit}>
            <Label className="space-y-2">
                <span className="text-sm font-medium sm:text-base">Email do convidado</span>
                <Input placeholder="usuario@exemplo.com" type="email" {...register('email')} />
                {errors.email ? <p className="text-xs text-red-600 sm:text-sm">{errors.email.message}</p> : null}
            </Label>

            <Label className="space-y-2">
                <span className="text-sm font-medium sm:text-base">Permissão</span>
                <Select {...register('role')} defaultValue="STAFF">
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="STAFF">Staff</option>
                </Select>
                {errors.role ? <p className="text-xs text-red-600 sm:text-sm">{errors.role.message}</p> : null}
            </Label>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={createInvitationMutation.isPending} className="min-h-12 lg:min-h-0 sm:w-auto">
                    {createInvitationMutation.isPending ? 'Enviando...' : 'Enviar convite'}
                </Button>
            </div>

            {createdInvitation ? (
                <div className="rounded-3xl border border-purple-200 bg-purple-50 p-4">
                    <p className="text-sm font-semibold text-purple-900">Convite criado</p>
                    <p className="mt-1 text-xs text-purple-800 sm:text-sm">
                        Compartilhe este link com {createdInvitation.email}.
                    </p>
                    <div className="mt-3 break-all rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                        {createdInvitation.invitationLink}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => copyInvitationLink(createdInvitation.invitationLink)}
                            className="min-h-12 lg:min-h-0"
                        >
                            Copiar link
                        </Button>
                        <a
                            href={getWhatsAppInvitationUrl(createdInvitation.invitationLink)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 sm:px-6 sm:text-sm md:w-auto lg:min-h-0"
                        >
                            Enviar pelo WhatsApp
                        </a>
                    </div>
                </div>
            ) : null}
        </form>
    )
}

type TeamSectionProps = {
    businessId: string
    enabled: boolean
    canCreateMembership: boolean
    canManageMemberships: boolean
}

export function TeamSection({
    businessId,
    enabled,
    canCreateMembership,
    canManageMemberships,
}: TeamSectionProps) {
    const queryClient = useQueryClient()
    const [isCreateMembershipOpen, setIsCreateMembershipOpen] = useState(false)
    const [isCreateInvitationOpen, setIsCreateInvitationOpen] = useState(false)
    const [deletingMembershipId, setDeletingMembershipId] = useState<string | null>(null)
    const [membershipRoleDrafts, setMembershipRoleDrafts] = useState<Record<string, AdminMembershipRole>>({})
    const membershipsQuery = useAdminMembershipsQuery(businessId, enabled)
    const invitationsQuery = useAdminInvitationsQuery(businessId, enabled)
    const updateMembershipRoleMutation = useAdminUpdateMembershipRoleMutation()
    const deleteMembershipMutation = useAdminDeleteMembershipMutation()

    const handleMembershipRoleChange = (membershipId: string, role: AdminMembershipRole) => {
        setMembershipRoleDrafts((current) => ({
            ...current,
            [membershipId]: role,
        }))
    }

    const handleMembershipRoleSave = async (membershipId: string, role: AdminMembershipRole) => {
        try {
            await updateMembershipRoleMutation.mutateAsync({
                businessId,
                membershipId,
                role,
            })
            await queryClient.invalidateQueries({ queryKey: ['admin-memberships', businessId] })
            setMembershipRoleDrafts((current) => {
                const nextDrafts = { ...current }
                delete nextDrafts[membershipId]
                return nextDrafts
            })
            toast.success('Permissão do membro atualizada com sucesso')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao atualizar a permissão do membro')
        }
    }

    const handleDeleteMembership = async (membershipId: string) => {
        setDeletingMembershipId(membershipId)

        try {
            await deleteMembershipMutation.mutateAsync({
                businessId,
                membershipId,
            })
            await queryClient.invalidateQueries({ queryKey: ['admin-memberships', businessId] })
            setMembershipRoleDrafts((current) => {
                const nextDrafts = { ...current }
                delete nextDrafts[membershipId]
                return nextDrafts
            })
            toast.success('Membro removido com sucesso')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao remover membro')
        } finally {
            setDeletingMembershipId(null)
        }
    }

    return (
        <>
            <Card className="border-slate-200 shadow-lg shadow-slate-200/60">
                <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[.3em] text-purple-700 sm:text-sm">Equipe</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Membros do negócio</h2>
                        <p className="mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
                            Acompanhe quem tem acesso ao painel administrativo e qual papel cada pessoa possui neste negócio.
                        </p>
                    </div>

                    {canCreateMembership ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Button type="button" variant="secondary" onClick={() => setIsCreateMembershipOpen(true)} className="min-h-12 lg:min-h-0 sm:w-auto">
                                Novo membro
                            </Button>
                            <Button type="button" onClick={() => setIsCreateInvitationOpen(true)} className="min-h-12 lg:min-h-0 sm:w-auto">
                                Convidar por email
                            </Button>
                        </div>
                    ) : null}
                </div>

                <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Convites pendentes</h3>
                        <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                            Convites ainda não aceitos para entrar neste negócio.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {invitationsQuery.isLoading ? (
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-500 sm:text-sm">
                                Carregando convites...
                            </div>
                        ) : null}

                        {invitationsQuery.isError ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-center text-xs text-red-600 sm:text-sm">
                                Não foi possível carregar os convites pendentes.
                            </div>
                        ) : null}

                        {!invitationsQuery.isLoading && !invitationsQuery.isError && (invitationsQuery.data?.length ?? 0) === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-xs text-slate-500 sm:text-sm">
                                Nenhum convite pendente neste negócio.
                            </div>
                        ) : null}

                        {!invitationsQuery.isLoading && !invitationsQuery.isError
                            ? invitationsQuery.data?.map((invitation) => (
                                  <div
                                      key={invitation.id}
                                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
                                  >
                                      <div className="min-w-0">
                                          <p className="break-all text-sm font-medium text-slate-900">{invitation.email}</p>
                                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
                                              <span className={`rounded-full px-3 py-1 font-semibold uppercase tracking-[.2em] ${membershipRoleBadgeStyles[invitation.role]}`}>
                                                  {membershipRoleLabels[invitation.role]}
                                              </span>
                                              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-[.2em] text-slate-700">
                                                  {getInvitationStatus(invitation)}
                                              </span>
                                              <span>
                                                  Expira em{' '}
                                                  {formatIsoCalendarDate(invitation.expiresAt) ?? '-'}
                                              </span>
                                              {invitation.isExpired ? (
                                                  <span className="rounded-full bg-red-100 px-3 py-1 font-semibold uppercase tracking-[.2em] text-red-700">
                                                      Expirado
                                                  </span>
                                              ) : null}
                                          </div>
                                          <p className="mt-2 break-all text-xs text-slate-500 sm:text-sm">
                                              {invitation.invitationLink}
                                          </p>
                                      </div>
                                      <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
                                          <Button
                                              type="button"
                                              variant="secondary"
                                              onClick={() => copyInvitationLink(invitation.invitationLink)}
                                              className="min-h-12 lg:min-h-0"
                                          >
                                              Copiar link
                                          </Button>
                                          <a
                                              href={getWhatsAppInvitationUrl(invitation.invitationLink)}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 sm:px-6 sm:text-sm md:w-auto lg:min-h-0"
                                          >
                                              Enviar pelo WhatsApp
                                          </a>
                                      </div>
                                  </div>
                              ))
                            : null}
                    </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {membershipsQuery.isLoading ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500 sm:text-sm">
                            Carregando equipe...
                        </div>
                    ) : null}

                    {membershipsQuery.isError ? (
                        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-xs text-red-600 sm:text-sm">
                            Não foi possível carregar os membros da equipe.
                        </div>
                    ) : null}

                    {!membershipsQuery.isLoading && !membershipsQuery.isError && (membershipsQuery.data?.length ?? 0) === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500 sm:text-sm">
                            Nenhum membro adicional vinculado a este negócio.
                        </div>
                    ) : null}

                    {!membershipsQuery.isLoading && !membershipsQuery.isError
                        ? membershipsQuery.data?.map((membership) => {
                              const selectedRole = membershipRoleDrafts[membership.id] ?? membership.role
                              const isSavingRole =
                                  updateMembershipRoleMutation.isPending &&
                                  updateMembershipRoleMutation.variables?.membershipId === membership.id
                              const hasRoleChanged = selectedRole !== membership.role
                              const isRemovingMember = deletingMembershipId === membership.id

                              return (
                                  <div
                                      key={membership.id}
                                      className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:gap-6"
                                  >
                                      <div className="min-w-0 space-y-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                              <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{membership.user.name}</h3>
                                              <span
                                                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[.2em] ${membershipRoleBadgeStyles[membership.role]}`}
                                              >
                                                  {membershipRoleLabels[membership.role]}
                                              </span>
                                          </div>
                                          <p className="break-all text-sm text-slate-600">{membership.user.email}</p>
                                      </div>

                                      {canManageMemberships ? (
                                          <div className="flex w-full flex-col gap-3 lg:w-full">
                                              <Label className="w-full space-y-2">
                                                  <span>Permissão</span>
                                                  <Select
                                                      value={selectedRole}
                                                      onChange={(event) =>
                                                          handleMembershipRoleChange(
                                                              membership.id,
                                                              event.target.value as AdminMembershipRole
                                                          )
                                                      }
                                                      disabled={isSavingRole || isRemovingMember}
                                                  >
                                                      <option value="OWNER">Owner</option>
                                                      <option value="ADMIN">Admin</option>
                                                      <option value="STAFF">Staff</option>
                                                  </Select>
                                              </Label>

                                              <div className="grid w-full grid-cols-2 gap-2">
                                                  <Button
                                                      type="button"
                                                      variant="secondary"
                                                      onClick={() => handleMembershipRoleSave(membership.id, selectedRole)}
                                                      disabled={isSavingRole || isRemovingMember || !hasRoleChanged}
                                                      className="min-h-12 lg:min-h-0"
                                                  >
                                                      {isSavingRole ? 'Salvando...' : 'Salvar role'}
                                                  </Button>
                                                  <Button
                                                      type="button"
                                                      variant="danger"
                                                      onClick={() => handleDeleteMembership(membership.id)}
                                                      disabled={isSavingRole || isRemovingMember}
                                                      className="min-h-12 lg:min-h-0"
                                                  >
                                                      {isRemovingMember ? 'Removendo...' : 'Remover'}
                                                  </Button>
                                              </div>
                                          </div>
                                      ) : null}
                                  </div>
                              )
                          })
                        : null}
                </div>
            </Card>

            {canCreateMembership ? (
                <Modal
                    title="Convidar por email"
                    description="Envie um convite para um novo funcionário aceitar depois."
                    open={isCreateInvitationOpen}
                    onClose={() => setIsCreateInvitationOpen(false)}
                >
                    <InvitationForm
                        businessId={businessId}
                        onCancel={() => setIsCreateInvitationOpen(false)}
                        onSaved={async () => {
                            await queryClient.invalidateQueries({ queryKey: ['admin-invitations', businessId] })
                        }}
                    />
                </Modal>
            ) : null}

            {canCreateMembership ? (
                <Modal
                    title="Novo membro"
                    description="Adicione um usuário já existente a este negócio com a permissão adequada."
                    open={isCreateMembershipOpen}
                    onClose={() => setIsCreateMembershipOpen(false)}
                >
                    <MembershipForm
                        businessId={businessId}
                        onCancel={() => setIsCreateMembershipOpen(false)}
                        onSaved={async () => {
                            await queryClient.invalidateQueries({ queryKey: ['admin-memberships', businessId] })
                            setIsCreateMembershipOpen(false)
                        }}
                    />
                </Modal>
            ) : null}
        </>
    )
}
