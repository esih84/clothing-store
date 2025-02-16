import { BaseEntity } from "src/common/abstracts/base.entity";
import { Otp } from "src/modules/auth/entities/otp.entity";
import { ShopUserRole } from "src/modules/role/entities/shop-user-role.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  mobile: string;
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  refreshToken?: string;

  @OneToOne(() => Otp, (otp) => otp.user)
  otp: Otp;
  @OneToMany(() => ShopUserRole, (shopUserRole) => shopUserRole.user)
  shopRoles: ShopUserRole[];
}
