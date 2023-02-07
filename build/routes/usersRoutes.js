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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const db_1 = require("../src/db");
const bcrypt = require("bcrypt");
router.get('/session_test', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.user) {
        console.log(req.session.user.username);
        res.status(200).json({ username: req.session.user.username });
    }
    else {
        res.status(404).json({ error: "Not logged in" });
    }
}));
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const { username, passwordHash } = body;
    if (!username) {
        res.status(404).json({ error: "Username or password not present" });
        return;
    }
    let user = yield db_1.pg.user.findUnique({
        where: {
            username: username,
        },
    });
    if (user) {
        res.status(404).json({ error: "Username already exists" });
        return;
    }
    if (!passwordHash) {
        res.status(404).json({ error: "No Password Given" });
        return;
    }
    if (passwordHash.length < 5) {
        res.status(404).json({ error: "Invalid Password" });
        return;
    }
    const saltRounds = 10;
    const hashed = yield bcrypt.hash(passwordHash, saltRounds);
    try {
        const user = yield db_1.pg.user.create({
            data: {
                username: username,
                passwordHash: hashed,
                createdAt: new Date()
            },
        });
        res.status(201).json(user);
    }
    catch (err) {
        res.status(404).json({ error: 'username already in use' });
    }
}));
// login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, passwordHash } = Object.assign({}, req.body);
    if (!username) {
        res.status(404).json({ error: "No Username Given" });
        return;
    }
    if (!passwordHash) {
        res.status(404).json({ error: "No Password Given" });
        return;
    }
    let user = yield db_1.pg.user.findUnique({
        where: {
            username: username,
        },
    });
    if (user) {
        let validCredentials = yield bcrypt.compare(passwordHash, user.passwordHash);
        console.log("passwords", user.passwordHash, passwordHash);
        if (validCredentials) {
            req.session.user = user;
            res.status(200).json({ username: user.username });
        }
        else {
            res.status(404).json({ error: "invalid password" });
        }
    }
    else {
        res.status(404).json({ error: 'user does not exist' });
    }
}));
router.post('/logout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.user) {
        delete req.session.user;
        res.status(200).json({ session: req.session });
    }
    else {
        res.status(402).json({ error: "not signed in" });
    }
}));
// delete a user account
router.delete('/:username', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.userId) {
        let user = yield db_1.pg.user.findUnique({
            where: {
                username: username,
            },
        });
        if (user.id === req.session.userId) {
            const deleteUsers = yield db_1.pg.user.delete({
                where: {
                    username: req.params.username
                }
            });
            res.json(deleteUsers);
        }
    }
}));
exports.default = router;
//# sourceMappingURL=usersRoutes.js.map