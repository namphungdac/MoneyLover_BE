import {Column, Entity, PrimaryGeneratedColumn, OneToMany} from "typeorm";
import {Wallet} from "./Wallet";

@Entity()

export class Currency {
    @PrimaryGeneratedColumn()
    public readonly id: number;

    @Column({type: 'varchar'})
    public name: string;

    @Column({type: 'varchar'})
    public icon: string;

    @Column({type: 'varchar'})
    public subname: string;

    @Column({type: 'varchar'})
    public sign: string;

    @OneToMany(() => Wallet, wallet => wallet.currency)
    public wallet: Wallet[];

}