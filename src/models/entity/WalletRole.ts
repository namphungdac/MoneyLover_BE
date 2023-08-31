import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany} from "typeorm";
import {User} from "./User";
import {Wallet} from "./Wallet";
import {Transaction} from "./Transaction";

@Entity()

export class WalletRole {
    @PrimaryGeneratedColumn()
    public readonly id: number;

    @ManyToOne(() => User, user => user.walletRoles)
    public user: User;

    @ManyToOne(() => Wallet, wallet => wallet.walletRoles)
    public wallet: Wallet;

    @Column({default: "owner" , type: 'varchar'})
    public role: string;

    @Column({ default: false, type: 'boolean'})
    public archived: boolean;

    @OneToMany(() => Transaction, transaction => transaction.walletRole)
    public transaction: Transaction[];
}