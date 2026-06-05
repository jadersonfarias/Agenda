'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { type AdminInvitationItem, type AdminMembershipItem, type AdminMembershipRole } from '../../features/admin/types'
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

type EditableMembershipRole = Extract<AdminMembershipRole, 'ADMIN' | 'STAFF'>

type MembershipFormValues = {
    email: string
    role: EditableMembershipRole
}

const membershipRoleLabels: Record<AdminMembershipRole, string> = {
    OWNER: 'Dono',
    ADMIN: 'Administrador',
    STAFF: 'Funcionário',
}

const editableMembershipRoleOptions: EditableMembershipRole[] = ['ADMIN', 'STAFF']

const membershipRoleBadgeStyles: Record<AdminMembershipRole, string> = {
    OWNER: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-sky-100 text-sky-700',
    STAFF: 'bg-slate-100 text-slate-700',
}

const teamListPerPage = 10

const membershipFormSchema = z.object({
    email: z.string().trim().email('Informe um email válido'),
    role: z.enum(['ADMIN', 'STAFF']),
})

const invitationFormSchema = z.object({
    email: z.string().trim().email('Informe um email válido'),
    role: z.enum(['ADMIN', 'STAFF']),
})

type ManageableMembershipItem = AdminMembershipItem & {
    role: EditableMembershipRole
}

function isEditableMembershipRole(role: AdminMembershipRole): role is EditableMembershipRole {
    return role === 'ADMIN' || role === 'STAFF'
}

function isManageableMembership(membership: AdminMembershipItem): membership is ManageableMembershipItem {
    return isEditableMembershipRole(membership.role)
}

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

function PaginationControls({
    currentPage,
    total,
    totalPages,
    isLoading,
    onPrevious,
    onNext,
}: {
    currentPage: number
    total: number
    totalPages: number
    isLoading: boolean
    onPrevious: () => void
    onNext: () => void
}) {
    const displayCurrentPage = total === 0 ? 0 : currentPage
    const canGoPrevious = currentPage > 1 && !isLoading
    const canGoNext = currentPage < totalPages && !isLoading

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 sm:text-sm">
                Página {displayCurrentPage} de {totalPages} · {total} total
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onPrevious}
                    disabled={!canGoPrevious}
                    className="min-h-11 lg:min-h-0"
                >
                    Anterior
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onNext}
                    disabled={!canGoNext}
                    className="min-h-11 lg:min-h-0"
                >
                    Próxima
                </Button>
            </div>
        </div>
    )
}

