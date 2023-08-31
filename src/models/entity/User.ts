import {Column, Entity, PrimaryGeneratedColumn, OneToMany} from "typeorm";
import {WalletRole} from "./WalletRole";
import {Category} from "./Category";

@Entity()

export class User {
    @PrimaryGeneratedColumn()
    public readonly id: number;

    @Column({type: 'varchar'})
    public email: string;

    @Column({type: 'varchar'})
    public password: string;

    @Column({default: '', type: 'varchar'})
    public verifyEmailToken: string;

    @Column({default: false, type: 'boolean'})
    public verifyEmail: boolean;

    @OneToMany(() => WalletRole, walletRoles => walletRoles.user)
    walletRoles: WalletRole[];

    @OneToMany(() => Category, category => category.user)
    category: Category[];
}