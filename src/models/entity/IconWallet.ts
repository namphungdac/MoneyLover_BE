import {Entity, Column, PrimaryGeneratedColumn, OneToMany} from "typeorm";
import {Wallet} from "./Wallet";

@Entity()

export class IconWallet {
    @PrimaryGeneratedColumn()
    public readonly id: number;

    @Column({type: "varchar"})
    public icon: string;

    @OneToMany(() => Wallet, wallet => wallet.icon)
    public wallet: Wallet[];
}