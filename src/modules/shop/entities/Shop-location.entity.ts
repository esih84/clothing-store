import { BaseEntity } from "src/common/abstracts/base.entity";
import { Column, Entity, OneToOne } from "typeorm";
import { Shop } from "./shop.entity";

@Entity("shop_location")
export class ShopLocation extends BaseEntity {
  @Column("point", { nullable: true })
  location: string;

  @Column({ nullable: true })
  addressDetails: string;
  @Column()
  city: string;
  @Column()
  shopId: number;
  @OneToOne(() => Shop, (shop) => shop.location, { onDelete: "SET NULL" })
  shop: Shop;
}
