import express from "express";
import http from 'http';
import {Server, Socket} from 'socket.io';
import cors from 'cors'
import bodyParser from 'body-parser'
import auth from './src/middlewares/auth'
import {AppDataSource} from "./src/models/data-source";
import authRouter from "./src/routers/auth.router";
import userRouter from "./src/routers/User.router";
import walletRouter from "./src/routers/Wallet.router";
import categoryRouter from "./src/routers/Category.router";
import currencyRouter from "./src/routers/Currency.router";
import iconWalletRouter from "./src/routers/IconWallet.router";
import walletRoleRouter from "./src/routers/WalletRole.router";
import transactionRouter from "./src/routers/Transaction.router";
import UserController from "./src/controllers/User.controller";
const port = process.env.PORT || 5000;

AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err)
    });

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/api/users', auth);
app.use('/api', authRouter);
app.use('/api', userRouter);
app.use('/api', walletRouter);
app.use('/api', categoryRouter);
app.use('/api', currencyRouter);
app.use('/api', iconWalletRouter);
app.use('/api', walletRoleRouter);
app.use('/api', transactionRouter);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://money-lover-demo.vercel.app",
        methods: ["GET", "POST", "DELETE", "PUT"],
        credentials: true
    }
});

type MessageData = {
    [key: string]: Array<{
        senderEmail: string;
        message: string;
        walletInfo: object;
        permission: string;
    }>;
};

type ResponseMessageData = {
    [key: string]: Array<{
        response: string;
        senderEmail: string;
        walletID: string;
    }>;
};

type UserData = {
    userID: number;
    socketID: string;
};

const connectedUsers: UserData[] = [];
const pendingMessages: MessageData = {};
const pendingResponseMessages: ResponseMessageData = {}

io.on('connection', (socket: Socket) => {
    console.log("Client connected: ", socket.id);

    socket.on('login', async (email: string) => {
        const userID = await UserController.getUserIDByEmail(email);
        if (userID) {
            connectedUsers.push({userID: userID, socketID: socket.id});
            if (pendingMessages[userID]) {
                pendingMessages[userID].forEach(message => {
                    io.to(socket.id).emit('forwardMessage', message);
                });
                delete pendingMessages[userID];
            }
            if (pendingResponseMessages[userID]) {
                pendingResponseMessages[userID].forEach(message => {
                    io.to(socket.id).emit('forwardResponseMessage', message);
                });
                delete pendingResponseMessages[userID];
            }
        }
        // console.log("Clients in now");
        // console.log(connectedUsers);
    });

    socket.on('sendMessage', async (data) => {
        const {senderEmail, receiverEmail, message, walletInfo, permission} = data;
        const receiverID = await UserController.getUserIDByEmail(receiverEmail);
        let receiverSocketId: string = '';
        for (const user of connectedUsers) {
            if (user.userID === receiverID) {
                receiverSocketId = user.socketID;
            }
        }
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('forwardMessage', {
                senderEmail,
                message,
                walletInfo,
                permission
            });
        } else {
            if (!pendingMessages[receiverID]) {
                pendingMessages[receiverID] = [];
            }
            pendingMessages[receiverID].push({senderEmail, message, walletInfo, permission});
        }
    });

    socket.on('responseMessage', async (data) => {
        const {response, senderEmail, receiverEmail, walletID} = data;
        console.log("<<<<<<<<<<<<<");
        console.log(data);
        console.log("<<<<<<<<<<<<<");
        const receiverID = await UserController.getUserIDByEmail(receiverEmail);
        let receiverSocketId: string = '';
        for (const user of connectedUsers) {
            if (user.userID === receiverID) {
                receiverSocketId = user.socketID;
            }
        }
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('forwardResponseMessage', {
                response,
                senderEmail,
                walletID
            });
        } else {
            if (!pendingResponseMessages[receiverID]) {
                pendingResponseMessages[receiverID] = [];
            }
            pendingResponseMessages[receiverID].push({response, senderEmail, walletID});
        }
    });

    socket.on('logout', () => {
        console.log("Client logout: ", socket.id);
        const userIndexToDelete: number = connectedUsers.findIndex(user => user.socketID === socket.id);
        if (userIndexToDelete !== -1) {
            connectedUsers.splice(userIndexToDelete, 1);
        }
        // console.log("Clients after logout");
        console.log(connectedUsers);
        socket.disconnect();
    });

    socket.on('disconnect', () => {
        console.log("Client disconnected: ", socket.id);
        const userIndexToDelete: number = connectedUsers.findIndex(user => user.socketID === socket.id);
        if (userIndexToDelete !== -1) {
            connectedUsers.splice(userIndexToDelete, 1);
        }
        // console.log("Clients after disconnect");
        console.log(connectedUsers);
    });

});

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});