"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideOfferModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GeoPointSchema = new mongoose_1.Schema({
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
}, { _id: false });
const RideOfferSchema = new mongoose_1.Schema({
    driverId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', index: true },
    seatsTotal: { type: Number, required: true, min: 1 },
    seatsAvailable: { type: Number, required: true, min: 0 },
    period: { type: String, enum: ['morning', 'evening'], required: true, index: true },
    timeWindowStart: { type: Date, required: true, index: true },
    timeWindowEnd: { type: Date, required: true, index: true },
    fromPoint: { type: GeoPointSchema, required: true, index: '2dsphere' },
    toPoint: { type: GeoPointSchema, required: true, index: '2dsphere' },
    passengerIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['active', 'closed'], required: true, default: 'active', index: true },
}, { timestamps: true });
exports.RideOfferModel = mongoose_1.default.model('RideOffer', RideOfferSchema);
