import { BaseEntity } from "src/common/abstracts/base.entity";
import { ShopUserRole } from "src/modules/role/entities/shop-user-role.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { ShopStatus, VerificationStatus } from "../enums/shop.enum";
import { Location } from "./location.entity";
import { ShopFile } from "./shop-file.entity";

@Entity("shops")
export class Shop extends BaseEntity {
  @Column()
  name: string;
  @Column({ nullable: true })
  address: string;
  @Column({ nullable: true })
  bio: string;

  @Column({ type: "enum", enum: ShopStatus, default: ShopStatus.INACTIVE })
  status: ShopStatus;
  @Column({
    type: "enum",
    enum: VerificationStatus,
    default: VerificationStatus.UNVERIFIED,
  })
  verificationStatus: VerificationStatus;

  @Column({ nullable: true })
  email: string;
  @Column({ nullable: true })
  password: string;
  @OneToOne(() => Location, (location) => location.shop)
  @JoinColumn()
  location: Location;
  @OneToMany(() => ShopUserRole, (shopUserRole) => shopUserRole.shop)
  userRoles: ShopUserRole[];
  @OneToMany(() => ShopFile, (shopFile) => shopFile.shop)
  files: ShopFile[];
}
