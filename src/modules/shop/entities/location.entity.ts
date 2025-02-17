import { BaseEntity } from "src/common/abstracts/base.entity";
import { Column, Entity, OneToOne } from "typeorm";
import { Shop } from "./shop.entity";

@Entity("locations")
export class Location extends BaseEntity {
  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  lat: string;

  @Column({ nullable: true })
  lng: string;

  @Column({ nullable: true })
  city: string;
  @OneToOne(() => Shop, (shop) => shop.location, { onDelete: "SET NULL" })
  shop: Shop;
}
