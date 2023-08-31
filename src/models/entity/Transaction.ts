import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from "typeorm";
import {Category} from "./Category";
import {WalletRole} from "./WalletRole";

@Entity()

export class Transaction {
    @PrimaryGeneratedColumn()
    public readonly id: number;

    @ManyToOne(() => Category, category => category.transaction)
    public category: Category;

    @Column({type: "int"})
    public amount: number;

    @Column({ type: 'date'})
    public date: Date;

    @Column({type: "varchar"})
    public note: string;

    @ManyToOne(() => WalletRole, walletRole => walletRole.transaction)
    public walletRole: WalletRole;

}