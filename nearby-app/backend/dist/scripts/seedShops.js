"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var client = new client_dynamodb_1.DynamoDBClient({ region: 'ap-south-1' });
var docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
var SHOPS_TABLE = 'nearby-backend-dev-shops';
var seedShops = [
    {
        shopId: 'shop-001',
        name: 'Fresh Mart Groceries',
        category: 'Groceries',
        description: 'Your daily fresh vegetables, fruits, and groceries delivered to your doorstep',
        coverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
        logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
        rating: 4.5,
        totalReviews: 234,
        openTime: '08:00',
        closeTime: '22:00',
        location: {
            lat: 12.9352,
            lng: 77.6245,
            address: '12th Main Road, Koramangala',
            area: 'Koramangala',
        },
        tags: ['fresh', 'organic', 'delivery', 'vegetables'],
        isVerified: true,
    },
    {
        shopId: 'shop-002',
        name: 'MedPlus Pharmacy',
        category: 'Pharmacy',
        description: '24/7 pharmacy with prescription medicines and healthcare products',
        coverImage: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800',
        logo: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=200',
        rating: 4.3,
        totalReviews: 156,
        openTime: '00:00',
        closeTime: '23:59',
        location: {
            lat: 12.9716,
            lng: 77.5946,
            address: 'MG Road, Central Bangalore',
            area: 'MG Road',
        },
        tags: ['24/7', 'medicines', 'healthcare', 'prescription'],
        isVerified: true,
    },
    {
        shopId: 'shop-003',
        name: 'TechZone Electronics',
        category: 'Electronics',
        description: 'Latest gadgets, smartphones, laptops and electronic accessories',
        coverImage: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
        logo: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200',
        rating: 4.7,
        totalReviews: 89,
        openTime: '10:00',
        closeTime: '21:00',
        location: {
            lat: 12.9784,
            lng: 77.6408,
            address: '100 Feet Road, Indiranagar',
            area: 'Indiranagar',
        },
        tags: ['gadgets', 'smartphones', 'laptops', 'warranty'],
        isVerified: true,
    },
    {
        shopId: 'shop-004',
        name: 'Book Haven',
        category: 'Books',
        description: 'Wide collection of books, stationery and educational materials',
        coverImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800',
        logo: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200',
        rating: 4.6,
        totalReviews: 67,
        openTime: '09:00',
        closeTime: '20:00',
        location: {
            lat: 12.9698,
            lng: 77.7500,
            address: 'Whitefield Main Road',
            area: 'Whitefield',
        },
        tags: ['books', 'stationery', 'education', 'novels'],
        isVerified: true,
    },
    {
        shopId: 'shop-005',
        name: 'Fashion Hub',
        category: 'Clothing',
        description: 'Trendy clothing, accessories and footwear for men and women',
        coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
        rating: 4.4,
        totalReviews: 128,
        openTime: '10:30',
        closeTime: '21:30',
        location: {
            lat: 12.9279,
            lng: 77.6271,
            address: 'BTM Layout 2nd Stage',
            area: 'BTM Layout',
        },
        tags: ['fashion', 'clothing', 'accessories', 'trendy'],
        isVerified: true,
    },
    {
        shopId: 'shop-006',
        name: 'Fitness First Gym',
        category: 'Fitness',
        description: 'Modern gym with personal trainers and fitness equipment',
        coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200',
        rating: 4.8,
        totalReviews: 92,
        openTime: '06:00',
        closeTime: '22:00',
        location: {
            lat: 12.9141,
            lng: 77.6411,
            address: 'HSR Layout Sector 1',
            area: 'HSR Layout',
        },
        tags: ['gym', 'fitness', 'trainer', 'equipment'],
        isVerified: true,
    },
    {
        shopId: 'shop-007',
        name: 'Pet Paradise',
        category: 'Pet Store',
        description: 'Pet food, accessories and grooming services for your furry friends',
        coverImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
        logo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200',
        rating: 4.2,
        totalReviews: 45,
        openTime: '09:00',
        closeTime: '19:00',
        location: {
            lat: 12.9591,
            lng: 77.6974,
            address: 'Marathahalli Bridge',
            area: 'Marathahalli',
        },
        tags: ['pets', 'grooming', 'food', 'accessories'],
        isVerified: false,
    },
    {
        shopId: 'shop-008',
        name: 'Cafe Delight',
        category: 'Cafe',
        description: 'Cozy cafe with coffee, snacks and free WiFi',
        coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
        logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200',
        rating: 4.5,
        totalReviews: 178,
        openTime: '08:00',
        closeTime: '23:00',
        location: {
            lat: 12.9343,
            lng: 77.6060,
            address: 'Jayanagar 4th Block',
            area: 'Jayanagar',
        },
        tags: ['coffee', 'wifi', 'snacks', 'cozy'],
        isVerified: true,
    },
];
function seedData() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, seedShops_1, shop, command, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Starting to seed shops data...');
                    _i = 0, seedShops_1 = seedShops;
                    _a.label = 1;
                case 1:
                    if (!(_i < seedShops_1.length)) return [3 /*break*/, 6];
                    shop = seedShops_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    command = new lib_dynamodb_1.PutCommand({
                        TableName: SHOPS_TABLE,
                        Item: shop,
                    });
                    return [4 /*yield*/, docClient.send(command)];
                case 3:
                    _a.sent();
                    console.log("\u2705 Seeded shop: ".concat(shop.name));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("\u274C Failed to seed shop: ".concat(shop.name), error_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    console.log('✅ Seeding completed!');
                    return [2 /*return*/];
            }
        });
    });
}
seedData();
