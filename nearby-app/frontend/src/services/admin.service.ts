import api from './api';

interface AdminStats {
    totalUsers: number;
    totalMerchants: number;
    totalCategories: number;
    totalOrders: number;
    totalBroadcasts: number;
    totalOffers: number;
    recentSignups: number;
    roleBreakdown: {
        users: number;
        merchants: number;
        admins: number;
    };
}

interface AdminStatsResponse {
    success: boolean;
    data: {
        stats: AdminStats;
    };
}

interface AdminUser {
    userId: string;
    email: string;
    name: string;
    phone: string;
    role: string;
    status?: string;
    createdAt: string;
    updatedAt: string;
}

interface AdminUsersResponse {
    success: boolean;
    data: {
        users: AdminUser[];
        total: number;
    };
}

interface ManageUserResponse {
    success: boolean;
    data: {
        user: AdminUser;
    };
}

export const adminService = {
    /**
     * Get platform statistics
     */
    async getStats(): Promise<AdminStats> {
        const response = await api.get<AdminStatsResponse>('/admin/stats');
        return response.data.data.stats;
    },

    /**
     * List all users
     */
    async getUsers(): Promise<AdminUser[]> {
        const response = await api.get<AdminUsersResponse>('/admin/users');
        return response.data.data.users;
    },

    /**
     * Manage user (suspend, approve, activate, changeRole)
     */
    async manageUser(userId: string, action: string, role?: string): Promise<AdminUser> {
        const response = await api.patch<ManageUserResponse>(`/admin/users/${userId}`, { action, role });
        return response.data.data.user;
    },
};

export type { AdminStats, AdminUser };
