'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2, Crown, Star } from 'lucide-react'
import HabboAvatar from './HabboAvatar'
import ActionDropdown from './ActionDropdown'
import ChangeRankModal from './ChangeRankModal'
import DeleteUserModal from './DeleteUserModal'
import ChangePasswordModal from './ChangePasswordModal'
import SovereignModal from './SovereignModal'
import SendTimeRequestModal from './SendTimeRequestModal'
import { RankIcon } from '@/lib/rank-icons';
import RankFilterDropdown from './RankFilterDropdown';

interface Rank {
  id: number
  name: string
  order: number
  icon: string
  roleDescription: string
}

interface User {
  id: string
  habboName: string
  avatarUrl: string
  rankId: number
  isSovereign: boolean
  createdAt: string
  updatedAt: string
  rank: Rank
}

interface PaginationResult {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface ApiResponse {
  success: boolean
  data: User[]
  pagination: PaginationResult
  error?: string
}

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<PaginationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [rankFilter, setRankFilter] = useState<string>('')
  const [bossFilter, setBossFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  
  // Lista de rangos disponibles
  const [availableRanks, setAvailableRanks] = useState<Rank[]>([])

  // Current user info (for permissions)
  const [currentUserRankOrder, setCurrentUserRankOrder] = useState(10)
  const [currentUserRankId, setCurrentUserRankId] = useState<number | undefined>()
  const [isSovereign, setIsSovereign] = useState(false)
  const [currentUserName, setCurrentUserName] = useState('')

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showChangeRankModal, setShowChangeRankModal] = useState(false)
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showSovereignModal, setShowSovereignModal] = useState(false)
  const [showSendTimeRequestModal, setShowSendTimeRequestModal] = useState(false)

  // Cargar datos
  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, rankFilter, bossFilter, page])

  // Fetch current user info
  useEffect(() => {
    fetchCurrentUser()
  }, [])
  
  // Fetch available ranks
  useEffect(() => {
    fetchRanks()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUserRankOrder(data.user.rank.order)
        setCurrentUserRankId(data.user.rankId)
        setIsSovereign(data.user.isSovereign)
        setCurrentUserName(data.user.habboName)
      }
    } catch (err) {
      console.error('Error fetching current user:', err)
    }
  }
  
  const fetchRanks = async () => {
    try {
      const response = await fetch('/api/ranks')
      if (response.ok) {
        const data = await response.json()
        setAvailableRanks(data.ranks || [])
      }
    } catch (err) {
      console.error('Error fetching ranks:', err)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })

      if (search) params.append('search', search)
      if (rankFilter) params.append('rankId', rankFilter)
      if (bossFilter) params.append('isSovereign', bossFilter)

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar usuarios')
      }

      setUsers(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleActionSuccess = () => {
    fetchUsers() // Refresh the user list
  }

  const handleChangeRank = (user: User) => {
    setSelectedUser(user)
    setShowChangeRankModal(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setShowDeleteUserModal(true)
  }

  const handleChangePassword = (user: User) => {
    setSelectedUser(user)
    setShowChangePasswordModal(true)
  }

  const handleManageSovereign = (user: User) => {
    setSelectedUser(user)
    setShowSovereignModal(true)
  }

  const handleSendTimeRequest = (user: User) => {
    setSelectedUser(user)
    setShowSendTimeRequestModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Búsqueda */}
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Buscar por nombre..."
            className="flex-1 px-4 py-2 rounded bg-black/50 text-white border border-[#CC933B]/50 focus:border-[#CC933B] focus:outline-none"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
            }}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded transition-all hover:scale-105"
            style={{
              backgroundColor: '#CC933B',
              color: '#0f0f0f',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 'bold',
            }}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Filtro de Rango */}
        <RankFilterDropdown
          ranks={availableRanks}
          selectedRankId={rankFilter}
          onSelectRank={(rankId) => {
            setRankFilter(rankId);
            setPage(1);
          }}
        />

        {/* Filtro de Soberanos */}
        <select
          value={bossFilter}
          onChange={(e) => {
            setBossFilter(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2 rounded bg-black/50 text-white border border-[#CC933B]/50 focus:border-[#CC933B] focus:outline-none"
          style={{
            fontFamily: 'Rajdhani, sans-serif',
          }}
        >
          <option value="">Todos</option>
          <option value="true">Solo Jefes</option>
          <option value="false">No Jefes</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto min-h-[20rem]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#CC933B' }} />
          </div>
        ) : error ? (
          <div
            className="text-center py-12 rounded"
            style={{
              backgroundColor: 'rgba(74, 12, 17, 0.3)',
              border: '1px solid #CC933B',
            }}
          >
            <p style={{ fontFamily: 'Rajdhani, sans-serif', color: '#CC933B' }}>
              {error}
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ fontFamily: 'Rajdhani, sans-serif', color: '#ededed' }}>
              No se encontraron usuarios
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid #CC933B',
                }}
              >
                <th
                  className="text-left px-4 py-3"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#CC933B',
                    fontWeight: 'bold',
                  }}
                >
                  Usuario
                </th>
                <th
                  className="text-left px-4 py-3"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#CC933B',
                    fontWeight: 'bold',
                  }}
                >
                  Rango
                </th>
                <th
                  className="text-center px-4 py-3"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#CC933B',
                    fontWeight: 'bold',
                  }}
                >
                  Jefe
                </th>
                <th
                  className="text-left px-4 py-3"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#CC933B',
                    fontWeight: 'bold',
                  }}
                >
                  Registrado
                </th>
                <th
                  className="text-center px-4 py-3"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    color: '#CC933B',
                    fontWeight: 'bold',
                  }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[#CC933B]/20 hover:bg-[#CC933B]/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <HabboAvatar src={user.avatarUrl} alt={user.habboName} size={48} />
                      <span
                        style={{
                          fontFamily: 'Rajdhani, sans-serif',
                          color: '#ededed',
                          fontWeight: 'bold',
                        }}
                      >
                        {user.habboName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RankIcon iconIdentifier={user.rank.icon} />
                      <span
                        style={{
                          fontFamily: 'Rajdhani, sans-serif',
                          color: '#ededed',
                        }}
                      >
                        {user.rank.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.rank.order <= 3 ? (
                      <Star className="w-5 h-5 inline-block" style={{ color: '#FFD700' }} />
                    ) : user.isSovereign ? (
                      <Crown className="w-5 h-5 inline-block" style={{ color: '#CC933B' }} />
                    ) : (
                      <span style={{ color: '#666' }}>-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        color: '#ededed',
                      }}
                    >
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ActionDropdown
                      user={user}
                      currentUserRankOrder={currentUserRankOrder}
                      currentUserRankId={currentUserRankId}
                      isSovereign={isSovereign}
                      onChangeRank={() => handleChangeRank(user)}
                      onManageSovereign={() => handleManageSovereign(user)}
                      onChangePassword={() => handleChangePassword(user)}
                      onDeleteUser={() => handleDeleteUser(user)}
                      onSendTimeRequest={() => handleSendTimeRequest(user)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ededed',
            }}
          >
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} usuarios
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPreviousPage}
              className="p-2 rounded transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: pagination.hasPreviousPage ? '#CC933B' : 'rgba(204, 147, 59, 0.3)',
                border: '1px solid #CC933B',
              }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: pagination.hasPreviousPage ? '#0f0f0f' : '#CC933B' }} />
            </button>
            <span
              className="px-4 py-2 rounded"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                color: '#CC933B',
                border: '1px solid #CC933B',
                backgroundColor: 'rgba(204, 147, 59, 0.1)',
              }}
            >
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: pagination.hasNextPage ? '#CC933B' : 'rgba(204, 147, 59, 0.3)',
                border: '1px solid #CC933B',
              }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: pagination.hasNextPage ? '#0f0f0f' : '#CC933B' }} />
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Modals - Rendered outside table container for proper fixed positioning */}
    {selectedUser && (
      <>
        <ChangeRankModal
          isOpen={showChangeRankModal}
          onClose={() => {
            setShowChangeRankModal(false)
            setSelectedUser(null)
          }}
          onSuccess={handleActionSuccess}
          user={selectedUser}
          currentUserRankOrder={currentUserRankOrder}
          currentUserRankId={currentUserRankId}
          isSovereign={isSovereign}
          currentUserName={currentUserName}
        />
        <DeleteUserModal
          isOpen={showDeleteUserModal}
          onClose={() => {
            setShowDeleteUserModal(false)
            setSelectedUser(null)
          }}
          onSuccess={handleActionSuccess}
          user={selectedUser}
          currentUserName={currentUserName}
        />
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => {
            setShowChangePasswordModal(false)
            setSelectedUser(null)
          }}
          onSuccess={handleActionSuccess}
          user={selectedUser}
          currentUserName={currentUserName}
        />
        <SovereignModal
          isOpen={showSovereignModal}
          onClose={() => {
            setShowSovereignModal(false)
            setSelectedUser(null)
          }}
          onSuccess={handleActionSuccess}
          user={selectedUser}
          currentUserName={currentUserName}
        />
        <SendTimeRequestModal
          isOpen={showSendTimeRequestModal}
          onClose={() => {
            setShowSendTimeRequestModal(false)
            setSelectedUser(null)
          }}
          onSuccess={handleActionSuccess}
          user={selectedUser}
        />
      </>
    )}
    </>
  )
}
