import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { db, Tables } from '../shared/db.js';
import { notifications } from '../shared/notifications.js';
import { response } from '../shared/response.js';

/**
 * Admin category management — supports CREATE (POST), UPDATE (PUT), DELETE (DELETE)
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const method = event.httpMethod;

        // CREATE category
        if (method === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { name, emoji, color, icon, parentId = 'root', sortOrder = 0 } = body;

            if (!name) {
                return response.error('Category name is required', 400, 'INVALID_INPUT');
            }

            const now = new Date().toISOString();
            const category = {
                categoryId: uuidv4(),
                name,
                emoji: emoji || '📦',
                color: color || 'bg-gray-100',
                icon: icon || `/icons/${name.toLowerCase().replace(/\s+/g, '-')}.png`,
                parentId,
                level: parentId === 'root' ? 0 : 1,
                depth: parentId === 'root' ? 0 : 1,
                sortOrder: sortOrder || 0,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            };

            await db.put(Tables.CATEGORIES!, category);

            // Send SNS notification about new category
            await notifications.notifyUser({
                type: 'CATEGORY_ADDED',
                title: 'New Category Added',
                message: `A new category "${name}" has been added to the platform.`,
                data: { categoryId: category.categoryId, categoryName: name },
            });

            return response.success({ category }, 201);
        }

        // UPDATE category
        if (method === 'PUT') {
            const categoryId = event.pathParameters?.categoryId;
            if (!categoryId) {
                return response.error('Category ID is required', 400, 'INVALID_INPUT');
            }

            const body = JSON.parse(event.body || '{}');
            const updates: Record<string, unknown> = {};

            if (body.name !== undefined) updates.name = body.name;
            if (body.emoji !== undefined) updates.emoji = body.emoji;
            if (body.color !== undefined) updates.color = body.color;
            if (body.icon !== undefined) updates.icon = body.icon;
            if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
            if (body.isActive !== undefined) updates.isActive = body.isActive;
            updates.updatedAt = new Date().toISOString();

            const updated = await db.update(Tables.CATEGORIES!, { categoryId }, updates);

            return response.success({ category: updated });
        }

        // DELETE category
        if (method === 'DELETE') {
            const categoryId = event.pathParameters?.categoryId;
            if (!categoryId) {
                return response.error('Category ID is required', 400, 'INVALID_INPUT');
            }

            await db.delete(Tables.CATEGORIES!, { categoryId });

            return response.success({ message: 'Category deleted', categoryId });
        }

        return response.error('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
    } catch (error) {
        console.error('Admin category management error:', error);
        return response.error('Category operation failed', 500, 'INTERNAL_ERROR');
    }
};
