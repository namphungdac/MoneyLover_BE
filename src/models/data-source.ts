import "reflect-metadata"
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "mydb.cnpntblhte9k.ap-southeast-1.rds.amazonaws.com",
    port: 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    synchronize: false,
    logging: false,
    entities: ["dist/src/models/entity/*.js"],
    // migrations: ["dist/src/migrations/*.js"],
})