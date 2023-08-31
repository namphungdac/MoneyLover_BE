import {Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne} from "typeorm";
import {Transaction} from "./Transaction";
import {User} from "./User";

@Entity()

export class Category {
    @PrimaryGeneratedColumn()
    public readonly id: number;

    @Column({type: "varchar"})
    public type: string;

    @Column({type: "varchar"})
    public subType: string;

    @Column({default: "https://static.moneylover.me/img/icon/icon_135.png" , type: "varchar"})
    public icon: string;

    @Column({type: "varchar"})
    public name: string;

    @OneToMany(() => Transaction, transaction => transaction.category)
    public transaction: Transaction[];

    @ManyToOne(() => User, user => user.walletRoles)
    public user: User;
}