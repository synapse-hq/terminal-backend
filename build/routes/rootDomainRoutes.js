"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const usersRoutes_1 = __importDefault(require("./usersRoutes"));
const bucketsRoutes_1 = __importDefault(require("./bucketsRoutes"));
const requestRoutes_1 = __importDefault(require("./requestRoutes"));
router.use("/api/buckets", bucketsRoutes_1.default);
router.use("/api/requests", requestRoutes_1.default);
router.use("/api/users", usersRoutes_1.default);
exports.default = router;
// router.use("/api/buckets", bucketsRoutes)
// router.use("/api/requests", requestsRoutes)
// router.use("/api/users", usersRoutes)
//# sourceMappingURL=rootDomainRoutes.js.map