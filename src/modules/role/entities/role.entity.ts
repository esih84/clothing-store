import { BaseEntity } from "src/common/abstracts/base.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { ShopUserRole } from "./shop-user-role.entity";
import { RoleNames } from "../enums/role.enum";

@Entity("roles")
export class Role extends BaseEntity {
  @Column({ type: "enum", enum: RoleNames, unique: true })
  name: RoleNames;
  @Column({ default: false })
  isForShop: boolean;
  @Column({ default: true })
  isActive: boolean;
  @OneToMany(() => ShopUserRole, (shopUser) => shopUser.role)
  users: ShopUserRole[];
}
