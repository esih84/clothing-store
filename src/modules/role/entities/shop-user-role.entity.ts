import { BaseEntity } from "src/common/abstracts/base.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Role } from "./role.entity";
import { Shop } from "src/modules/shop/entities/shop.entity";
import { User } from "src/modules/user/entities/user.entity";

@Entity("shop_user-roles")
export class ShopUserRole extends BaseEntity {
  @Column()
  roleId: number;
  @ManyToOne(() => Role, (role) => role.users)
  role: Role;
  @Column()
  shopId: number;
  @ManyToOne(() => Shop, (shop) => shop.userRoles)
  shop: Shop;
  @Column()
  userId: number;
  @ManyToOne(() => User, (user) => user.shopRoles)
  user: User;
}