function OwnerMembershipCard({ membership }: { membership: AdminMembershipItem }) {
    return (
        <div className="rounded-3xl border border-purple-100 bg-purple-50/60 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                    <h4 className="text-base font-semibold text-slate-900 sm:text-lg">{membership.user.name}</h4>
                    <p className="break-all text-sm text-slate-600">{membership.user.email}</p>
                </div>
                <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[.2em] ${membershipRoleBadgeStyles[membership.role]}`}
                >
                    {membershipRoleLabels[membership.role]}
                </span>
            </div>
        </div>
    )
}

function RoleSelect({
    value,
    onChange,
    disabled = false,
}: {
    value: EditableMembershipRole
    onChange: (role: EditableMembershipRole) => void
    disabled?: boolean
}) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!isOpen) {
            return
        }

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('touchstart', handlePointerDown)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('touchstart', handlePointerDown)
        }
    }, [isOpen])

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setIsOpen(false)
                    }
                }}
                className={[
                    'flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-left text-base text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100',
                    disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-purple-200 hover:bg-white',
                ].join(' ')}
            >
                <span>{membershipRoleLabels[value]}</span>
                <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className={[
                        'h-4 w-4 shrink-0 text-slate-500 transition-transform',
                        isOpen ? 'rotate-180' : 'rotate-0',
                    ].join(' ')}
                    fill="none"
                >
                    <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {isOpen && !disabled ? (
                <div
                    role="listbox"
                    className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/70"
                >
                    {editableMembershipRoleOptions.map((role) => {
                        const isSelected = role === value

                        return (
                            <button
                                key={role}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                    onChange(role)
                                    setIsOpen(false)
                                }}
                                className={[
                                    'flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium transition',
                                    isSelected
                                        ? 'bg-purple-50 text-purple-700'
                                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950',
                                ].join(' ')}
                            >
                                {membershipRoleLabels[role]}
                            </button>
                        )
                    })}
                </div>
            ) : null}
        </div>
    )
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
        watch,
        setValue,
        formState: { errors },
    } = useForm<MembershipFormValues>({
        resolver: zodResolver(membershipFormSchema),
        defaultValues: {
            email: '',
            role: 'STAFF',
        },
    })
    const selectedRole = watch('role')

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
                <input type="hidden" {...register('role')} />
                <RoleSelect
                    value={selectedRole}
                    onChange={(role) => setValue('role', role, { shouldDirty: true, shouldValidate: true })}
                    disabled={createMembershipMutation.isPending}
                />
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
        watch,
        setValue,
        formState: { errors },
    } = useForm<MembershipFormValues>({
        resolver: zodResolver(invitationFormSchema),
        defaultValues: {
            email: '',
            role: 'STAFF',
        },
    })
    const selectedRole = watch('role')

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
            toast.error(error instanceof Error ? error.message : 'Erro ao criar convite')
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
                <input type="hidden" {...register('role')} />
                <RoleSelect
                    value={selectedRole}
                    onChange={(role) => setValue('role', role, { shouldDirty: true, shouldValidate: true })}
                    disabled={createInvitationMutation.isPending}
                />
                {errors.role ? <p className="text-xs text-red-600 sm:text-sm">{errors.role.message}</p> : null}
            </Label>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={createInvitationMutation.isPending} className="min-h-12 lg:min-h-0 sm:w-auto">
                    {createInvitationMutation.isPending ? 'Criando...' : 'Criar convite'}
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
    const [membershipRoleDrafts, setMembershipRoleDrafts] = useState<Record<string, EditableMembershipRole>>({})
    const [membershipsPage, setMembershipsPage] = useState(1)
    const [invitationsPage, setInvitationsPage] = useState(1)
    const membershipsQuery = useAdminMembershipsQuery(businessId, enabled, membershipsPage, teamListPerPage)
    const invitationsQuery = useAdminInvitationsQuery(businessId, enabled && canCreateMembership, invitationsPage, teamListPerPage)
    const updateMembershipRoleMutation = useAdminUpdateMembershipRoleMutation()
    const deleteMembershipMutation = useAdminDeleteMembershipMutation()
    const memberships = membershipsQuery.data?.data ?? []
    const ownerMemberships = memberships.filter((membership) => membership.role === 'OWNER')
    const manageableMemberships = memberships.filter(isManageableMembership)
    const membershipsMeta = membershipsQuery.data?.meta
    const membershipsTotal = membershipsMeta?.total ?? 0
    const membershipsTotalPages = membershipsMeta?.totalPages ?? 1
    const membershipsCurrentPage = membershipsMeta?.page ?? membershipsPage
    const invitations = invitationsQuery.data?.data ?? []
    const invitationsMeta = invitationsQuery.data?.meta
    const invitationsTotal = invitationsMeta?.total ?? 0
    const invitationsTotalPages = invitationsMeta?.totalPages ?? 1
    const invitationsCurrentPage = invitationsMeta?.page ?? invitationsPage

    useEffect(() => {
        setMembershipsPage(1)
        setInvitationsPage(1)
        setMembershipRoleDrafts({})
    }, [businessId])

    useEffect(() => {
        if (!membershipsMeta || membershipsPage <= membershipsMeta.totalPages) {
            return
        }

        setMembershipsPage(membershipsMeta.totalPages)
    }, [membershipsMeta, membershipsPage])

    useEffect(() => {
        if (!invitationsMeta || invitationsPage <= invitationsMeta.totalPages) {
            return
        }

        setInvitationsPage(invitationsMeta.totalPages)
    }, [invitationsMeta, invitationsPage])

    const handleMembershipRoleChange = (membershipId: string, role: EditableMembershipRole) => {
        setMembershipRoleDrafts((current) => ({
            ...current,
            [membershipId]: role,
        }))
    }

    const handleMembershipRoleSave = async (membershipId: string, role: EditableMembershipRole) => {
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
                                Gerar convite
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

                        {!invitationsQuery.isLoading && !invitationsQuery.isError && invitations.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-xs text-slate-500 sm:text-sm">
                                Nenhum convite pendente neste negócio.
                            </div>
                        ) : null}

                        {!invitationsQuery.isLoading && !invitationsQuery.isError
                            ? invitations.map((invitation) => (
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

                        {!invitationsQuery.isLoading && !invitationsQuery.isError && invitationsTotal > 0 ? (
                            <PaginationControls
                                currentPage={invitationsCurrentPage}
                                total={invitationsTotal}
                                totalPages={invitationsTotalPages}
                                isLoading={invitationsQuery.isFetching}
                                onPrevious={() => setInvitationsPage((current) => Math.max(1, current - 1))}
                                onNext={() => setInvitationsPage((current) => Math.min(invitationsTotalPages, current + 1))}
                            />
                        ) : null}
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

                    {!membershipsQuery.isLoading && !membershipsQuery.isError && memberships.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500 sm:text-sm">
                            Nenhum membro adicional vinculado a este negócio.
                        </div>
                    ) : null}

                    {!membershipsQuery.isLoading && !membershipsQuery.isError && ownerMemberships.length > 0 ? (
                        <div className="space-y-3 rounded-3xl border border-purple-100 bg-white p-4 shadow-sm shadow-purple-100/40 sm:p-5">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                                    {ownerMemberships.length > 1 ? 'Donos do negócio' : 'Dono do negócio'}
                                </h3>
                                <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                                    Responsável principal exibido apenas como informação nesta tela.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {ownerMemberships.map((membership) => (
                                    <OwnerMembershipCard key={membership.id} membership={membership} />
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {!membershipsQuery.isLoading &&
                    !membershipsQuery.isError &&
                    memberships.length > 0 &&
                    manageableMemberships.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-xs text-slate-500 sm:text-sm">
                            Nenhum membro gerenciável nesta página.
                        </div>
                    ) : null}

                    {!membershipsQuery.isLoading && !membershipsQuery.isError
                        ? manageableMemberships.map((membership) => {
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
                                                  <RoleSelect
                                                      value={selectedRole}
                                                      onChange={(role) =>
                                                          handleMembershipRoleChange(
                                                              membership.id,
                                                              role
                                                          )
                                                      }
                                                      disabled={isSavingRole || isRemovingMember}
                                                  />
                                              </Label>

                                              <div className="grid w-full grid-cols-2 gap-2">
                                                  <Button
                                                      type="button"
                                                      variant="secondary"
                                                      onClick={() => handleMembershipRoleSave(membership.id, selectedRole)}
                                                      disabled={isSavingRole || isRemovingMember || !hasRoleChanged}
                                                      className="min-h-12 lg:min-h-0"
                                                  >
                                                      {isSavingRole ? 'Salvando...' : 'Salvar permissão'}
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

                    {!membershipsQuery.isLoading && !membershipsQuery.isError && membershipsTotal > 0 ? (
                        <PaginationControls
                            currentPage={membershipsCurrentPage}
                            total={membershipsTotal}
                            totalPages={membershipsTotalPages}
                            isLoading={membershipsQuery.isFetching}
                            onPrevious={() => setMembershipsPage((current) => Math.max(1, current - 1))}
                            onNext={() => setMembershipsPage((current) => Math.min(membershipsTotalPages, current + 1))}
                        />
                    ) : null}
                </div>
            </Card>

            {canCreateMembership ? (
                <Modal
                    title="Criar convite para equipe"
                    description="Gere um link para o funcionário aceitar o convite e acessar a equipe."
                    open={isCreateInvitationOpen}
                    onClose={() => setIsCreateInvitationOpen(false)}
                >
                    <InvitationForm
                        businessId={businessId}
                        onCancel={() => setIsCreateInvitationOpen(false)}
                        onSaved={async () => {
                            setInvitationsPage(1)
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
                            setMembershipsPage(1)
                            await queryClient.invalidateQueries({ queryKey: ['admin-memberships', businessId] })
                            setIsCreateMembershipOpen(false)
                        }}
                    />
                </Modal>
            ) : null}
        </>
    )
}
