import { BaseEntity } from "src/common/abstracts/base.entity";
import { Column, Entity, ManyToMany } from "typeorm";
import { ShopUserRole } from "./shop-user-role.entity";

@Entity("roles")
export class Role extends BaseEntity {
  @Column({ unique: true })
  name: string;
  @Column({ default: true })
  isActive: boolean;
  @ManyToMany(() => ShopUserRole, (shopUser) => shopUser.roles)
  users: ShopUserRole[];
}
