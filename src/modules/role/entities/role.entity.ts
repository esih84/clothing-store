import { BaseEntity } from "src/common/abstracts/base.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { ShopUserRole } from "./shop-user-role.entity";

@Entity("roles")
export class Role extends BaseEntity {
  @Column({ unique: true })
  name: string;
  @Column({ default: true })
  isActive: boolean;
  @OneToMany(() => ShopUserRole, (shopUser) => shopUser.roles)
  users: ShopUserRole[];
}
