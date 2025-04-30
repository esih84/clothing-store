import { BaseEntity } from "src/common/abstracts/base.entity";
import { Shop } from "src/modules/shop/entities/shop.entity";
import { User } from "src/modules/user/entities/user.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { BlogCategory } from "./blog-category.entity";
import { blogStatus, PublisherRole } from "../types/blog.type";

@Entity("blogs")
export class Blog extends BaseEntity {
  @Column()
  title: string;
  @Column()
  description: string;
  @Column({ unique: true })
  slug: string;
  @Column({ type: "text" })
  content: string;
  @Column()
  image: string;
  @Column()
  imageKey: string;
  @Column({ type: "enum", enum: blogStatus })
  status: blogStatus;
  @Column({ type: "enum", enum: PublisherRole, default: PublisherRole.SHOP })
  publishedBy: PublisherRole;
  @Column()
  authorId: number;
  @ManyToOne(() => User, (user) => user.blogs, { onDelete: "CASCADE" })
  author: User;
  @Column({ nullable: true })
  shopId: number;
  @ManyToOne(() => Shop, (shop) => shop.blogs, { onDelete: "CASCADE" })
  shop: Shop;
  @OneToMany(() => BlogCategory, (category) => category.blog, {
    onDelete: "CASCADE",
  })
  categories: BlogCategory[];
}
