import { BaseEntity } from "src/common/abstracts/base.entity";
import { User } from "src/modules/user/entities/user.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Shop } from "./shop.entity";

@Entity()
export class ShopOtp extends BaseEntity {
  @Column()
  code: string;
  @Column()
  shopId: number;
  @OneToOne(() => Shop, (shop) => shop.otp, { onDelete: "CASCADE" })
  @JoinColumn()
  shop: Shop;
  @Column({ type: "timestamp" })
  expiresAt: Date;
}
