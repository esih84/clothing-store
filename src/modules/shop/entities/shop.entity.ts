import { BaseEntity } from "src/common/abstracts/base.entity";
import { ShopUserRole } from "src/modules/role/entities/shop-user-role.entity";
import { Column, Entity, OneToMany } from "typeorm";
@Entity("shops")
export class Shop extends BaseEntity {
  @Column()
  name: string;
  @Column()
  address: string;
  @OneToMany(() => ShopUserRole, (shopUserRole) => shopUserRole.shop)
  userRoles: ShopUserRole[];
}
