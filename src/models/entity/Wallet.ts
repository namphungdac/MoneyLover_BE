import {Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne} from "typeorm";
import {Currency} from "./Currency";
import {WalletRole} from "./WalletRole";
import {IconWallet} from "./IconWallet";

@Entity()

export class Wallet {
    @PrimaryGeneratedColumn()
    public readonly id: number;

    @Column({type: 'varchar'})
    public name: string;

    @ManyToOne(() => IconWallet, icon => icon.wallet)
    public icon: IconWallet;

    @ManyToOne(() => Currency, currency => currency.wallet)
    public currency: Currency;

    @Column({type: 'int'})
    public amountOfMoney: number;

    @OneToMany(() => WalletRole, walletRoles => walletRoles.wallet)
    walletRoles: WalletRole[];

}