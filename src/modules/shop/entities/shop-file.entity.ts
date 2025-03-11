import { BaseEntity } from "src/common/abstracts/base.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Shop } from "./shop.entity";
import { FileType } from "../enums/shop-file-type.enum";

@Entity("shop_files")
export class ShopFile extends BaseEntity {
  @Column()
  fileUrl: string;
  @Column({ type: "enum", enum: FileType })
  fileType: FileType;
  @Column()
  shopId: number;
  @ManyToOne(() => Shop, (shop) => shop.files, { onDelete: "CASCADE" })
  @JoinColumn()
  shop: Shop;
  @Column({ default: false })
  isActive: boolean;
}
