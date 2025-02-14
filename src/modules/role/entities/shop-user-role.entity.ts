import { BaseEntity } from "src/common/abstracts/base.entity";
import { Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { Role } from "./role.entity";
import { Shop } from "src/modules/shop/entities/shop.entity";
import { User } from "src/modules/user/entities/user.entity";

@Entity("shop_user-roles")
export class ShopUserRole extends BaseEntity {
  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles: Role[];
  @ManyToOne(() => Shop, (shop) => shop.userRoles)
  shop: Shop;
  @ManyToOne(() => User, (user) => user.shopRoles)
  user: User;
}
