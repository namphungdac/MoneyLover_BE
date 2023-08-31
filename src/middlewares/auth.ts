import {Request, Response, NextFunction} from "express";
import jwt, {Secret} from "jsonwebtoken";
import {TokenPayload} from "../controllers/User.controller";
import config from "../config/config";

export interface CustomRequest extends Request {
    token: TokenPayload;
}

export const SECRET_KEY: Secret = config.jwtSecretKey;

const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.header('Authorization')?.replace('Bearer ', '');
        if (accessToken) {
            jwt.verify(accessToken, SECRET_KEY, (err, decoded: TokenPayload | undefined) => {
                    if (err) {
                        return res.status(401).json({
                            message: err.message
                        });
                    } else {
                        (req as CustomRequest).token = decoded;
                        next();
                    }
                },
            );
        } else {
            return res.status(401).json({
                message: 'No accessToken provided!'
            });
        }
    } catch (e) {
        res.status(500).json({
            message: e.message
        });
    }
}

export default auth;

