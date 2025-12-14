"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWithinRushHours = isWithinRushHours;
exports.timeWindowsOverlap = timeWindowsOverlap;
const dayjs_1 = __importDefault(require("dayjs"));
function isWithinRushHours(date, period) {
    const hour = (0, dayjs_1.default)(date).hour();
    if (period === 'morning') {
        // 07:00 - 11:00 inclusive start, exclusive end
        return hour >= 7 && hour < 11;
    }
    // evening: 16:00 - 21:00
    return hour >= 16 && hour < 21;
}
function timeWindowsOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart <= bEnd && bStart <= aEnd;
}
